import React, { useState, useEffect } from 'react';
import { StudentData } from '@/types';
import { TabType } from '@/types/app';
import { FileText, Download, Loader2, Target, Users, Award } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface QAAssessmentProps {
    studentData: StudentData;
    activeTab: TabType;
}

// Define the shape of the data coming from your API
interface SchoolFromDB {
    id: string;
    name: string;
}

const QAAssessment: React.FC<QAAssessmentProps> = ({ studentData, activeTab }) => {
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

    const calculateAverage = (subjects: StudentData['subjects'], type: 'qa1' | 'qa2' | 'endOfTerm'): string => {
        const validSubjects = subjects.filter(s => {
            const score = s[type];
            return score !== null && score !== undefined && score > 0;
        });

        if (validSubjects.length === 0) return 'N/A';

        const total = validSubjects.reduce((acc, s) => acc + s[type], 0);
        return (total / validSubjects.length).toFixed(1);
    };

    // CORRECTED: Calculate total marks scored for the assessment
    const calculateTotalScored = (): string => {
        const subjectsWithScores = studentData.subjects.filter(subject =>
            hasValidScore(subject[assessmentType])
        );

        if (subjectsWithScores.length === 0) return '0.0';

        const total = subjectsWithScores.reduce((sum, subject) => {
            return sum + subject[assessmentType]!;
        }, 0);

        return total.toFixed(1);
    };

    // CORRECTED: Calculate average grade for the assessment
    const calculateAssessmentAverage = (): string => {
        const subjectsWithScores = studentData.subjects.filter(subject =>
            hasValidScore(subject[assessmentType])
        );

        if (subjectsWithScores.length === 0) return 'N/A';

        const total = subjectsWithScores.reduce((sum, subject) => {
            return sum + subject[assessmentType]!;
        }, 0);

        return (total / subjectsWithScores.length).toFixed(1);
    };

    const hasValidScore = (score: number | null | undefined): boolean => {
        return score !== null && score !== undefined && score > 0;
    };

    const hasAssessmentScores = (type: 'qa1' | 'qa2' | 'endOfTerm'): boolean => {
        if (!studentData || !studentData.subjects || studentData.subjects.length === 0) {
            return false;
        }
        return studentData.subjects.some(subject => {
            const score = subject[type];
            return score !== null && score !== undefined && score > 0;
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

            // // ===== ASSESSMENT SUMMARY =====
            // doc.setFont('helvetica', 'bold');
            // doc.text('ASSESSMENT SUMMARY', 14, y);
            // y += 4;
            // doc.setFont('helvetica', 'normal');

            // const avgScore = calculateAssessmentAverage();
            // const subjectsWithScores = studentData.subjects.filter(s => hasValidScore(s[assessmentType]));
            // const passMark = studentData.gradeConfiguration?.pass_mark || 50;

            // doc.text(`Assessment Type: ${getAssessmentTitle(assessmentType)}`, 14, y);
            // doc.text(`Average Score: ${avgScore === 'N/A' ? 'No scores' : `${avgScore}%`}`, 14, y + 6);
            // doc.text(`Pass Mark: ${passMark}%`, 14, y + 12);
            // doc.text(`Subjects Assessed: ${subjectsWithScores.length}/${studentData.subjects.length}`, 120, y);

            // y += 20;

            // ===== ASSESSMENT SUMMARY =====

            // ===== ASSESSMENT SUMMARY =====
            doc.setFont('helvetica', 'bold');
            doc.text('ASSESSMENT SUMMARY', 14, y);
            y += 7;

            doc.setFont('helvetica', 'normal');

            // 1. Data Calculations
            const avgScore = calculateAssessmentAverage();
            const numericAvg = avgScore === 'N/A' ? null : parseFloat(avgScore);
            const subjectsWithScores = studentData.subjects.filter(s => hasValidScore(s[assessmentType]));
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
            // doc.setFont('helvetica', 'bold');
            // doc.text('ASSESSMENT SUMMARY', 14, y);
            // y += 7;

            // doc.setFont('helvetica', 'normal');

            // // 1. Data Calculations (One-time only)
            // const avgScore = calculateAssessmentAverage();
            // const numericAvg = avgScore === 'N/A' ? null : parseFloat(avgScore);
            // const subjectsWithScores = studentData.subjects.filter(s => hasValidScore(s[assessmentType]));
            // const passMark = studentData.gradeConfiguration?.pass_mark || 50;

            // // Determine Status and Grade
            // const assessmentStatus = numericAvg !== null ? (numericAvg >= passMark ? 'PASSED' : 'FAILED') : 'N/A';
            // const assessmentGrade = numericAvg !== null ? calculateGrade(numericAvg, passMark) : 'N/A';
            // const avgText = numericAvg !== null ? `${avgScore}%` : 'N/A';

            // // 2. Row 1: Assessment Type & Subjects Count
            // doc.text(`Assessment Type: ${getAssessmentTitle(assessmentType)}`, 14, y);
            // doc.text(`Subjects Assessed: ${subjectsWithScores.length}/${studentData.subjects.length}`, 120, y);
            // y += 7;

            // // 3. Row 2: Average Score & Class Position
            // doc.text(`Average Score: ${avgText}`, 14, y);
            // doc.text(`Class Position: ${studentData.classRank || 'N/A'}`, 120, y);

            // y += 7;

            // // 4. Row 3: Overall Grade & Overall Status
            // doc.text(`Overall Grade: ${assessmentGrade}`, 14, y);
            // doc.text(`Overall Status: ${assessmentStatus}`, 120, y);

            // // Final spacing for the next section
            // y += 10;



            // ===== RESULTS TABLE =====
            doc.setFont('helvetica', 'bold');
            doc.text('RESULTS', 14, y);
            y += 3;
            doc.setFont('helvetica', 'normal');

            // Filter subjects with valid scores
            const subjectsWithValidScores = studentData.subjects.filter(subject =>
                hasValidScore(subject[assessmentType])
            );

            if (subjectsWithValidScores.length > 0) {
                const tableBody = subjectsWithValidScores.map(subject => {
                    const score = subject[assessmentType]!;
                    const grade = calculateGrade(score, passMark);
                    const remark = grade === 'F' ? 'Failed' : 'Passed';

                    return [
                        subject.name,
                        '100', // Each subject has total marks of 100
                        score.toFixed(1),
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
                    totalScored, // Total scored marks
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

                // Best subject
                const bestSubject = subjectsWithValidScores.reduce((best, cur) =>
                    cur[assessmentType]! > best[assessmentType]! ? cur : best
                );

                // Weak subjects (C, D, F grades)
                const weakSubjects = subjectsWithValidScores.filter(subject => {
                    const grade = calculateGrade(subject[assessmentType]!, passMark);
                    return ['C', 'D', 'F'].includes(grade);
                });

                const weakestSubject = weakSubjects.length > 0
                    ? weakSubjects.reduce((w, c) =>
                        c[assessmentType]! < w[assessmentType]! ? c : w
                    )
                    : null;

                doc.text(`Best Subject: ${bestSubject.name}`, 14, y);
                doc.text(`Score: ${bestSubject[assessmentType]}%`, 14, y + 6);

                doc.text(
                    `Needs Improvement: ${weakestSubject ? weakestSubject.name : 'None'}`,
                    120,
                    y
                );

                if (weakestSubject) {
                    doc.text(
                        `Score: ${weakestSubject[assessmentType]}%`,
                        120,
                        y + 6
                    );
                }

                y += 14;

                // Performance stats
                const subjectsPassed = subjectsWithValidScores.filter(
                    s => calculateGrade(s[assessmentType]!, passMark) !== 'F'
                ).length;

                const abGrades = subjectsWithValidScores.filter(s =>
                    ['A', 'B'].includes(calculateGrade(s[assessmentType]!, passMark))
                ).length;

                const cdGrades = subjectsWithValidScores.filter(s =>
                    ['C', 'D'].includes(calculateGrade(s[assessmentType]!, passMark))
                ).length;

                const belowPass = subjectsWithValidScores.filter(
                    s => s[assessmentType]! < passMark
                ).length;

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
    const subjectsWithScores = studentData.subjects.filter(s => hasValidScore(s[assessmentType]));
    const passMark = studentData.gradeConfiguration?.pass_mark || 50;
    const totalScored = calculateTotalScored();

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
                    const hasScore = hasValidScore(score);

                    const gradeForThisTab = (() => {
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
                                                <div
                                                    className={`h-full ${score >= 80 ? 'bg-emerald-500' :
                                                        score >= 60 ? 'bg-blue-500' :
                                                            score >= passMark ? 'bg-amber-500' :
                                                                'bg-red-500'
                                                        } transition-all duration-500`}
                                                    style={{ width: `${Math.min(score, 100)}%` }}
                                                ></div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="mt-2 text-sm text-amber-600 italic">
                                            No test conducted for {getAssessmentTitle(assessmentType)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        {hasScore ? (
                                            <>
                                                <p className="text-2xl font-bold text-slate-800">{score}%</p>
                                                <p className="text-xs text-slate-500">Score</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-2xl font-bold text-slate-400">N/A</p>
                                                <p className="text-xs text-slate-400">No Score</p>
                                            </>
                                        )}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(gradeForThisTab)}`}>
                                        {gradeForThisTab}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Performance Summary Card */}
            {/* {hasAssessmentScores(assessmentType) && (
                <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-xl p-6 border border-indigo-100 mt-6">
                    <h5 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        Performance Summary
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-3 rounded-lg text-center">
                            <p className="text-sm text-slate-500">Average Score</p>
                            <p className="text-2xl font-bold text-indigo-700">
                                {avgScore}%
                            </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg text-center">
                            <p className="text-sm text-slate-500">Total Scored</p>
                            <p className="text-2xl font-bold text-emerald-700">
                                {totalScored}<span className="text-sm text-slate-400">/{subjectsWithScores.length * 100}</span>
                            </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg text-center">
                            <p className="text-sm text-slate-500">Pass Rate</p>
                            <p className="text-2xl font-bold text-blue-700">
                                {(() => {
                                    if (subjectsWithScores.length === 0) return '0%';
                                    const passed = subjectsWithScores.filter(s => s[assessmentType]! >= passMark).length;
                                    return `${((passed / subjectsWithScores.length) * 100).toFixed(1)}%`;
                                })()}
                            </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg text-center">
                            <p className="text-sm text-slate-500">Status</p>
                            <p className={`text-xl font-bold ${parseFloat(avgScore) >= passMark
                                ? 'text-emerald-700'
                                : 'text-red-700'
                                }`}>
                                {parseFloat(avgScore) >= passMark
                                    ? 'PASSING'
                                    : 'NEEDS IMPROVEMENT'}
                            </p>
                        </div>
                    </div>
                </div>
            )} */}
            {/* Teacher's Remark (Replaces the commented out Performance Summary) */}
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

// import React, { useState } from 'react';
// import { StudentData } from '@/types';
// import { TabType } from '@/types/app';
// import { FileText, Download, Loader2 } from 'lucide-react';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';

// interface QAAssessmentProps {
//     studentData: StudentData;
//     activeTab: TabType;
// }

// const QAAssessment: React.FC<QAAssessmentProps> = ({ studentData, activeTab }) => {
//     const [isDownloading, setIsDownloading] = useState(false);
//     const assessmentType = activeTab as 'qa1' | 'qa2' | 'endOfTerm';

//     // Helper functions for PDF generation
//     const getAssessmentTitle = (type: 'qa1' | 'qa2' | 'endOfTerm') => {
//         switch (type) {
//             case 'qa1': return 'Quarterly Assessment 1';
//             case 'qa2': return 'Quarterly Assessment 2';
//             case 'endOfTerm': return 'End of Term Examination';
//             default: return 'Assessment';
//         }
//     };

//     const getGradeColor = (grade: string) => {
//         if (grade === 'N/A') return 'text-slate-600 bg-slate-100';
//         if (grade.includes('A')) return 'text-emerald-600 bg-emerald-50';
//         if (grade === 'B') return 'text-blue-600 bg-blue-50';
//         if (grade === 'C') return 'text-amber-600 bg-amber-50';
//         return 'text-red-600 bg-red-50';
//     };

//     const calculateGrade = (score: number, passMark?: number): string => {
//         const effectivePassMark = passMark || 50;
//         if (score >= 80) return 'A';
//         if (score >= 70) return 'B';
//         if (score >= 60) return 'C';
//         if (score >= effectivePassMark) return 'D';
//         return 'F';
//     };

//     const calculateAverage = (subjects: StudentData['subjects'], type: 'qa1' | 'qa2' | 'endOfTerm'): string => {
//         const validSubjects = subjects.filter(s => {
//             const score = s[type];
//             return score !== null && score !== undefined && score > 0;
//         });

//         if (validSubjects.length === 0) return 'N/A';

//         const total = validSubjects.reduce((acc, s) => acc + s[type], 0);
//         return (total / validSubjects.length).toFixed(1);
//     };

//     const hasValidScore = (score: number | null | undefined): boolean => {
//         return score !== null && score !== undefined && score > 0;
//     };

//     const hasAssessmentScores = (type: 'qa1' | 'qa2' | 'endOfTerm'): boolean => {
//         if (!studentData || !studentData.subjects || studentData.subjects.length === 0) {
//             return false;
//         }
//         return studentData.subjects.some(subject => {
//             const score = subject[type];
//             return score !== null && score !== undefined && score > 0;
//         });
//     };

//     // PDF Generation function for assessments
//     const handleDownloadAssessmentPDF = () => {
//         setIsDownloading(true);

//         try {
//             const doc = new jsPDF();
//             const pageWidth = doc.internal.pageSize.getWidth();
//             let y = 20;

//             // Header
//             doc.setFontSize(18);
//             doc.setFont('helvetica', 'bold');
//             doc.text('STUDENT ASSESSMENT REPORT', pageWidth / 2, y, { align: 'center' });

//             y += 6;
//             doc.setFontSize(14);
//             doc.text(getAssessmentTitle(assessmentType), pageWidth / 2, y, { align: 'center' });

//             y += 12;

//             // Student Information
//             doc.setFontSize(10);
//             doc.setFont('helvetica', 'bold');
//             doc.text('STUDENT INFORMATION', 14, y);
//             y += 4;
//             doc.setFont('helvetica', 'normal');

//             doc.text(`Student Name: ${studentData.name || 'N/A'}`, 14, y);
//             doc.text(`Exam Number: ${studentData.examNumber || 'N/A'}`, 14, y + 6);
//             doc.text(`Class: ${studentData.class || 'N/A'}`, 14, y + 12);
//             doc.text(`Academic Year: ${studentData.academicYear || 'N/A'}`, 120, y);
//             doc.text(`Term: ${studentData.term || 'N/A'}`, 120, y + 6);

//             y += 22;

//             // Assessment Summary
//             doc.setFont('helvetica', 'bold');
//             doc.text('ASSESSMENT SUMMARY', 14, y);
//             y += 4;
//             doc.setFont('helvetica', 'normal');

//             const avgScore = calculateAverage(studentData.subjects, assessmentType);
//             const subjectsWithScores = studentData.subjects.filter(s => hasValidScore(s[assessmentType]));

//             doc.text(`Assessment Type: ${getAssessmentTitle(assessmentType)}`, 14, y);
//             doc.text(`Average Score: ${avgScore === 'N/A' ? 'No scores available' : `${avgScore}%`}`, 14, y + 6);
//             doc.text(`Subjects Assessed: ${subjectsWithScores.length}/${studentData.subjects.length}`, 14, y + 12);

//             y += 20;

//             // Results Table
//             doc.setFont('helvetica', 'bold');
//             doc.text('SUBJECT RESULTS', 14, y);
//             y += 4;
//             doc.setFont('helvetica', 'normal');

//             // Filter subjects with valid scores
//             const subjectsWithValidScores = studentData.subjects.filter(subject =>
//                 hasValidScore(subject[assessmentType])
//             );

//             if (subjectsWithValidScores.length > 0) {
//                 const tableBody = subjectsWithValidScores.map(subject => {
//                     const score = subject[assessmentType]!;
//                     const grade = calculateGrade(score, studentData.gradeConfiguration?.pass_mark || 50);
//                     const remark = grade === 'F' ? 'Failed' : 'Passed';

//                     return [
//                         subject.name,
//                         '100',
//                         score.toFixed(1),
//                         grade,
//                         remark
//                     ];
//                 });

//                 // Add total row
//                 const totalMarks = subjectsWithValidScores.reduce((sum, subject) => sum + subject[assessmentType]!, 0);
//                 const averageMarks = totalMarks / subjectsWithValidScores.length;
//                 const overallGrade = calculateGrade(averageMarks, studentData.gradeConfiguration?.pass_mark || 50);
//                 const overallRemark = overallGrade === 'F' ? 'Failed' : 'Passed';

//                 tableBody.push([
//                     'TOTAL / AVERAGE',
//                     String(subjectsWithValidScores.length * 100),
//                     averageMarks.toFixed(1),
//                     overallGrade,
//                     overallRemark
//                 ]);

//                 autoTable(doc, {
//                     startY: y,
//                     head: [['Subject', 'Total Marks', 'Marks Obtained', 'Grade', 'Remark']],
//                     body: tableBody,
//                     theme: 'striped',
//                     didParseCell: (data) => {
//                         if (data.row.index === tableBody.length - 1) {
//                             data.cell.styles.fontStyle = 'bold';
//                         }
//                     },
//                 });

//                 y = (doc as any).lastAutoTable.finalY + 10;
//             } else {
//                 doc.text('No assessment scores available for this period.', 14, y);
//                 y += 10;
//             }

//             // Performance Breakdown
//             if (subjectsWithValidScores.length > 0) {
//                 doc.setFont('helvetica', 'bold');
//                 doc.text('PERFORMANCE BREAKDOWN', 14, y);
//                 y += 4;
//                 doc.setFont('helvetica', 'normal');

//                 const passMark = studentData.gradeConfiguration?.pass_mark || 50;

//                 // Count grades
//                 const aCount = subjectsWithValidScores.filter(s => calculateGrade(s[assessmentType]!, passMark) === 'A').length;
//                 const bCount = subjectsWithValidScores.filter(s => calculateGrade(s[assessmentType]!, passMark) === 'B').length;
//                 const cCount = subjectsWithValidScores.filter(s => calculateGrade(s[assessmentType]!, passMark) === 'C').length;
//                 const dCount = subjectsWithValidScores.filter(s => calculateGrade(s[assessmentType]!, passMark) === 'D').length;
//                 const fCount = subjectsWithValidScores.filter(s => calculateGrade(s[assessmentType]!, passMark) === 'F').length;

//                 doc.text(`Grade A: ${aCount} subjects`, 14, y);
//                 doc.text(`Grade B: ${bCount} subjects`, 14, y + 6);
//                 doc.text(`Grade C: ${cCount} subjects`, 14, y + 12);
//                 doc.text(`Grade D: ${dCount} subjects`, 14, y + 18);
//                 doc.text(`Grade F: ${fCount} subjects`, 14, y + 24);

//                 doc.text(`Pass Rate: ${((aCount + bCount + cCount + dCount) / subjectsWithValidScores.length * 100).toFixed(1)}%`, 120, y);
//                 doc.text(`Subjects Above ${passMark}%: ${aCount + bCount + cCount + dCount}/${subjectsWithValidScores.length}`, 120, y + 6);

//                 y += 32;
//             }

//             // Footer
//             doc.setFont('helvetica', 'normal');
//             doc.setFontSize(10);
//             doc.text(
//                 `Generated on: ${new Date().toLocaleDateString('en-US', {
//                     weekday: 'long',
//                     year: 'numeric',
//                     month: 'long',
//                     day: 'numeric',
//                 })}`,
//                 pageWidth / 2,
//                 y,
//                 { align: 'center' }
//             );

//             y += 6;

//             doc.setFontSize(8);
//             doc.text(
//                 'This is an assessment report only. For complete academic performance, refer to the full report card.',
//                 pageWidth / 2,
//                 y,
//                 { align: 'center' }
//             );

//             // Save PDF
//             const studentName = studentData.name || 'Student';
//             const assessmentTitle = getAssessmentTitle(assessmentType).replace(/\s+/g, '_');
//             const filename = `${assessmentTitle}_${studentName.replace(/\s+/g, '_')}.pdf`;

//             doc.save(filename);

//         } catch (error) {
//             console.error('Error generating assessment PDF:', error);
//             alert('Failed to generate PDF. Please try again.');
//         } finally {
//             setIsDownloading(false);
//         }
//     };

//     // Rest of your existing component code...
//     if (!hasAssessmentScores(assessmentType)) {
//         return (
//             <div className="text-center py-12 bg-slate-50 rounded-xl">
//                 <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
//                 <h4 className="text-lg font-semibold text-slate-700 mb-2">
//                     No {assessmentType === 'qa1' ? 'Quarterly Assessment 1' :
//                         assessmentType === 'qa2' ? 'Quarterly Assessment 2' :
//                             'End of Term'} Scores
//                 </h4>
//                 <p className="text-slate-500 max-w-md mx-auto">
//                     This student did not write the {assessmentType === 'qa1' ? 'first quarterly assessment' :
//                         assessmentType === 'qa2' ? 'second quarterly assessment' :
//                             'end of term examination'}.
//                     Scores will appear here once entered by the teacher.
//                 </p>
//             </div>
//         );
//     }

//     return (
//         <div className="space-y-6">
//             {/* Download Button Header */}
//             <div className="flex items-center justify-between mb-6">
//                 <div>
//                     <h3 className="text-xl font-bold text-slate-800">
//                         {getAssessmentTitle(assessmentType)} Results
//                     </h3>
//                     <p className="text-slate-500 mt-1">
//                         Average Score: <span className="font-semibold text-indigo-600">
//                             {calculateAverage(studentData.subjects, assessmentType) === 'N/A' ?
//                                 'No tests conducted' :
//                                 `${calculateAverage(studentData.subjects, assessmentType)}%`}
//                         </span>
//                     </p>
//                 </div>

//                 <button
//                     onClick={handleDownloadAssessmentPDF}
//                     disabled={isDownloading}
//                     className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-white transition-colors ${isDownloading
//                         ? 'bg-indigo-400 cursor-wait'
//                         : 'bg-indigo-600 hover:bg-indigo-700'
//                         }`}
//                 >
//                     {isDownloading ? (
//                         <>
//                             <Loader2 className="w-4 h-4 animate-spin" />
//                             <span>Generating PDF...</span>
//                         </>
//                     ) : (
//                         <>
//                             <Download className="w-4 h-4" />
//                             <span>Download PDF</span>
//                         </>
//                     )}
//                 </button>
//             </div>

//             {/* Existing assessment results display */}
//             <div className="grid gap-4">
//                 {studentData.subjects.map((subject, index) => {
//                     const score = subject[assessmentType];
//                     const hasScore = hasValidScore(score);

//                     const gradeForThisTab = (() => {
//                         if (!hasScore) return 'N/A';
//                         const passMark = studentData.gradeConfiguration?.pass_mark || 50;
//                         if (score >= 80) return 'A';
//                         if (score >= 70) return 'B';
//                         if (score >= 60) return 'C';
//                         if (score >= passMark) return 'D';
//                         return 'F';
//                     })();

//                     return (
//                         <div key={index} className="bg-white rounded-xl p-4 border border-slate-200 hover:border-indigo-200 transition-colors">
//                             <div className="flex flex-col sm:flex-row sm:items-center gap-3">
//                                 <div className="flex-1">
//                                     <h5 className="font-semibold text-slate-800">{subject.name}</h5>
//                                     {hasScore ? (
//                                         <>
//                                             <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
//                                                 <div
//                                                     className={`h-full ${score >= 80 ? 'bg-emerald-500' :
//                                                         score >= 60 ? 'bg-blue-500' :
//                                                             score >= (studentData.gradeConfiguration?.pass_mark || 50) ? 'bg-amber-500' :
//                                                                 'bg-red-500'
//                                                         } transition-all duration-500`}
//                                                     style={{ width: `${Math.min(score, 100)}%` }}
//                                                 ></div>
//                                             </div>
//                                         </>
//                                     ) : (
//                                         <div className="mt-2 text-sm text-amber-600 italic">
//                                             No test conducted for {getAssessmentTitle(assessmentType)}
//                                         </div>
//                                     )}
//                                 </div>
//                                 <div className="flex items-center gap-4">
//                                     <div className="text-right">
//                                         {hasScore ? (
//                                             <>
//                                                 <p className="text-2xl font-bold text-slate-800">{score}%</p>
//                                                 <p className="text-xs text-slate-500">Score</p>
//                                             </>
//                                         ) : (
//                                             <>
//                                                 <p className="text-2xl font-bold text-slate-400">N/A</p>
//                                                 <p className="text-xs text-slate-400">No Score</p>
//                                             </>
//                                         )}
//                                     </div>
//                                     <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(gradeForThisTab)}`}>
//                                         {gradeForThisTab}
//                                     </span>
//                                 </div>
//                             </div>
//                         </div>
//                     );
//                 })}
//             </div>

//             {/* Performance Summary Card */}
//             {hasAssessmentScores(assessmentType) && (
//                 <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-xl p-6 border border-indigo-100 mt-6">
//                     <h5 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
//                         Performance Summary
//                     </h5>
//                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                         <div className="bg-white p-3 rounded-lg text-center">
//                             <p className="text-sm text-slate-500">Average Score</p>
//                             <p className="text-2xl font-bold text-indigo-700">
//                                 {calculateAverage(studentData.subjects, assessmentType)}%
//                             </p>
//                         </div>
//                         <div className="bg-white p-3 rounded-lg text-center">
//                             <p className="text-sm text-slate-500">Subjects Assessed</p>
//                             <p className="text-2xl font-bold text-emerald-700">
//                                 {studentData.subjects.filter(s => hasValidScore(s[assessmentType])).length}
//                                 <span className="text-sm text-slate-400">/{studentData.subjects.length}</span>
//                             </p>
//                         </div>
//                         <div className="bg-white p-3 rounded-lg text-center">
//                             <p className="text-sm text-slate-500">Pass Rate</p>
//                             <p className="text-2xl font-bold text-blue-700">
//                                 {(() => {
//                                     const validSubjects = studentData.subjects.filter(s => hasValidScore(s[assessmentType]));
//                                     if (validSubjects.length === 0) return '0%';
//                                     const passMark = studentData.gradeConfiguration?.pass_mark || 50;
//                                     const passed = validSubjects.filter(s => s[assessmentType]! >= passMark).length;
//                                     return `${((passed / validSubjects.length) * 100).toFixed(1)}%`;
//                                 })()}
//                             </p>
//                         </div>
//                         <div className="bg-white p-3 rounded-lg text-center">
//                             <p className="text-sm text-slate-500">Status</p>
//                             <p className={`text-xl font-bold ${parseFloat(calculateAverage(studentData.subjects, assessmentType)) >=
//                                 (studentData.gradeConfiguration?.pass_mark || 50)
//                                 ? 'text-emerald-700'
//                                 : 'text-red-700'
//                                 }`}>
//                                 {parseFloat(calculateAverage(studentData.subjects, assessmentType)) >=
//                                     (studentData.gradeConfiguration?.pass_mark || 50)
//                                     ? 'PASSING'
//                                     : 'NEEDS IMPROVEMENT'}
//                             </p>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default QAAssessment;

// import React from 'react';
// import { StudentData } from '@/types';
// import { TabType } from '@/types/app';
// import { FileText } from 'lucide-react';

// interface QAAssessmentProps {
//     studentData: StudentData;
//     activeTab: TabType;
// }

// const QAAssessment: React.FC<QAAssessmentProps> = ({ studentData, activeTab }) => {
//     // Ensure activeTab is only qa1, qa2, or endOfTerm (reportCard shouldn't be passed here)
//     const assessmentType = activeTab as 'qa1' | 'qa2' | 'endOfTerm';

//     const getGradeColor = (grade: string) => {
//         if (grade === 'N/A') return 'text-slate-600 bg-slate-100';
//         if (grade.includes('A')) return 'text-emerald-600 bg-emerald-50';
//         if (grade === 'B') return 'text-blue-600 bg-blue-50';
//         if (grade === 'C') return 'text-amber-600 bg-amber-50';
//         return 'text-red-600 bg-red-50';
//     };

//     const getScoreColor = (score: number) => {
//         if (score === null || score === undefined || score <= 0) return 'bg-slate-300';
//         const passMark = studentData.gradeConfiguration?.pass_mark || 50;
//         if (score >= 80) return 'bg-emerald-500';
//         if (score >= 60) return 'bg-blue-500';
//         if (score >= passMark) return 'bg-amber-500';
//         return 'bg-red-500';
//     };

//     const calculateAverage = (subjects: StudentData['subjects'], type: 'qa1' | 'qa2' | 'endOfTerm' | 'overall') => {
//         if (subjects.length === 0) return 'N/A';

//         if (type === 'overall') {
//             const validSubjects = subjects.filter(s => {
//                 const finalScore = s.finalScore || ((s.qa1 + s.qa2 + s.endOfTerm) / 3);
//                 return finalScore > 0;
//             });

//             if (validSubjects.length === 0) return 'N/A';

//             const total = validSubjects.reduce((acc, s) => {
//                 const finalScore = s.finalScore || ((s.qa1 + s.qa2 + s.endOfTerm) / 3);
//                 return acc + finalScore;
//             }, 0);
//             return (total / validSubjects.length).toFixed(1);
//         }

//         const validSubjects = subjects.filter(s => s[type] !== null && s[type] !== undefined && s[type] > 0);
//         if (validSubjects.length === 0) return 'N/A';

//         const total = validSubjects.reduce((acc, s) => acc + s[type], 0);
//         return (total / validSubjects.length).toFixed(1);
//     };

//     const hasValidScore = (score: number | null | undefined): boolean => {
//         return score !== null && score !== undefined && score > 0;
//     };

//     const hasAssessmentScores = (type: 'qa1' | 'qa2' | 'endOfTerm'): boolean => {
//         if (!studentData || !studentData.subjects || studentData.subjects.length === 0) {
//             return false;
//         }

//         return studentData.subjects.some(subject => {
//             const score = subject[type];
//             return score !== null && score !== undefined && score > 0;
//         });
//     };

//     if (!hasAssessmentScores(assessmentType)) {
//         return (
//             <div className="text-center py-12 bg-slate-50 rounded-xl">
//                 <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
//                 <h4 className="text-lg font-semibold text-slate-700 mb-2">
//                     No {assessmentType === 'qa1' ? 'Quarterly Assessment 1' :
//                         assessmentType === 'qa2' ? 'Quarterly Assessment 2' :
//                             'End of Term'} Scores
//                 </h4>
//                 <p className="text-slate-500 max-w-md mx-auto">
//                     This student did not write the {assessmentType === 'qa1' ? 'first quarterly assessment' :
//                         assessmentType === 'qa2' ? 'second quarterly assessment' :
//                             'end of term examination'}.
//                     Scores will appear here once entered by the teacher.
//                 </p>
//             </div>
//         );
//     }

//     return (
//         <div>
//             <div className="flex items-center justify-between mb-6">
//                 <p className="text-slate-500">
//                     Average Score: <span className="font-semibold text-indigo-600">
//                         {calculateAverage(studentData.subjects, assessmentType) === 'N/A' ? 'No tests conducted' : `${calculateAverage(studentData.subjects, assessmentType)}%`}
//                     </span>
//                 </p>
//             </div>

//             <div className="grid gap-4">
//                 {studentData.subjects.map((subject, index) => {
//                     const score = subject[assessmentType];
//                     const hasScore = hasValidScore(score);

//                     const gradeForThisTab = (() => {
//                         if (!hasScore) return 'N/A';
//                         const passMark = studentData.gradeConfiguration?.pass_mark || 50;
//                         if (score >= 80) return 'A';
//                         if (score >= 70) return 'B';
//                         if (score >= 60) return 'C';
//                         if (score >= passMark) return 'D';
//                         return 'F';
//                     })();

//                     return (
//                         <div key={index} className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
//                             <div className="flex flex-col sm:flex-row sm:items-center gap-3">
//                                 <div className="flex-1">
//                                     <h5 className="font-semibold text-slate-800">{subject.name}</h5>
//                                     {hasScore ? (
//                                         <>
//                                             <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
//                                                 <div
//                                                     className={`h-full ${getScoreColor(score)} transition-all duration-500`}
//                                                     style={{ width: `${Math.min(score, 100)}%` }}
//                                                 ></div>
//                                             </div>
//                                         </>
//                                     ) : (
//                                         <div className="mt-2 text-sm text-amber-600 italic">
//                                             No test conducted for {assessmentType === 'qa1' ? 'Quarterly Assessment 1' :
//                                                 assessmentType === 'qa2' ? 'Quarterly Assessment 2' :
//                                                     'End of Term Examination'}
//                                         </div>
//                                     )}
//                                 </div>
//                                 <div className="flex items-center gap-4">
//                                     <div className="text-right">
//                                         {hasScore ? (
//                                             <>
//                                                 <p className="text-2xl font-bold text-slate-800">{score}%</p>
//                                                 <p className="text-xs text-slate-500">Score</p>
//                                             </>
//                                         ) : (
//                                             <>
//                                                 <p className="text-2xl font-bold text-slate-400">N/A</p>
//                                                 <p className="text-xs text-slate-400">No Score</p>
//                                             </>
//                                         )}
//                                     </div>
//                                     <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(gradeForThisTab)}`}>
//                                         {gradeForThisTab}
//                                     </span>
//                                 </div>
//                             </div>
//                         </div>
//                     );
//                 })}
//             </div>
//         </div>
//     );
// };

// export default QAAssessment;