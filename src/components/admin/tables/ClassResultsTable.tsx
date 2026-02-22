import React from 'react';
import { Printer, Download, Loader2 } from 'lucide-react';
import { SubjectRecord } from '@/services/studentService';
import { GradeConfiguration } from '@/services/gradeConfigService';
import { ClassResultStudent } from '@/types/admin';

interface ClassResultsTableProps {
    classResults: ClassResultStudent[];
    subjects: SubjectRecord[];
    activeAssessmentType: 'qa1' | 'qa2' | 'endOfTerm' | 'overall';
    activeConfig: GradeConfiguration | null;
    calculateGrade: (score: number, passMark?: number) => string;
    onPrint: () => void;
    onExport: () => void;
    isDownloading?: boolean;
}

const ClassResultsTable: React.FC<ClassResultsTableProps> = ({
    classResults,
    subjects,
    activeAssessmentType,
    activeConfig,
    calculateGrade,
    onPrint,
    onExport,
    isDownloading = false,
}) => {
    // Function to calculate final score for a subject based on grade configuration
    // const calculateSubjectFinalScore = (subject: any): number => {

    //     if (subject.endOfTerm_absent) {
    //         return 0;
    //     }

    //     if (!activeConfig) {
    //         // Default to average of all tests if no config
    //         return (subject.qa1 + subject.qa2 + subject.endOfTerm) / 3;
    //     }

    //     switch (activeConfig.calculation_method) {
    //         case 'end_of_term_only':
    //             // 👇 NEW: If absent, return 0
    //             return subject.endOfTerm_absent ? 0 : subject.endOfTerm;
    //         // return subject.endOfTerm;

    //         case 'weighted_average':
    //             const weightQA1 = activeConfig.weight_qa1 || 0;
    //             const weightQA2 = activeConfig.weight_qa2 || 0;
    //             const weightEndTerm = activeConfig.weight_end_of_term || 0;

    //             return (
    //                 (subject.qa1 * weightQA1 / 100) +
    //                 (subject.qa2 * weightQA2 / 100) +
    //                 (subject.endOfTerm * weightEndTerm / 100)
    //             );

    //         case 'average_all':
    //         default:
    //             return (subject.qa1 + subject.qa2 + subject.endOfTerm) / 3;
    //     }
    // };
    // ===== FIXED: calculateSubjectFinalScore function =====
    const calculateSubjectFinalScore = (subject: any): number => {
        // If absent in endOfTerm, return 0
        if (subject.endOfTerm_absent) {
            return 0;
        }

        if (!activeConfig) {
            // Default to average of all tests if no config
            // Only include tests that have valid scores (including 0)
            let sum = 0;
            let count = 0;

            if (!subject.qa1_absent && subject.qa1 !== null && subject.qa1 >= 0) {
                sum += subject.qa1;
                count++;
            }
            if (!subject.qa2_absent && subject.qa2 !== null && subject.qa2 >= 0) {
                sum += subject.qa2;
                count++;
            }
            if (!subject.endOfTerm_absent && subject.endOfTerm !== null && subject.endOfTerm >= 0) {
                sum += subject.endOfTerm;
                count++;
            }

            return count > 0 ? sum / count : 0;
        }

        switch (activeConfig.calculation_method) {
            case 'end_of_term_only':
                return subject.endOfTerm_absent ? 0 : subject.endOfTerm;

            case 'weighted_average':
                const weightQA1 = activeConfig.weight_qa1 || 0;
                const weightQA2 = activeConfig.weight_qa2 || 0;
                const weightEndTerm = activeConfig.weight_end_of_term || 0;

                let weightedSum = 0;
                let totalWeight = 0;

                // Only include QA1 if it's valid and not absent
                if (!subject.qa1_absent && subject.qa1 !== null && subject.qa1 >= 0) {
                    weightedSum += subject.qa1 * weightQA1 / 100;
                    totalWeight += weightQA1;
                }

                // Only include QA2 if it's valid and not absent
                if (!subject.qa2_absent && subject.qa2 !== null && subject.qa2 >= 0) {
                    weightedSum += subject.qa2 * weightQA2 / 100;
                    totalWeight += weightQA2;
                }

                // End term is always included (with 0 if absent)
                weightedSum += (subject.endOfTerm_absent ? 0 : subject.endOfTerm) * weightEndTerm / 100;
                totalWeight += weightEndTerm;

                return totalWeight > 0 ? (weightedSum * 100) / totalWeight : 0;

            case 'average_all':
            default:
                let sum = 0;
                let count = 0;

                if (!subject.qa1_absent && subject.qa1 !== null && subject.qa1 >= 0) {
                    sum += subject.qa1;
                    count++;
                }
                if (!subject.qa2_absent && subject.qa2 !== null && subject.qa2 >= 0) {
                    sum += subject.qa2;
                    count++;
                }
                // Always include endOfTerm (with 0 if absent)
                sum += subject.endOfTerm_absent ? 0 : subject.endOfTerm;
                count++;

                return count > 0 ? sum / count : 0;
        }
    };

    // const calculateStudentAssessmentAverage = (student: ClassResultStudent): number => {
    //     let totalScore = 0;
    //     let subjectCount = 0;

    //     student.subjects.forEach(subject => {
    //         let score = 0;
    //         // 👇 NEW: Check if absent
    //         let isAbsent = false;

    //         if (activeAssessmentType === 'qa1') {
    //             score = subject.qa1;
    //             isAbsent = subject.qa1_absent || false;  // 👈 NEW
    //         } else if (activeAssessmentType === 'qa2') {
    //             score = subject.qa2;
    //             isAbsent = subject.qa2_absent || false;  // 👈 NEW
    //         } else { // endOfTerm
    //             score = subject.endOfTerm;
    //             isAbsent = subject.endOfTerm_absent || false;  // 👈 NEW
    //         }

    //         // 👇 MODIFIED: Skip absent students
    //         // if (!isAbsent && !isNaN(score) && score > 0) {
    //         if (!isAbsent && !isNaN(score) && score >= 0) {
    //             totalScore += score;
    //             subjectCount++;
    //         }
    //     });

    //     return subjectCount > 0 ? totalScore / subjectCount : 0;
    // };

    // ===== FIXED: calculateStudentAssessmentAverage function =====
    const calculateStudentAssessmentAverage = (student: ClassResultStudent): number => {
        let totalScore = 0;
        let subjectCount = 0;

        student.subjects.forEach(subject => {
            let score = 0;
            let isAbsent = false;

            if (activeAssessmentType === 'qa1') {
                score = subject.qa1;
                isAbsent = subject.qa1_absent || false;
            } else if (activeAssessmentType === 'qa2') {
                score = subject.qa2;
                isAbsent = subject.qa2_absent || false;
            } else { // endOfTerm
                score = subject.endOfTerm;
                isAbsent = subject.endOfTerm_absent || false;
            }

            // Include if:
            // 1. Not absent AND score is a valid number (including 0)
            if (!isAbsent && !isNaN(score) && score !== null && score >= 0) {
                totalScore += score;
                subjectCount++;
            }
            // 2. If absent, count it as 0 (so subjectCount increments but score is 0)
            else if (isAbsent) {
                totalScore += 0; // Explicitly add 0
                subjectCount++;
            }
        });

        return subjectCount > 0 ? totalScore / subjectCount : 0;
    };

    // ===== CHANGE 3: Update calculateStudentOverallAverage function (around line 70) =====
    // const calculateStudentOverallAverage = (student: ClassResultStudent): number => {
    //     const validSubjects = student.subjects.filter(subject => {
    //         // 👇 MODIFIED: Include subjects that have scores OR were absent
    //         const hasScores = subject.qa1 > 0 || subject.qa2 > 0 || subject.endOfTerm > 0;
    //         const hasAbsent = subject.qa1_absent || subject.qa2_absent || subject.endOfTerm_absent;  // 👈 NEW
    //         return hasScores || hasAbsent;  // 👈 MODIFIED
    //     });

    //     if (validSubjects.length === 0) return 0;

    //     const totalScore = validSubjects.reduce((sum, subject) => {
    //         const finalScore = calculateSubjectFinalScore(subject);
    //         return sum + finalScore;
    //     }, 0);

    //     return totalScore / validSubjects.length;
    // };

    // ===== FIXED: calculateStudentOverallAverage function =====
    const calculateStudentOverallAverage = (student: ClassResultStudent): number => {
        // Include ALL subjects - don't filter them out
        if (student.subjects.length === 0) return 0;

        const totalScore = student.subjects.reduce((sum, subject) => {
            const finalScore = calculateSubjectFinalScore(subject);
            return sum + finalScore;
        }, 0);

        return totalScore / student.subjects.length; // Divide by total subjects, not just valid ones
    };

    // Function to get overall grade based on average score
    const getOverallGrade = (average: number): string => {
        const passMark = activeConfig?.pass_mark || 50;

        if (average >= 80) return 'A';
        if (average >= 70) return 'B';
        if (average >= 60) return 'C';
        if (average >= passMark) return 'D';
        return 'F';
    };


    // ===== CHANGE 4: Update getStudentSubjectsWithScores function (around line 85) =====
    // const getStudentSubjectsWithScores = (student: ClassResultStudent) => {
    //     return student.subjects.filter(subject => {
    //         // 👇 MODIFIED: Include subjects that have scores OR were absent
    //         // const hasScores = subject.qa1 > 0 || subject.qa2 > 0 || subject.endOfTerm > 0;
    //         // Include subjects where score is 0 (not just >0)
    //         const hasScores = (subject.qa1 !== null && subject.qa1 >= 0) ||
    //             (subject.qa2 !== null && subject.qa2 >= 0) ||
    //             (subject.endOfTerm !== null && subject.endOfTerm >= 0);
    //         const hasAbsent = subject.qa1_absent || subject.qa2_absent || subject.endOfTerm_absent;  // 👈 NEW
    //         return hasScores || hasAbsent;  // 👈 MODIFIED
    //     });
    // };
    // ===== FIXED: getStudentSubjectsWithScores function =====
    const getStudentSubjectsWithScores = (student: ClassResultStudent) => {
        return student.subjects.filter(subject => {
            // Include subjects that have ANY valid data (including 0 or absent)
            const hasValidQA1 = subject.qa1 !== null && subject.qa1 >= 0;
            const hasValidQA2 = subject.qa2 !== null && subject.qa2 >= 0;
            const hasValidEndTerm = subject.endOfTerm !== null && subject.endOfTerm >= 0;
            const hasAbsent = subject.qa1_absent || subject.qa2_absent || subject.endOfTerm_absent;

            return hasValidQA1 || hasValidQA2 || hasValidEndTerm || hasAbsent;
        });
    };
    // Function to get subjects with scores for overall view
    const getOverallSubjectsWithScores = () => {
        // Get all subjects that have scores for at least one student
        const subjectsWithScores = new Set<string>();

        classResults.forEach(student => {
            student.subjects.forEach(subject => {
                const hasScores = subject.qa1 > 0 || subject.qa2 > 0 || subject.endOfTerm > 0;
                if (hasScores) {
                    subjectsWithScores.add(subject.name);
                }
            });
        });

        return subjects.filter(subject => subjectsWithScores.has(subject.name));
    };


    // ===== CHANGE 5: Update calculateTotalMarks function =====
    // const calculateTotalMarks = (student: ClassResultStudent): number => {
    //     if (activeAssessmentType === 'overall') {
    //         const average = calculateStudentOverallAverage(student);
    //         const validSubjects = getStudentSubjectsWithScores(student);
    //         return average * validSubjects.length;
    //     }

    //     let total = 0;
    //     student.subjects.forEach(subject => {
    //         let score = 0;
    //         // 👇 NEW: Check if absent
    //         let isAbsent = false;

    //         if (activeAssessmentType === 'qa1') {
    //             score = subject.qa1;
    //             isAbsent = subject.qa1_absent || false;  // 👈 NEW
    //         } else if (activeAssessmentType === 'qa2') {
    //             score = subject.qa2;
    //             isAbsent = subject.qa2_absent || false;  // 👈 NEW
    //         } else { // endOfTerm
    //             score = subject.endOfTerm;
    //             isAbsent = subject.endOfTerm_absent || false;  // 👈 NEW
    //         }

    //         // 👇 MODIFIED: Only add if not absent and score > 0
    //         if (!isAbsent && !isNaN(score) && score > 0) {
    //             total += score;
    //         }
    //     });
    //     return total;
    // };

    // ===== FIXED: calculateTotalMarks function =====
    const calculateTotalMarks = (student: ClassResultStudent): number => {
        if (activeAssessmentType === 'overall') {
            const average = calculateStudentOverallAverage(student);
            return average * student.subjects.length; // Multiply by total subjects
        }

        let total = 0;
        student.subjects.forEach(subject => {
            let score = 0;
            let isAbsent = false;

            if (activeAssessmentType === 'qa1') {
                score = subject.qa1;
                isAbsent = subject.qa1_absent || false;
            } else if (activeAssessmentType === 'qa2') {
                score = subject.qa2;
                isAbsent = subject.qa2_absent || false;
            } else { // endOfTerm
                score = subject.endOfTerm;
                isAbsent = subject.endOfTerm_absent || false;
            }

            // Include if:
            // 1. Not absent AND score is a valid number (including 0)
            if (!isAbsent && !isNaN(score) && score !== null && score >= 0) {
                total += score;
            }
            // 2. If absent, add 0 (count it)
            else if (isAbsent) {
                total += 0; // Add 0 for absent subjects
            }
        });

        return total;
    };

    // Function to calculate assessment-specific grade
    const getAssessmentGrade = (student: ClassResultStudent): string => {
        const average = calculateStudentAssessmentAverage(student);
        return calculateGrade(average, activeConfig?.pass_mark || 50);
    };

    // Function to calculate status based on grade
    const getAssessmentStatus = (student: ClassResultStudent): string => {
        const grade = getAssessmentGrade(student);
        return grade === 'F' ? 'Failed' : 'Passed';
    };

    // Function to calculate ranks dynamically based on total marks
    const calculateRanks = () => {
        // Calculate total marks for each student
        const studentsWithMarks = classResults.map(student => ({
            ...student,
            calculatedTotalMarks: calculateTotalMarks(student),
            calculatedAverage: activeAssessmentType === 'overall'
                ? calculateStudentOverallAverage(student)
                : calculateStudentAssessmentAverage(student),
            calculatedGrade: activeAssessmentType === 'overall'
                ? getOverallGrade(calculateStudentOverallAverage(student))
                : getAssessmentGrade(student),
            calculatedStatus: activeAssessmentType === 'overall'
                ? (getOverallGrade(calculateStudentOverallAverage(student)) === 'F' ? 'Failed' : 'Passed')
                : getAssessmentStatus(student)
        }));

        // Sort students by total marks in descending order
        studentsWithMarks.sort((a, b) => b.calculatedTotalMarks - a.calculatedTotalMarks);

        // Assign ranks with tie handling (Dense Ranking: 1, 1, 2)
        const rankedStudents = [];
        let currentRank = 1;
        let previousMarks: number | null = null;

        for (let i = 0; i < studentsWithMarks.length; i++) {
            const student = studentsWithMarks[i];

            // If we have previous marks and current marks are different, increment rank
            if (previousMarks !== null && student.calculatedTotalMarks !== previousMarks) {
                currentRank++;
            }

            // If marks are equal to previous, currentRank stays the same (tie)

            rankedStudents.push({
                ...student,
                dynamicRank: currentRank
            });

            previousMarks = student.calculatedTotalMarks;
        }

        return rankedStudents;
    };

    // ===== CHANGE 6: Update getFilteredSubjects function =====
    // const getFilteredSubjects = () => {
    //     if (activeAssessmentType === 'overall') {
    //         return getOverallSubjectsWithScores();
    //     }

    //     // Create a Set of subject names that have scores OR were absent for at least one student
    //     const subjectsWithScores = new Set<string>();

    //     classResults.forEach(student => {
    //         student.subjects.forEach(subject => {
    //             let hasScoreOrAbsent = false;

    //             if (activeAssessmentType === 'qa1') {
    //                 // hasScoreOrAbsent = subject.qa1 > 0 || subject.qa1_absent;  // 👈 MODIFIED
    //                 // Include subjects with zero scores
    //                 hasScoreOrAbsent = (subject.qa1 !== null && subject.qa1 >= 0) || subject.qa1_absent;
    //             } else if (activeAssessmentType === 'qa2') {
    //                 // hasScoreOrAbsent = subject.qa2 > 0 || subject.qa2_absent;  // 👈 MODIFIED
    //                 // Include subjects with zero scores
    //                 hasScoreOrAbsent = (subject.qa2 !== null && subject.qa2 >= 0) || subject.qa2_absent;
    //             } else { // endOfTerm
    //                 // hasScoreOrAbsent = subject.endOfTerm > 0 || subject.endOfTerm_absent;  // 👈 MODIFIED
    //                 // Include subjects with zero scores
    //                 hasScoreOrAbsent = (subject.endOfTerm !== null && subject.endOfTerm >= 0) || subject.endOfTerm_absent;
    //             }

    //             if (hasScoreOrAbsent) {
    //                 subjectsWithScores.add(subject.name);
    //             }
    //         });
    //     });

    //     return subjects.filter(subject => subjectsWithScores.has(subject.name));
    // };

    // ===== FIXED: getFilteredSubjects function =====
    const getFilteredSubjects = () => {
        if (activeAssessmentType === 'overall') {
            return getOverallSubjectsWithScores();
        }

        // Create a Set of subject names that have ANY data (scores including 0 OR absent)
        const subjectsWithData = new Set<string>();

        classResults.forEach(student => {
            student.subjects.forEach(subject => {
                let hasData = false;

                if (activeAssessmentType === 'qa1') {
                    hasData = (subject.qa1 !== null && subject.qa1 >= 0) || subject.qa1_absent;
                } else if (activeAssessmentType === 'qa2') {
                    hasData = (subject.qa2 !== null && subject.qa2 >= 0) || subject.qa2_absent;
                } else { // endOfTerm
                    hasData = (subject.endOfTerm !== null && subject.endOfTerm >= 0) || subject.endOfTerm_absent;
                }

                if (hasData) {
                    subjectsWithData.add(subject.name);
                }
            });
        });

        return subjects.filter(subject => subjectsWithData.has(subject.name));
    };

    const filteredSubjects = getFilteredSubjects();
    const rankedStudents = calculateRanks();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">
                    {activeAssessmentType === 'overall' ? 'Overall Results' :
                        activeAssessmentType === 'qa1' ? 'QA1 Results' :
                            activeAssessmentType === 'qa2' ? 'QA2 Results' : 'End Term Results'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                    {activeAssessmentType === 'overall'
                        ? activeConfig
                            ? `Based on ${activeConfig.configuration_name} calculation`
                            : 'Based on average of all tests'
                        : `Ranked by ${activeAssessmentType} score`}
                </p>
                {activeAssessmentType === 'overall' && activeConfig && (
                    <p className="text-xs text-indigo-600 mt-1">
                        {activeConfig.calculation_method === 'weighted_average'
                            ? `Weights: QA1: ${activeConfig.weight_qa1}%, QA2: ${activeConfig.weight_qa2}%, End Term: ${activeConfig.weight_end_of_term}%`
                            : activeConfig.calculation_method === 'end_of_term_only'
                                ? 'End of Term Only Calculation'
                                : 'Average of All Tests'}
                    </p>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Rank</th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Exam No.</th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Name</th>
                            {filteredSubjects.map(subject => (
                                <th key={subject.id} className="text-center px-4 py-3 text-sm font-semibold text-slate-600">
                                    {subject.name}
                                </th>
                            ))}

                            {/* Total Marks Column */}
                            {filteredSubjects.length > 0 && (
                                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-600 bg-indigo-50 border-l border-slate-200">
                                    Total Marks
                                </th>
                            )}

                            {/* Average Column for ALL assessment types */}
                            <th className="text-center px-4 py-3 text-sm font-semibold text-slate-600">Average</th>

                            {/* Grade Column for ALL assessment types */}
                            <th className="text-center px-4 py-3 text-sm font-semibold text-slate-600">
                                {activeAssessmentType === 'overall' ? 'Overall Grade' : 'Grade'}
                            </th>

                            {/* Status Column for ALL assessment types */}
                            <th className="text-center px-4 py-3 text-sm font-semibold text-slate-600">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rankedStudents.map((student: any) => {
                            const studentRank = student.dynamicRank || student.rank;
                            const average = student.calculatedAverage || 0;
                            const grade = student.calculatedGrade || 'F';
                            const status = student.calculatedStatus || 'Failed';
                            const totalMarks = student.calculatedTotalMarks || 0;

                            return (
                                <tr key={student.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center">
                                            {studentRank <= 3 ? (
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${studentRank === 1 ? 'bg-amber-500' :
                                                    studentRank === 2 ? 'bg-slate-500' :
                                                        'bg-amber-700'
                                                    }`}>
                                                    {studentRank}
                                                </span>
                                            ) : (
                                                <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-700">
                                                    {studentRank}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-sm text-indigo-600">{student.examNumber}</td>
                                    <td className="px-4 py-3 font-medium text-slate-800">{student.name}</td>

                                    {filteredSubjects.map(subject => {
                                        const studentSubject = student.subjects.find((s: any) => s.name === subject.name);
                                        if (!studentSubject) {
                                            return (
                                                <td key={subject.id} className="px-4 py-3 text-center">
                                                    <span className="text-slate-400">-</span>
                                                </td>
                                            );
                                        }

                                        if (activeAssessmentType === 'overall') {
                                            const hasScores = studentSubject.qa1 > 0 || studentSubject.qa2 > 0 || studentSubject.endOfTerm > 0;
                                            if (!hasScores) {
                                                return (
                                                    <td key={subject.id} className="px-4 py-3 text-center">
                                                        <span className="text-slate-400">-</span>
                                                    </td>
                                                );
                                            }

                                            const finalScore = calculateSubjectFinalScore(studentSubject);
                                            const subjectGrade = calculateGrade(finalScore, activeConfig?.pass_mark || 50);

                                            return (
                                                <td key={subject.id} className="px-4 py-3 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className={`font-bold ${finalScore >= 80 ? 'text-emerald-700' :
                                                            finalScore >= 60 ? 'text-blue-700' :
                                                                finalScore >= 50 ? 'text-amber-700' :
                                                                    'text-red-700'
                                                            }`}>
                                                            {finalScore.toFixed(1)}%
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            {subjectGrade}
                                                        </span>
                                                    </div>
                                                </td>
                                            );
                                        } else {
                                            const score = activeAssessmentType === 'qa1'
                                                ? studentSubject.qa1
                                                : activeAssessmentType === 'qa2'
                                                    ? studentSubject.qa2
                                                    : studentSubject.endOfTerm;

                                            // 👇 NEW: Check if absent
                                            const isAbsent = activeAssessmentType === 'qa1'
                                                ? studentSubject.qa1_absent
                                                : activeAssessmentType === 'qa2'
                                                    ? studentSubject.qa2_absent
                                                    : studentSubject.endOfTerm_absent;

                                            return (
                                                <td key={subject.id} className="px-4 py-3 text-center">
                                                    {isAbsent ? (  // 👈 NEW: Show AB when absent
                                                        <div className="flex flex-col items-center">
                                                            <span className="font-bold text-slate-400">AB</span>
                                                        </div>
                                                        // ) : score > 0 ? (
                                                    ) : (score !== null && score >= 0) ? (
                                                        <div className="flex flex-col items-center">
                                                            <span className={`font-bold ${score >= 80 ? 'text-emerald-700' :
                                                                score >= 60 ? 'text-blue-700' :
                                                                    score >= 50 ? 'text-amber-700' :
                                                                        'text-red-700'
                                                                }`}>
                                                                {score}%
                                                            </span>
                                                            <span className="text-xs text-slate-500">
                                                                {calculateGrade(score, activeConfig?.pass_mark || 50)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>
                                            );
                                        }
                                    })}

                                    {/* Total Marks Cell */}
                                    {filteredSubjects.length > 0 && (
                                        <td className="px-4 py-3 text-center bg-indigo-50 border-l border-slate-200">
                                            <div className="flex flex-col items-center">
                                                <span className="font-bold text-lg text-indigo-700">
                                                    {totalMarks.toFixed(1)}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    Total
                                                </span>
                                            </div>
                                        </td>
                                    )}

                                    {/* Average Cell for ALL assessment types */}
                                    <td className="px-4 py-3 text-center">
                                        <span className="text-xl font-bold text-indigo-700">
                                            {average.toFixed(1)}%
                                        </span>
                                    </td>

                                    {/* Grade Cell for ALL assessment types */}
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                                            grade === 'B' ? 'bg-blue-100 text-blue-700' :
                                                grade === 'C' ? 'bg-amber-100 text-amber-700' :
                                                    grade === 'D' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-red-100 text-red-700'
                                            }`}>
                                            {grade}
                                        </span>
                                    </td>

                                    {/* Status Cell for ALL assessment types */}
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${status === 'Failed' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                            {status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Show message when no subjects have scores */}
                {filteredSubjects.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                        No subjects with scores found for {activeAssessmentType}
                    </div>
                )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                {/* <button
                    onClick={onPrint}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-2"
                >
                    <Printer className="w-4 h-4" />
                    Print Results
                </button> */}
                {/* <button
                    onClick={onExport}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    Export as PDF
                </button> */}
                <button
                    onClick={onExport}
                    disabled={isDownloading}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${isDownloading ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'
                        } text-white`}
                >
                    {isDownloading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Generating...</span>
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ClassResultsTable;