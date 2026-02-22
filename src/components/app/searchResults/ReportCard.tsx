import React, { useEffect, useRef, useState } from 'react';
import { StudentData } from '@/types';
import { Download, Printer, CheckCircle, AlertCircle, TrendingUp, Calendar, User, Loader2 } from 'lucide-react';
// import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';

interface ReportCardProps {
    studentData: StudentData;
    onPrint?: () => void;
    showActions?: boolean;
}

// Define the shape of the data coming from your API (based on your SchoolsManagement code)
interface SchoolFromDB {
    id: string;
    name: string;
}

const ReportCard: React.FC<ReportCardProps> = ({
    studentData,
    onPrint,
    showActions = true
}) => {
    const reportCardRef = useRef<HTMLDivElement>(null);

    const [isDownloading, setIsDownloading] = useState(false)
    // 1. State for the School Name
    const [schoolName, setSchoolName] = useState<string>('Loading School...');


    // 2. The Logic to Fetch and Find the School
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

                    // 1. Extract the prefix from the Exam Number
                    // If exam number is "f22-26-5001", we split by '-' and take the first part "f22"
                    let examPrefix = '';

                    if (studentData.examNumber.includes('-')) {
                        examPrefix = studentData.examNumber.split('-')[0];
                    } else {
                        // Fallback: If no hyphen, take the first 3 characters
                        examPrefix = studentData.examNumber.substring(0, 3);
                    }

                    console.log("Looking for school starting with:", examPrefix);

                    // 2. Find the school whose Long ID starts with that short prefix
                    const matchedSchool = schools.find(school =>
                        school.id.toString().toLowerCase().startsWith(examPrefix.toLowerCase())
                    );

                    if (matchedSchool) {
                        setSchoolName(matchedSchool.name);
                    } else {
                        console.warn('No school matched prefix:', examPrefix);
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

    const getGradeColor = (grade: string) => {
        if (grade === 'AB' || grade === 'N/A') return 'text-slate-600 bg-slate-100';
        if (grade.includes('A')) return 'text-emerald-600 bg-emerald-50';
        if (grade === 'B') return 'text-blue-600 bg-blue-50';
        if (grade === 'C') return 'text-amber-600 bg-amber-50';
        return 'text-red-600 bg-red-50';
    };

    const getRemarkColor = (remark: string): string => {
        if (remark === 'Absent') return 'bg-slate-100 text-slate-700';
        return remark === 'Passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
    };

    // NEW: Check if student has valid score (including 0 and AB)
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

    // NEW: Check if any assessment has scores (including 0 and AB)
    // const hasAssessmentScores = (assessmentType: 'qa1' | 'qa2' | 'endOfTerm'): boolean => {
    //     if (!studentData || !studentData.subjects || studentData.subjects.length === 0) {
    //         return false;
    //     }

    //     return studentData.subjects.some(subject => {
    //         const score = subject[assessmentType];
    //         // Check if score was ACTUALLY entered (not null/undefined)
    //         // This allows 0 and AB to pass through
    //         return score !== null && score !== undefined;
    //     });
    // };


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

    // Calculate final score based on grade configuration (handles AB and 0)
    // Calculate final score based on grade configuration (handles AB and 0 correctly)
    const calculateFinalScore = (
        qa1: number | null | undefined,
        qa2: number | null | undefined,
        endOfTerm: number | null | undefined,
        qa1_absent?: boolean,
        qa2_absent?: boolean,
        endOfTerm_absent?: boolean,
        gradeConfig?: StudentData['gradeConfiguration']
    ): number | 'AB' => {
        // Check if student was ABSENT (only when absent flag is true, NOT when score is 0)
        const isQa1Absent = qa1_absent === true;
        const isQa2Absent = qa2_absent === true;
        const isEndOfTermAbsent = endOfTerm_absent === true;

        // If ALL assessments are absent, return AB
        if (isQa1Absent && isQa2Absent && isEndOfTermAbsent) return 'AB';

        // Convert null/undefined to 0 for calculation (0 is a valid score, not absence)
        const numQA1 = (qa1 === null || qa1 === undefined) ? 0 : qa1;
        const numQA2 = (qa2 === null || qa2 === undefined) ? 0 : qa2;
        const numEndOfTerm = (endOfTerm === null || endOfTerm === undefined) ? 0 : endOfTerm;

        // Check if any REQUIRED assessment is absent based on calculation method
        if (gradeConfig) {
            const method = gradeConfig.calculation_method;

            if (method === 'end_of_term_only') {
                // Only end of term matters
                if (isEndOfTermAbsent) return 'AB';
                return numEndOfTerm;
            }

            if (method === 'average_all') {
                // All three assessments required
                if (isQa1Absent || isQa2Absent || isEndOfTermAbsent) return 'AB';
                return (numQA1 + numQA2 + numEndOfTerm) / 3;
            }

            if (method === 'weighted_average') {
                // Check if any weighted component is absent
                if ((gradeConfig.weight_qa1 > 0 && isQa1Absent) ||
                    (gradeConfig.weight_qa2 > 0 && isQa2Absent) ||
                    (gradeConfig.weight_end_of_term > 0 && isEndOfTermAbsent)) {
                    return 'AB';
                }

                const totalWeight = gradeConfig.weight_qa1 + gradeConfig.weight_qa2 + gradeConfig.weight_end_of_term;
                const weightedSum =
                    (numQA1 * gradeConfig.weight_qa1) +
                    (numQA2 * gradeConfig.weight_qa2) +
                    (numEndOfTerm * gradeConfig.weight_end_of_term);
                return weightedSum / totalWeight;
            }
        }

        // Default: if any assessment is absent, return AB
        if (isQa1Absent || isQa2Absent || isEndOfTermAbsent) return 'AB';

        // Default simple average
        return (numQA1 + numQA2 + numEndOfTerm) / 3;
    };

    // Calculate grade based on score and pass mark (handles AB)
    const calculateGrade = (score: number | 'AB', passMark?: number): string => {
        if (score === 'AB') return 'AB';
        const effectivePassMark = passMark || 50;

        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        if (score >= effectivePassMark) return 'D';
        return 'F';
    };

    // Calculate subject average with grade configuration (handles AB)
    const calculateSubjectAverage = (subject: StudentData['subjects'][0]): number | 'AB' => {
        if (subject.finalScore) {
            return subject.finalScore;
        }

        return calculateFinalScore(
            subject.qa1,
            subject.qa2,
            subject.endOfTerm,
            subject.qa1_absent,
            subject.qa2_absent,
            subject.endOfTerm_absent,
            studentData.gradeConfiguration
        );
    };

    // Calculate average for display (handles AB)
    const calculateAverage = (subjects: StudentData['subjects'], type: 'qa1' | 'qa2' | 'endOfTerm' | 'overall') => {
        if (subjects.length === 0) return 'N/A';

        if (type === 'overall') {
            const validSubjects = subjects.filter(s => {
                const finalScore = calculateSubjectAverage(s);
                return finalScore !== 'AB';
            });

            if (validSubjects.length === 0) return 'N/A';

            const total = validSubjects.reduce((acc, s) => {
                const finalScore = calculateSubjectAverage(s) as number;
                return acc + finalScore;
            }, 0);
            return (total / validSubjects.length).toFixed(1);
        }

        const validSubjects = subjects.filter(s => {
            const isAbsent =
                type === 'qa1' ? s.qa1_absent :
                    type === 'qa2' ? s.qa2_absent :
                        s.endOfTerm_absent;

            const score = s[type];
            return !isAbsent && score !== null && score !== undefined && typeof score === 'number';
        });

        if (validSubjects.length === 0) return 'N/A';

        const total = validSubjects.reduce((acc, s) => acc + (s[type] as number), 0);
        return (total / validSubjects.length).toFixed(1);
    };

    const canGenerateReportCard = (): boolean => {
        if (!studentData || !studentData.gradeConfiguration) return true;

        const config = studentData.gradeConfiguration;

        if (config.calculation_method === 'end_of_term_only' && !hasAssessmentScores('endOfTerm')) {
            return false;
        }

        const hasAnyScores = hasAssessmentScores('qa1') ||
            hasAssessmentScores('qa2') ||
            hasAssessmentScores('endOfTerm');

        return hasAnyScores;
    };

    const calculateSubjectAverageFormatted = (subject: StudentData['subjects'][0]): string => {
        const average = calculateSubjectAverage(subject);
        return average === 'AB' ? 'AB' : average.toFixed(1);
    };

    const calculateOverallAverage = (): string => {
        if (studentData.assessmentStats?.overall?.termAverage) {
            return studentData.assessmentStats.overall.termAverage.toFixed(1);
        }
        return calculateAverage(studentData.subjects, 'overall');
    };

    // const calculateGrandTotal = (): string => {
    //     let total = 0;
    //     studentData.subjects.forEach(subject => {
    //         const subjectAverage = calculateSubjectAverage(subject);
    //         if (subjectAverage !== 'AB') {
    //             total += subjectAverage as number;
    //         }
    //     });
    //     return total.toFixed(1);
    // };

    const calculateGrandTotal = (): string => {
        const totals = studentData.subjects
            .map(s => calculateSubjectAverage(s))
            .filter((v): v is number => typeof v === 'number');

        if (totals.length === 0) {
            return '0.0';
        }

        const total = totals.reduce((sum, v) => sum + v, 0);

        return total.toFixed(1);
    };

    const getOverallGrade = (): string => {
        const overallAverage = parseFloat(calculateOverallAverage());
        const passMark = studentData.gradeConfiguration?.pass_mark || 50;
        return calculateGrade(isNaN(overallAverage) ? 'AB' : overallAverage, passMark);
    };

    const getSubjectGrade = (subject: StudentData['subjects'][0]): string => {
        const subjectAverage = calculateSubjectAverage(subject);
        const passMark = studentData.gradeConfiguration?.pass_mark || 50;
        return calculateGrade(subjectAverage, passMark);
    };

    const getSubjectRemark = (subject: StudentData['subjects'][0]): string => {
        const avg = calculateSubjectAverage(subject);
        if (avg === 'AB') return 'Absent';
        const grade = getSubjectGrade(subject);
        return grade === 'F' ? 'Failed' : 'Passed';
    };

    const getOverallRemark = (): string => {
        const overallGrade = getOverallGrade();
        return overallGrade === 'F' ? 'FAILED' : overallGrade === 'AB' ? 'INCOMPLETE' : 'PASSED';
    };

    const getOverallRemarkColor = (): string => {
        const overallGrade = getOverallGrade();
        if (overallGrade === 'AB') return 'bg-slate-100 text-slate-700';
        return overallGrade === 'F' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700';
    };

    // Handle Print functionality (same as before)
    const handlePrint = () => {
        if (onPrint) {
            onPrint();
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to print the report card.');
            return;
        }

        const reportContent = document.getElementById('report-card-content');
        if (!reportContent) return;

        const contentClone = reportContent.cloneNode(true) as HTMLElement;
        const actionButtons = contentClone.querySelector('.action-buttons');
        if (actionButtons) {
            actionButtons.remove();
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Report Card - ${studentData.name || 'Student'}</title>
                <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                <style>
                    @media print {
                        @page {
                            margin: 20mm;
                        }
                        body {
                            padding: 0;
                            margin: 0;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                    body {
                        font-family: system-ui, -apple-system, sans-serif;
                        padding: 20px;
                    }
                </style>
            </head>
            <body>
                ${contentClone.innerHTML}
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => {
                            window.close();
                        }, 100);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDownloadPDF = () => {
        setIsDownloading(true);

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            let y = 20;

            // ===== HEADER =====
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(schoolName || 'School Name', pageWidth / 2, y, { align: 'center' });

            y += 6;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text('Student Term Report', pageWidth / 2, y, { align: 'center' });

            y += 8;

            // ===== STUDENT & ACADEMIC INFO =====
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

            // ===== SUMMARY =====
            doc.setFont('helvetica', 'bold');
            doc.text('SUMMARY', 14, y);
            y += 4;
            doc.setFont('helvetica', 'normal');

            doc.text(`Class Position: ${studentData.classRank || 'N/A'}`, 14, y);
            doc.text(`Overall Status: ${getOverallRemark()}`, 120, y);

            y += 6;
            doc.text(`Final Average: ${calculateOverallAverage()}%`, 14, y);
            doc.text(`Overall Grade: ${getOverallGrade()}`, 120, y);

            y += 8;

            // ===== RESULTS TABLE =====
            doc.setFont('helvetica', 'bold');
            doc.text('RESULTS', 14, y);
            y += 3;
            doc.setFont('helvetica', 'normal');

            // Build table body with AB handling
            const tableBody = studentData.subjects
                .filter(sub => {
                    // Include if any assessment has a value (including AB)
                    return sub.qa1 !== null || sub.qa2 !== null || sub.endOfTerm !== null ||
                        sub.qa1_absent || sub.qa2_absent || sub.endOfTerm_absent;
                })
                .map(sub => {
                    const avg = calculateSubjectAverage(sub);
                    const avgDisplay = avg === 'AB' ? 'AB' : avg.toFixed(1);
                    const grade = getSubjectGrade(sub);
                    const remark = getSubjectRemark(sub);

                    return [
                        sub.name,
                        '100',
                        avgDisplay,
                        grade,
                        remark,
                    ];
                });

            // Add GRAND TOTAL as last row
            const grandTotalDisplay = calculateGrandTotal();
            const overallGrade = getOverallGrade();
            const overallRemark = getOverallRemark();

            tableBody.push([
                'GRAND TOTAL',
                String(studentData.subjects.length * 100),
                grandTotalDisplay,
                overallGrade,
                overallRemark,
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

            // ===== PERFORMANCE ANALYSIS =====
            if (studentData.subjects.length > 0) {
                doc.setFont('helvetica', 'bold');
                doc.text('PERFORMANCE ANALYSIS', 14, y);
                y += 4;
                doc.setFont('helvetica', 'normal');

                // Filter out AB subjects for performance analysis
                const subjectsWithStats = studentData.subjects
                    .map(s => ({
                        name: s.name,
                        score: calculateSubjectAverage(s),
                        grade: getSubjectGrade(s)
                    }))
                    .filter(s => s.score !== 'AB'); // Exclude AB from analysis

                if (subjectsWithStats.length > 0) {
                    // Strongest Subject Logic (Handles ties)
                    const numericScores = subjectsWithStats.map(s => s.score as number);
                    const highestScore = Math.max(...numericScores);
                    const strongestSubjects = subjectsWithStats.filter(s => s.score === highestScore);
                    const strongestNames = strongestSubjects.map(s => s.name).join(', ');

                    // Needs Improvement Logic (Lists all D and F with grades)
                    const needsImprovement = subjectsWithStats.filter(s => ['D', 'F'].includes(s.grade));
                    const improvementNames = needsImprovement.length > 0
                        ? needsImprovement.map(s => `${s.name} (${s.grade})`).join(', ')
                        : 'None';

                    // Render Best Subjects (Left)
                    const strongLabel = `Best Subject${strongestSubjects.length > 1 ? 's' : ''}: `;
                    const strongLines = doc.splitTextToSize(`${strongLabel}${strongestNames}`, 95);
                    doc.text(strongLines, 14, y);
                    doc.text(`Score: ${Math.round(highestScore)}%`, 14, y + (strongLines.length * 5));

                    // Render Needs Improvement (Right)
                    const improvementLabel = `Needs Improvement: `;
                    const improvementLines = doc.splitTextToSize(`${improvementLabel}${improvementNames}`, 75);
                    doc.text(improvementLines, 120, y);

                    if (needsImprovement.length > 0) {
                        doc.setFontSize(8);
                        doc.text(`Total flagged: ${needsImprovement.length}`, 120, y + (improvementLines.length * 5) + 1);
                        doc.setFontSize(10);
                    } else {
                        doc.text(`All subjects are currently satisfactory`, 120, y + 5);
                    }

                    // Move Y down based on whichever column was longer
                    y += Math.max(strongLines.length * 5 + 10, improvementLines.length * 5 + 10);

                    // Performance Stats (excluding AB subjects)
                    const passMark = studentData.gradeConfiguration?.pass_mark || 50;

                    const subjectsPassed = subjectsWithStats.filter(s => s.grade !== 'F').length;
                    const abGrades = subjectsWithStats.filter(s => ['A', 'B'].includes(s.grade)).length;
                    const cdGrades = subjectsWithStats.filter(s => ['C', 'D'].includes(s.grade)).length;
                    const belowPass = subjectsWithStats.filter(s => (s.score as number) < passMark).length;

                    doc.text(`Subjects Passed: ${subjectsPassed}/${subjectsWithStats.length}`, 14, y);
                    doc.text(`A & B Grades: ${abGrades}`, 14, y + 6);
                    doc.text(`C & D Grades: ${cdGrades}`, 14, y + 12);
                    doc.text(`Subjects Below ${passMark}% Pass Mark: ${belowPass}`, 14, y + 18);

                    y += 28;
                } else {
                    doc.text('No valid scores available for performance analysis.', 14, y);
                    y += 10;
                }
            }

            // ===== TEACHER REMARK =====
            // ===== TEACHER REMARK =====
            doc.setFont('helvetica', 'bold');
            doc.text("TEACHER'S REMARK", 14, y);
            y += 6;
            doc.setFont('helvetica', 'normal');

            const currentOverallGrade = getOverallGrade();
            let teacherRemark = '';

            if (currentOverallGrade === 'AB') {
                teacherRemark = 'Student was absent for one or more required assessments. Please ensure attendance for all examinations.';
            } else if (currentOverallGrade === 'A') {
                teacherRemark = 'An outstanding performance! Keep maintaining this high standard.';
            } else if (currentOverallGrade === 'B') {
                teacherRemark = 'A very good result. With a little more push, you can reach excellence.';
            } else if (currentOverallGrade === 'C') {
                teacherRemark = 'A satisfactory performance, but there is room for improvement.';
            } else if (currentOverallGrade === 'D') {
                teacherRemark = 'You have passed, but more effort is needed to improve grades.';
            } else {
                teacherRemark = 'Please focus more on your studies and seek help in weak subjects.';
            }

            const remarkLines = doc.splitTextToSize(`"${teacherRemark}"`, pageWidth - 28);
            doc.text(remarkLines, 14, y);
            y += remarkLines.length * 5 + 10;

            // ===== ATTENDANCE =====
            doc.setFont('helvetica', 'bold');
            doc.text('ATTENDANCE', 14, y);
            y += 4;
            doc.setFont('helvetica', 'normal');

            const totalDays = studentData.attendance.present + studentData.attendance.absent;
            const attendanceRate = totalDays > 0 ? Math.round((studentData.attendance.present / totalDays) * 100) : 0;

            doc.text(`Total School Days: ${totalDays}`, 14, y);
            doc.text(`Attendance Rate: ${attendanceRate}%`, 120, y);

            y += 4;

            doc.text(`Days Present: ${studentData.attendance.present}`, 14, y);
            doc.text(`Days Absent: ${studentData.attendance.absent}`, 120, y);

            y += 4;

            doc.text(`Days Late: ${studentData.attendance.late}`, 14, y);

            y += 6;

            // Attendance comment
            let attendanceComment = '';
            if (attendanceRate >= 95) {
                attendanceComment = 'Excellent attendance! Keep it up.';
            } else if (attendanceRate >= 80) {
                attendanceComment = 'Good attendance record.';
            } else {
                attendanceComment = 'Needs improvement in attendance.';
            }

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(attendanceComment, 14, y);

            y += 6;

            // ===== FOOTER =====
            const footerTitle = 'Report Card Generated';
            const footerDesc =
                "This report card was generated based on the school's active grade calculation configuration.\nFor any questions or clarifications, please contact the school administration.";
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

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(generatedOn, pageWidth / 2, y, { align: 'center' });

            // ===== SAVE =====
            doc.save(`${studentData.name}_Report.pdf`);

        } catch (error) {
            console.error('PDF Error:', error);
            alert('Could not generate PDF');
        } finally {
            setIsDownloading(false);
        }
    };

    if (!canGenerateReportCard()) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-xl">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-700 mb-2">
                    Report Card Not Available
                </h4>
                <p className="text-slate-500 max-w-md mx-auto">
                    {studentData.gradeConfiguration?.calculation_method === 'end_of_term_only'
                        ? 'This report card uses "End of Term Only" calculation, but no end of term scores have been submitted yet. Please check back after end of term exams are graded.'
                        : 'No assessment scores have been recorded for this student yet. Report card will be available once scores are entered.'
                    }
                </p>
                <div className="mt-4 text-sm text-slate-400">
                    Current grade calculation method: <span className="font-semibold">{studentData.gradeConfiguration?.configuration_name}</span>
                </div>
            </div>
        );
    }

    return (
        <div ref={reportCardRef} id="report-card-content" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h4 className="text-xl font-bold text-slate-800">Complete Report Card</h4>
                    {studentData.gradeConfiguration && (
                        <p className="text-sm text-indigo-600 mt-1">
                            Grade Calculation: {studentData.gradeConfiguration.configuration_name}
                            {studentData.gradeConfiguration.calculation_method === 'weighted_average' &&
                                ` (QA1: ${studentData.gradeConfiguration.weight_qa1}%, QA2: ${studentData.gradeConfiguration.weight_qa2}%, End Term: ${studentData.gradeConfiguration.weight_end_of_term}%)`}
                        </p>
                    )}
                </div>

                {showActions && (
                    <div className="flex gap-2 action-buttons">
                        <button
                            onClick={handleDownloadPDF}
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
                )}
            </div>

            {/* STUDENT AND SCHOOL INFORMATION SECTION */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h5 className="text-lg font-bold text-blue-900 mb-3">Student Information</h5>
                        <div className="space-y-2">
                            <div className="flex justify-between border-b border-blue-100 pb-2">
                                <span className="text-blue-700 font-medium">Student Name:</span>
                                <span className="text-blue-900 font-semibold">{studentData.name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between border-b border-blue-100 pb-2">
                                <span className="text-blue-700 font-medium">Exam Number:</span>
                                <span className="text-blue-900 font-semibold">{studentData.examNumber || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between border-b border-blue-100 pb-2">
                                <span className="text-blue-700 font-medium">Class:</span>
                                <span className="text-blue-900 font-semibold">
                                    {studentData.class || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h5 className="text-lg font-bold text-indigo-900 mb-3">Academic Information</h5>
                        <div className="space-y-2">
                            <div className="flex justify-between border-b border-indigo-100 pb-2">
                                <span className="text-indigo-700 font-medium">Academic Year:</span>
                                <span className="text-indigo-900 font-semibold">
                                    {studentData.academicYear || 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-indigo-100 pb-2">
                                <span className="text-indigo-700 font-medium">Term:</span>
                                <span className="text-indigo-900 font-semibold">
                                    {studentData.term || 'N/A'}
                                </span>
                            </div>

                            {/* DYNAMIC SCHOOL NAME */}
                            <div className="flex justify-between border-b border-indigo-100 pb-2">
                                <span className="text-indigo-700 font-medium">School Name:</span>
                                <span className="text-indigo-900 font-semibold">
                                    {schoolName}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Final Average */}
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white">
                    <p className="text-indigo-100 text-sm">Final Average</p>
                    <p className="text-3xl font-bold">{calculateOverallAverage()}%</p>
                </div>

                {/* Class Position */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
                    <p className="text-emerald-100 text-sm">Class Position</p>
                    <p className="text-3xl font-bold">{studentData.classRank}<span className="text-lg">/{studentData.totalStudents}</span></p>
                </div>

                {/* Pass/Fail Status */}
                <div className={`${getOverallGrade() === 'F' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                    getOverallGrade() === 'AB' ? 'bg-gradient-to-br from-slate-500 to-slate-600' :
                        'bg-gradient-to-br from-green-500 to-green-600'
                    } rounded-xl p-4 text-white`}>
                    <p className="text-white/90 text-sm">Overall Status</p>
                    <p className="text-3xl font-bold">{getOverallRemark()}</p>
                </div>

                {/* Overall Grade */}
                <div className={`${getOverallGrade() === 'AB' ? 'bg-gradient-to-br from-slate-500 to-slate-600' :
                    getOverallGrade() === 'A' || getOverallGrade() === 'B' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                        getOverallGrade() === 'C' || getOverallGrade() === 'D' ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                            'bg-gradient-to-br from-red-500 to-red-600'
                    } rounded-xl p-4 text-white`}>
                    <p className="text-white/90 text-sm">Overall Grade</p>
                    <p className="text-3xl font-bold">{getOverallGrade()}</p>
                    <p className="text-xs opacity-90 mt-1">
                        {getOverallGrade() === 'AB' ? 'Incomplete' :
                            getOverallGrade() === 'A' ? 'Excellent' :
                                getOverallGrade() === 'B' ? 'Good' :
                                    getOverallGrade() === 'C' ? 'Satisfactory' :
                                        getOverallGrade() === 'D' ? 'Passing' : 'Needs Improvement'}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <h5 className="font-semibold text-slate-800">Final Results</h5>
                    <p className="text-sm text-slate-500 mt-1">
                        Based on {studentData.gradeConfiguration?.configuration_name || 'active grade configuration'}
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Subject</th>
                                <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">Total Marks</th>
                                <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">Marks Scored</th>
                                <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">Grade</th>
                                <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">Remark</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {studentData.subjects.map((subject, index) => {
                                const hasScores = subject.qa1 !== null || subject.qa2 !== null || subject.endOfTerm !== null ||
                                    subject.qa1_absent || subject.qa2_absent || subject.endOfTerm_absent;
                                if (!hasScores) return null;

                                const subjectAverage = calculateSubjectAverage(subject);
                                const subjectAverageFormatted = subjectAverage === 'AB' ? 'AB' : typeof subjectAverage === 'number'
                                    ? subjectAverage.toFixed(1)
                                    : subjectAverage;
                                const grade = getSubjectGrade(subject);
                                const remark = getSubjectRemark(subject);

                                return (
                                    <tr key={index} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-800">{subject.name}</td>
                                        <td className="px-6 py-4 text-center text-slate-600">100</td>
                                        <td className="px-6 py-4 text-center font-semibold text-slate-800">
                                            {subjectAverageFormatted}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(grade)}`}>
                                                {grade}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRemarkColor(remark)}`}>
                                                {remark}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-indigo-50 font-bold">
                                <td className="px-6 py-4 text-slate-800">GRAND TOTAL</td>
                                <td className="px-6 py-4 text-center text-slate-800">
                                    {studentData.subjects.length * 100}
                                </td>
                                <td className="px-6 py-4 text-center text-indigo-700">
                                    {calculateGrandTotal()}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(getOverallGrade())}`}>
                                        {getOverallGrade()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getOverallRemarkColor()}`}>
                                        {getOverallRemark()}
                                    </span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
                <h5 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Performance Analysis
                </h5>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Strongest Subject(s) - ALL subjects with highest score (excluding AB) */}
                        <div className="bg-white p-3 rounded-lg">
                            <p className="text-sm text-slate-500">Strongest Subject{(() => {
                                const validSubjects = studentData.subjects.filter(s => calculateSubjectAverage(s) !== 'AB');
                                const scores = validSubjects.map(calculateSubjectAverage);
                                const highestScore = Math.max(...scores as number[]);
                                const strongestCount = validSubjects.filter(s => calculateSubjectAverage(s) === highestScore).length;
                                return strongestCount > 1 ? 's' : '';
                            })()}</p>
                            <p className="font-bold text-emerald-700">
                                {(() => {
                                    const validSubjects = studentData.subjects.filter(s => calculateSubjectAverage(s) !== 'AB');
                                    if (validSubjects.length === 0) return 'No valid scores';

                                    const scores = validSubjects.map(s => calculateSubjectAverage(s) as number);
                                    const highestScore = Math.max(...scores);
                                    const strongestSubjects = validSubjects.filter(
                                        s => calculateSubjectAverage(s) === highestScore
                                    );
                                    return strongestSubjects.map(s => s.name).join(', ');
                                })()}
                            </p>
                            {(() => {
                                const validSubjects = studentData.subjects.filter(s => calculateSubjectAverage(s) !== 'AB');
                                if (validSubjects.length === 0) return null;

                                const scores = validSubjects.map(s => calculateSubjectAverage(s) as number);
                                const highestScore = Math.max(...scores);
                                return (
                                    <p className="text-xs text-slate-500 mt-1">
                                        Score: {Math.round(highestScore)}%
                                    </p>
                                );
                            })()}
                        </div>

                        {/* Needs Improvement - ALL subjects with D or F grades (excluding AB) */}
                        <div className="bg-white p-3 rounded-lg">
                            <p className="text-sm text-slate-500">Needs Improvement</p>
                            <p className="font-bold text-amber-700">
                                {(() => {
                                    const weakSubjects = studentData.subjects.filter(subject => {
                                        const grade = getSubjectGrade(subject);
                                        return ['D', 'F'].includes(grade);
                                    });

                                    if (weakSubjects.length === 0) {
                                        return "None";
                                    }

                                    return weakSubjects
                                        .map(s => `${s.name} (${getSubjectGrade(s)})`)
                                        .join(', ');
                                })()}
                            </p>
                            {(() => {
                                const weakSubjects = studentData.subjects.filter(subject => {
                                    const grade = getSubjectGrade(subject);
                                    return ['D', 'F'].includes(grade);
                                });

                                if (weakSubjects.length > 0) {
                                    return (
                                        <p className="text-xs text-slate-500 mt-1">
                                            Total flagged: {weakSubjects.length}
                                        </p>
                                    );
                                } else {
                                    return (
                                        <p className="text-xs text-slate-500 mt-1">
                                            All subjects are currently satisfactory
                                        </p>
                                    );
                                }
                            })()}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Subjects Passed:</span>
                            <span className="font-bold text-emerald-800">
                                {studentData.subjects.filter(subject => {
                                    const grade = getSubjectGrade(subject);
                                    return grade && grade !== 'F' && grade !== 'AB';
                                }).length}/{studentData.subjects.length}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">A & B Grades:</span>
                            <span className="font-bold text-blue-800">
                                {studentData.subjects.filter(subject => {
                                    const grade = getSubjectGrade(subject);
                                    return grade === 'A' || grade === 'B';
                                }).length}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">C & D Grades:</span>
                            <span className="font-bold text-amber-800">
                                {studentData.subjects.filter(subject => {
                                    const grade = getSubjectGrade(subject);
                                    return grade === 'C' || grade === 'D';
                                }).length}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Subjects Below {studentData.gradeConfiguration?.pass_mark || 50}% Pass Mark:</span>
                            <span className="font-bold text-rose-800">
                                {studentData.subjects.filter(subject => {
                                    const score = calculateSubjectAverage(subject);
                                    if (score === 'AB') return false;
                                    const passMark = studentData.gradeConfiguration?.pass_mark || 50;
                                    return (score as number) < passMark;
                                }).length}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-indigo-100">
                    <p className="text-xs font-bold text-indigo-600 tracking-wide mb-2">
                        Teacher's Remark
                    </p>

                    <p className="text-sm text-slate-700 italic leading-relaxed">
                        "{(() => {
                            const currentOverallGrade = getOverallGrade();
                            if (currentOverallGrade === 'AB') {
                                return 'Student was absent for one or more required assessments. Please ensure attendance for all examinations.';
                            } else if (currentOverallGrade === 'A') {
                                return 'An outstanding performance! Keep maintaining this high standard.';
                            } else if (currentOverallGrade === 'B') {
                                return 'A very good result. With a little more push, you can reach excellence.';
                            } else if (currentOverallGrade === 'C') {
                                return 'A satisfactory performance, but there is room for improvement.';
                            } else if (currentOverallGrade === 'D') {
                                return 'You have passed, but more effort is needed to improve grades.';
                            } else {
                                return 'Please focus more on your studies and seek help in weak subjects.';
                            }
                        })()}"
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h5 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    Attendance Details
                </h5>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-700">
                            {studentData.attendance.present + studentData.attendance.absent}
                        </p>
                        <p className="text-sm text-blue-600">Total School Days</p>
                    </div>

                    <div className={`${Math.round((studentData.attendance.present / (studentData.attendance.present + studentData.attendance.absent)) * 100) >= 75
                        ? 'bg-gradient-to-br from-green-50 to-green-100'
                        : 'bg-gradient-to-br from-orange-50 to-orange-100'
                        } rounded-xl p-4`}>
                        <p className={`text-sm font-medium ${Math.round((studentData.attendance.present / (studentData.attendance.present + studentData.attendance.absent)) * 100) >= 75
                            ? 'text-green-800'
                            : 'text-orange-800'
                            }`}>
                            Attendance Rate
                        </p>
                        <p className={`text-2xl font-bold ${Math.round((studentData.attendance.present / (studentData.attendance.present + studentData.attendance.absent)) * 100) >= 75
                            ? 'text-green-900'
                            : 'text-orange-900'
                            }`}>
                            {Math.round((studentData.attendance.present / (studentData.attendance.present + studentData.attendance.absent)) * 100)}%
                        </p>
                        <p className={`text-xs mt-1 ${Math.round((studentData.attendance.present / (studentData.attendance.present + studentData.attendance.absent)) * 100) >= 75
                            ? 'text-green-700'
                            : 'text-orange-700'
                            }`}>
                            {studentData.attendance.present}/{studentData.attendance.present + studentData.attendance.absent}
                        </p>
                    </div>

                    <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-rose-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-emerald-600">Days Present</p>
                                <p className="text-2xl font-bold text-emerald-700">{studentData.attendance.present}</p>
                            </div>
                            <div>
                                <p className="text-sm text-rose-600">Days Absent</p>
                                <p className="text-2xl font-bold text-rose-700">{studentData.attendance.absent}</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                        <p className="text-sm text-amber-600">Days Late</p>
                        <p className="text-2xl font-bold text-amber-700">
                            {studentData.attendance.late}
                        </p>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm font-medium text-slate-700 mb-2">Attendance Trend:</p>
                    <div className="flex items-center justify-between">
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                                className="bg-emerald-500 h-2 rounded-full"
                                style={{ width: `${Math.round((studentData.attendance.present / (studentData.attendance.present + studentData.attendance.absent)) * 100)}%` }}
                            ></div>
                        </div>
                        <span className="ml-4 text-sm font-semibold text-slate-700">
                            {Math.round((studentData.attendance.present / (studentData.attendance.present + studentData.attendance.absent)) * 100)}%
                        </span>
                    </div>

                    <div className="mt-3 text-sm text-slate-500">
                        {Math.round((studentData.attendance.present / (studentData.attendance.present + studentData.attendance.absent)) * 100) >= 95
                            ? '✓ Excellent attendance! Keep it up.'
                            : Math.round((studentData.attendance.present / (studentData.attendance.present + studentData.attendance.absent)) * 100) >= 80
                                ? '✓ Good attendance record.'
                                : '⚠ Needs improvement in attendance.'}
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 text-white rounded-xl p-6">
                <div className="text-center">
                    <h6 className="text-lg font-bold mb-2">Report Card Generated</h6>
                    <p className="text-slate-300 mb-4">
                        This report card was generated based on the school's active grade calculation configuration.
                        For any questions or clarifications, please contact the school administration.
                    </p>
                    <div className="flex flex-col md:flex-row justify-center items-center gap-6 text-sm text-slate-400">
                        <div>Generated on: {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportCard;

// import React, { useEffect, useRef, useState } from 'react';
// import { StudentData } from '@/types';
// import { Download, Printer, CheckCircle, AlertCircle, TrendingUp, Calendar, User, Loader2 } from 'lucide-react';
// // import html2canvas from 'html2canvas';
// import autoTable from 'jspdf-autotable';
// import jsPDF from 'jspdf';

// interface ReportCardProps {
//     studentData: StudentData;
//     onPrint?: () => void;
//     showActions?: boolean;
// }

// // Define the shape of the data coming from your API (based on your SchoolsManagement code)
// interface SchoolFromDB {
//     id: string;
//     name: string;
// }

// const ReportCard: React.FC<ReportCardProps> = ({
//     studentData,
//     onPrint,
//     showActions = true
// }) => {
//     const reportCardRef = useRef<HTMLDivElement>(null);

//     const [isDownloading, setIsDownloading] = useState(false)
//     // 1. State for the School Name
//     const [schoolName, setSchoolName] = useState<string>('Loading School...');


//     // 2. The Logic to Fetch and Find the School
//     useEffect(() => {
//         const fetchSchoolName = async () => {
//             if (!studentData.examNumber) {
//                 setSchoolName('Unknown School');
//                 return;
//             }

//             try {
//                 const token = localStorage.getItem('token');

//                 const response = await fetch('https://eduspace-portal-backend.onrender.com/schools', {
//                     headers: {
//                         'Authorization': `Bearer ${token}`,
//                         'Content-Type': 'application/json'
//                     },
//                 });

//                 if (response.ok) {
//                     const schools: SchoolFromDB[] = await response.json();

//                     // 1. Extract the prefix from the Exam Number
//                     // If exam number is "f22-26-5001", we split by '-' and take the first part "f22"
//                     let examPrefix = '';

//                     if (studentData.examNumber.includes('-')) {
//                         examPrefix = studentData.examNumber.split('-')[0];
//                     } else {
//                         // Fallback: If no hyphen, take the first 3 characters
//                         examPrefix = studentData.examNumber.substring(0, 3);
//                     }

//                     console.log("Looking for school starting with:", examPrefix);

//                     // 2. Find the school whose Long ID starts with that short prefix
//                     const matchedSchool = schools.find(school =>
//                         school.id.toString().toLowerCase().startsWith(examPrefix.toLowerCase())
//                     );

//                     if (matchedSchool) {
//                         setSchoolName(matchedSchool.name);
//                     } else {
//                         console.warn('No school matched prefix:', examPrefix);
//                         setSchoolName('School Not Found');
//                     }
//                 }
//             } catch (error) {
//                 console.error('Failed to load school name', error);
//                 setSchoolName('Error Loading School');
//             }
//         };

//         fetchSchoolName();
//     }, [studentData.examNumber]);


//     const getGradeColor = (grade: string) => {
//         if (grade === 'N/A') return 'text-slate-600 bg-slate-100';
//         if (grade.includes('A')) return 'text-emerald-600 bg-emerald-50';
//         if (grade === 'B') return 'text-blue-600 bg-blue-50';
//         if (grade === 'C') return 'text-amber-600 bg-amber-50';
//         return 'text-red-600 bg-red-50';
//     };

//     // Calculate final score based on grade configuration
//     const calculateFinalScore = (
//         qa1: number,
//         qa2: number,
//         endOfTerm: number,
//         gradeConfig: StudentData['gradeConfiguration']
//     ): number => {
//         if (!gradeConfig) {
//             return (qa1 + qa2 + endOfTerm) / 3;
//         }

//         const method = gradeConfig.calculation_method;

//         switch (method) {
//             case 'end_of_term_only':
//                 return endOfTerm;

//             case 'average_all':
//                 return (qa1 + qa2 + endOfTerm) / 3;

//             case 'weighted_average':
//                 const totalWeight = gradeConfig.weight_qa1 + gradeConfig.weight_qa2 + gradeConfig.weight_end_of_term;
//                 const weightedSum =
//                     (qa1 * gradeConfig.weight_qa1) +
//                     (qa2 * gradeConfig.weight_qa2) +
//                     (endOfTerm * gradeConfig.weight_end_of_term);
//                 return weightedSum / totalWeight;

//             default:
//                 return (qa1 + qa2 + endOfTerm) / 3;
//         }
//     };

//     // Calculate grade based on score and pass mark
//     const calculateGrade = (score: number, passMark?: number): string => {
//         const effectivePassMark = passMark || 50;

//         if (score >= 80) return 'A';
//         if (score >= 70) return 'B';
//         if (score >= 60) return 'C';
//         if (score >= effectivePassMark) return 'D';
//         return 'F';
//     };

//     // Calculate subject average with grade configuration
//     const calculateSubjectAverage = (subject: StudentData['subjects'][0]): number => {
//         if (subject.finalScore) {
//             return subject.finalScore;
//         }

//         return calculateFinalScore(
//             subject.qa1,
//             subject.qa2,
//             subject.endOfTerm,
//             studentData.gradeConfiguration
//         );
//     };

//     const calculateAverage = (subjects: StudentData['subjects'], type: 'qa1' | 'qa2' | 'endOfTerm' | 'overall') => {
//         if (subjects.length === 0) return 'N/A';

//         if (type === 'overall') {
//             const validSubjects = subjects.filter(s => {
//                 const finalScore = calculateSubjectAverage(s);
//                 return finalScore > 0;
//             });

//             if (validSubjects.length === 0) return 'N/A';

//             const total = validSubjects.reduce((acc, s) => {
//                 const finalScore = calculateSubjectAverage(s);
//                 return acc + finalScore;
//             }, 0);
//             return (total / validSubjects.length).toFixed(1);
//         }

//         const validSubjects = subjects.filter(s => s[type] !== null && s[type] !== undefined && s[type] > 0);
//         if (validSubjects.length === 0) return 'N/A';

//         const total = validSubjects.reduce((acc, s) => acc + s[type], 0);
//         return (total / validSubjects.length).toFixed(1);
//     };

//     const hasAssessmentScores = (assessmentType: 'qa1' | 'qa2' | 'endOfTerm'): boolean => {
//         if (!studentData || !studentData.subjects || studentData.subjects.length === 0) {
//             return false;
//         }

//         return studentData.subjects.some(subject => {
//             const score = subject[assessmentType];
//             return score !== null && score !== undefined && score > 0;
//         });
//     };

//     const canGenerateReportCard = (): boolean => {
//         if (!studentData || !studentData.gradeConfiguration) return true;

//         const config = studentData.gradeConfiguration;

//         if (config.calculation_method === 'end_of_term_only' && !hasAssessmentScores('endOfTerm')) {
//             return false;
//         }

//         const hasAnyScores = hasAssessmentScores('qa1') ||
//             hasAssessmentScores('qa2') ||
//             hasAssessmentScores('endOfTerm');

//         return hasAnyScores;
//     };

//     const calculateSubjectAverageFormatted = (subject: StudentData['subjects'][0]): string => {
//         const average = calculateSubjectAverage(subject);
//         return average.toFixed(1);
//     };

//     const calculateOverallAverage = (): string => {
//         if (studentData.assessmentStats?.overall?.termAverage) {
//             return studentData.assessmentStats.overall.termAverage.toFixed(1);
//         }
//         return calculateAverage(studentData.subjects, 'overall');
//     };

//     const calculateGrandTotal = (): string => {
//         const totalScored = studentData.subjects.reduce((sum, subject) => {
//             const subjectAverage = calculateSubjectAverage(subject);
//             return sum + subjectAverage;
//         }, 0);
//         return totalScored.toFixed(1);
//     };

//     const getOverallGrade = (): string => {
//         const overallAverage = parseFloat(calculateOverallAverage());
//         const passMark = studentData.gradeConfiguration?.pass_mark || 50;
//         return calculateGrade(overallAverage, passMark);
//     };

//     const getSubjectGrade = (subject: StudentData['subjects'][0]): string => {
//         const subjectAverage = calculateSubjectAverage(subject);
//         const passMark = studentData.gradeConfiguration?.pass_mark || 50;
//         return calculateGrade(subjectAverage, passMark);
//     };

//     const getSubjectRemark = (subject: StudentData['subjects'][0]): string => {
//         const grade = getSubjectGrade(subject);
//         return grade === 'F' ? 'Failed' : 'Passed';
//     };

//     const getOverallRemark = (): string => {
//         const overallGrade = getOverallGrade();
//         return overallGrade === 'F' ? 'FAILED' : 'PASSED';
//     };

//     const getOverallRemarkColor = (): string => {
//         const overallGrade = getOverallGrade();
//         return overallGrade === 'F' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700';
//     };

//     const getSubjectRemarkColor = (remark: string): string => {
//         return remark === 'Passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
//     };

//     // Handle Print functionality
//     const handlePrint = () => {
//         if (onPrint) {
//             onPrint();
//             return;
//         }

//         const printWindow = window.open('', '_blank');
//         if (!printWindow) {
//             alert('Please allow popups to print the report card.');
//             return;
//         }

//         const reportContent = document.getElementById('report-card-content');
//         if (!reportContent) return;

//         const contentClone = reportContent.cloneNode(true) as HTMLElement;
//         const actionButtons = contentClone.querySelector('.action-buttons');
//         if (actionButtons) {
//             actionButtons.remove();
//         }

//         printWindow.document.write(`
//             <!DOCTYPE html>
//             <html>
//             <head>
//                 <title>Report Card - ${studentData.name || 'Student'}</title>
//                 <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
//                 <style>
//                     @media print {
//                         @page {
//                             margin: 20mm;
//                         }
//                         body {
//                             padding: 0;
//                             margin: 0;
//                         }
//                         .no-print {
//                             display: none !important;
//                         }
//                     }
//                     body {
//                         font-family: system-ui, -apple-system, sans-serif;
//                         padding: 20px;
//                     }
//                 </style>
//             </head>
//             <body>
//                 ${contentClone.innerHTML}
//                 <script>
//                     window.onload = function() {
//                         window.print();
//                         setTimeout(() => {
//                             window.close();
//                         }, 100);
//                     };
//                 </script>
//             </body>
//             </html>
//         `);
//         printWindow.document.close();
//     };

//     const handleDownloadPDF = () => {
//         setIsDownloading(true);

//         try {
//             const doc = new jsPDF();
//             const pageWidth = doc.internal.pageSize.getWidth();
//             let y = 20;

//             // ===== HEADER =====
//             doc.setFontSize(18);
//             doc.setFont('helvetica', 'bold');
//             doc.text(schoolName || 'School Name', pageWidth / 2, y, { align: 'center' });

//             y += 6;
//             doc.setFontSize(12);
//             doc.setFont('helvetica', 'normal');
//             doc.text('Student Term Report', pageWidth / 2, y, { align: 'center' });

//             y += 8;

//             // ===== STUDENT & ACADEMIC INFO =====
//             doc.setFontSize(10);

//             // 🔴 ADDED
//             doc.setFont('helvetica', 'bold');
//             doc.text('STUDENT & ACADEMIC INFORMATION', 14, y);
//             y += 4;
//             doc.setFont('helvetica', 'normal');

//             doc.text(`Student Name: ${studentData.name || 'N/A'}`, 14, y);
//             doc.text(`Exam Number: ${studentData.examNumber || 'N/A'}`, 14, y + 6);
//             doc.text(`Class: ${studentData.class || 'N/A'}`, 14, y + 12);


//             doc.text(`Academic Year: ${studentData.academicYear || 'N/A'}`, 120, y);
//             doc.text(`Term: ${studentData.term || 'N/A'}`, 120, y + 6);
//             doc.text(`Total Enrollment: ${studentData.totalStudents || 'N/A'}`, 120, y + 12);


//             y += 22;

//             // ===== SUMMARY =====


//             doc.setFont('helvetica', 'bold');
//             doc.text('SUMMARY', 14, y);
//             y += 4;
//             doc.setFont('helvetica', 'normal');


//             doc.text(
//                 `Class Position: ${studentData.classRank || 'N/A'}`,
//                 14,
//                 y
//             );

//             // Top row - right: Overall Status
//             doc.text(
//                 `Overall Status: ${getOverallRemark()}`,
//                 120,
//                 y
//             );


//             // Bottom row
//             y += 6;
//             doc.text(`Final Average: ${calculateOverallAverage()}%`, 14, y);
//             doc.text(`Overall Grade: ${getOverallGrade()}`, 120, y);

//             y += 8; // spacing before next section




//             // 🔴 Section Title
//             doc.setFont('helvetica', 'bold');
//             doc.text('RESULTS', 14, y);
//             y += 3;
//             doc.setFont('helvetica', 'normal');

//             // Build table body
//             const tableBody = studentData.subjects
//                 .filter(sub => sub.qa1 > 0 || sub.qa2 > 0 || sub.endOfTerm > 0)
//                 .map(sub => {
//                     const avg = calculateSubjectAverage(sub).toFixed(1);
//                     return [
//                         sub.name,
//                         '100',
//                         avg,
//                         getSubjectGrade(sub),
//                         getSubjectRemark(sub),
//                     ];
//                 });

//             // 🔴 Add GRAND TOTAL as last row
//             tableBody.push([
//                 'GRAND TOTAL',
//                 String(studentData.subjects.length * 100),
//                 String(calculateGrandTotal()),
//                 getOverallGrade(),
//                 getOverallRemark(),
//             ]);

//             // 🔴 Single autoTable call
//             autoTable(doc, {
//                 startY: y,
//                 head: [['Subject', 'Total Marks', 'Marks Scored', 'Grade', 'Remark']],
//                 body: tableBody,
//                 theme: 'striped',
//                 // Make the last row bold
//                 didParseCell: (data) => {
//                     if (data.row.index === tableBody.length - 1) { // last row = GRAND TOTAL
//                         data.cell.styles.fontStyle = 'bold';
//                     }
//                 },
//             });

//             y = (doc as any).lastAutoTable.finalY + 8; // update y for next section

//             // ===== PERFORMANCE ANALYSIS =====
//             if (studentData.subjects.length > 0) {
//                 doc.setFont('helvetica', 'bold');
//                 doc.text('PERFORMANCE ANALYSIS', 14, y);
//                 y += 4;
//                 doc.setFont('helvetica', 'normal');

//                 // 1. Pre-calculate scores and grades
//                 const subjectsWithStats = studentData.subjects.map(s => ({
//                     name: s.name,
//                     score: calculateSubjectAverage(s),
//                     grade: getSubjectGrade(s)
//                 }));

//                 // 2. Strongest Subject Logic (Handles ties) - MATCHES ORIGINAL
//                 const scores = subjectsWithStats.map(s => s.score);
//                 const highestScore = Math.max(...scores);
//                 const strongestSubjects = subjectsWithStats.filter(s => s.score === highestScore);
//                 const strongestNames = strongestSubjects.map(s => s.name).join(', ');

//                 // 3. Needs Improvement Logic (Lists all D and F with grades) - MATCHES ORIGINAL
//                 const needsImprovement = subjectsWithStats.filter(s => ['D', 'F'].includes(s.grade));
//                 const improvementNames = needsImprovement.length > 0
//                     ? needsImprovement.map(s => `${s.name} (${s.grade})`).join(', ')
//                     : 'None';

//                 // --- Render Best Subjects (Left) - MATCHES ORIGINAL FORMAT ---
//                 const strongLabel = `Best Subject${strongestSubjects.length > 1 ? 's' : ''}: `;
//                 const strongLines = doc.splitTextToSize(`${strongLabel}${strongestNames}`, 95);
//                 doc.text(strongLines, 14, y);
//                 doc.text(`Score: ${Math.round(highestScore)}%`, 14, y + (strongLines.length * 5));

//                 // --- Render Needs Improvement (Right) - MATCHES ORIGINAL FORMAT ---
//                 const improvementLabel = `Needs Improvement: `;
//                 const improvementLines = doc.splitTextToSize(`${improvementLabel}${improvementNames}`, 75);
//                 doc.text(improvementLines, 120, y);

//                 // If there are failures, show total flagged, otherwise show success message - MATCHES ORIGINAL
//                 if (needsImprovement.length > 0) {
//                     doc.setFontSize(8);
//                     doc.text(`Total flagged: ${needsImprovement.length}`, 120, y + (improvementLines.length * 5) + 1);
//                     doc.setFontSize(10);
//                 } else {
//                     doc.text(`All subjects are currently satisfactory`, 120, y + 5);
//                 }

//                 // Move Y down based on whichever column was longer
//                 y += Math.max(strongLines.length * 5 + 10, improvementLines.length * 5 + 10);

//                 // --- Performance Stats - MATCHES ORIGINAL CALCULATIONS ---
//                 const passMark = studentData.gradeConfiguration?.pass_mark || 50;

//                 const subjectsPassed = subjectsWithStats.filter(s => s.grade !== 'F').length;
//                 const abGrades = subjectsWithStats.filter(s => ['A', 'B'].includes(s.grade)).length;
//                 const cdGrades = subjectsWithStats.filter(s => ['C', 'D'].includes(s.grade)).length;
//                 const belowPass = subjectsWithStats.filter(s => s.score < passMark).length;

//                 doc.text(`Subjects Passed: ${subjectsPassed}/${subjectsWithStats.length}`, 14, y);
//                 doc.text(`A & B Grades: ${abGrades}`, 14, y + 6);
//                 doc.text(`C & D Grades: ${cdGrades}`, 14, y + 12);
//                 doc.text(`Subjects Below ${passMark}% Pass Mark: ${belowPass}`, 14, y + 18);

//                 y += 28;
//             }


//             // ===== TEACHER REMARK =====

//             // 🔴 ADDED
//             doc.setFont('helvetica', 'bold');
//             doc.text("TEACHER'S REMARK", 14, y);
//             y += 4;
//             doc.setFont('helvetica', 'normal');

//             const teacherRemark =
//                 getOverallGrade() === 'A'
//                     ? 'An outstanding performance! Keep maintaining this high standard.'
//                     : getOverallGrade() === 'B'
//                         ? 'A very good result. With a little more push, you can reach excellence.'
//                         : getOverallGrade() === 'C'
//                             ? 'A satisfactory performance, but there is room for improvement.'
//                             : getOverallGrade() === 'D'
//                                 ? 'You have passed, but more effort is needed to improve grades.'
//                                 : 'Please focus more on your studies and seek help in weak subjects.';

//             doc.text(`"${teacherRemark}"`, 14, y);

//             y += 14;

//             // // ===== ATTENDANCE =====

//             // 🔴 ADDED
//             doc.setFont('helvetica', 'bold');
//             doc.text('ATTENDANCE', 14, y);
//             y += 4;
//             doc.setFont('helvetica', 'normal');

//             const totalDays = studentData.attendance.present + studentData.attendance.absent;
//             const attendanceRate = Math.round(
//                 (studentData.attendance.present / totalDays) * 100
//             );

//             doc.text(`Total School Days: ${totalDays}`, 14, y);
//             doc.text(`Attendance Rate: ${attendanceRate}%`, 120, y);

//             y += 4;

//             doc.text(`Days Present: ${studentData.attendance.present}`, 14, y);
//             doc.text(`Days Absent: ${studentData.attendance.absent}`, 120, y);

//             y += 4;

//             doc.text(`Days Late: ${studentData.attendance.late}`, 14, y);

//             y += 6; // extra spacing before comment

//             // 🔴 ADDED: Attendance comment logic
//             let attendanceComment = '';
//             if (attendanceRate >= 95) {
//                 attendanceComment = 'Excellent attendance! Keep it up.';
//             } else if (attendanceRate >= 80) {
//                 attendanceComment = 'Good attendance record.';
//             } else {
//                 attendanceComment = 'Needs improvement in attendance.';
//             }

//             // 🔹 Ensure normal font and proper size BEFORE drawing
//             doc.setFont('helvetica', 'normal'); // fixes letter spacing
//             doc.setFontSize(10);                // match other attendance lines

//             // Draw the comment on the same style as other lines
//             doc.text(attendanceComment, 14, y);

//             // 🔹 Reduce vertical spacing after comment
//             y += 6; // instead of 10


//             // ===== FOOTER =====
//             const footerTitle = 'Report Card Generated';
//             const footerDesc =
//                 "This report card was generated based on the school's active grade calculation configuration.\nFor any questions or clarifications, please contact the school administration.";
//             const generatedOn = `Generated on: ${new Date().toLocaleDateString('en-US', {
//                 weekday: 'long',
//                 year: 'numeric',
//                 month: 'long',
//                 day: 'numeric',
//             })}`;

//             // Title - bold, centered
//             doc.setFont('helvetica', 'bold');
//             doc.setFontSize(12);
//             doc.text(footerTitle, pageWidth / 2, y, { align: 'center' });
//             y += 6;

//             // Description - normal, smaller font, wrap text if needed
//             doc.setFont('helvetica', 'normal');
//             doc.setFontSize(10);

//             // Split description into lines if too long
//             const lines = doc.splitTextToSize(footerDesc, pageWidth - 28); // 14px margin each side
//             lines.forEach((line) => {
//                 doc.text(line, pageWidth / 2, y, { align: 'center' });
//                 y += 5; // line spacing
//             });

//             // Generated date - normal, smaller, centered
//             doc.setFont('helvetica', 'normal');
//             doc.setFontSize(10);
//             doc.text(generatedOn, pageWidth / 2, y, { align: 'center' });
//             y += 6;

//             // ===== SAVE =====
//             doc.save(`${studentData.name}_Report.pdf`);



//         } catch (error) {
//             console.error('PDF Error:', error);
//             alert('Could not generate PDF');
//         } finally {
//             setIsDownloading(false);
//         }
//     };


//     if (!canGenerateReportCard()) {
//         return (
//             <div className="text-center py-12 bg-slate-50 rounded-xl">
//                 <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
//                 <h4 className="text-lg font-semibold text-slate-700 mb-2">
//                     Report Card Not Available
//                 </h4>
//                 <p className="text-slate-500 max-w-md mx-auto">
//                     {studentData.gradeConfiguration?.calculation_method === 'end_of_term_only'
//                         ? 'This report card uses "End of Term Only" calculation, but no end of term scores have been submitted yet. Please check back after end of term exams are graded.'
//                         : 'No assessment scores have been recorded for this student yet. Report card will be available once scores are entered.'
//                     }
//                 </p>
//                 <div className="mt-4 text-sm text-slate-400">
//                     Current grade calculation method: <span className="font-semibold">{studentData.gradeConfiguration?.configuration_name}</span>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div ref={reportCardRef} id="report-card-content" className="space-y-6">
//             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
//                 <div>
//                     <h4 className="text-xl font-bold text-slate-800">Complete Report Card</h4>
//                     {/* <p className="text-slate-500">{studentData.term}</p> */}
//                     {studentData.gradeConfiguration && (
//                         <p className="text-sm text-indigo-600 mt-1">
//                             Grade Calculation: {studentData.gradeConfiguration.configuration_name}
//                             {studentData.gradeConfiguration.calculation_method === 'weighted_average' &&
//                                 ` (QA1: ${studentData.gradeConfiguration.weight_qa1}%, QA2: ${studentData.gradeConfiguration.weight_qa2}%, End Term: ${studentData.gradeConfiguration.weight_end_of_term}%)`}
//                         </p>
//                     )}
//                 </div>

//                 {showActions && (
//                     <div className="flex gap-2 action-buttons">

//                         <button
//                             onClick={handleDownloadPDF}
//                             disabled={isDownloading}
//                             className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-white transition-colors ${isDownloading
//                                 ? 'bg-indigo-400 cursor-wait'        // Style when loading
//                                 : 'bg-indigo-600 hover:bg-indigo-700' // Style when normal
//                                 }`}
//                         >
//                             {isDownloading ? (
//                                 <>
//                                     {/* Shows while loading */}
//                                     <Loader2 className="w-4 h-4 animate-spin" />
//                                     <span>Generating PDF...</span>
//                                 </>
//                             ) : (
//                                 <>
//                                     {/* Shows when normal */}
//                                     <Download className="w-4 h-4" />
//                                     <span>Download PDF</span>
//                                 </>
//                             )}
//                         </button>
//                     </div>
//                 )}
//             </div>

//             {/* STUDENT AND SCHOOL INFORMATION SECTION */}
//             <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 mb-6">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                         <h5 className="text-lg font-bold text-blue-900 mb-3">Student Information</h5>
//                         <div className="space-y-2">
//                             <div className="flex justify-between border-b border-blue-100 pb-2">
//                                 <span className="text-blue-700 font-medium">Student Name:</span>
//                                 <span className="text-blue-900 font-semibold">{studentData.name || 'N/A'}</span>
//                             </div>
//                             <div className="flex justify-between border-b border-blue-100 pb-2">
//                                 <span className="text-blue-700 font-medium">Exam Number:</span>
//                                 <span className="text-blue-900 font-semibold">{studentData.examNumber || 'N/A'}</span>
//                             </div>
//                             <div className="flex justify-between border-b border-blue-100 pb-2">
//                                 <span className="text-blue-700 font-medium">Class:</span>
//                                 <span className="text-blue-900 font-semibold">
//                                     {studentData.class || 'N/A'}
//                                 </span>
//                             </div>

//                         </div>
//                     </div>

//                     <div>
//                         <h5 className="text-lg font-bold text-indigo-900 mb-3">Academic Information</h5>
//                         <div className="space-y-2">
//                             <div className="flex justify-between border-b border-indigo-100 pb-2">
//                                 <span className="text-indigo-700 font-medium">Academic Year:</span>
//                                 <span className="text-indigo-900 font-semibold">
//                                     {studentData.academicYear || 'N/A'}
//                                 </span>
//                             </div>
//                             <div className="flex justify-between border-b border-indigo-100 pb-2">
//                                 <span className="text-indigo-700 font-medium">Term:</span>
//                                 <span className="text-indigo-900 font-semibold">
//                                     {studentData.term || 'N/A'}
//                                 </span>
//                             </div>


//                             {/* DYNAMIC SCHOOL NAME */}
//                             <div className="flex justify-between border-b border-indigo-100 pb-2">
//                                 <span className="text-indigo-700 font-medium">School Name:</span>
//                                 <span className="text-indigo-900 font-semibold">
//                                     {schoolName}
//                                 </span>
//                             </div>

//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//                 {/* Final Average */}
//                 <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white">
//                     <p className="text-indigo-100 text-sm">Final Average</p>
//                     <p className="text-3xl font-bold">{calculateOverallAverage()}%</p>
//                 </div>

//                 {/* Class Position */}
//                 <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
//                     <p className="text-emerald-100 text-sm">Class Position</p>
//                     <p className="text-3xl font-bold">{studentData.classRank}<span className="text-lg">/{studentData.totalStudents}</span></p>
//                 </div>

//                 {/* Pass/Fail Status */}
//                 <div className={`${getOverallGrade() === 'F' ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-green-500 to-green-600'} rounded-xl p-4 text-white`}>
//                     <p className="text-white/90 text-sm">Overall Status</p>
//                     <p className="text-3xl font-bold">{getOverallRemark()}</p>
//                 </div>

//                 {/* Overall Grade */}
//                 <div className={`${getOverallGrade() === 'A' || getOverallGrade() === 'B' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : getOverallGrade() === 'C' || getOverallGrade() === 'D' ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-slate-500 to-slate-600'} rounded-xl p-4 text-white`}>
//                     <p className="text-white/90 text-sm">Overall Grade</p>
//                     <p className="text-3xl font-bold">{getOverallGrade()}</p>
//                     <p className="text-xs opacity-90 mt-1">
//                         {getOverallGrade() === 'A' ? 'Excellent' :
//                             getOverallGrade() === 'B' ? 'Good' :
//                                 getOverallGrade() === 'C' ? 'Satisfactory' :
//                                     getOverallGrade() === 'D' ? 'Passing' : 'Needs Improvement'}
//                     </p>
//                 </div>
//             </div>

//             <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
//                 <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
//                     <h5 className="font-semibold text-slate-800">Final Results</h5>
//                     <p className="text-sm text-slate-500 mt-1">
//                         Based on {studentData.gradeConfiguration?.configuration_name || 'active grade configuration'}
//                     </p>
//                 </div>
//                 <div className="overflow-x-auto">
//                     <table className="w-full">
//                         <thead>
//                             <tr className="bg-slate-100">
//                                 <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Subject</th>
//                                 <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">Total Marks</th>
//                                 <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">Marks Scored</th>
//                                 <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">Grade</th>
//                                 <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">Remark</th>
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y divide-slate-100">
//                             {studentData.subjects.map((subject, index) => {
//                                 const hasScores = subject.qa1 > 0 || subject.qa2 > 0 || subject.endOfTerm > 0;
//                                 if (!hasScores) return null;

//                                 const subjectAverage = calculateSubjectAverage(subject);
//                                 const subjectAverageFormatted = subjectAverage.toFixed(1);
//                                 const grade = getSubjectGrade(subject);
//                                 const remark = getSubjectRemark(subject);

//                                 return (
//                                     <tr key={index} className="hover:bg-slate-50">
//                                         <td className="px-6 py-4 font-medium text-slate-800">{subject.name}</td>
//                                         <td className="px-6 py-4 text-center text-slate-600">100</td>
//                                         <td className="px-6 py-4 text-center font-semibold text-slate-800">
//                                             {subjectAverageFormatted}
//                                         </td>
//                                         <td className="px-6 py-4 text-center">
//                                             <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(grade)}`}>
//                                                 {grade}
//                                             </span>
//                                         </td>
//                                         <td className="px-6 py-4 text-center">
//                                             <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getSubjectRemarkColor(remark)}`}>
//                                                 {remark}
//                                             </span>
//                                         </td>
//                                     </tr>
//                                 );
//                             })}
//                         </tbody>
//                         <tfoot>
//                             <tr className="bg-indigo-50 font-bold">
//                                 <td className="px-6 py-4 text-slate-800">GRAND TOTAL</td>
//                                 <td className="px-6 py-4 text-center text-slate-800">
//                                     {studentData.subjects.length * 100}
//                                 </td>
//                                 <td className="px-6 py-4 text-center text-indigo-700">
//                                     {calculateGrandTotal()}
//                                 </td>
//                                 <td className="px-6 py-4 text-center">
//                                     <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(getOverallGrade())}`}>
//                                         {getOverallGrade()}
//                                     </span>
//                                 </td>
//                                 <td className="px-6 py-4 text-center">
//                                     <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getOverallRemarkColor()}`}>
//                                         {getOverallRemark()}
//                                     </span>
//                                 </td>
//                             </tr>
//                         </tfoot>
//                     </table>
//                 </div>
//             </div>

//             <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
//                 <h5 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
//                     <TrendingUp className="w-5 h-5 text-emerald-600" />
//                     Performance Analysis
//                 </h5>
//                 <div className="space-y-4">
//                     <div className="grid grid-cols-2 gap-4">
//                         {/* Strongest Subject(s) - ALL subjects with highest score */}
//                         <div className="bg-white p-3 rounded-lg">
//                             <p className="text-sm text-slate-500">Strongest Subject{studentData.subjects.filter(s => {
//                                 const scores = studentData.subjects.map(calculateSubjectAverage);
//                                 const highestScore = Math.max(...scores);
//                                 return calculateSubjectAverage(s) === highestScore;
//                             }).length > 1 ? 's' : ''}</p>
//                             <p className="font-bold text-emerald-700">
//                                 {(() => {
//                                     const scores = studentData.subjects.map(calculateSubjectAverage);
//                                     const highestScore = Math.max(...scores);
//                                     const strongestSubjects = studentData.subjects.filter(
//                                         s => calculateSubjectAverage(s) === highestScore
//                                     );
//                                     return strongestSubjects.map(s => s.name).join(', ');
//                                 })()}
//                             </p>
//                             <p className="text-xs text-slate-500 mt-1">
//                                 Score: {Math.round(Math.max(...studentData.subjects.map(calculateSubjectAverage)))}%
//                             </p>
//                         </div>

//                         {/* Needs Improvement - ALL subjects with D or F grades */}
//                         <div className="bg-white p-3 rounded-lg">
//                             <p className="text-sm text-slate-500">Needs Improvement</p>
//                             <p className="font-bold text-amber-700">
//                                 {(() => {
//                                     const weakSubjects = studentData.subjects.filter(subject => {
//                                         const grade = getSubjectGrade(subject);
//                                         return ['D', 'F'].includes(grade);
//                                     });

//                                     if (weakSubjects.length === 0) {
//                                         return "None";
//                                     }

//                                     // Show all subjects with D/F grades, not just the weakest
//                                     return weakSubjects
//                                         .map(s => `${s.name} (${getSubjectGrade(s)})`)
//                                         .join(', ');
//                                 })()}
//                             </p>
//                             {(() => {
//                                 const weakSubjects = studentData.subjects.filter(subject => {
//                                     const grade = getSubjectGrade(subject);
//                                     return ['D', 'F'].includes(grade);
//                                 });

//                                 if (weakSubjects.length > 0) {
//                                     return (
//                                         <p className="text-xs text-slate-500 mt-1">
//                                             Total flagged: {weakSubjects.length}
//                                         </p>
//                                     );
//                                 } else {
//                                     return (
//                                         <p className="text-xs text-slate-500 mt-1">
//                                             All subjects are currently satisfactory
//                                         </p>
//                                     );
//                                 }
//                             })()}
//                         </div>
//                     </div>

//                     <div className="space-y-3">
//                         <div className="flex justify-between items-center">
//                             <span className="text-sm text-slate-600">Subjects Passed:</span>
//                             <span className="font-bold text-emerald-800">
//                                 {studentData.subjects.filter(subject => {
//                                     const grade = getSubjectGrade(subject);
//                                     return grade && grade !== 'F';
//                                 }).length}/{studentData.subjects.length}
//                             </span>
//                         </div>
//                         <div className="flex justify-between items-center">
//                             <span className="text-sm text-slate-600">A & B Grades:</span>
//                             <span className="font-bold text-blue-800">
//                                 {studentData.subjects.filter(subject => {
//                                     const grade = getSubjectGrade(subject);
//                                     return grade === 'A' || grade === 'B';
//                                 }).length}
//                             </span>
//                         </div>
//                         <div className="flex justify-between items-center">
//                             <span className="text-sm text-slate-600">C & D Grades:</span>
//                             <span className="font-bold text-amber-800">
//                                 {studentData.subjects.filter(subject => {
//                                     const grade = getSubjectGrade(subject);
//                                     return grade === 'C' || grade === 'D';
//                                 }).length}
//                             </span>
//                         </div>
//                         <div className="flex justify-between items-center">
//                             <span className="text-sm text-slate-600">Subjects Below {studentData.gradeConfiguration?.pass_mark || 50}% Pass Mark:</span>
//                             <span className="font-bold text-rose-800">
//                                 {studentData.subjects.filter(subject => {
//                                     const score = calculateSubjectAverage(subject);
//                                     const passMark = studentData.gradeConfiguration?.pass_mark || 50;
//                                     return score < passMark;
//                                 }).length}
//                             </span>
//                         </div>
//                     </div>
//                 </div>

//                 <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-indigo-100">
//                     {/* Label with Indigo Color, Uppercase, and Letter Spacing */}
//                     <p className="text-xs font-bold text-indigo-600 tracking-wide mb-2">
//                         Teacher's Remark
//                     </p>

//                     <p className="text-sm text-slate-700 italic leading-relaxed">
//                         "{getOverallGrade() === 'A' ? 'An outstanding performance! Keep maintaining this high standard.' :
//                             getOverallGrade() === 'B' ? 'A very good result. With a little more push, you can reach excellence.' :
//                                 getOverallGrade() === 'C' ? 'A satisfactory performance, but there is room for improvement.' :
//                                     getOverallGrade() === 'D' ? 'You have passed, but more effort is needed to improve grades.' :
//                                         'Please focus more on your studies and seek help in weak subjects.'}"
//                     </p>
//                 </div>
//             </div>

//             <div className="bg-white rounded-xl p-6 border border-slate-200">
//                 <h5 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
//                     <Calendar className="w-5 h-5 text-indigo-600" />
//                     Attendance Details
//                 </h5>

//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
//                     <div className="text-center p-4 bg-blue-50 rounded-lg">
//                         <p className="text-2xl font-bold text-blue-700">
//                             <p className="text-sm text-blue-600">Total School Days</p>
//                             {studentData.attendance.present + studentData.attendance.absent}
//                         </p>
//                     </div>

//                     <div className={`${Math.round((studentData.attendance.present / (studentData.attendance.present + studentData.attendance.absent)) * 100) >= 75 ? 'bg-gradient-to-br from-green-50 to-green-100' : 'bg-gradient-to-br from-orange-50 to-orange-100'} rounded-xl p-4`}>
//                         <p className={`text-sm font-medium ${Math.round((studentData.attendance.present / (studentData.attendance.present + studentData.attendance.absent)) * 100) >= 75 ? 'text-green-800' : 'text-orange-800'}`}>
//                             Attendance Rate
//                         </p>
//                         <p className={`text-2xl font-bold ${Math.round((studentData.attendance.present / (studentData.attendance.present + studentData.attendance.absent)) * 100) >= 75 ? 'text-green-900' : 'text-orange-900'}`}>
//                             {Math.round((studentData.attendance.present / (studentData.attendance.present + studentData.attendance.absent)) * 100)}%
//                         </p>
//                         <p className={`text-xs mt-1 ${Math.round((studentData.attendance.present / (studentData.attendance.present + studentData.attendance.absent)) * 100) >= 75 ? 'text-green-700' : 'text-orange-700'}`}>
//                             {studentData.attendance.present}/{studentData.attendance.present + studentData.attendance.absent}
//                         </p>
//                     </div>

//                     <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-rose-50 rounded-lg">
//                         <div className="grid grid-cols-2 gap-4">
//                             <div>
//                                 <p className="text-sm text-emerald-600">Days Present</p>
//                                 <p className="text-2xl font-bold text-emerald-700">{studentData.attendance.present}</p>
//                             </div>
//                             <div>
//                                 <p className="text-sm text-rose-600"> Days Absent</p>
//                                 <p className="text-2xl font-bold text-rose-700">{studentData.attendance.absent}</p>
//                             </div>
//                         </div>
//                     </div>

//                     <div className="text-center p-4 bg-amber-50 rounded-lg">
//                         <p className="text-sm text-amber-600">Days Late</p>
//                         <p className="text-2xl font-bold text-amber-700">
//                             {studentData.attendance.late}
//                         </p>
//                     </div>
//                 </div>

//                 <div className="mt-4 pt-4 border-t border-slate-200">
//                     <p className="text-sm font-medium text-slate-700 mb-2">Attendance Trend:</p>
//                     <div className="flex items-center justify-between">
//                         <div className="w-full bg-slate-200 rounded-full h-2">
//                             <div
//                                 className="bg-emerald-500 h-2 rounded-full"
//                                 style={{ width: `${Math.round((studentData.attendance.present / (studentData.attendance.present + studentData.attendance.absent)) * 100)}%` }}
//                             ></div>
//                         </div>
//                         <span className="ml-4 text-sm font-semibold text-slate-700">
//                             {Math.round((studentData.attendance.present / (studentData.attendance.present + studentData.attendance.absent)) * 100)}%
//                         </span>
//                     </div>

//                     <div className="mt-3 text-sm text-slate-500">
//                         {Math.round((studentData.attendance.present / (studentData.attendance.present + studentData.attendance.absent)) * 100) >= 95
//                             ? '✓ Excellent attendance! Keep it up.'
//                             : Math.round((studentData.attendance.present / (studentData.attendance.present + studentData.attendance.absent)) * 100) >= 80
//                                 ? '✓ Good attendance record.'
//                                 : '⚠ Needs improvement in attendance.'}
//                     </div>
//                 </div>
//             </div>




//             <div className="bg-slate-900 text-white rounded-xl p-6">
//                 <div className="text-center">
//                     <h6 className="text-lg font-bold mb-2">Report Card Generated</h6>
//                     <p className="text-slate-300 mb-4">
//                         This report card was generated based on the school's active grade calculation configuration.
//                         For any questions or clarifications, please contact the school administration.
//                     </p>
//                     <div className="flex flex-col md:flex-row justify-center items-center gap-6 text-sm text-slate-400">
//                         <div>Generated on: {new Date().toLocaleDateString('en-US', {
//                             weekday: 'long',
//                             year: 'numeric',
//                             month: 'long',
//                             day: 'numeric'
//                         })}</div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ReportCard;