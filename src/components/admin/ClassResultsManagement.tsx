import React, { useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TrendingUp, Award, CheckCircle, Users, Download } from 'lucide-react';
import { SubjectRecord } from '@/services/studentService';
import { GradeConfiguration } from '@/services/gradeConfigService';
import { ClassResultStudent, Student } from '@/types/admin';
import ClassResultsTable from './tables/ClassResultsTable';

interface ClassResultsManagementProps {
    classes: any[];
    subjects: SubjectRecord[];
    classResults: ClassResultStudent[];
    students: Student[];
    selectedClassForResults: string;
    activeAssessmentType: 'qa1' | 'qa2' | 'endOfTerm' | 'overall';
    resultsLoading: boolean;
    activeConfig: GradeConfiguration | null;
    setSelectedClassForResults: (classId: string) => void;
    setActiveAssessmentType: (type: 'qa1' | 'qa2' | 'endOfTerm' | 'overall') => void;
    loadClassResults: (classId: string) => Promise<void>;
    calculateGrade: (score: number, passMark?: number) => string;
    isTeacherView?: boolean;
}

const ClassResultsManagement: React.FC<ClassResultsManagementProps> = ({
    classes,
    subjects,
    classResults,
    students,
    selectedClassForResults,
    activeAssessmentType,
    resultsLoading,
    activeConfig,
    setSelectedClassForResults,
    setActiveAssessmentType,
    loadClassResults,
    calculateGrade,
}) => {

    const tableRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const classId = e.target.value;
        setSelectedClassForResults(classId);
        if (classId) {
            loadClassResults(classId);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        setIsDownloading(true);

        try {
            const doc = new jsPDF('l', 'mm', 'a4');

            // --- 1. CALCULATION LOGIC (Identical to Table) ---

            const calculateSubjectFinalScore = (subject: any): number => {
                if (!activeConfig) {
                    return (subject.qa1 + subject.qa2 + subject.endOfTerm) / 3;
                }
                switch (activeConfig.calculation_method) {
                    case 'end_of_term_only':
                        return subject.endOfTerm;
                    case 'weighted_average':
                        const w1 = activeConfig.weight_qa1 || 0;
                        const w2 = activeConfig.weight_qa2 || 0;
                        const w3 = activeConfig.weight_end_of_term || 0;
                        return ((subject.qa1 * w1 / 100) + (subject.qa2 * w2 / 100) + (subject.endOfTerm * w3 / 100));
                    case 'average_all':
                    default:
                        return (subject.qa1 + subject.qa2 + subject.endOfTerm) / 3;
                }
            };

            const calculateStudentOverallAverage = (student: ClassResultStudent): number => {
                const validSubjects = student.subjects.filter(subject => {
                    const hasScores = subject.qa1 > 0 || subject.qa2 > 0 || subject.endOfTerm > 0;
                    return hasScores;
                });
                if (validSubjects.length === 0) return 0;
                const totalScore = validSubjects.reduce((sum, subject) => {
                    const finalScore = calculateSubjectFinalScore(subject);
                    return sum + finalScore;
                }, 0);
                return totalScore / validSubjects.length;
            };

            const calculateStudentAssessmentAverage = (student: ClassResultStudent): number => {
                let totalScore = 0;
                let subjectCount = 0;
                student.subjects.forEach(subject => {
                    const score = activeAssessmentType === 'qa1' ? subject.qa1 : activeAssessmentType === 'qa2' ? subject.qa2 : subject.endOfTerm;
                    if (!isNaN(score) && score > 0) {
                        totalScore += score;
                        subjectCount++;
                    }
                });
                return subjectCount > 0 ? totalScore / subjectCount : 0;
            };

            const getStudentSubjectsWithScores = (student: ClassResultStudent) => {
                return student.subjects.filter(subject => {
                    const hasScores = subject.qa1 > 0 || subject.qa2 > 0 || subject.endOfTerm > 0;
                    return hasScores;
                });
            };

            const calculateTotalMarks = (student: ClassResultStudent): number => {
                if (activeAssessmentType === 'overall') {
                    const average = calculateStudentOverallAverage(student);
                    const validSubjects = getStudentSubjectsWithScores(student);
                    return average * validSubjects.length;
                }
                let total = 0;
                student.subjects.forEach(subject => {
                    const score = activeAssessmentType === 'qa1' ? subject.qa1 : activeAssessmentType === 'qa2' ? subject.qa2 : subject.endOfTerm;
                    if (!isNaN(score) && score > 0) {
                        total += score;
                    }
                });
                return total;
            };

            // --- 2. PREPARE DATA & CALCULATIONS ---

            // Filter subjects
            const subjectsWithScores = new Set<string>();
            classResults.forEach(student => {
                student.subjects.forEach(subject => {
                    const score = activeAssessmentType === 'overall'
                        ? (subject.qa1 > 0 || subject.qa2 > 0 || subject.endOfTerm > 0 ? 1 : 0)
                        : (activeAssessmentType === 'qa1' ? subject.qa1 : activeAssessmentType === 'qa2' ? subject.qa2 : subject.endOfTerm);

                    if (score > 0) subjectsWithScores.add(subject.name);
                });
            });
            const filteredSubjects = subjects.filter(subject => subjectsWithScores.has(subject.name));

            // Calculate Metrics per Student
            const studentsWithCalculations = classResults.map(student => {
                const totalMarks = calculateTotalMarks(student);
                const average = activeAssessmentType === 'overall'
                    ? calculateStudentOverallAverage(student)
                    : calculateStudentAssessmentAverage(student);

                return {
                    ...student,
                    calculatedTotalMarks: totalMarks,
                    calculatedAverage: average,
                    calculatedGrade: calculateGrade(average, activeConfig?.pass_mark),
                    calculatedStatus: calculateGrade(average, activeConfig?.pass_mark) === 'F' ? 'Failed' : 'Passed'
                };
            });

            // Sort by Total Marks (as per your table logic)
            const sortedStudents = studentsWithCalculations.sort((a, b) => b.calculatedTotalMarks - a.calculatedTotalMarks);

            // --- 3. GENERATE HEADER STATS ---
            const totalStudents = sortedStudents.length;
            const passedCount = sortedStudents.filter(s => s.calculatedStatus === 'Passed').length;
            const failedCount = sortedStudents.filter(s => s.calculatedStatus === 'Failed').length;
            const passRate = totalStudents > 0 ? (passedCount / totalStudents) * 100 : 0;
            const classAverage = totalStudents > 0
                ? sortedStudents.reduce((acc, s) => acc + s.calculatedAverage, 0) / totalStudents
                : 0;

            const selectedClass = classes.find(c => c.id === selectedClassForResults);
            const className = selectedClass?.name || 'Class';
            const termName = selectedClass?.term || '';
            const academicYear = selectedClass?.academic_year || '';

            // Text Strings
            const mainTitle = `${className} - ${termName}, ${academicYear} - Results (${activeAssessmentType.toUpperCase()})`;
            const statsLine1 = `Total Students: ${totalStudents}    |    Class Average: ${classAverage.toFixed(1)}%`;
            const statsLine2 = `Passed: ${passedCount}    |    Failed: ${failedCount}    |    Pass Rate: ${passRate.toFixed(1)}%`;

            // --- 4. BUILD TABLE BODY ---
            const tableHead = [
                'Rank',
                'Student Name',
                ...filteredSubjects.map(s => s.name),
                'Total',
                'Avg',
                'Grade',
                'Status'
            ];

            // === UPDATED RANKING LOGIC (DENSE RANKING: 1, 1, 2) ===
            let currentRank = 1;
            let previousMarks: number | null = null;

            const tableBody = sortedStudents.map((student, index) => {
                let displayRank = currentRank;

                if (index === 0) {
                    // First student is always rank 1
                    displayRank = 1;
                    currentRank = 1;
                } else if (previousMarks !== null && student.calculatedTotalMarks === previousMarks) {
                    // Tie: Keep same rank as previous (1, 1)
                    displayRank = currentRank;
                } else {
                    // New score: Just increment rank by 1 (1, 1, 2)
                    currentRank++;
                    displayRank = currentRank;
                }

                previousMarks = student.calculatedTotalMarks;

                // Subject Columns
                const subjectCols = filteredSubjects.map((subj) => {
                    const studentSubject = student.subjects?.find((s: any) => s.name === subj.name);
                    if (!studentSubject) return '-';

                    if (activeAssessmentType === 'overall') {
                        const hasScores = studentSubject.qa1 > 0 || studentSubject.qa2 > 0 || studentSubject.endOfTerm > 0;
                        if (!hasScores) return '-';
                        const finalScore = calculateSubjectFinalScore(studentSubject);
                        const grade = calculateGrade(finalScore, activeConfig?.pass_mark);
                        return `${finalScore.toFixed(1)} (${grade})`;
                    } else {
                        const score = activeAssessmentType === 'qa1' ? studentSubject.qa1 : activeAssessmentType === 'qa2' ? studentSubject.qa2 : studentSubject.endOfTerm;
                        if (score > 0) {
                            const grade = calculateGrade(score, activeConfig?.pass_mark);
                            return `${score} (${grade})`;
                        }
                        return '-';
                    }
                });

                return [
                    displayRank,
                    student.name,
                    ...subjectCols,
                    student.calculatedTotalMarks.toFixed(1),
                    (student.calculatedAverage || 0).toFixed(1) + '%',
                    student.calculatedGrade,
                    student.calculatedStatus
                ];
            });

            // --- 5. RENDER PDF ---
            autoTable(doc, {
                head: [tableHead],
                body: tableBody,
                startY: 35,
                styles: { fontSize: 7, cellPadding: 1 },
                headStyles: { fillColor: [63, 81, 181] },
                didDrawPage: (data) => {
                    if (data.pageNumber === 1) {
                        doc.setFontSize(16);
                        doc.setTextColor(40);
                        doc.text(mainTitle, 14, 15);

                        doc.setFontSize(10);
                        doc.setTextColor(80);
                        doc.text(statsLine1, 14, 22);
                        doc.text(statsLine2, 14, 27);
                    }
                }
            });

            doc.save(`${className}_Results_${activeAssessmentType}.pdf`);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to download PDF');
        } finally {
            setIsDownloading(false);
        }
    };

    // Calculate metrics for UI Cards
    const metrics = useMemo(() => {
        const totalStudentsInClass = students.filter(student => student.class?.id === selectedClassForResults).length;

        if (!selectedClassForResults || totalStudentsInClass === 0) {
            return {
                classAverage: 0,
                topPerformerName: 'N/A',
                topPerformerScore: 0,
                passRate: 0,
                totalStudents: totalStudentsInClass,
                studentsWithScoresRatio: `0/${totalStudentsInClass}`,
                passedCount: 0,
                failedCount: 0
            };
        }

        let totalAvg = 0;
        let topScore = -1;
        let topPerformerName = 'N/A';
        let topPerformerScore = 0;
        let passedCount = 0;
        let failedCount = 0;
        let studentsWithScoresCount = 0;

        classResults.forEach(student => {
            let avg = 0;
            if (activeAssessmentType === 'overall') {
                const validSubjects = student.subjects.filter(s => s.qa1 > 0 || s.qa2 > 0 || s.endOfTerm > 0);
                if (validSubjects.length > 0) {
                    const total = validSubjects.reduce((sum, s) => sum + ((s.qa1 + s.qa2 + s.endOfTerm) / 3), 0);
                    avg = total / validSubjects.length;
                }
            } else {
                let total = 0; let count = 0;
                student.subjects.forEach(s => {
                    const sc = activeAssessmentType === 'qa1' ? s.qa1 : activeAssessmentType === 'qa2' ? s.qa2 : s.endOfTerm;
                    if (sc > 0) { total += sc; count++; }
                });
                if (count > 0) avg = total / count;
            }

            if (avg > 0) {
                totalAvg += avg;
                studentsWithScoresCount++;
                if (avg > topScore) {
                    topScore = avg;
                    topPerformerName = student.name;
                    topPerformerScore = avg;
                }
            }

            const grade = calculateGrade(avg, activeConfig?.pass_mark);
            if (grade !== 'F') passedCount++; else failedCount++;
        });

        const classAverage = studentsWithScoresCount > 0 ? totalAvg / studentsWithScoresCount : 0;
        const passRate = totalStudentsInClass > 0 ? (passedCount / totalStudentsInClass) * 100 : 0;

        return {
            classAverage,
            topPerformerName,
            topPerformerScore,
            passRate,
            totalStudents: totalStudentsInClass,
            studentsWithScores: studentsWithScoresCount,
            studentsWithScoresRatio: `${studentsWithScoresCount}/${totalStudentsInClass}`,
            passedCount,
            failedCount
        };
    }, [classResults, activeAssessmentType, students, selectedClassForResults, activeConfig, calculateGrade]);

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">Class Results & Rankings</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            View all students' results in each class, ranked by performance
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <div className="min-w-[200px]">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Select Class</label>
                            <select
                                value={selectedClassForResults}
                                onChange={handleClassChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Select a class</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name} - {cls.term} ({cls.academic_year})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">View Results For</label>
                            <div className="flex gap-2">
                                {[
                                    { id: 'overall', label: 'Overall' },
                                    { id: 'qa1', label: 'QA1' },
                                    { id: 'qa2', label: 'QA2' },
                                    { id: 'endOfTerm', label: 'End Term' }
                                ].map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setActiveAssessmentType(type.id as any)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeAssessmentType === type.id
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {resultsLoading ? (
                    <div className="text-center py-12">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-600">Loading results...</p>
                    </div>
                ) : selectedClassForResults && classResults.length > 0 ? (
                    <div className="space-y-8">
                        {/* Top Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-indigo-700 font-medium">Class Average</p>
                                        <p className="text-2xl font-bold text-indigo-800 mt-1">
                                            {metrics.classAverage.toFixed(1)}%
                                        </p>
                                        <p className="text-xs text-indigo-600 mt-1">
                                            {activeAssessmentType.toUpperCase()}
                                        </p>
                                    </div>
                                    <TrendingUp className="w-8 h-8 text-indigo-600 opacity-50" />
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-emerald-700 font-medium">Top Performer</p>
                                        <p className="text-lg font-bold text-emerald-800 mt-1">
                                            {metrics.topPerformerName}
                                        </p>
                                        <p className="text-xs text-emerald-600 mt-1">
                                            Score: {metrics.topPerformerScore.toFixed(1)}%
                                        </p>
                                    </div>
                                    <Award className="w-8 h-8 text-emerald-600 opacity-50" />
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-amber-700 font-medium">Pass Rate</p>
                                        <p className="text-2xl font-bold text-amber-800 mt-1">
                                            {Math.round(metrics.passRate)}%
                                        </p>
                                        <p className="text-xs text-amber-600 mt-1">
                                            {metrics.passedCount} passed / {metrics.failedCount} failed
                                        </p>
                                    </div>
                                    <CheckCircle className="w-8 h-8 text-amber-600 opacity-50" />
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-700 font-medium">Students with Scores</p>
                                        <p className="text-2xl font-bold text-slate-800 mt-1">
                                            {metrics.studentsWithScoresRatio}
                                        </p>
                                        <p className="text-xs text-slate-600 mt-1">
                                            {activeAssessmentType.toUpperCase()} scores entered
                                        </p>
                                    </div>
                                    <Users className="w-8 h-8 text-slate-600 opacity-50" />
                                </div>
                            </div>
                        </div>

                        <div ref={tableRef} className="bg-white p-1">
                            <ClassResultsTable
                                classResults={classResults}
                                subjects={subjects}
                                activeAssessmentType={activeAssessmentType}
                                activeConfig={activeConfig}
                                calculateGrade={calculateGrade}
                                onPrint={handlePrint}
                                onExport={handleExport}
                                isDownloading={isDownloading}
                            />
                        </div>
                    </div>
                ) : selectedClassForResults ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl">
                        <p className="text-slate-500">No results found for this class. Enter student results first.</p>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-xl">
                        <p className="text-slate-500">Select a class to view results</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClassResultsManagement;


// import React, { useMemo, useRef, useState } from 'react';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import { TrendingUp, Award, CheckCircle, Users, Download } from 'lucide-react';
// import { SubjectRecord } from '@/services/studentService';
// import { GradeConfiguration } from '@/services/gradeConfigService';
// import { ClassResultStudent, Student } from '@/types/admin';
// import ClassResultsTable from './tables/ClassResultsTable';

// interface ClassResultsManagementProps {
//     classes: any[];
//     subjects: SubjectRecord[];
//     classResults: ClassResultStudent[];
//     students: Student[];
//     selectedClassForResults: string;
//     activeAssessmentType: 'qa1' | 'qa2' | 'endOfTerm' | 'overall';
//     resultsLoading: boolean;
//     activeConfig: GradeConfiguration | null;
//     setSelectedClassForResults: (classId: string) => void;
//     setActiveAssessmentType: (type: 'qa1' | 'qa2' | 'endOfTerm' | 'overall') => void;
//     loadClassResults: (classId: string) => Promise<void>;
//     calculateGrade: (score: number, passMark?: number) => string;
//     isTeacherView?: boolean;
// }

// const ClassResultsManagement: React.FC<ClassResultsManagementProps> = ({
//     classes,
//     subjects,
//     classResults,
//     students,
//     selectedClassForResults,
//     activeAssessmentType,
//     resultsLoading,
//     activeConfig,
//     setSelectedClassForResults,
//     setActiveAssessmentType,
//     loadClassResults,
//     calculateGrade,
// }) => {

//     const tableRef = useRef<HTMLDivElement>(null);
//     const [isDownloading, setIsDownloading] = useState(false);

//     const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//         const classId = e.target.value;
//         setSelectedClassForResults(classId);
//         if (classId) {
//             loadClassResults(classId);
//         }
//     };

//     const handlePrint = () => {
//         window.print();
//     };

//     // --- REPLICATING LOGIC FROM YOUR TABLE FOR PDF GENERATION ---
//     const handleExport = () => {
//         setIsDownloading(true);

//         try {
//             const doc = new jsPDF('l', 'mm', 'a4');

//             // 1. HELPERS: Exact copies from your ClassResultsTable

//             const calculateSubjectFinalScore = (subject: any): number => {
//                 if (!activeConfig) {
//                     return (subject.qa1 + subject.qa2 + subject.endOfTerm) / 3;
//                 }
//                 switch (activeConfig.calculation_method) {
//                     case 'end_of_term_only':
//                         return subject.endOfTerm;
//                     case 'weighted_average':
//                         const w1 = activeConfig.weight_qa1 || 0;
//                         const w2 = activeConfig.weight_qa2 || 0;
//                         const w3 = activeConfig.weight_end_of_term || 0;
//                         return ((subject.qa1 * w1 / 100) + (subject.qa2 * w2 / 100) + (subject.endOfTerm * w3 / 100));
//                     case 'average_all':
//                     default:
//                         return (subject.qa1 + subject.qa2 + subject.endOfTerm) / 3;
//                 }
//             };

//             const calculateStudentOverallAverage = (student: ClassResultStudent): number => {
//                 const validSubjects = student.subjects.filter(subject => {
//                     const hasScores = subject.qa1 > 0 || subject.qa2 > 0 || subject.endOfTerm > 0;
//                     return hasScores;
//                 });
//                 if (validSubjects.length === 0) return 0;
//                 const totalScore = validSubjects.reduce((sum, subject) => {
//                     const finalScore = calculateSubjectFinalScore(subject);
//                     return sum + finalScore;
//                 }, 0);
//                 return totalScore / validSubjects.length;
//             };

//             const calculateStudentAssessmentAverage = (student: ClassResultStudent): number => {
//                 let totalScore = 0;
//                 let subjectCount = 0;
//                 student.subjects.forEach(subject => {
//                     const score = activeAssessmentType === 'qa1' ? subject.qa1 : activeAssessmentType === 'qa2' ? subject.qa2 : subject.endOfTerm;
//                     if (!isNaN(score) && score > 0) {
//                         totalScore += score;
//                         subjectCount++;
//                     }
//                 });
//                 return subjectCount > 0 ? totalScore / subjectCount : 0;
//             };

//             const getStudentSubjectsWithScores = (student: ClassResultStudent) => {
//                 return student.subjects.filter(subject => {
//                     const hasScores = subject.qa1 > 0 || subject.qa2 > 0 || subject.endOfTerm > 0;
//                     return hasScores;
//                 });
//             };

//             // THE CRITICAL FUNCTION: How Total Marks are calculated in your table
//             const calculateTotalMarks = (student: ClassResultStudent): number => {
//                 if (activeAssessmentType === 'overall') {
//                     const average = calculateStudentOverallAverage(student);
//                     const validSubjects = getStudentSubjectsWithScores(student);
//                     return average * validSubjects.length;
//                 }
//                 let total = 0;
//                 student.subjects.forEach(subject => {
//                     const score = activeAssessmentType === 'qa1' ? subject.qa1 : activeAssessmentType === 'qa2' ? subject.qa2 : subject.endOfTerm;
//                     if (!isNaN(score) && score > 0) {
//                         total += score;
//                     }
//                 });
//                 return total;
//             };

//             // 2. PREPARE DATA USING ABOVE HELPERS
//             const selectedClass = classes.find(c => c.id === selectedClassForResults);
//             const className = selectedClass?.name || 'Class';
//             const termName = selectedClass?.term || '';
//             const academicYear = selectedClass?.academic_year || '';

//             const mainTitle = `${className} - ${termName}, ${academicYear} - Results (${activeAssessmentType.toUpperCase()})`;

//             // Filter subjects exactly like the table does
//             const subjectsWithScores = new Set<string>();
//             classResults.forEach(student => {
//                 student.subjects.forEach(subject => {
//                     const score = activeAssessmentType === 'overall'
//                         ? (subject.qa1 > 0 || subject.qa2 > 0 || subject.endOfTerm > 0 ? 1 : 0)
//                         : (activeAssessmentType === 'qa1' ? subject.qa1 : activeAssessmentType === 'qa2' ? subject.qa2 : subject.endOfTerm);

//                     if (score > 0) subjectsWithScores.add(subject.name);
//                 });
//             });
//             const filteredSubjects = subjects.filter(subject => subjectsWithScores.has(subject.name));

//             const tableHead = [
//                 'Rank',
//                 'Student Name',
//                 ...filteredSubjects.map(s => s.name),
//                 'Total',
//                 'Avg',
//                 'Grade',
//                 'Status'
//             ];

//             // 3. CALCULATE AND SORT (Replicating calculateRanks)
//             const studentsWithCalculations = classResults.map(student => {
//                 const totalMarks = calculateTotalMarks(student);
//                 const average = activeAssessmentType === 'overall'
//                     ? calculateStudentOverallAverage(student)
//                     : calculateStudentAssessmentAverage(student);

//                 return {
//                     ...student,
//                     calculatedTotalMarks: totalMarks,
//                     calculatedAverage: average,
//                     calculatedGrade: calculateGrade(average, activeConfig?.pass_mark),
//                     // Status logic from your code
//                     calculatedStatus: calculateGrade(average, activeConfig?.pass_mark) === 'F' ? 'Failed' : 'Passed'
//                 };
//             });

//             // Sort by Total Marks (as per your table logic)
//             const sortedStudents = studentsWithCalculations.sort((a, b) => b.calculatedTotalMarks - a.calculatedTotalMarks);

//             let currentRank = 1;
//             let previousMarks: number | null = null;
//             let skipCount = 0;

//             const tableBody = sortedStudents.map((student, index) => {
//                 // Rank Logic
//                 let displayRank = currentRank;
//                 if (previousMarks !== null && student.calculatedTotalMarks === previousMarks) {
//                     displayRank = currentRank; // Tie
//                     skipCount++;
//                 } else {
//                     if (index > 0) currentRank += skipCount;
//                     displayRank = currentRank;
//                     previousMarks = student.calculatedTotalMarks;
//                     skipCount = 1;
//                 }

//                 // Subject Columns
//                 const subjectCols = filteredSubjects.map((subj) => {
//                     const studentSubject = student.subjects?.find((s: any) => s.name === subj.name);

//                     if (!studentSubject) return '-';

//                     if (activeAssessmentType === 'overall') {
//                         const hasScores = studentSubject.qa1 > 0 || studentSubject.qa2 > 0 || studentSubject.endOfTerm > 0;
//                         if (!hasScores) return '-';
//                         const finalScore = calculateSubjectFinalScore(studentSubject);
//                         const grade = calculateGrade(finalScore, activeConfig?.pass_mark);
//                         return `${finalScore.toFixed(1)} (${grade})`;
//                     } else {
//                         const score = activeAssessmentType === 'qa1' ? studentSubject.qa1 : activeAssessmentType === 'qa2' ? studentSubject.qa2 : studentSubject.endOfTerm;
//                         if (score > 0) {
//                             const grade = calculateGrade(score, activeConfig?.pass_mark);
//                             return `${score} (${grade})`;
//                         }
//                         return '-';
//                     }
//                 });

//                 return [
//                     displayRank,
//                     student.name,
//                     ...subjectCols,
//                     student.calculatedTotalMarks.toFixed(1), // The exact total from your logic
//                     (student.calculatedAverage || 0).toFixed(1) + '%',
//                     student.calculatedGrade,
//                     student.calculatedStatus
//                 ];
//             });

//             autoTable(doc, {
//                 head: [tableHead],
//                 body: tableBody,
//                 startY: 25,
//                 styles: { fontSize: 7, cellPadding: 1 },
//                 headStyles: { fillColor: [63, 81, 181] },
//                 didDrawPage: (data) => {
//                     doc.setFontSize(14);
//                     doc.setTextColor(40);
//                     doc.text(mainTitle, 14, 10);
//                 }
//             });

//             doc.save(`${className}_Results_${activeAssessmentType}.pdf`);

//         } catch (error) {
//             console.error('Error generating PDF:', error);
//             alert('Failed to download PDF');
//         } finally {
//             setIsDownloading(false);
//         }
//     };

//     // Calculate dynamic metrics based on activeAssessmentType
//     // NOTE: Using the exact same helpers here to ensure consistency in the Top Cards
//     const metrics = useMemo(() => {
//         const totalStudentsInClass = students.filter(student => student.class?.id === selectedClassForResults).length;

//         if (!selectedClassForResults || totalStudentsInClass === 0) {
//             return {
//                 classAverage: 0,
//                 topPerformerName: 'N/A',
//                 topPerformerScore: 0,
//                 passRate: 0,
//                 totalStudents: totalStudentsInClass,
//                 studentsWithScoresRatio: `0/${totalStudentsInClass}`,
//                 passedCount: 0,
//                 failedCount: 0
//             };
//         }

//         // Define local helpers again for useMemo (or move them outside component to avoid duplication)
//         // For brevity in this fix, I'm simplifying the metric calculation to rely on classResults
//         // but ideally, you'd refactor the helpers to be available to both handleExport and here.

//         let totalAvg = 0;
//         let topScore = -1;
//         let topPerformerName = 'N/A';
//         let topPerformerScore = 0;
//         let passedCount = 0;
//         let failedCount = 0;
//         let studentsWithScoresCount = 0;

//         classResults.forEach(student => {
//             // Simplified replication of logic for the metrics cards
//             // Note: For perfect consistency, the helper functions defined in handleExport
//             // should be moved outside the component so they can be used here too.
//             let avg = 0;
//             if (activeAssessmentType === 'overall') {
//                 // Inline version of calculateStudentOverallAverage logic
//                 const validSubjects = student.subjects.filter(s => s.qa1 > 0 || s.qa2 > 0 || s.endOfTerm > 0);
//                 if (validSubjects.length > 0) {
//                     const total = validSubjects.reduce((sum, s) => {
//                         // Defaulting to average if config not available in this scope,
//                         // but you should pass the calculator function if possible
//                         return sum + ((s.qa1 + s.qa2 + s.endOfTerm) / 3);
//                     }, 0);
//                     avg = total / validSubjects.length;
//                 }
//             } else {
//                 // Assessment specific
//                 let total = 0; let count = 0;
//                 student.subjects.forEach(s => {
//                     const sc = activeAssessmentType === 'qa1' ? s.qa1 : activeAssessmentType === 'qa2' ? s.qa2 : s.endOfTerm;
//                     if (sc > 0) { total += sc; count++; }
//                 });
//                 if (count > 0) avg = total / count;
//             }

//             if (avg > 0) {
//                 totalAvg += avg;
//                 studentsWithScoresCount++;
//                 if (avg > topScore) {
//                     topScore = avg;
//                     topPerformerName = student.name;
//                     topPerformerScore = avg;
//                 }
//             }

//             const grade = calculateGrade(avg, activeConfig?.pass_mark);
//             if (grade !== 'F') passedCount++; else failedCount++;
//         });

//         const classAverage = studentsWithScoresCount > 0 ? totalAvg / studentsWithScoresCount : 0;
//         const passRate = totalStudentsInClass > 0 ? (passedCount / totalStudentsInClass) * 100 : 0;

//         return {
//             classAverage,
//             topPerformerName,
//             topPerformerScore,
//             passRate,
//             totalStudents: totalStudentsInClass,
//             studentsWithScores: studentsWithScoresCount,
//             studentsWithScoresRatio: `${studentsWithScoresCount}/${totalStudentsInClass}`,
//             passedCount,
//             failedCount
//         };
//     }, [classResults, activeAssessmentType, students, selectedClassForResults, activeConfig, calculateGrade]);

//     return (
//         <div className="space-y-6">
//             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
//                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
//                     <div>
//                         <h2 className="text-lg font-semibold text-slate-800">Class Results & Rankings</h2>
//                         <p className="text-sm text-slate-500 mt-1">
//                             View all students' results in each class, ranked by performance
//                         </p>
//                     </div>

//                     <div className="flex flex-wrap gap-4">
//                         <div className="min-w-[200px]">
//                             <label className="block text-sm font-medium text-slate-700 mb-1">Select Class</label>
//                             <select
//                                 value={selectedClassForResults}
//                                 onChange={handleClassChange}
//                                 className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                             >
//                                 <option value="">Select a class</option>
//                                 {classes.map(cls => (
//                                     <option key={cls.id} value={cls.id}>
//                                         {cls.name} - {cls.term} ({cls.academic_year})
//                                     </option>
//                                 ))}
//                             </select>
//                         </div>

//                         <div>
//                             <label className="block text-sm font-medium text-slate-700 mb-1">View Results For</label>
//                             <div className="flex gap-2">
//                                 {[
//                                     { id: 'overall', label: 'Overall' },
//                                     { id: 'qa1', label: 'QA1' },
//                                     { id: 'qa2', label: 'QA2' },
//                                     { id: 'endOfTerm', label: 'End Term' }
//                                 ].map(type => (
//                                     <button
//                                         key={type.id}
//                                         onClick={() => setActiveAssessmentType(type.id as any)}
//                                         className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeAssessmentType === type.id
//                                             ? 'bg-indigo-600 text-white'
//                                             : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
//                                             }`}
//                                     >
//                                         {type.label}
//                                     </button>
//                                 ))}
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {resultsLoading ? (
//                     <div className="text-center py-12">
//                         <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
//                         <p className="text-slate-600">Loading results...</p>
//                     </div>
//                 ) : selectedClassForResults && classResults.length > 0 ? (
//                     <div className="space-y-8">
//                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                             <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-indigo-700 font-medium">Class Average</p>
//                                         <p className="text-2xl font-bold text-indigo-800 mt-1">
//                                             {metrics.classAverage.toFixed(1)}%
//                                         </p>
//                                         <p className="text-xs text-indigo-600 mt-1">
//                                             {activeAssessmentType.toUpperCase()}
//                                         </p>
//                                     </div>
//                                     <TrendingUp className="w-8 h-8 text-indigo-600 opacity-50" />
//                                 </div>
//                             </div>

//                             <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-emerald-700 font-medium">Top Performer</p>
//                                         <p className="text-lg font-bold text-emerald-800 mt-1">
//                                             {metrics.topPerformerName}
//                                         </p>
//                                         <p className="text-xs text-emerald-600 mt-1">
//                                             Score: {metrics.topPerformerScore.toFixed(1)}%
//                                         </p>
//                                     </div>
//                                     <Award className="w-8 h-8 text-emerald-600 opacity-50" />
//                                 </div>
//                             </div>

//                             <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-amber-700 font-medium">Pass Rate</p>
//                                         <p className="text-2xl font-bold text-amber-800 mt-1">
//                                             {Math.round(metrics.passRate)}%
//                                         </p>
//                                         <p className="text-xs text-amber-600 mt-1">
//                                             {metrics.passedCount} passed / {metrics.failedCount} failed
//                                         </p>
//                                     </div>
//                                     <CheckCircle className="w-8 h-8 text-amber-600 opacity-50" />
//                                 </div>
//                             </div>

//                             <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-slate-700 font-medium">Students with Scores</p>
//                                         <p className="text-2xl font-bold text-slate-800 mt-1">
//                                             {metrics.studentsWithScoresRatio}
//                                         </p>
//                                         <p className="text-xs text-slate-600 mt-1">
//                                             {activeAssessmentType.toUpperCase()} scores entered
//                                         </p>
//                                     </div>
//                                     <Users className="w-8 h-8 text-slate-600 opacity-50" />
//                                 </div>
//                             </div>
//                         </div>

//                         <div ref={tableRef} className="bg-white p-1">

//                             <ClassResultsTable
//                                 classResults={classResults}
//                                 subjects={subjects}
//                                 activeAssessmentType={activeAssessmentType}
//                                 activeConfig={activeConfig}
//                                 calculateGrade={calculateGrade}
//                                 onPrint={handlePrint}
//                                 onExport={handleExport}
//                                 isDownloading={isDownloading}
//                             />
//                         </div>
//                     </div>
//                 ) : selectedClassForResults ? (
//                     <div className="text-center py-12 bg-slate-50 rounded-xl">
//                         <p className="text-slate-500">No results found for this class. Enter student results first.</p>
//                     </div>
//                 ) : (
//                     <div className="text-center py-12 bg-slate-50 rounded-xl">
//                         <p className="text-slate-500">Select a class to view results</p>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default ClassResultsManagement;

// import React, { useMemo, useRef, useState } from 'react';
// // NEW CODE: Removed html2canvas, added jspdf-autotable
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import { TrendingUp, Award, CheckCircle, Users, Printer, Download, Loader2 } from 'lucide-react';
// import { SubjectRecord } from '@/services/studentService';
// import { GradeConfiguration } from '@/services/gradeConfigService';
// import { ClassResultStudent, Student } from '@/types/admin';
// import ClassResultsTable from './tables/ClassResultsTable';

// interface ClassResultsManagementProps {
//     classes: any[];
//     subjects: SubjectRecord[];
//     classResults: ClassResultStudent[];
//     students: Student[];
//     selectedClassForResults: string;
//     activeAssessmentType: 'qa1' | 'qa2' | 'endOfTerm' | 'overall';
//     resultsLoading: boolean;
//     activeConfig: GradeConfiguration | null;
//     setSelectedClassForResults: (classId: string) => void;
//     setActiveAssessmentType: (type: 'qa1' | 'qa2' | 'endOfTerm' | 'overall') => void;
//     loadClassResults: (classId: string) => Promise<void>;
//     calculateGrade: (score: number, passMark?: number) => string;
//     isTeacherView?: boolean;
// }

// const ClassResultsManagement: React.FC<ClassResultsManagementProps> = ({
//     classes,
//     subjects,
//     classResults,
//     students,
//     selectedClassForResults,
//     activeAssessmentType,
//     resultsLoading,
//     activeConfig,
//     setSelectedClassForResults,
//     setActiveAssessmentType,
//     loadClassResults,
//     calculateGrade,
// }) => {

//     const tableRef = useRef<HTMLDivElement>(null);
//     const [isDownloading, setIsDownloading] = useState(false);

//     const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//         const classId = e.target.value;
//         setSelectedClassForResults(classId);
//         if (classId) {
//             loadClassResults(classId);
//         }
//     };

//     const handlePrint = () => {
//         window.print();
//     };

//     // NEW CODE: Fully implemented PDF generation using jspdf-autotable
//     // This replaces the html2canvas logic to fix the 'screenshot' issues
//     const handleExport = () => {
//         setIsDownloading(true);

//         try {
//             const doc = new jsPDF('l', 'mm', 'a4'); // Landscape A4

//             // 1. Get Class Name for Title
//             const className = classes.find(c => c.id === selectedClassForResults)?.name || 'Class';
//             const termName = classes.find(c => c.id === selectedClassForResults)?.term || '';
//             const title = `${className} - ${termName} - Results (${activeAssessmentType.toUpperCase()})`;

//             // 2. Define Table Headers
//             // First column is Name, then dynamic Subject columns, then aggregates
//             const tableHead = [
//                 'Student Name',
//                 ...subjects.map(s => s.name), // Dynamic Subject Headers
//                 'Average',
//                 'Grade',
//                 'Status'
//             ];

//             // 3. Prepare Table Body Data
//             // We map over enhancedClassResults to get the exact data currently shown in your logic
//             const tableBody = enhancedClassResults.map((student) => {
//                 // Get name
//                 const studentName = student.name;

//                 // Get Subject Scores dynamically based on activeAssessmentType
//                 const subjectScores = subjects.map((subj) => {
//                     // FIX: We find the student's specific subject record by matching ID or Name
//                     // This fixes the "Property id does not exist" error by checking existence safely
//                     const studentSubject = student.subjects?.find((s: any) =>
//                         (s.subjectId && s.subjectId === subj.id) ||
//                         (s.name && s.name === subj.name)
//                     );

//                     if (!studentSubject) return '-';

//                     // Get the score based on the active tab
//                     let score = 0;
//                     switch (activeAssessmentType) {
//                         case 'qa1': score = studentSubject.qa1; break;
//                         case 'qa2': score = studentSubject.qa2; break;
//                         case 'endOfTerm': score = studentSubject.endOfTerm; break;
//                         case 'overall':
//                             // If overall, we might want the calculated average for that subject
//                             // Or default to endOfTerm if that's your logic.
//                             // Based on your code, let's use the stored score if available.
//                             score = studentSubject.endOfTerm;
//                             break;
//                     }

//                     return score > 0 ? score.toString() : '-';
//                 });

//                 // Get Aggregates (calculated in your useMemo)
//                 const average = typeof student.calculatedAverage === 'number'
//                     ? student.calculatedAverage.toFixed(1) + '%'
//                     : '0%';

//                 const grade = student.calculatedGrade || '-';
//                 const status = student.calculatedStatus || '-';

//                 return [
//                     studentName,
//                     ...subjectScores,
//                     average,
//                     grade,
//                     status
//                 ];
//             });

//             // 4. Generate the Table
//             autoTable(doc, {
//                 head: [tableHead],
//                 body: tableBody,
//                 startY: 20,
//                 styles: { fontSize: 8 },
//                 headStyles: { fillColor: [63, 81, 181] }, // Indigo color to match your theme
//                 didDrawPage: (data) => {
//                     // Header Title on every page
//                     doc.setFontSize(14);
//                     doc.text(title, 14, 15);
//                 }
//             });

//             // 5. Save
//             const filename = `${className}_Results_${activeAssessmentType}.pdf`;
//             doc.save(filename);

//         } catch (error) {
//             console.error('Error generating PDF:', error);
//             alert('Failed to download PDF');
//         } finally {
//             setIsDownloading(false);
//         }
//     };
//     // END NEW CODE

//     // Calculate average from subjects for each assessment type - MATCHES BACKEND LOGIC
//     const calculateSubjectAverage = (student: any, type: 'qa1' | 'qa2' | 'endOfTerm') => {
//         if (!student.subjects || !Array.isArray(student.subjects) || student.subjects.length === 0) {
//             return 0;
//         }

//         // Filter subjects with scores > 0 for the specific assessment type
//         const validSubjects = student.subjects.filter((subject: any) =>
//             subject[type] !== undefined && subject[type] !== null && subject[type] > 0
//         );

//         if (validSubjects.length === 0) return 0;

//         // Sum all scores for this assessment type and divide by number of subjects with scores
//         const total = validSubjects.reduce((sum: number, subject: any) => sum + subject[type], 0);
//         return total / validSubjects.length;
//     };

//     // Check if student has scores for the active assessment type
//     const hasScoresForAssessment = (student: any): boolean => {
//         if (!student.subjects || !Array.isArray(student.subjects)) {
//             return false;
//         }

//         switch (activeAssessmentType) {
//             case 'overall':
//                 // For overall, check if student has any scores in any subject
//                 return student.subjects.some((subject: any) =>
//                     subject.qa1 > 0 || subject.qa2 > 0 || subject.endOfTerm > 0
//                 );
//             case 'qa1':
//                 // For QA1, check if student has QA1 scores
//                 return student.subjects.some((subject: any) => subject.qa1 > 0);
//             case 'qa2':
//                 // For QA2, check if student has QA2 scores
//                 return student.subjects.some((subject: any) => subject.qa2 > 0);
//             case 'endOfTerm':
//                 // For End Term, check if student has End Term scores
//                 return student.subjects.some((subject: any) => subject.endOfTerm > 0);
//             default:
//                 return false;
//         }
//     };

//     // Count students with scores for the active assessment type
//     const countStudentsWithScores = () => {
//         if (!classResults.length) return 0;

//         return classResults.filter(student => hasScoresForAssessment(student)).length;
//     };

//     // Get total students in the selected class from ALL students array
//     const getTotalStudentsInClass = () => {
//         if (!selectedClassForResults) return 0;

//         // Filter all students to find those in this class (same as ClassesManagement component)
//         return students.filter(student => student.class?.id === selectedClassForResults).length;
//     };

//     // Enhance classResults with calculated metrics for each assessment type
//     const enhancedClassResults = useMemo(() => {
//         return classResults.map(student => {
//             let average = 0;
//             let grade = 'F';
//             let status = 'Failed';

//             switch (activeAssessmentType) {
//                 case 'overall':
//                     average = student.average || 0;
//                     grade = student.overallGrade || 'F';
//                     status = grade === 'F' ? 'Failed' : 'Passed';
//                     break;
//                 case 'qa1':
//                     average = calculateSubjectAverage(student, 'qa1');
//                     grade = calculateGrade(average, activeConfig?.pass_mark);
//                     status = grade === 'F' ? 'Failed' : 'Passed';
//                     break;
//                 case 'qa2':
//                     average = calculateSubjectAverage(student, 'qa2');
//                     grade = calculateGrade(average, activeConfig?.pass_mark);
//                     status = grade === 'F' ? 'Failed' : 'Passed';
//                     break;
//                 case 'endOfTerm':
//                     average = calculateSubjectAverage(student, 'endOfTerm');
//                     grade = calculateGrade(average, activeConfig?.pass_mark);
//                     status = grade === 'F' ? 'Failed' : 'Passed';
//                     break;
//             }

//             return {
//                 ...student,
//                 calculatedAverage: average,
//                 calculatedGrade: grade,
//                 calculatedStatus: status
//             };
//         });
//     }, [classResults, activeAssessmentType, calculateGrade, activeConfig]);

//     // Calculate dynamic metrics based on activeAssessmentType
//     const metrics = useMemo(() => {
//         const totalStudentsInClass = getTotalStudentsInClass();

//         if (!selectedClassForResults || totalStudentsInClass === 0) {
//             return {
//                 classAverage: 0,
//                 topPerformerName: 'N/A',
//                 topPerformerScore: 0,
//                 passRate: 0,
//                 totalStudents: totalStudentsInClass,
//                 studentsWithScores: 0,
//                 studentsWithScoresRatio: `0/${totalStudentsInClass}`,
//                 passedCount: 0,
//                 failedCount: 0
//             };
//         }

//         let totalScore = 0;
//         let topScore = -1;
//         let topPerformerName = 'N/A';
//         let topPerformerScore = 0;
//         let passedCount = 0;
//         let failedCount = 0;
//         let studentsWithScoresCount = 0;

//         // Process ALL students in the class
//         enhancedClassResults.forEach(student => {
//             const studentScore = student.calculatedAverage;
//             const studentGrade = student.calculatedGrade;
//             const hasScores = studentScore > 0;

//             // Only include in average calculation if they have scores
//             if (hasScores) {
//                 totalScore += studentScore;
//                 studentsWithScoresCount++;

//                 // Track top performer (only among those with scores)
//                 if (studentScore > topScore) {
//                     topScore = studentScore;
//                     topPerformerName = student.name || 'N/A';
//                     topPerformerScore = studentScore;
//                 }
//             }

//             // Count ALL students for pass/fail (including those without scores)
//             // Students without scores get 'F' grade from calculateGrade(0)
//             if (studentGrade !== 'F') {
//                 passedCount++;
//             } else {
//                 failedCount++;
//             }
//         });

//         const classAverage = studentsWithScoresCount > 0 ? totalScore / studentsWithScoresCount : 0;
//         const passRate = totalStudentsInClass > 0 ? (passedCount / totalStudentsInClass) * 100 : 0;
//         const studentsWithScoresRatio = `${studentsWithScoresCount}/${totalStudentsInClass}`;

//         return {
//             classAverage,
//             topPerformerName,
//             topPerformerScore,
//             passRate,
//             totalStudents: totalStudentsInClass,
//             studentsWithScores: studentsWithScoresCount,
//             studentsWithScoresRatio,
//             passedCount,
//             failedCount
//         };
//     }, [enhancedClassResults, activeAssessmentType, students, selectedClassForResults]);

//     return (
//         <div className="space-y-6">
//             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
//                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
//                     <div>
//                         <h2 className="text-lg font-semibold text-slate-800">Class Results & Rankings</h2>
//                         <p className="text-sm text-slate-500 mt-1">
//                             View all students' results in each class, ranked by performance
//                         </p>
//                     </div>

//                     <div className="flex flex-wrap gap-4">
//                         <div className="min-w-[200px]">
//                             <label className="block text-sm font-medium text-slate-700 mb-1">Select Class</label>
//                             <select
//                                 value={selectedClassForResults}
//                                 onChange={handleClassChange}
//                                 className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                             >
//                                 <option value="">Select a class</option>
//                                 {classes.map(cls => (
//                                     <option key={cls.id} value={cls.id}>
//                                         {cls.name} - {cls.term} ({cls.academic_year})
//                                     </option>
//                                 ))}
//                             </select>
//                         </div>

//                         <div>
//                             <label className="block text-sm font-medium text-slate-700 mb-1">View Results For</label>
//                             <div className="flex gap-2">
//                                 {[
//                                     { id: 'overall', label: 'Overall' },
//                                     { id: 'qa1', label: 'QA1' },
//                                     { id: 'qa2', label: 'QA2' },
//                                     { id: 'endOfTerm', label: 'End Term' }
//                                 ].map(type => (
//                                     <button
//                                         key={type.id}
//                                         onClick={() => setActiveAssessmentType(type.id as any)}
//                                         className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeAssessmentType === type.id
//                                             ? 'bg-indigo-600 text-white'
//                                             : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
//                                             }`}
//                                     >
//                                         {type.label}
//                                     </button>
//                                 ))}
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {resultsLoading ? (
//                     <div className="text-center py-12">
//                         <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
//                         <p className="text-slate-600">Loading results...</p>
//                     </div>
//                 ) : selectedClassForResults && classResults.length > 0 ? (
//                     <div className="space-y-8">
//                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                             <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-indigo-700 font-medium">Class Average</p>
//                                         <p className="text-2xl font-bold text-indigo-800 mt-1">
//                                             {metrics.classAverage.toFixed(1)}%
//                                         </p>
//                                         <p className="text-xs text-indigo-600 mt-1">
//                                             {activeAssessmentType.toUpperCase()}
//                                         </p>
//                                     </div>
//                                     <TrendingUp className="w-8 h-8 text-indigo-600 opacity-50" />
//                                 </div>
//                             </div>

//                             <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-emerald-700 font-medium">Top Performer</p>
//                                         <p className="text-lg font-bold text-emerald-800 mt-1">
//                                             {metrics.topPerformerName}
//                                         </p>
//                                         <p className="text-xs text-emerald-600 mt-1">
//                                             Score: {metrics.topPerformerScore.toFixed(1)}%
//                                         </p>
//                                     </div>
//                                     <Award className="w-8 h-8 text-emerald-600 opacity-50" />
//                                 </div>
//                             </div>

//                             <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-amber-700 font-medium">Pass Rate</p>
//                                         <p className="text-2xl font-bold text-amber-800 mt-1">
//                                             {Math.round(metrics.passRate)}%
//                                         </p>
//                                         <p className="text-xs text-amber-600 mt-1">
//                                             {metrics.passedCount} passed / {metrics.failedCount} failed
//                                         </p>
//                                         <p className="text-xs text-amber-600 mt-1">
//                                             {activeAssessmentType.toUpperCase()}
//                                         </p>
//                                     </div>
//                                     <CheckCircle className="w-8 h-8 text-amber-600 opacity-50" />
//                                 </div>
//                             </div>

//                             <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-slate-700 font-medium">Students with Scores</p>
//                                         <p className="text-2xl font-bold text-slate-800 mt-1">
//                                             {metrics.studentsWithScoresRatio}
//                                         </p>
//                                         <p className="text-xs text-slate-600 mt-1">
//                                             {activeAssessmentType.toUpperCase()} scores entered
//                                         </p>
//                                     </div>
//                                     <Users className="w-8 h-8 text-slate-600 opacity-50" />
//                                 </div>
//                             </div>
//                         </div>

//                         <div ref={tableRef} className="bg-white p-1">

//                             <ClassResultsTable
//                                 classResults={enhancedClassResults}
//                                 subjects={subjects}
//                                 activeAssessmentType={activeAssessmentType}
//                                 activeConfig={activeConfig}
//                                 calculateGrade={calculateGrade}
//                                 onPrint={handlePrint}
//                                 onExport={handleExport}
//                                 isDownloading={isDownloading}

//                             />
//                         </div>
//                     </div>
//                 ) : selectedClassForResults ? (
//                     <div className="text-center py-12 bg-slate-50 rounded-xl">
//                         <p className="text-slate-500">No results found for this class. Enter student results first.</p>
//                     </div>
//                 ) : (
//                     <div className="text-center py-12 bg-slate-50 rounded-xl">
//                         <p className="text-slate-500">Select a class to view results</p>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default ClassResultsManagement;

// import React, { useMemo, useRef, useState } from 'react';
// import html2canvas from 'html2canvas'; // Added
// import jsPDF from 'jspdf'; // Added
// import { TrendingUp, Award, CheckCircle, Users, Printer, Download, Loader2 } from 'lucide-react';
// import { SubjectRecord } from '@/services/studentService';
// import { GradeConfiguration } from '@/services/gradeConfigService';
// import { ClassResultStudent, Student } from '@/types/admin';
// import ClassResultsTable from './tables/ClassResultsTable';

// interface ClassResultsManagementProps {
//     classes: any[];
//     subjects: SubjectRecord[];
//     classResults: ClassResultStudent[];
//     students: Student[];
//     selectedClassForResults: string;
//     activeAssessmentType: 'qa1' | 'qa2' | 'endOfTerm' | 'overall';
//     resultsLoading: boolean;
//     activeConfig: GradeConfiguration | null;
//     setSelectedClassForResults: (classId: string) => void;
//     setActiveAssessmentType: (type: 'qa1' | 'qa2' | 'endOfTerm' | 'overall') => void;
//     loadClassResults: (classId: string) => Promise<void>;
//     calculateGrade: (score: number, passMark?: number) => string;
//     isTeacherView?: boolean;
// }

// const ClassResultsManagement: React.FC<ClassResultsManagementProps> = ({
//     classes,
//     subjects,
//     classResults,
//     students,
//     selectedClassForResults,
//     activeAssessmentType,
//     resultsLoading,
//     activeConfig,
//     setSelectedClassForResults,
//     setActiveAssessmentType,
//     loadClassResults,
//     calculateGrade,
// }) => {
//     // CHANGE 2: Add Ref and Loading State
//     const tableRef = useRef<HTMLDivElement>(null);
//     const [isDownloading, setIsDownloading] = useState(false);

//     const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//         const classId = e.target.value;
//         setSelectedClassForResults(classId);
//         if (classId) {
//             loadClassResults(classId);
//         }
//     };

//     const handlePrint = () => {
//         window.print();
//     };

//     // const handleExport = () => {
//     //     console.log('Exporting PDF...');
//     // };

//     // CHANGE 3: Replace handleExport with full PDF generation logic
//     const handleExport = async () => {
//         if (!tableRef.current) return;

//         setIsDownloading(true);
//         // Wait for button UI to update
//         await new Promise(resolve => setTimeout(resolve, 100));

//         try {
//             const content = tableRef.current;

//             // Capture the table
//             const canvas = await html2canvas(content, {
//                 scale: 2, // High resolution
//                 useCORS: true,
//                 logging: false,
//                 backgroundColor: '#ffffff'
//             });

//             const imgData = canvas.toDataURL('image/png');

//             // Use 'l' for Landscape (better for wide tables)
//             const pdf = new jsPDF('l', 'mm', 'a4');
//             const pdfWidth = 297; // A4 Landscape width
//             const pdfHeight = 210; // A4 Landscape height

//             const imgProps = pdf.getImageProperties(imgData);
//             const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

//             // Add image to PDF
//             pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);

//             // Generate filename based on class and assessment
//             const className = classes.find(c => c.id === selectedClassForResults)?.name || 'Class';
//             const filename = `${className}_Results_${activeAssessmentType}.pdf`;

//             pdf.save(filename);

//         } catch (error) {
//             console.error('Error generating PDF:', error);
//             alert('Failed to download PDF');
//         } finally {
//             setIsDownloading(false);
//         }
//     };

//     // Calculate average from subjects for each assessment type - MATCHES BACKEND LOGIC
//     const calculateSubjectAverage = (student: any, type: 'qa1' | 'qa2' | 'endOfTerm') => {
//         if (!student.subjects || !Array.isArray(student.subjects) || student.subjects.length === 0) {
//             return 0;
//         }

//         // Filter subjects with scores > 0 for the specific assessment type
//         const validSubjects = student.subjects.filter((subject: any) =>
//             subject[type] !== undefined && subject[type] !== null && subject[type] > 0
//         );

//         if (validSubjects.length === 0) return 0;

//         // Sum all scores for this assessment type and divide by number of subjects with scores
//         const total = validSubjects.reduce((sum: number, subject: any) => sum + subject[type], 0);
//         return total / validSubjects.length;
//     };

//     // Check if student has scores for the active assessment type
//     const hasScoresForAssessment = (student: any): boolean => {
//         if (!student.subjects || !Array.isArray(student.subjects)) {
//             return false;
//         }

//         switch (activeAssessmentType) {
//             case 'overall':
//                 // For overall, check if student has any scores in any subject
//                 return student.subjects.some((subject: any) =>
//                     subject.qa1 > 0 || subject.qa2 > 0 || subject.endOfTerm > 0
//                 );
//             case 'qa1':
//                 // For QA1, check if student has QA1 scores
//                 return student.subjects.some((subject: any) => subject.qa1 > 0);
//             case 'qa2':
//                 // For QA2, check if student has QA2 scores
//                 return student.subjects.some((subject: any) => subject.qa2 > 0);
//             case 'endOfTerm':
//                 // For End Term, check if student has End Term scores
//                 return student.subjects.some((subject: any) => subject.endOfTerm > 0);
//             default:
//                 return false;
//         }
//     };

//     // Count students with scores for the active assessment type
//     const countStudentsWithScores = () => {
//         if (!classResults.length) return 0;

//         return classResults.filter(student => hasScoresForAssessment(student)).length;
//     };

//     // Get total students in the selected class from ALL students array
//     const getTotalStudentsInClass = () => {
//         if (!selectedClassForResults) return 0;

//         // Filter all students to find those in this class (same as ClassesManagement component)
//         return students.filter(student => student.class?.id === selectedClassForResults).length;
//     };

//     // Enhance classResults with calculated metrics for each assessment type
//     const enhancedClassResults = useMemo(() => {
//         return classResults.map(student => {
//             let average = 0;
//             let grade = 'F';
//             let status = 'Failed';

//             switch (activeAssessmentType) {
//                 case 'overall':
//                     average = student.average || 0;
//                     grade = student.overallGrade || 'F';
//                     status = grade === 'F' ? 'Failed' : 'Passed';
//                     break;
//                 case 'qa1':
//                     average = calculateSubjectAverage(student, 'qa1');
//                     grade = calculateGrade(average, activeConfig?.pass_mark);
//                     status = grade === 'F' ? 'Failed' : 'Passed';
//                     break;
//                 case 'qa2':
//                     average = calculateSubjectAverage(student, 'qa2');
//                     grade = calculateGrade(average, activeConfig?.pass_mark);
//                     status = grade === 'F' ? 'Failed' : 'Passed';
//                     break;
//                 case 'endOfTerm':
//                     average = calculateSubjectAverage(student, 'endOfTerm');
//                     grade = calculateGrade(average, activeConfig?.pass_mark);
//                     status = grade === 'F' ? 'Failed' : 'Passed';
//                     break;
//             }

//             return {
//                 ...student,
//                 calculatedAverage: average,
//                 calculatedGrade: grade,
//                 calculatedStatus: status
//             };
//         });
//     }, [classResults, activeAssessmentType, calculateGrade, activeConfig]);

//     // // Calculate dynamic metrics based on activeAssessmentType
//     // const metrics = useMemo(() => {
//     //     const totalStudentsInClass = getTotalStudentsInClass();
//     //     const studentsWithScoresCount = countStudentsWithScores();

//     //     if (!classResults.length) {
//     //         return {
//     //             classAverage: 0,
//     //             topPerformerName: 'N/A',
//     //             topPerformerScore: 0,
//     //             passRate: 0,
//     //             totalStudents: totalStudentsInClass,
//     //             studentsWithScores: 0,
//     //             studentsWithScoresRatio: `0/${totalStudentsInClass}`,
//     //             passedCount: 0,
//     //             failedCount: 0
//     //         };
//     //     }

//     //     let totalScore = 0;
//     //     let topScore = -1;
//     //     let topPerformerName = 'N/A';
//     //     let topPerformerScore = 0;
//     //     let passedCount = 0;
//     //     let failedCount = 0;

//     //     classResults.forEach(student => {
//     //         let studentScore = 0;
//     //         let studentGrade = 'F';
//     //         let hasScores = false;

//     //         // Get score and grade based on activeAssessmentType - MATCHES BACKEND
//     //         switch (activeAssessmentType) {
//     //             case 'overall':
//     //                 // Use the average already calculated by backend
//     //                 studentScore = student.average || 0;
//     //                 studentGrade = student.overallGrade || 'F';
//     //                 hasScores = student.subjects?.some((subject: any) =>
//     //                     subject.qa1 > 0 || subject.qa2 > 0 || subject.endOfTerm > 0
//     //                 ) || false;
//     //                 break;
//     //             case 'qa1':
//     //                 // Calculate QA1 average from subjects
//     //                 studentScore = calculateSubjectAverage(student, 'qa1');
//     //                 studentGrade = calculateGrade(studentScore, activeConfig?.pass_mark);
//     //                 hasScores = student.subjects?.some((subject: any) => subject.qa1 > 0) || false;
//     //                 break;
//     //             case 'qa2':
//     //                 // Calculate QA2 average from subjects
//     //                 studentScore = calculateSubjectAverage(student, 'qa2');
//     //                 studentGrade = calculateGrade(studentScore, activeConfig?.pass_mark);
//     //                 hasScores = student.subjects?.some((subject: any) => subject.qa2 > 0) || false;
//     //                 break;
//     //             case 'endOfTerm':
//     //                 // Calculate End Term average from subjects
//     //                 studentScore = calculateSubjectAverage(student, 'endOfTerm');
//     //                 studentGrade = calculateGrade(studentScore, activeConfig?.pass_mark);
//     //                 hasScores = student.subjects?.some((subject: any) => subject.endOfTerm > 0) || false;
//     //                 break;
//     //         }

//     //         if (hasScores) {
//     //             totalScore += studentScore;
//     //         }

//     //         if (studentScore > topScore && hasScores) {
//     //             topScore = studentScore;
//     //             topPerformerName = student.name || 'N/A';
//     //             topPerformerScore = studentScore;
//     //         }

//     //         if (hasScores) {
//     //             if (studentGrade !== 'F') {
//     //                 passedCount++;
//     //             } else {
//     //                 failedCount++;
//     //             }
//     //         }
//     //     });

//     //     const classAverage = studentsWithScoresCount > 0 ? totalScore / studentsWithScoresCount : 0;
//     //     const passRate = studentsWithScoresCount > 0 ? (passedCount / studentsWithScoresCount) * 100 : 0;
//     //     const studentsWithScoresRatio = `${studentsWithScoresCount}/${totalStudentsInClass}`;

//     //     return {
//     //         classAverage,
//     //         topPerformerName,
//     //         topPerformerScore,
//     //         passRate,
//     //         totalStudents: totalStudentsInClass,
//     //         studentsWithScores: studentsWithScoresCount,
//     //         studentsWithScoresRatio,
//     //         passedCount,
//     //         failedCount
//     //     };
//     // }, [classResults, activeAssessmentType, calculateGrade, activeConfig, students, selectedClassForResults]);

//     // Calculate dynamic metrics based on activeAssessmentType
//     const metrics = useMemo(() => {
//         const totalStudentsInClass = getTotalStudentsInClass();

//         if (!selectedClassForResults || totalStudentsInClass === 0) {
//             return {
//                 classAverage: 0,
//                 topPerformerName: 'N/A',
//                 topPerformerScore: 0,
//                 passRate: 0,
//                 totalStudents: totalStudentsInClass,
//                 studentsWithScores: 0,
//                 studentsWithScoresRatio: `0/${totalStudentsInClass}`,
//                 passedCount: 0,
//                 failedCount: 0
//             };
//         }

//         let totalScore = 0;
//         let topScore = -1;
//         let topPerformerName = 'N/A';
//         let topPerformerScore = 0;
//         let passedCount = 0;
//         let failedCount = 0;
//         let studentsWithScoresCount = 0;

//         // Process ALL students in the class
//         enhancedClassResults.forEach(student => {
//             const studentScore = student.calculatedAverage;
//             const studentGrade = student.calculatedGrade;
//             const hasScores = studentScore > 0;

//             // Only include in average calculation if they have scores
//             if (hasScores) {
//                 totalScore += studentScore;
//                 studentsWithScoresCount++;

//                 // Track top performer (only among those with scores)
//                 if (studentScore > topScore) {
//                     topScore = studentScore;
//                     topPerformerName = student.name || 'N/A';
//                     topPerformerScore = studentScore;
//                 }
//             }

//             // Count ALL students for pass/fail (including those without scores)
//             // Students without scores get 'F' grade from calculateGrade(0)
//             if (studentGrade !== 'F') {
//                 passedCount++;
//             } else {
//                 failedCount++;
//             }
//         });

//         const classAverage = studentsWithScoresCount > 0 ? totalScore / studentsWithScoresCount : 0;
//         const passRate = totalStudentsInClass > 0 ? (passedCount / totalStudentsInClass) * 100 : 0;
//         const studentsWithScoresRatio = `${studentsWithScoresCount}/${totalStudentsInClass}`;

//         return {
//             classAverage,
//             topPerformerName,
//             topPerformerScore,
//             passRate,
//             totalStudents: totalStudentsInClass,
//             studentsWithScores: studentsWithScoresCount,
//             studentsWithScoresRatio,
//             passedCount,
//             failedCount
//         };
//     }, [enhancedClassResults, activeAssessmentType, students, selectedClassForResults]);

//     return (
//         <div className="space-y-6">
//             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
//                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
//                     <div>
//                         <h2 className="text-lg font-semibold text-slate-800">Class Results & Rankings</h2>
//                         <p className="text-sm text-slate-500 mt-1">
//                             View all students' results in each class, ranked by performance
//                         </p>
//                     </div>

//                     <div className="flex flex-wrap gap-4">
//                         <div className="min-w-[200px]">
//                             <label className="block text-sm font-medium text-slate-700 mb-1">Select Class</label>
//                             <select
//                                 value={selectedClassForResults}
//                                 onChange={handleClassChange}
//                                 className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                             >
//                                 <option value="">Select a class</option>
//                                 {classes.map(cls => (
//                                     <option key={cls.id} value={cls.id}>
//                                         {cls.name} - {cls.term} ({cls.academic_year})
//                                     </option>
//                                 ))}
//                             </select>
//                         </div>

//                         <div>
//                             <label className="block text-sm font-medium text-slate-700 mb-1">View Results For</label>
//                             <div className="flex gap-2">
//                                 {[
//                                     { id: 'overall', label: 'Overall' },
//                                     { id: 'qa1', label: 'QA1' },
//                                     { id: 'qa2', label: 'QA2' },
//                                     { id: 'endOfTerm', label: 'End Term' }
//                                 ].map(type => (
//                                     <button
//                                         key={type.id}
//                                         onClick={() => setActiveAssessmentType(type.id as any)}
//                                         className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeAssessmentType === type.id
//                                             ? 'bg-indigo-600 text-white'
//                                             : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
//                                             }`}
//                                     >
//                                         {type.label}
//                                     </button>
//                                 ))}
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {resultsLoading ? (
//                     <div className="text-center py-12">
//                         <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
//                         <p className="text-slate-600">Loading results...</p>
//                     </div>
//                 ) : selectedClassForResults && classResults.length > 0 ? (
//                     <div className="space-y-8">
//                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                             <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-indigo-700 font-medium">Class Average</p>
//                                         <p className="text-2xl font-bold text-indigo-800 mt-1">
//                                             {metrics.classAverage.toFixed(1)}%
//                                         </p>
//                                         <p className="text-xs text-indigo-600 mt-1">
//                                             {activeAssessmentType.toUpperCase()}
//                                         </p>
//                                     </div>
//                                     <TrendingUp className="w-8 h-8 text-indigo-600 opacity-50" />
//                                 </div>
//                             </div>

//                             <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-emerald-700 font-medium">Top Performer</p>
//                                         <p className="text-lg font-bold text-emerald-800 mt-1">
//                                             {metrics.topPerformerName}
//                                         </p>
//                                         <p className="text-xs text-emerald-600 mt-1">
//                                             Score: {metrics.topPerformerScore.toFixed(1)}%
//                                         </p>
//                                     </div>
//                                     <Award className="w-8 h-8 text-emerald-600 opacity-50" />
//                                 </div>
//                             </div>

//                             <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-amber-700 font-medium">Pass Rate</p>
//                                         <p className="text-2xl font-bold text-amber-800 mt-1">
//                                             {Math.round(metrics.passRate)}%
//                                         </p>
//                                         <p className="text-xs text-amber-600 mt-1">
//                                             {metrics.passedCount} passed / {metrics.failedCount} failed
//                                         </p>
//                                         <p className="text-xs text-amber-600 mt-1">
//                                             {activeAssessmentType.toUpperCase()}
//                                         </p>
//                                     </div>
//                                     <CheckCircle className="w-8 h-8 text-amber-600 opacity-50" />
//                                 </div>
//                             </div>

//                             <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-slate-700 font-medium">Students with Scores</p>
//                                         <p className="text-2xl font-bold text-slate-800 mt-1">
//                                             {metrics.studentsWithScoresRatio}
//                                         </p>
//                                         <p className="text-xs text-slate-600 mt-1">
//                                             {activeAssessmentType.toUpperCase()} scores entered
//                                         </p>
//                                     </div>
//                                     <Users className="w-8 h-8 text-slate-600 opacity-50" />
//                                 </div>
//                             </div>
//                         </div>

//                         <div ref={tableRef} className="bg-white p-1">

//                             <ClassResultsTable
//                                 classResults={enhancedClassResults}
//                                 subjects={subjects}
//                                 activeAssessmentType={activeAssessmentType}
//                                 activeConfig={activeConfig}
//                                 calculateGrade={calculateGrade}
//                                 onPrint={handlePrint}
//                                 onExport={handleExport}
//                                 isDownloading={isDownloading}

//                             />
//                         </div> {/* <--- CLOSE THE DIV HERE */}
//                     </div>
//                 ) : selectedClassForResults ? (
//                     <div className="text-center py-12 bg-slate-50 rounded-xl">
//                         <p className="text-slate-500">No results found for this class. Enter student results first.</p>
//                     </div>
//                 ) : (
//                     <div className="text-center py-12 bg-slate-50 rounded-xl">
//                         <p className="text-slate-500">Select a class to view results</p>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default ClassResultsManagement;

// import React, { useMemo } from 'react';
// import { TrendingUp, Award, CheckCircle, Users, Printer, Download } from 'lucide-react';
// import { SubjectRecord } from '@/services/studentService';
// import { GradeConfiguration } from '@/services/gradeConfigService';
// import { ClassResultStudent, Student } from '@/types/admin'; // Import Student type
// import ClassResultsTable from './tables/ClassResultsTable';

// interface ClassResultsManagementProps {
//     classes: any[];
//     subjects: SubjectRecord[];
//     classResults: ClassResultStudent[];
//     students: Student[]; // ADD THIS - full list of all students
//     selectedClassForResults: string;
//     activeAssessmentType: 'qa1' | 'qa2' | 'endOfTerm' | 'overall';
//     resultsLoading: boolean;
//     activeConfig: GradeConfiguration | null;
//     setSelectedClassForResults: (classId: string) => void;
//     setActiveAssessmentType: (type: 'qa1' | 'qa2' | 'endOfTerm' | 'overall') => void;
//     loadClassResults: (classId: string) => Promise<void>;
//     calculateGrade: (score: number, passMark?: number) => string;
// }

// const ClassResultsManagement: React.FC<ClassResultsManagementProps> = ({
//     classes,
//     subjects,
//     classResults,
//     students, // ADD THIS
//     selectedClassForResults,
//     activeAssessmentType,
//     resultsLoading,
//     activeConfig,
//     setSelectedClassForResults,
//     setActiveAssessmentType,
//     loadClassResults,
//     calculateGrade,
// }) => {
//     const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//         const classId = e.target.value;
//         setSelectedClassForResults(classId);
//         if (classId) {
//             loadClassResults(classId);
//         }
//     };

//     const handlePrint = () => {
//         window.print();
//     };

//     const handleExport = () => {
//         console.log('Exporting PDF...');
//     };

//     // Calculate average from subjects for each assessment type - MATCHES BACKEND LOGIC
//     const calculateSubjectAverage = (student: any, type: 'qa1' | 'qa2' | 'endOfTerm') => {
//         if (!student.subjects || !Array.isArray(student.subjects) || student.subjects.length === 0) {
//             return 0;
//         }

//         // Filter subjects with scores > 0 for the specific assessment type
//         const validSubjects = student.subjects.filter((subject: any) =>
//             subject[type] !== undefined && subject[type] !== null && subject[type] > 0
//         );

//         if (validSubjects.length === 0) return 0;

//         // Sum all scores for this assessment type and divide by number of subjects with scores
//         const total = validSubjects.reduce((sum: number, subject: any) => sum + subject[type], 0);
//         return total / validSubjects.length;
//     };

//     // Check if student has scores for the active assessment type
//     const hasScoresForAssessment = (student: any): boolean => {
//         if (!student.subjects || !Array.isArray(student.subjects)) {
//             return false;
//         }

//         switch (activeAssessmentType) {
//             case 'overall':
//                 // For overall, check if student has any scores in any subject
//                 return student.subjects.some((subject: any) =>
//                     subject.qa1 > 0 || subject.qa2 > 0 || subject.endOfTerm > 0
//                 );
//             case 'qa1':
//                 // For QA1, check if student has QA1 scores
//                 return student.subjects.some((subject: any) => subject.qa1 > 0);
//             case 'qa2':
//                 // For QA2, check if student has QA2 scores
//                 return student.subjects.some((subject: any) => subject.qa2 > 0);
//             case 'endOfTerm':
//                 // For End Term, check if student has End Term scores
//                 return student.subjects.some((subject: any) => subject.endOfTerm > 0);
//             default:
//                 return false;
//         }
//     };

//     // Count students with scores for the active assessment type
//     const countStudentsWithScores = () => {
//         if (!classResults.length) return 0;

//         return classResults.filter(student => hasScoresForAssessment(student)).length;
//     };

//     // Get total students in the selected class from ALL students array
//     const getTotalStudentsInClass = () => {
//         if (!selectedClassForResults) return 0;

//         // Filter all students to find those in this class (same as ClassesManagement component)
//         return students.filter(student => student.class?.id === selectedClassForResults).length;
//     };

//     // Enhance classResults with calculated metrics for each assessment type
//     const enhancedClassResults = useMemo(() => {
//         return classResults.map(student => {
//             let average = 0;
//             let grade = 'F';
//             let status = 'Failed';

//             switch (activeAssessmentType) {
//                 case 'overall':
//                     average = student.average || 0;
//                     grade = student.overallGrade || 'F';
//                     status = grade === 'F' ? 'Failed' : 'Passed';
//                     break;
//                 case 'qa1':
//                     average = calculateSubjectAverage(student, 'qa1');
//                     grade = calculateGrade(average, activeConfig?.pass_mark);
//                     status = grade === 'F' ? 'Failed' : 'Passed';
//                     break;
//                 case 'qa2':
//                     average = calculateSubjectAverage(student, 'qa2');
//                     grade = calculateGrade(average, activeConfig?.pass_mark);
//                     status = grade === 'F' ? 'Failed' : 'Passed';
//                     break;
//                 case 'endOfTerm':
//                     average = calculateSubjectAverage(student, 'endOfTerm');
//                     grade = calculateGrade(average, activeConfig?.pass_mark);
//                     status = grade === 'F' ? 'Failed' : 'Passed';
//                     break;
//             }

//             return {
//                 ...student,
//                 calculatedAverage: average,
//                 calculatedGrade: grade,
//                 calculatedStatus: status
//             };
//         });
//     }, [classResults, activeAssessmentType, calculateGrade, activeConfig]);

//     // Calculate dynamic metrics based on activeAssessmentType
//     const metrics = useMemo(() => {
//         const totalStudentsInClass = getTotalStudentsInClass();
//         const studentsWithScoresCount = countStudentsWithScores();

//         if (!classResults.length) {
//             return {
//                 classAverage: 0,
//                 topPerformerName: 'N/A',
//                 topPerformerScore: 0,
//                 passRate: 0,
//                 totalStudents: totalStudentsInClass,
//                 studentsWithScores: 0,
//                 studentsWithScoresRatio: `0/${totalStudentsInClass}`
//             };
//         }

//         let totalScore = 0;
//         let topScore = -1;
//         let topPerformerName = 'N/A';
//         let topPerformerScore = 0;
//         let passedCount = 0;

//         classResults.forEach(student => {
//             let studentScore = 0;
//             let studentGrade = 'F';
//             let hasScores = false;

//             // Get score and grade based on activeAssessmentType - MATCHES BACKEND
//             switch (activeAssessmentType) {
//                 case 'overall':
//                     // Use the average already calculated by backend
//                     studentScore = student.average || 0;
//                     studentGrade = student.overallGrade || 'F';
//                     hasScores = student.subjects?.some((subject: any) =>
//                         subject.qa1 > 0 || subject.qa2 > 0 || subject.endOfTerm > 0
//                     ) || false;
//                     break;
//                 case 'qa1':
//                     // Calculate QA1 average from subjects
//                     studentScore = calculateSubjectAverage(student, 'qa1');
//                     studentGrade = calculateGrade(studentScore, activeConfig?.pass_mark);
//                     hasScores = student.subjects?.some((subject: any) => subject.qa1 > 0) || false;
//                     break;
//                 case 'qa2':
//                     // Calculate QA2 average from subjects
//                     studentScore = calculateSubjectAverage(student, 'qa2');
//                     studentGrade = calculateGrade(studentScore, activeConfig?.pass_mark);
//                     hasScores = student.subjects?.some((subject: any) => subject.qa2 > 0) || false;
//                     break;
//                 case 'endOfTerm':
//                     // Calculate End Term average from subjects
//                     studentScore = calculateSubjectAverage(student, 'endOfTerm');
//                     studentGrade = calculateGrade(studentScore, activeConfig?.pass_mark);
//                     hasScores = student.subjects?.some((subject: any) => subject.endOfTerm > 0) || false;
//                     break;
//             }

//             if (hasScores) {
//                 totalScore += studentScore;
//             }

//             if (studentScore > topScore && hasScores) {
//                 topScore = studentScore;
//                 topPerformerName = student.name || 'N/A';
//                 topPerformerScore = studentScore;
//             }

//             if (studentGrade !== 'F' && hasScores) {
//                 passedCount++;
//             }
//         });

//         const classAverage = studentsWithScoresCount > 0 ? totalScore / studentsWithScoresCount : 0;
//         const passRate = studentsWithScoresCount > 0 ? (passedCount / studentsWithScoresCount) * 100 : 0;
//         const studentsWithScoresRatio = `${studentsWithScoresCount}/${totalStudentsInClass}`;

//         return {
//             classAverage,
//             topPerformerName,
//             topPerformerScore,
//             passRate,
//             totalStudents: totalStudentsInClass,
//             studentsWithScores: studentsWithScoresCount,
//             studentsWithScoresRatio
//         };
//     }, [classResults, activeAssessmentType, calculateGrade, activeConfig, students, selectedClassForResults]);

//     return (
//         <div className="space-y-6">
//             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
//                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
//                     <div>
//                         <h2 className="text-lg font-semibold text-slate-800">Class Results & Rankings</h2>
//                         <p className="text-sm text-slate-500 mt-1">
//                             View all students' results in each class, ranked by performance
//                         </p>
//                     </div>

//                     <div className="flex flex-wrap gap-4">
//                         <div className="min-w-[200px]">
//                             <label className="block text-sm font-medium text-slate-700 mb-1">Select Class</label>
//                             <select
//                                 value={selectedClassForResults}
//                                 onChange={handleClassChange}
//                                 className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                             >
//                                 <option value="">Select a class</option>
//                                 {classes.map(cls => (
//                                     <option key={cls.id} value={cls.id}>
//                                         {cls.name} - {cls.term} ({cls.academic_year})
//                                     </option>
//                                 ))}
//                             </select>
//                         </div>

//                         <div>
//                             <label className="block text-sm font-medium text-slate-700 mb-1">View Results For</label>
//                             <div className="flex gap-2">
//                                 {[
//                                     { id: 'overall', label: 'Overall' },
//                                     { id: 'qa1', label: 'QA1' },
//                                     { id: 'qa2', label: 'QA2' },
//                                     { id: 'endOfTerm', label: 'End Term' }
//                                 ].map(type => (
//                                     <button
//                                         key={type.id}
//                                         onClick={() => setActiveAssessmentType(type.id as any)}
//                                         className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeAssessmentType === type.id
//                                             ? 'bg-indigo-600 text-white'
//                                             : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
//                                             }`}
//                                     >
//                                         {type.label}
//                                     </button>
//                                 ))}
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {resultsLoading ? (
//                     <div className="text-center py-12">
//                         <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
//                         <p className="text-slate-600">Loading results...</p>
//                     </div>
//                 ) : selectedClassForResults && classResults.length > 0 ? (
//                     <div className="space-y-8">
//                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                             <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-indigo-700 font-medium">Class Average</p>
//                                         <p className="text-2xl font-bold text-indigo-800 mt-1">
//                                             {metrics.classAverage.toFixed(1)}%
//                                         </p>
//                                         <p className="text-xs text-indigo-600 mt-1">
//                                             {activeAssessmentType.toUpperCase()}
//                                         </p>
//                                     </div>
//                                     <TrendingUp className="w-8 h-8 text-indigo-600 opacity-50" />
//                                 </div>
//                             </div>

//                             <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-emerald-700 font-medium">Top Performer</p>
//                                         <p className="text-lg font-bold text-emerald-800 mt-1">
//                                             {metrics.topPerformerName}
//                                         </p>
//                                         <p className="text-xs text-emerald-600 mt-1">
//                                             Score: {metrics.topPerformerScore.toFixed(1)}%
//                                         </p>
//                                     </div>
//                                     <Award className="w-8 h-8 text-emerald-600 opacity-50" />
//                                 </div>
//                             </div>

//                             <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-amber-700 font-medium">Pass Rate</p>
//                                         <p className="text-2xl font-bold text-amber-800 mt-1">
//                                             {Math.round(metrics.passRate)}%
//                                         </p>
//                                         <p className="text-xs text-amber-600 mt-1">
//                                             {activeAssessmentType.toUpperCase()}
//                                         </p>
//                                     </div>
//                                     <CheckCircle className="w-8 h-8 text-amber-600 opacity-50" />
//                                 </div>
//                             </div>

//                             <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-slate-700 font-medium">Students with Scores</p>
//                                         <p className="text-2xl font-bold text-slate-800 mt-1">
//                                             {metrics.studentsWithScoresRatio}
//                                         </p>
//                                         <p className="text-xs text-slate-600 mt-1">
//                                             {activeAssessmentType.toUpperCase()} scores entered
//                                         </p>
//                                     </div>
//                                     <Users className="w-8 h-8 text-slate-600 opacity-50" />
//                                 </div>
//                             </div>
//                         </div>

//                         <ClassResultsTable
//                             classResults={enhancedClassResults}
//                             subjects={subjects}
//                             activeAssessmentType={activeAssessmentType}
//                             activeConfig={activeConfig}
//                             calculateGrade={calculateGrade}
//                             onPrint={handlePrint}
//                             onExport={handleExport}
//                         />
//                     </div>
//                 ) : selectedClassForResults ? (
//                     <div className="text-center py-12 bg-slate-50 rounded-xl">
//                         <p className="text-slate-500">No results found for this class. Enter student results first.</p>
//                     </div>
//                 ) : (
//                     <div className="text-center py-12 bg-slate-50 rounded-xl">
//                         <p className="text-slate-500">Select a class to view results</p>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default ClassResultsManagement;

// import React, { useMemo } from 'react';
// import { TrendingUp, Award, CheckCircle, Users, Printer, Download } from 'lucide-react';
// import { SubjectRecord } from '@/services/studentService';
// import { GradeConfiguration } from '@/services/gradeConfigService';
// import { ClassResultStudent } from '@/types/admin';
// import ClassResultsTable from './tables/ClassResultsTable';

// interface ClassResultsManagementProps {
//     classes: any[];
//     subjects: SubjectRecord[];
//     classResults: ClassResultStudent[];
//     selectedClassForResults: string;
//     activeAssessmentType: 'qa1' | 'qa2' | 'endOfTerm' | 'overall';
//     resultsLoading: boolean;
//     activeConfig: GradeConfiguration | null;
//     setSelectedClassForResults: (classId: string) => void;
//     setActiveAssessmentType: (type: 'qa1' | 'qa2' | 'endOfTerm' | 'overall') => void;
//     loadClassResults: (classId: string) => Promise<void>;
//     calculateGrade: (score: number, passMark?: number) => string;
// }

// const ClassResultsManagement: React.FC<ClassResultsManagementProps> = ({
//     classes,
//     subjects,
//     classResults,
//     selectedClassForResults,
//     activeAssessmentType,
//     resultsLoading,
//     activeConfig,
//     setSelectedClassForResults,
//     setActiveAssessmentType,
//     loadClassResults,
//     calculateGrade,
// }) => {
//     const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//         const classId = e.target.value;
//         setSelectedClassForResults(classId);
//         if (classId) {
//             loadClassResults(classId);
//         }
//     };

//     const handlePrint = () => {
//         window.print();
//     };

//     const handleExport = () => {
//         console.log('Exporting PDF...');
//     };

//     // Calculate average from subjects for each assessment type - MATCHES BACKEND LOGIC
//     const calculateSubjectAverage = (student: any, type: 'qa1' | 'qa2' | 'endOfTerm') => {
//         if (!student.subjects || !Array.isArray(student.subjects) || student.subjects.length === 0) {
//             return 0;
//         }

//         // Filter subjects with scores > 0 for the specific assessment type
//         const validSubjects = student.subjects.filter((subject: any) =>
//             subject[type] !== undefined && subject[type] !== null && subject[type] > 0
//         );

//         if (validSubjects.length === 0) return 0;

//         // Sum all scores for this assessment type and divide by number of subjects with scores
//         const total = validSubjects.reduce((sum: number, subject: any) => sum + subject[type], 0);
//         return total / validSubjects.length;
//     };

//     // Enhance classResults with calculated metrics for each assessment type
//     const enhancedClassResults = useMemo(() => {
//         return classResults.map(student => {
//             let average = 0;
//             let grade = 'F';
//             let status = 'Failed';

//             switch (activeAssessmentType) {
//                 case 'overall':
//                     average = student.average || 0;
//                     grade = student.overallGrade || 'F';
//                     status = grade === 'F' ? 'Failed' : 'Passed';
//                     break;
//                 case 'qa1':
//                     average = calculateSubjectAverage(student, 'qa1');
//                     grade = calculateGrade(average, activeConfig?.pass_mark);
//                     status = grade === 'F' ? 'Failed' : 'Passed';
//                     break;
//                 case 'qa2':
//                     average = calculateSubjectAverage(student, 'qa2');
//                     grade = calculateGrade(average, activeConfig?.pass_mark);
//                     status = grade === 'F' ? 'Failed' : 'Passed';
//                     break;
//                 case 'endOfTerm':
//                     average = calculateSubjectAverage(student, 'endOfTerm');
//                     grade = calculateGrade(average, activeConfig?.pass_mark);
//                     status = grade === 'F' ? 'Failed' : 'Passed';
//                     break;
//             }

//             return {
//                 ...student,
//                 calculatedAverage: average,
//                 calculatedGrade: grade,
//                 calculatedStatus: status
//             };
//         });
//     }, [classResults, activeAssessmentType, calculateGrade, activeConfig]);

//     // Calculate dynamic metrics based on activeAssessmentType
//     const metrics = useMemo(() => {
//         if (!classResults.length) {
//             return {
//                 classAverage: 0,
//                 topPerformerName: 'N/A',
//                 topPerformerScore: 0,
//                 passRate: 0,
//                 totalStudents: 0
//             };
//         }

//         let totalScore = 0;
//         let topScore = -1;
//         let topPerformerName = 'N/A';
//         let topPerformerScore = 0;
//         let passedCount = 0;

//         classResults.forEach(student => {
//             let studentScore = 0;
//             let studentGrade = 'F';

//             // Get score and grade based on activeAssessmentType - MATCHES BACKEND
//             switch (activeAssessmentType) {
//                 case 'overall':
//                     // Use the average already calculated by backend
//                     studentScore = student.average || 0;
//                     studentGrade = student.overallGrade || 'F';
//                     break;
//                 case 'qa1':
//                     // Calculate QA1 average from subjects
//                     studentScore = calculateSubjectAverage(student, 'qa1');
//                     studentGrade = calculateGrade(studentScore, activeConfig?.pass_mark);
//                     break;
//                 case 'qa2':
//                     // Calculate QA2 average from subjects
//                     studentScore = calculateSubjectAverage(student, 'qa2');
//                     studentGrade = calculateGrade(studentScore, activeConfig?.pass_mark);
//                     break;
//                 case 'endOfTerm':
//                     // Calculate End Term average from subjects
//                     studentScore = calculateSubjectAverage(student, 'endOfTerm');
//                     studentGrade = calculateGrade(studentScore, activeConfig?.pass_mark);
//                     break;
//             }

//             totalScore += studentScore;

//             if (studentScore > topScore) {
//                 topScore = studentScore;
//                 topPerformerName = student.name || 'N/A';
//                 topPerformerScore = studentScore;
//             }

//             if (studentGrade !== 'F') {
//                 passedCount++;
//             }
//         });

//         const classAverage = classResults.length > 0 ? totalScore / classResults.length : 0;
//         const passRate = classResults.length > 0 ? (passedCount / classResults.length) * 100 : 0;

//         return {
//             classAverage,
//             topPerformerName,
//             topPerformerScore,
//             passRate,
//             totalStudents: classResults.length
//         };
//     }, [classResults, activeAssessmentType, calculateGrade, activeConfig]);

//     return (
//         <div className="space-y-6">
//             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
//                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
//                     <div>
//                         <h2 className="text-lg font-semibold text-slate-800">Class Results & Rankings</h2>
//                         <p className="text-sm text-slate-500 mt-1">
//                             View all students' results in each class, ranked by performance
//                         </p>
//                     </div>

//                     <div className="flex flex-wrap gap-4">
//                         <div className="min-w-[200px]">
//                             <label className="block text-sm font-medium text-slate-700 mb-1">Select Class</label>
//                             <select
//                                 value={selectedClassForResults}
//                                 onChange={handleClassChange}
//                                 className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                             >
//                                 <option value="">Select a class</option>
//                                 {classes.map(cls => (
//                                     <option key={cls.id} value={cls.id}>
//                                         {cls.name} - {cls.term} ({cls.academic_year})
//                                     </option>
//                                 ))}
//                             </select>
//                         </div>

//                         <div>
//                             <label className="block text-sm font-medium text-slate-700 mb-1">View Results For</label>
//                             <div className="flex gap-2">
//                                 {[
//                                     { id: 'overall', label: 'Overall' },
//                                     { id: 'qa1', label: 'QA1' },
//                                     { id: 'qa2', label: 'QA2' },
//                                     { id: 'endOfTerm', label: 'End Term' }
//                                 ].map(type => (
//                                     <button
//                                         key={type.id}
//                                         onClick={() => setActiveAssessmentType(type.id as any)}
//                                         className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeAssessmentType === type.id
//                                             ? 'bg-indigo-600 text-white'
//                                             : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
//                                             }`}
//                                     >
//                                         {type.label}
//                                     </button>
//                                 ))}
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {resultsLoading ? (
//                     <div className="text-center py-12">
//                         <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
//                         <p className="text-slate-600">Loading results...</p>
//                     </div>
//                 ) : selectedClassForResults && classResults.length > 0 ? (
//                     <div className="space-y-8">
//                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                             <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-indigo-700 font-medium">Class Average</p>
//                                         <p className="text-2xl font-bold text-indigo-800 mt-1">
//                                             {metrics.classAverage.toFixed(1)}%
//                                         </p>
//                                         <p className="text-xs text-indigo-600 mt-1">
//                                             {activeAssessmentType.toUpperCase()}
//                                         </p>
//                                     </div>
//                                     <TrendingUp className="w-8 h-8 text-indigo-600 opacity-50" />
//                                 </div>
//                             </div>

//                             <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-emerald-700 font-medium">Top Performer</p>
//                                         <p className="text-lg font-bold text-emerald-800 mt-1">
//                                             {metrics.topPerformerName}
//                                         </p>
//                                         <p className="text-xs text-emerald-600 mt-1">
//                                             Score: {metrics.topPerformerScore.toFixed(1)}%
//                                         </p>
//                                     </div>
//                                     <Award className="w-8 h-8 text-emerald-600 opacity-50" />
//                                 </div>
//                             </div>

//                             <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-amber-700 font-medium">Pass Rate</p>
//                                         <p className="text-2xl font-bold text-amber-800 mt-1">
//                                             {Math.round(metrics.passRate)}%
//                                         </p>
//                                         <p className="text-xs text-amber-600 mt-1">
//                                             {activeAssessmentType.toUpperCase()}
//                                         </p>
//                                     </div>
//                                     <CheckCircle className="w-8 h-8 text-amber-600 opacity-50" />
//                                 </div>
//                             </div>

//                             <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-slate-700 font-medium">Total Students</p>
//                                         <p className="text-2xl font-bold text-slate-800 mt-1">
//                                             {metrics.totalStudents}
//                                         </p>
//                                     </div>
//                                     <Users className="w-8 h-8 text-slate-600 opacity-50" />
//                                 </div>
//                             </div>
//                         </div>

//                         <ClassResultsTable
//                             classResults={enhancedClassResults} // Pass enhanced data with calculated metrics
//                             subjects={subjects}
//                             activeAssessmentType={activeAssessmentType}
//                             activeConfig={activeConfig}
//                             calculateGrade={calculateGrade}
//                             onPrint={handlePrint}
//                             onExport={handleExport}
//                         />
//                     </div>
//                 ) : selectedClassForResults ? (
//                     <div className="text-center py-12 bg-slate-50 rounded-xl">
//                         <p className="text-slate-500">No results found for this class. Enter student results first.</p>
//                     </div>
//                 ) : (
//                     <div className="text-center py-12 bg-slate-50 rounded-xl">
//                         <p className="text-slate-500">Select a class to view results</p>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default ClassResultsManagement;

// // import React from 'react';
// // import { TrendingUp, Award, CheckCircle, Users, Printer, Download } from 'lucide-react';
// // import { SubjectRecord } from '@/services/studentService';
// // import { GradeConfiguration } from '@/services/gradeConfigService';
// // import { ClassResultStudent } from '@/types/admin';
// // import ClassResultsTable from './tables/ClassResultsTable';

// // interface ClassResultsManagementProps {
// //     classes: any[];
// //     subjects: SubjectRecord[];
// //     classResults: ClassResultStudent[];
// //     selectedClassForResults: string;
// //     activeAssessmentType: 'qa1' | 'qa2' | 'endOfTerm' | 'overall';
// //     resultsLoading: boolean;
// //     activeConfig: GradeConfiguration | null;
// //     setSelectedClassForResults: (classId: string) => void;
// //     setActiveAssessmentType: (type: 'qa1' | 'qa2' | 'endOfTerm' | 'overall') => void;
// //     loadClassResults: (classId: string) => Promise<void>;
// //     calculateGrade: (score: number, passMark?: number) => string;
// // }

// // const ClassResultsManagement: React.FC<ClassResultsManagementProps> = ({
// //     classes,
// //     subjects,
// //     classResults,
// //     selectedClassForResults,
// //     activeAssessmentType,
// //     resultsLoading,
// //     activeConfig,
// //     setSelectedClassForResults,
// //     setActiveAssessmentType,
// //     loadClassResults,
// //     calculateGrade,
// // }) => {
// //     const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
// //         const classId = e.target.value;
// //         setSelectedClassForResults(classId);
// //         if (classId) {
// //             loadClassResults(classId);
// //         }
// //     };

// //     const handlePrint = () => {
// //         window.print();
// //     };

// //     const handleExport = () => {
// //         // Implement PDF export logic here
// //         console.log('Exporting PDF...');
// //     };

// //     return (
// //         <div className="space-y-6">
// //             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
// //                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
// //                     <div>
// //                         <h2 className="text-lg font-semibold text-slate-800">Class Results & Rankings</h2>
// //                         <p className="text-sm text-slate-500 mt-1">
// //                             View all students' results in each class, ranked by performance
// //                         </p>
// //                     </div>

// //                     <div className="flex flex-wrap gap-4">
// //                         <div className="min-w-[200px]">
// //                             <label className="block text-sm font-medium text-slate-700 mb-1">Select Class</label>
// //                             <select
// //                                 value={selectedClassForResults}
// //                                 onChange={handleClassChange}
// //                                 className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
// //                             >
// //                                 <option value="">Select a class</option>
// //                                 {classes.map(cls => (
// //                                     <option key={cls.id} value={cls.id}>
// //                                         {cls.name} - {cls.term} ({cls.academic_year})
// //                                     </option>
// //                                 ))}
// //                             </select>
// //                         </div>

// //                         <div>
// //                             <label className="block text-sm font-medium text-slate-700 mb-1">View Results For</label>
// //                             <div className="flex gap-2">
// //                                 {[
// //                                     { id: 'overall', label: 'Overall' },
// //                                     { id: 'qa1', label: 'QA1' },
// //                                     { id: 'qa2', label: 'QA2' },
// //                                     { id: 'endOfTerm', label: 'End Term' }
// //                                 ].map(type => (
// //                                     <button
// //                                         key={type.id}
// //                                         onClick={() => setActiveAssessmentType(type.id as any)}
// //                                         className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeAssessmentType === type.id
// //                                             ? 'bg-indigo-600 text-white'
// //                                             : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
// //                                             }`}
// //                                     >
// //                                         {type.label}
// //                                     </button>
// //                                 ))}
// //                             </div>
// //                         </div>
// //                     </div>
// //                 </div>

// //                 {resultsLoading ? (
// //                     <div className="text-center py-12">
// //                         <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
// //                         <p className="text-slate-600">Loading results...</p>
// //                     </div>
// //                 ) : selectedClassForResults && classResults.length > 0 ? (
// //                     <div className="space-y-8">
// //                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
// //                             <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
// //                                 <div className="flex items-center justify-between">
// //                                     <div>
// //                                         <p className="text-sm text-indigo-700 font-medium">Class Average</p>
// //                                         <p className="text-2xl font-bold text-indigo-800 mt-1">
// //                                             {(
// //                                                 classResults.reduce((sum, student) => sum + student.average, 0) /
// //                                                 classResults.length
// //                                             ).toFixed(1)}%
// //                                         </p>
// //                                     </div>
// //                                     <TrendingUp className="w-8 h-8 text-indigo-600 opacity-50" />
// //                                 </div>
// //                             </div>

// //                             <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
// //                                 <div className="flex items-center justify-between">
// //                                     <div>
// //                                         <p className="text-sm text-emerald-700 font-medium">Top Performer</p>
// //                                         <p className="text-lg font-bold text-emerald-800 mt-1">
// //                                             {classResults[0]?.name || 'N/A'}
// //                                         </p>
// //                                     </div>
// //                                     <Award className="w-8 h-8 text-emerald-600 opacity-50" />
// //                                 </div>
// //                             </div>

// //                             <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
// //                                 <div className="flex items-center justify-between">
// //                                     <div>
// //                                         <p className="text-sm text-amber-700 font-medium">Pass Rate</p>
// //                                         <p className="text-2xl font-bold text-amber-800 mt-1">
// //                                             {Math.round(
// //                                                 (classResults.filter(s => s.overallGrade !== 'F').length /
// //                                                     classResults.length) * 100
// //                                             )}%
// //                                         </p>
// //                                     </div>
// //                                     <CheckCircle className="w-8 h-8 text-amber-600 opacity-50" />
// //                                 </div>
// //                             </div>

// //                             <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
// //                                 <div className="flex items-center justify-between">
// //                                     <div>
// //                                         <p className="text-sm text-slate-700 font-medium">Total Students</p>
// //                                         <p className="text-2xl font-bold text-slate-800 mt-1">
// //                                             {classResults.length}
// //                                         </p>
// //                                     </div>
// //                                     <Users className="w-8 h-8 text-slate-600 opacity-50" />
// //                                 </div>
// //                             </div>
// //                         </div>

// //                         <ClassResultsTable
// //                             classResults={classResults}
// //                             subjects={subjects}
// //                             activeAssessmentType={activeAssessmentType}
// //                             activeConfig={activeConfig}
// //                             calculateGrade={calculateGrade}
// //                             onPrint={handlePrint}
// //                             onExport={handleExport}
// //                         />
// //                     </div>
// //                 ) : selectedClassForResults ? (
// //                     <div className="text-center py-12 bg-slate-50 rounded-xl">
// //                         <p className="text-slate-500">No results found for this class. Enter student results first.</p>
// //                     </div>
// //                 ) : (
// //                     <div className="text-center py-12 bg-slate-50 rounded-xl">
// //                         <p className="text-slate-500">Select a class to view results</p>
// //                     </div>
// //                 )}
// //             </div>
// //         </div>
// //     );
// // };

// // export default ClassResultsManagement;