import React, { useState, useEffect } from 'react';
import { StudentData } from '@/types';
import { TabType } from '@/types/app';
import { FileText, Download, Loader2, Target, Users, Award } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface QAAssessmentProps {
    studentData: StudentData;
    activeTab: TabType;
    showPDFOnly?: boolean;
}

// Define the shape of the data coming from your API
interface SchoolFromDB {
    id: string;
    name: string;
}

const QAAssessment: React.FC<QAAssessmentProps> = ({ studentData, activeTab, showPDFOnly = false }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [schoolName, setSchoolName] = useState<string>('Loading School...');
    const assessmentType = activeTab as 'qa1' | 'qa2' | 'endOfTerm';

    // Fetch school name (same as ReportCard)
    useEffect(() => {
        const fetchSchoolName = async () => {
            if (!studentData.examNumber) {
                setSchoolName('Unknown School');
                return;
            }

            try {
                const token = localStorage.getItem('token');
                const response = await fetch('https://eduspace-portal-backend.onrender.com/schools', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                });

                if (response.ok) {
                    const schools: SchoolFromDB[] = await response.json();
                    let examPrefix = '';

                    if (studentData.examNumber.includes('-')) {
                        examPrefix = studentData.examNumber.split('-')[0];
                    } else {
                        examPrefix = studentData.examNumber.substring(0, 3);
                    }

                    const matchedSchool = schools.find(school =>
                        school.id.toString().toLowerCase().startsWith(examPrefix.toLowerCase())
                    );

                    if (matchedSchool) {
                        setSchoolName(matchedSchool.name);
                    } else {
                        setSchoolName('School Not Found');
                    }
                }
            } catch (error) {
                console.error('Failed to load school name', error);
                setSchoolName('Error Loading School');
            }
        };

        fetchSchoolName();
    }, [studentData.examNumber]);

    // Helper functions
    const getAssessmentTitle = (type: 'qa1' | 'qa2' | 'endOfTerm') => {
        switch (type) {
            case 'qa1': return 'Quarterly Assessment 1';
            case 'qa2': return 'Quarterly Assessment 2';
            case 'endOfTerm': return 'End of Term Examination';
            default: return 'Assessment';
        }
    };

    const getGradeColor = (grade: string) => {
        if (grade === 'N/A') return 'text-slate-600 bg-slate-100';
        if (grade.includes('A')) return 'text-emerald-600 bg-emerald-50';
        if (grade === 'B') return 'text-blue-600 bg-blue-50';
        if (grade === 'C') return 'text-amber-600 bg-amber-50';
        return 'text-red-600 bg-red-50';
    };

    const calculateGrade = (score: number, passMark?: number): string => {
        const effectivePassMark = passMark || 50;
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        if (score >= effectivePassMark) return 'D';
        return 'F';
    };

    const calculateAverage = (
        subjects: StudentData['subjects'],
        type: 'qa1' | 'qa2' | 'endOfTerm'
    ): string => {

        const validSubjects = subjects.filter(s => {
            const score = s[type];
            const isAbsent =
                type === 'qa1' ? s.qa1_absent :
                    type === 'qa2' ? s.qa2_absent :
                        s.endOfTerm_absent;

            return !isAbsent && score !== null && score !== undefined;
        });

        if (validSubjects.length === 0) return 'N/A';

        const total = validSubjects.reduce((acc, s) => acc + s[type], 0);

        return (total / validSubjects.length).toFixed(1);
    };


    const calculateTotalScored = (): number => {
        const subjectsWithScores = studentData.subjects.filter(s =>
            hasValidScore(s, assessmentType)
        );

        if (subjectsWithScores.length === 0) return 0;

        const total = subjectsWithScores.reduce((sum, subject) => {
            const score = subject[assessmentType];

            // Do not add AB to total
            if (typeof score !== 'number') return sum;

            return sum + score;
        }, 0);

        return Math.round(total);
    };

    // CORRECTED: Calculate average grade for the assessment
    const calculateAssessmentAverage = (): string => {
        // const subjectsWithScores = studentData.subjects.filter(subject =>
        //     hasValidScore(subject[assessmentType])
        // );

        const subjectsWithScores = studentData.subjects.filter(s => hasValidScore(s, assessmentType))


        if (subjectsWithScores.length === 0) return 'N/A';

        const total = subjectsWithScores.reduce((sum, subject) => {
            return sum + subject[assessmentType]!;
        }, 0);

        return (total / subjectsWithScores.length).toFixed(1);
    };

    const hasValidScore = (
        subject: any,
        type: 'qa1' | 'qa2' | 'endOfTerm'
    ): boolean => {

        const score = subject[type];

        const isAbsent =
            type === 'qa1' ? subject.qa1_absent :
                type === 'qa2' ? subject.qa2_absent :
                    subject.endOfTerm_absent;

        // Absent counts as an entry
        if (isAbsent) return true;

        // Null means no score entered
        if (score === null || score === undefined) return false;

        // Must be a number (0 allowed)
        return typeof score === 'number' && !isNaN(score);
    };


    const hasAssessmentScores = (assessmentType: 'qa1' | 'qa2' | 'endOfTerm'): boolean => {
        if (!studentData || !studentData.subjects || studentData.subjects.length === 0) return false;

        return studentData.subjects.some(subject => {
            const score = subject[assessmentType];
            const absentFlag = assessmentType === 'qa1' ? subject.qa1_absent
                : assessmentType === 'qa2' ? subject.qa2_absent
                    : subject.endOfTerm_absent;

            if (absentFlag) return true;

            if (typeof score === 'string' && score === 'AB') return true;

            return typeof score === 'number';
        });
    };

    // PDF Generation function for assessments
    const handleDownloadAssessmentPDF = () => {
        setIsDownloading(true);

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            let y = 20;

            // ===== HEADER ===== (Same as ReportCard)
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(schoolName || 'School Name', pageWidth / 2, y, { align: 'center' });

            y += 6;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`${getAssessmentTitle(assessmentType)} Results`, pageWidth / 2, y, { align: 'center' });

            y += 8;

            // ===== STUDENT & ACADEMIC INFO ===== (Same as ReportCard)
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('STUDENT & ACADEMIC INFORMATION', 14, y);
            y += 4;
            doc.setFont('helvetica', 'normal');

            doc.text(`Student Name: ${studentData.name || 'N/A'}`, 14, y);
            doc.text(`Exam Number: ${studentData.examNumber || 'N/A'}`, 14, y + 6);
            doc.text(`Class: ${studentData.class || 'N/A'}`, 14, y + 12);

            doc.text(`Academic Year: ${studentData.academicYear || 'N/A'}`, 120, y);
            doc.text(`Term: ${studentData.term || 'N/A'}`, 120, y + 6);
            doc.text(`Total Enrollment: ${studentData.totalStudents || 'N/A'}`, 120, y + 12);

            y += 22;

            // ===== ASSESSMENT SUMMARY =====
            doc.setFont('helvetica', 'bold');
            doc.text('ASSESSMENT SUMMARY', 14, y);
            y += 7;

            doc.setFont('helvetica', 'normal');

            // 1. Data Calculations
            const avgScore = calculateAssessmentAverage();
            const numericAvg = avgScore === 'N/A' ? null : parseFloat(avgScore);
            // const subjectsWithScores = studentData.subjects.filter(s => hasValidScore(s[assessmentType]));
            const subjectsWithScores = studentData.subjects.filter(s => hasValidScore(s, assessmentType))
            const passMark = studentData.gradeConfiguration?.pass_mark || 50;

            // RESOLVED RANK: Fetching from assessmentStats based on the active tab
            const displayRank = studentData.assessmentStats?.[assessmentType]?.classRank || 'N/A';

            // Determine Status and Grade
            const assessmentStatus = numericAvg !== null ? (numericAvg >= passMark ? 'PASSED' : 'FAILED') : 'N/A';
            const assessmentGrade = numericAvg !== null ? calculateGrade(numericAvg, passMark) : 'N/A';
            const avgText = numericAvg !== null ? `${avgScore}%` : 'N/A';

            // 2. Row 1: Assessment Type & Subjects Count
            doc.text(`Assessment Type: ${getAssessmentTitle(assessmentType)}`, 14, y);
            doc.text(`Subjects Assessed: ${subjectsWithScores.length}/${studentData.subjects.length}`, 120, y);
            y += 7;

            // 3. Row 2: Average Score & Class Position
            doc.text(`Average Score: ${avgText}`, 14, y);
            doc.text(`Class Position: ${displayRank}`, 120, y);
            y += 7;

            // 4. Row 3: Overall Grade & Overall Status
            doc.text(`Overall Grade: ${assessmentGrade}`, 14, y);
            doc.text(`Overall Status: ${assessmentStatus}`, 120, y);

            // Final spacing before Results table
            y += 10;
            // ===== RESULTS TABLE =====
            doc.setFont('helvetica', 'bold');
            doc.text('RESULTS', 14, y);
            y += 3;
            doc.setFont('helvetica', 'normal');

            // Filter subjects with valid scores
            // const subjectsWithValidScores = studentData.subjects.filter(subject =>
            //     hasValidScore(subject[assessmentType])
            // );

            // const subjectsWithValidScores = studentData.subjects.filter(s => hasValidScore(s, assessmentType));
            const subjectsWithValidScores = studentData.subjects.filter(subject =>
                hasValidScore(subject, assessmentType)
            );

            if (subjectsWithValidScores.length > 0) {

                const tableBody = subjectsWithValidScores.map(subject => {
                    const score = subject[assessmentType];

                    const isAbsent =
                        assessmentType === 'qa1' ? subject.qa1_absent :
                            assessmentType === 'qa2' ? subject.qa2_absent :
                                subject.endOfTerm_absent;

                    // If Absent → show AB clearly
                    if (isAbsent) {
                        return [
                            subject.name,
                            '100',
                            'AB',
                            'AB',
                            'Absent'
                        ];
                    }

                    // Otherwise must be numeric
                    const numericScore = score as number;
                    const grade = calculateGrade(numericScore, passMark);
                    const remark = grade === 'F' ? 'Failed' : 'Passed';

                    return [
                        subject.name,
                        '100',
                        numericScore.toFixed(1),
                        grade,
                        remark
                    ];
                });

                // CORRECTED: Add GRAND TOTAL row (Same as ReportCard)
                const totalScored = calculateTotalScored();
                const totalSubjects = subjectsWithValidScores.length;
                const averageScore = parseFloat(avgScore);
                const overallGrade = calculateGrade(averageScore, passMark);
                const overallRemark = overallGrade === 'F' ? 'Failed' : 'Passed';

                tableBody.push([
                    'GRAND TOTAL',
                    String(totalSubjects * 100), // Total possible marks
                    // totalScored, // Total scored marks
                    String(totalScored), // Total scored marks
                    overallGrade,
                    overallRemark
                ]);

                autoTable(doc, {
                    startY: y,
                    head: [['Subject', 'Total Marks', 'Marks Scored', 'Grade', 'Remark']],
                    body: tableBody,
                    theme: 'striped',
                    didParseCell: (data) => {
                        if (data.row.index === tableBody.length - 1) {
                            data.cell.styles.fontStyle = 'bold';
                        }
                    },
                });

                y = (doc as any).lastAutoTable.finalY + 8;
            } else {
                doc.text('No assessment scores available for this period.', 14, y);
                y += 10;
            }

            // ===== PERFORMANCE ANALYSIS =====
            if (subjectsWithValidScores.length > 0) {
                doc.setFont('helvetica', 'bold');
                doc.text('PERFORMANCE ANALYSIS', 14, y);
                y += 4;
                doc.setFont('helvetica', 'normal');

                // 1. Find Highest Score and ALL subjects that have it
                const scores = subjectsWithValidScores.map(s => s[assessmentType]);
                const highestScore = Math.max(...scores);
                const strongestSubjects = subjectsWithValidScores.filter(s => s[assessmentType] === highestScore);
                const strongestNames = strongestSubjects.map(s => s.name).join(', ');

                // 2. Find ALL subjects with D or F grades
                const needsImprovement = subjectsWithValidScores.filter(s => {
                    const grade = calculateGrade(s[assessmentType], passMark);
                    return ['D', 'F'].includes(grade);
                });

                // Create a string like "Maths (D), Science (F)"
                const improvementNames = needsImprovement.length > 0
                    ? needsImprovement.map(s => `${s.name} (${calculateGrade(s[assessmentType], passMark)})`).join(', ')
                    : 'None';

                // --- Render Best Subjects (Left) ---
                const strongLabel = `Best Subject${strongestSubjects.length > 1 ? 's' : ''}: `;
                const strongLines = doc.splitTextToSize(`${strongLabel}${strongestNames}`, 95);
                doc.text(strongLines, 14, y);
                doc.text(`Score: ${Math.round(highestScore)}%`, 14, y + (strongLines.length * 5));

                // --- Render Needs Improvement (Right) ---
                const improvementLabel = `Needs Improvement: `;
                const improvementLines = doc.splitTextToSize(`${improvementLabel}${improvementNames}`, 75);
                doc.text(improvementLines, 120, y);

                // If there are failures, show a sub-message, otherwise show a success message
                if (needsImprovement.length > 0) {
                    doc.setFontSize(8);
                    doc.text(`Total flagged: ${needsImprovement.length}`, 120, y + (improvementLines.length * 5) + 1);
                    doc.setFontSize(10);
                } else {
                    doc.text(`All subjects are currently satisfactory`, 120, y + 5);
                }

                // Move Y down based on whichever column was longer
                y += Math.max(strongLines.length * 5 + 10, improvementLines.length * 5 + 10);

                // --- Performance Stats ---
                const stats = subjectsWithValidScores.map(s => ({
                    score: s[assessmentType],
                    grade: calculateGrade(s[assessmentType], passMark)
                }));

                const subjectsPassed = stats.filter(s => s.grade !== 'F').length;
                const abGrades = stats.filter(s => ['A', 'B'].includes(s.grade)).length;
                const cdGrades = stats.filter(s => ['C', 'D'].includes(s.grade)).length;
                const belowPass = stats.filter(s => s.score < passMark).length;

                doc.text(`Subjects Passed: ${subjectsPassed}/${subjectsWithValidScores.length}`, 14, y);
                doc.text(`A & B Grades: ${abGrades}`, 14, y + 6);
                doc.text(`C & D Grades: ${cdGrades}`, 14, y + 12);
                doc.text(`Subjects Below ${passMark}% Pass Mark: ${belowPass}`, 14, y + 18);

                y += 28;
            }

            // ===== TEACHER REMARK =====
            doc.setFont('helvetica', 'bold');
            doc.text("TEACHER'S REMARK", 14, y);
            y += 4;
            doc.setFont('helvetica', 'normal');

            let teacherRemark = '';
            if (avgScore === 'N/A') {
                teacherRemark = 'No assessment scores available for evaluation.';
            } else {
                const numericAvg = parseFloat(avgScore);
                if (numericAvg >= 80) {
                    teacherRemark = 'Outstanding performance! Excellent understanding of concepts.';
                } else if (numericAvg >= 70) {
                    teacherRemark = 'Good performance. Shows strong understanding with room for growth.';
                } else if (numericAvg >= passMark) {
                    teacherRemark = 'Satisfactory performance. Focus on improving in weaker areas.';
                } else {
                    teacherRemark = 'Additional effort required. Please seek help and dedicate more time to studies.';
                }
            }

            doc.text(`"${teacherRemark}"`, 14, y);

            y += 14;

            // ===== FOOTER ===== (Same as ReportCard)
            const footerTitle = `${getAssessmentTitle(assessmentType)} Results Generated`;
            const footerDesc = "This assessment report was generated based on the school's active grade calculation configuration.\nFor any questions or clarifications, please contact the school administration.";;
            const generatedOn = `Generated on: ${new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })}`;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(footerTitle, pageWidth / 2, y, { align: 'center' });
            y += 6;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const lines = doc.splitTextToSize(footerDesc, pageWidth - 28);
            lines.forEach((line) => {
                doc.text(line, pageWidth / 2, y, { align: 'center' });
                y += 5;
            });

            doc.text(generatedOn, pageWidth / 2, y, { align: 'center' });

            // ===== SAVE =====
            const studentName = studentData.name || 'Student';
            const filename = `${getAssessmentTitle(assessmentType).replace(/\s+/g, '_')}_${studentName.replace(/\s+/g, '_')}.pdf`;

            doc.save(filename);

        } catch (error) {
            console.error('PDF Error:', error);
            alert('Could not generate PDF');
        } finally {
            setIsDownloading(false);
        }
    };

    // Rest of your existing component code...
    if (!hasAssessmentScores(assessmentType)) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-xl">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-700 mb-2">
                    No {assessmentType === 'qa1' ? 'Quarterly Assessment 1' :
                        assessmentType === 'qa2' ? 'Quarterly Assessment 2' :
                            'End of Term'} Scores
                </h4>
                <p className="text-slate-500 max-w-md mx-auto">
                    This student did not write the {assessmentType === 'qa1' ? 'first quarterly assessment' :
                        assessmentType === 'qa2' ? 'second quarterly assessment' :
                            'end of term examination'}.
                    Scores will appear here once entered by the teacher.
                </p>
            </div>
        );
    }

    const avgScore = calculateAssessmentAverage();
    // const subjectsWithScores = studentData.subjects.filter(s => hasValidScore(s[assessmentType]));
    const subjectsWithScores = studentData.subjects.filter(s => hasValidScore(s, assessmentType));
    const passMark = studentData.gradeConfiguration?.pass_mark || 50;
    const totalScored = calculateTotalScored();



    // Add this function to render the PDF content
    // Replace your entire renderPDFContent function with this:

    const renderPDFContent = () => {
        const assessmentType = activeTab as 'qa1' | 'qa2' | 'endOfTerm';
        const avgScore = calculateAssessmentAverage();
        const numericAvg = avgScore === 'N/A' ? null : parseFloat(avgScore);
        const subjectsWithScores = studentData.subjects.filter(s => hasValidScore(s, assessmentType));
        const passMark = studentData.gradeConfiguration?.pass_mark || 50;
        const displayRank = studentData.assessmentStats?.[assessmentType]?.classRank || 'N/A';
        const assessmentStatus = numericAvg !== null ? (numericAvg >= passMark ? 'PASSED' : 'FAILED') : 'N/A';
        const assessmentGrade = numericAvg !== null ? calculateGrade(numericAvg, passMark) : 'N/A';
        const totalScored = calculateTotalScored();

        // Calculate performance stats
        const subjectsPassed = subjectsWithScores.filter(s => {
            const grade = calculateGrade(s[assessmentType], passMark);
            return grade !== 'F';
        }).length;

        const abGrades = subjectsWithScores.filter(s => {
            const grade = calculateGrade(s[assessmentType], passMark);
            return ['A', 'B'].includes(grade);
        }).length;

        const cdGrades = subjectsWithScores.filter(s => {
            const grade = calculateGrade(s[assessmentType], passMark);
            return ['C', 'D'].includes(grade);
        }).length;

        const belowPass = subjectsWithScores.filter(s => {
            const score = s[assessmentType];
            return score < passMark;
        }).length;

        // Get strongest subjects
        const scores = subjectsWithScores.map(s => s[assessmentType]);
        const highestScore = Math.max(...scores);
        const strongestSubjects = subjectsWithScores.filter(s => s[assessmentType] === highestScore);
        const strongestNames = strongestSubjects.map(s => s.name).join(', ');

        // Get needs improvement subjects
        const needsImprovement = subjectsWithScores.filter(s => {
            const grade = calculateGrade(s[assessmentType], passMark);
            return ['D', 'F'].includes(grade);
        });
        const improvementNames = needsImprovement.length > 0
            ? needsImprovement.map(s => `${s.name} (${calculateGrade(s[assessmentType], passMark)})`).join(', ')
            : 'None';

        // Teacher remark - EXACT same as PDF
        let teacherRemark = '';
        if (avgScore === 'N/A') {
            teacherRemark = 'No assessment scores available for evaluation.';
        } else {
            if (numericAvg >= 80) {
                teacherRemark = 'Outstanding performance! Excellent understanding of concepts.';
            } else if (numericAvg >= 70) {
                teacherRemark = 'Good performance. Shows strong understanding with room for growth.';
            } else if (numericAvg >= passMark) {
                teacherRemark = 'Satisfactory performance. Focus on improving in weaker areas.';
            } else {
                teacherRemark = 'Additional effort required. Please seek help and dedicate more time to studies.';
            }
        }

        // Function to get grade color
        const getGradeBadgeColor = (grade: string) => {
            switch (grade) {
                case 'A': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
                case 'B': return 'bg-blue-100 text-blue-800 border-blue-300';
                case 'C': return 'bg-amber-100 text-amber-800 border-amber-300';
                case 'D': return 'bg-orange-100 text-orange-800 border-orange-300';
                case 'F': return 'bg-red-100 text-red-800 border-red-300';
                case 'AB': return 'bg-slate-100 text-slate-800 border-slate-300';
                default: return 'bg-slate-100 text-slate-800 border-slate-300';
            }
        };

        return (
            <div className="font-['helvetica'] max-w-4xl mx-auto p-8 bg-gradient-to-br from-slate-50 to-white rounded-xl shadow-2xl">
                {/* Header with gradient */}
                <div className="text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-xl -mt-8 -mx-8 mb-6">
                    <h1 className="text-3xl font-bold tracking-wide">{schoolName}</h1>
                    <h2 className="text-xl font-semibold mt-2 opacity-90">{getAssessmentTitle(assessmentType)} Results</h2>
                    <div className="flex justify-center gap-4 mt-3 text-sm">
                        <span className="px-3 py-1 bg-white/20 rounded-full">Year: {studentData.academicYear}</span>
                        <span className="px-3 py-1 bg-white/20 rounded-full">Term: {studentData.term}</span>
                    </div>
                </div>

                {/* STUDENT & ACADEMIC INFORMATION - with colored card */}
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500 shadow-sm">
                    <p className="font-bold text-lg text-indigo-800 mb-3 flex items-center">
                        <span className="w-1 h-6 bg-indigo-600 rounded-full mr-2"></span>
                        STUDENT & ACADEMIC INFORMATION
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white p-2 rounded shadow-sm"><span className="font-medium text-indigo-700">Student Name:</span> {studentData.name || 'N/A'}</div>
                        <div className="bg-white p-2 rounded shadow-sm"><span className="font-medium text-indigo-700">Exam Number:</span> {studentData.examNumber || 'N/A'}</div>
                        <div className="bg-white p-2 rounded shadow-sm"><span className="font-medium text-indigo-700">Class:</span> {studentData.class || 'N/A'}</div>
                        <div className="bg-white p-2 rounded shadow-sm"><span className="font-medium text-indigo-700">Term:</span> {studentData.term || 'N/A'}</div>
                        <div className="bg-white p-2 rounded shadow-sm"><span className="font-medium text-indigo-700">Academic Year:</span> {studentData.academicYear || 'N/A'}</div>
                        <div className="bg-white p-2 rounded shadow-sm"><span className="font-medium text-indigo-700">Total Enrollment:</span> {studentData.totalStudents || 'N/A'}</div>
                    </div>
                </div>

                {/* ASSESSMENT SUMMARY - with colored grid */}
                <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-l-4 border-purple-500 shadow-sm">
                    <p className="font-bold text-lg text-purple-800 mb-3 flex items-center">
                        <span className="w-1 h-6 bg-purple-600 rounded-full mr-2"></span>
                        ASSESSMENT SUMMARY
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white p-2 rounded shadow-sm"><span className="font-medium text-purple-700">Assessment Type:</span> {getAssessmentTitle(assessmentType)}</div>
                        <div className="bg-white p-2 rounded shadow-sm"><span className="font-medium text-purple-700">Subjects Assessed:</span> {subjectsWithScores.length}/{studentData.subjects.length}</div>
                        <div className="bg-white p-2 rounded shadow-sm"><span className="font-medium text-purple-700">Average Score:</span> {avgScore}%</div>
                        <div className="bg-white p-2 rounded shadow-sm"><span className="font-medium text-purple-700">Class Position:</span> {displayRank}</div>
                        <div className="bg-white p-2 rounded shadow-sm"><span className="font-medium text-purple-700">Overall Grade:</span>
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${getGradeBadgeColor(assessmentGrade)}`}>
                                {assessmentGrade}
                            </span>
                        </div>
                        <div className="bg-white p-2 rounded shadow-sm">
                            <span className="font-medium text-purple-700">Overall Status:</span>
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${assessmentStatus === 'PASSED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {assessmentStatus}
                            </span>
                        </div>
                    </div>
                </div>

                {/* RESULTS - with styled table */}
                <div className="mt-6 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border-l-4 border-emerald-500 shadow-sm">
                    <p className="font-bold text-lg text-emerald-800 mb-3 flex items-center">
                        <span className="w-1 h-6 bg-emerald-600 rounded-full mr-2"></span>
                        RESULTS
                    </p>
                    <div className="overflow-x-auto rounded-lg border border-emerald-200">
                        <table className="w-full text-sm">
                            <thead className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                                <tr>
                                    <th className="px-4 py-3 text-left">Subject</th>
                                    <th className="px-4 py-3 text-center">Total Marks</th>
                                    <th className="px-4 py-3 text-center">Marks Scored</th>
                                    <th className="px-4 py-3 text-center">Grade</th>
                                    <th className="px-4 py-3 text-center">Remark</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-200">
                                {subjectsWithScores.map((subject, idx) => {
                                    const score = subject[assessmentType];
                                    const isAbsent = assessmentType === 'qa1' ? subject.qa1_absent :
                                        assessmentType === 'qa2' ? subject.qa2_absent :
                                            subject.endOfTerm_absent;
                                    const grade = calculateGrade(score, passMark);
                                    const remark = grade === 'F' ? 'Failed' : 'Passed';

                                    return (
                                        <tr key={idx} className="hover:bg-emerald-50/50 transition-colors">
                                            <td className="px-4 py-2 font-medium">{subject.name}</td>
                                            <td className="px-4 py-2 text-center">100</td>
                                            <td className="px-4 py-2 text-center font-semibold">{isAbsent ? 'AB' : score}</td>
                                            <td className="px-4 py-2 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${getGradeBadgeColor(grade)}`}>
                                                    {grade}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${remark === 'Passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {remark}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-gradient-to-r from-emerald-100 to-teal-100 font-bold">
                                <tr>
                                    <td className="px-4 py-3">GRAND TOTAL</td>
                                    <td className="px-4 py-3 text-center">{subjectsWithScores.length * 100}</td>
                                    <td className="px-4 py-3 text-center text-emerald-700">{totalScored}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getGradeBadgeColor(assessmentGrade)}`}>
                                            {assessmentGrade}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${assessmentStatus === 'PASSED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {assessmentStatus}
                                        </span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* PERFORMANCE ANALYSIS - with colored cards */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-lg border-l-4 border-amber-500 shadow-sm">
                        <p className="font-bold text-amber-800 mb-2 flex items-center">
                            <span className="w-1 h-6 bg-amber-600 rounded-full mr-2"></span>
                            STRONGEST SUBJECTS
                        </p>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                            <p className="text-lg font-bold text-amber-700">{strongestNames}</p>
                            <p className="text-sm text-slate-600 mt-1">Score: <span className="font-bold text-amber-600">{Math.round(highestScore)}%</span></p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-rose-50 to-red-50 p-4 rounded-lg border-l-4 border-rose-500 shadow-sm">
                        <p className="font-bold text-rose-800 mb-2 flex items-center">
                            <span className="w-1 h-6 bg-rose-600 rounded-full mr-2"></span>
                            NEEDS IMPROVEMENT
                        </p>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                            <p className="text-sm font-medium text-rose-700">{improvementNames}</p>
                            {needsImprovement.length > 0 && (
                                <p className="text-xs text-slate-500 mt-1">Total flagged: {needsImprovement.length}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Performance Stats Grid */}
                <div className="mt-4 grid grid-cols-4 gap-3">
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-3 rounded-lg text-center border border-emerald-200">
                        <p className="text-xs text-emerald-700">Subjects Passed</p>
                        <p className="text-xl font-bold text-emerald-800">{subjectsPassed}/{subjectsWithScores.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg text-center border border-blue-200">
                        <p className="text-xs text-blue-700">A & B Grades</p>
                        <p className="text-xl font-bold text-blue-800">{abGrades}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3 rounded-lg text-center border border-amber-200">
                        <p className="text-xs text-amber-700">C & D Grades</p>
                        <p className="text-xl font-bold text-amber-800">{cdGrades}</p>
                    </div>
                    <div className="bg-gradient-to-br from-rose-50 to-red-50 p-3 rounded-lg text-center border border-rose-200">
                        <p className="text-xs text-rose-700">Below {passMark}%</p>
                        <p className="text-xl font-bold text-rose-800">{belowPass}</p>
                    </div>
                </div>

                {/* TEACHER'S REMARK - with styled card */}
                <div className="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border-l-4 border-indigo-500 shadow-sm">
                    <p className="font-bold text-lg text-indigo-800 mb-2 flex items-center">
                        <span className="w-1 h-6 bg-indigo-600 rounded-full mr-2"></span>
                        TEACHER'S REMARK
                    </p>
                    <div className="bg-white p-4 rounded-lg italic text-slate-700 border border-indigo-200">
                        "{teacherRemark}"
                    </div>
                </div>

                {/* Footer - with gradient */}
                <div className="mt-8 text-center bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 rounded-b-xl -mb-8 -mx-8">
                    <p className="text-lg font-bold tracking-wide">{getAssessmentTitle(assessmentType)} Results Generated</p>
                    <p className="text-sm mt-2 text-slate-300">This assessment report was generated based on the school's active grade calculation configuration.</p>
                    <p className="text-sm text-slate-300">For any questions or clarifications, please contact the school administration.</p>
                    <p className="text-sm mt-3 text-slate-400 border-t border-slate-700 pt-3">
                        Generated on: {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>
            </div>
        );
    };

    if (showPDFOnly) {
        return renderPDFContent();
    }

    return (
        <div className="space-y-6">
            {/* Download Button Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">
                        {getAssessmentTitle(assessmentType)} Results
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                        {/* <p className="text-slate-500">
                            Average Score: <span className="font-semibold text-indigo-600">
                                {avgScore === 'N/A' ? 'No tests' : `${avgScore}%`}
                            </span>
                        </p> */}
                        {/* <span className="text-slate-400">•</span> */}
                        <Target className="w-4 h-4 text-slate-400 mx-2" />
                        <p className="text-slate-500">
                            Total Marks Scored: <span className="font-semibold text-emerald-600">
                                {totalScored}/{subjectsWithScores.length * 100}
                            </span>
                        </p>


                    </div>
                </div>

                <button
                    onClick={handleDownloadAssessmentPDF}
                    disabled={isDownloading}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-white transition-colors ${isDownloading
                        ? 'bg-indigo-400 cursor-wait'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                >
                    {isDownloading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Generating PDF...</span>
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" />
                            <span>Download PDF</span>
                        </>
                    )}
                </button>
            </div>

            {/* Existing assessment results display */}
            <div className="grid gap-4">


                {studentData.subjects.map((subject, index) => {
                    const score = subject[assessmentType];
                    const isAbsent = assessmentType === 'qa1' ? subject.qa1_absent :
                        assessmentType === 'qa2' ? subject.qa2_absent :
                            subject.endOfTerm_absent;

                    // const hasScore = hasValidScore(score, isAbsent);
                    const hasScore = hasValidScore(subject, assessmentType);

                    const gradeForThisTab = (() => {
                        if (isAbsent) return 'AB';
                        if (!hasScore) return 'N/A';
                        if (score >= 80) return 'A';
                        if (score >= 70) return 'B';
                        if (score >= 60) return 'C';
                        if (score >= passMark) return 'D';
                        return 'F';
                    })();

                    return (
                        <div key={index} className="bg-white rounded-xl p-4 border border-slate-200 hover:border-indigo-200 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="flex-1">
                                    <h5 className="font-semibold text-slate-800">{subject.name}</h5>
                                    {hasScore ? (
                                        <>
                                            <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                {!isAbsent && (
                                                    <div
                                                        className={`h-full ${score >= 80 ? 'bg-emerald-500' :
                                                            score >= 60 ? 'bg-blue-500' :
                                                                score >= passMark ? 'bg-amber-500' :
                                                                    'bg-red-500'
                                                            } transition-all duration-500`}
                                                        style={{ width: `${Math.min(score, 100)}%` }}
                                                    ></div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="mt-2 text-sm text-amber-600 italic">
                                            {isAbsent ? 'Student was absent' : `No test conducted for ${getAssessmentTitle(assessmentType)}`}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        {!isAbsent && hasScore ? (
                                            <>
                                                <p className="text-2xl font-bold text-slate-800">{score}%</p>
                                                <p className="text-xs text-slate-500">Score</p>
                                            </>
                                        ) : isAbsent ? (
                                            <>
                                                <p className="text-2xl font-bold text-slate-800">AB</p>
                                                <p className="text-xs text-slate-500">Absent</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-2xl font-bold text-slate-400">N/A</p>
                                                <p className="text-xs text-slate-400">No Score</p>
                                            </>
                                        )}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${isAbsent ? 'text-slate-600 bg-slate-100' : getGradeColor(gradeForThisTab)}`}>
                                        {isAbsent ? 'AB' : gradeForThisTab}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {hasAssessmentScores(assessmentType) && (
                <div className="mt-8 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <h5 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        Teacher's Remark
                    </h5>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-lg text-slate-700 italic">
                            "{(() => {
                                const avg = parseFloat(calculateAssessmentAverage());
                                const pass = studentData.gradeConfiguration?.pass_mark || 50;

                                if (isNaN(avg)) return 'No assessment scores available for evaluation.';
                                if (avg >= 80) return 'Outstanding performance! Excellent understanding of concepts.';
                                if (avg >= 70) return 'Good performance. Shows strong understanding with room for growth.';
                                if (avg >= pass) return 'Satisfactory performance. Focus on improving in weaker areas.';
                                return 'Additional effort required. Please seek help and dedicate more time to studies.';
                            })()}"
                        </p>
                    </div>

                    {/* Quick Stats Row under the remark */}

                </div>
            )}
        </div>
    );
};

export default QAAssessment;

