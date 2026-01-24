import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, X } from 'lucide-react';
import { SubjectRecord } from '@/services/studentService';
import { GradeConfiguration } from '@/services/gradeConfigService';
import { Student, Assessment, ReportCardData } from '@/types/admin';

interface ResultsManagementProps {
    students: Student[];
    classes: any[];
    subjects: SubjectRecord[];
    selectedStudent: Student | null;
    assessments: Assessment[];
    reportCard: ReportCardData;
    savingResults: boolean;
    activeConfig: GradeConfiguration | null;
    setSelectedStudent: (student: Student | null) => void;
    setAssessments: (assessments: Assessment[]) => void;
    setReportCard: (reportCard: ReportCardData) => void;
    loadStudentResults: (student: Student) => Promise<void>;
    saveAllResults: () => Promise<void>;
    updateAssessmentScore: (subjectId: string, field: 'qa1' | 'qa2' | 'end_of_term', value: number) => void;
    calculateGrade: (score: number, passMark?: number) => string;
    calculateFinalScore: (qa1: number, qa2: number, endOfTerm: number, config: GradeConfiguration) => number;
    isTeacherView?: boolean;
    isClassTeacher?: boolean; // ADDED
}

const ResultsManagement: React.FC<ResultsManagementProps> = ({
    students,
    classes,
    subjects,
    selectedStudent,
    assessments,
    reportCard,
    savingResults,
    activeConfig,
    setSelectedStudent,
    setAssessments,
    setReportCard,
    loadStudentResults,
    saveAllResults,
    updateAssessmentScore,
    calculateGrade,
    calculateFinalScore,
    isTeacherView = false,
    isClassTeacher = false, // ADDED
}) => {
    const [studentAssessmentsCount, setStudentAssessmentsCount] = useState<{ [key: string]: { qa1: number; qa2: number; endTerm: number } }>({});

    const [reportCardErrors, setReportCardErrors] = useState<{
        days_present: boolean;
        days_absent: boolean;
        days_late: boolean;
        // teacher_remarks: boolean;
    }>({
        days_present: false,
        days_absent: false,
        days_late: false,
        // teacher_remarks: false
    });

    // const predefinedRemarks = [
    //     "Outstanding performance. Excellent understanding of concepts.",
    //     "Very good performance. Consistent effort and strong results.",
    //     "Average performance. Shows understanding but needs more consistency.",
    //     "Fair performance. Steady progress at this stage.",
    //     "Satisfactory performance. Can improve with more practice.",
    //     "Below average performance. Needs to focus and work harder.",
    //     "Poor performance. Requires serious improvement and support."
    // ];

    // Fetch assessment counts for all students when component loads
    useEffect(() => {
        const fetchAllStudentAssessments = async () => {
            const counts: { [key: string]: { qa1: number; qa2: number; endTerm: number } } = {};

            for (const student of students) {
                try {
                    const response = await fetch(`http://localhost:3000/api/students/${student.id}/assessments`);
                    if (response.ok) {
                        const assessmentsData = await response.json();

                        let qa1Count = 0;
                        let qa2Count = 0;
                        let endTermCount = 0;

                        if (Array.isArray(assessmentsData)) {
                            assessmentsData.forEach((assessment: any) => {
                                const assessmentType = assessment.assessment_type || assessment.assessmentType;
                                const score = assessment.score || 0;

                                if (score > 0) {
                                    if (assessmentType === 'qa1') qa1Count++;
                                    if (assessmentType === 'qa2') qa2Count++;
                                    if (assessmentType === 'end_of_term') endTermCount++;
                                }
                            });
                        }

                        counts[student.id] = { qa1: qa1Count, qa2: qa2Count, endTerm: endTermCount };
                    }
                } catch (error) {
                    console.error(`Error fetching assessments for student ${student.id}:`, error);
                    counts[student.id] = { qa1: 0, qa2: 0, endTerm: 0 };
                }
            }

            setStudentAssessmentsCount(counts);
        };

        if (students.length > 0 && !selectedStudent) {
            fetchAllStudentAssessments();
        }
    }, [students, selectedStudent]);

    const getStudentCompletedSubjects = (studentId: string) => {
        const counts = studentAssessmentsCount[studentId];
        if (!counts) return 0;
        return Math.max(counts.qa1, counts.qa2, counts.endTerm);
    };

    const hasAnyAssessments = (studentId: string) => {
        const counts = studentAssessmentsCount[studentId];
        if (!counts) return false;
        return counts.qa1 > 0 || counts.qa2 > 0 || counts.endTerm > 0;
    };

    const clearScore = (subjectId: string, field: 'qa1' | 'qa2' | 'end_of_term') => {
        updateAssessmentScore(subjectId, field, 0);
    };

    const hasEndOfTermScores = () => {
        return assessments.some(assessment => assessment.end_of_term > 0);
    };

    const validateReportCard = (): boolean => {
        const errors = {
            days_present: reportCard.days_present === undefined || reportCard.days_present === null,
            days_absent: reportCard.days_absent === undefined || reportCard.days_absent === null,
            days_late: reportCard.days_late === undefined || reportCard.days_late === null,
            // teacher_remarks: !reportCard.teacher_remarks.trim()
        };

        setReportCardErrors(errors);
        return !Object.values(errors).some(error => error);
    };

    // MODIFIED: Save button handler with class teacher check
    // const handleSaveClick = async () => {
    //     if (hasEndOfTermScores()) {
    //         if (!isClassTeacher) {
    //             alert('Only class teacher can save attendance and remarks. Please contact the class teacher.');
    //             return;
    //         }

    //         if (!validateReportCard()) {
    //             document.querySelector('.report-card-section')?.scrollIntoView({ behavior: 'smooth' });
    //             return;
    //         }
    //     }
    //     await saveAllResults();
    // };

    const handleSaveClick = async () => {
        // If there are End of Term scores AND teacher is class teacher
        if (hasEndOfTermScores() && isClassTeacher) {
            if (!validateReportCard()) {
                document.querySelector('.report-card-section')?.scrollIntoView({ behavior: 'smooth' });
                return;
            }
        }
        // Subject teachers can save without validating attendance/remarks
        await saveAllResults();
    };

    return (
        <div className="space-y-6">
            {!selectedStudent ? (
                <>
                    <h2 className="text-lg font-semibold text-slate-800">Select a Student to Enter Results</h2>

                    <div className="space-y-8">
                        {classes.map(cls => {
                            const classStudents = students.filter(s => s.class?.id === cls.id);
                            if (classStudents.length === 0) return null;

                            return (
                                <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-slate-800">
                                            {cls.name} - {cls.term} ({cls.academic_year})
                                        </h3>
                                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">
                                            {classStudents.length} students
                                        </span>
                                    </div>

                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {classStudents.map((student) => {
                                            const counts = studentAssessmentsCount[student.id] || { qa1: 0, qa2: 0, endTerm: 0 };
                                            const completedSubjects = getStudentCompletedSubjects(student.id);
                                            const hasScores = hasAnyAssessments(student.id);

                                            return (
                                                <button
                                                    key={student.id}
                                                    onClick={() => loadStudentResults(student)}
                                                    className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all text-left hover:bg-indigo-50 relative"
                                                >
                                                    {hasScores && (
                                                        <div className="absolute top-3 right-3 flex gap-1">
                                                            {counts.qa1 > 0 && (
                                                                <div className="w-2 h-2 bg-emerald-500 rounded-full" title={`${counts.qa1} QA1 subjects`}></div>
                                                            )}
                                                            {counts.qa2 > 0 && (
                                                                <div className="w-2 h-2 bg-blue-500 rounded-full" title={`${counts.qa2} QA2 subjects`}></div>
                                                            )}
                                                            {counts.endTerm > 0 && (
                                                                <div className="w-2 h-2 bg-amber-500 rounded-full" title={`${counts.endTerm} End Term subjects`}></div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-start mb-2">
                                                        <p className="font-mono text-sm text-indigo-600">{student.examNumber}</p>
                                                        {completedSubjects > 0 && (
                                                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                                                                {completedSubjects} subjects
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="font-semibold text-slate-800">{student.name}</p>
                                                    <p className="text-sm text-slate-500">
                                                        {student.class?.name || 'No Class'}
                                                        {student.class?.term || 'Term 1, 2024/2025'}
                                                    </p>

                                                    {hasScores && (
                                                        <div className="mt-3 pt-3 border-t border-slate-200">
                                                            <div className="flex justify-between text-xs">
                                                                <div className="flex items-center gap-1">
                                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                                                    <span className="text-slate-600">QA1:</span>
                                                                    <span className="font-semibold text-emerald-600 ml-1">{counts.qa1}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                    <span className="text-slate-600">QA2:</span>
                                                                    <span className="font-semibold text-blue-600 ml-1">{counts.qa2}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                                                    <span className="text-slate-600">End:</span>
                                                                    <span className="font-semibold text-amber-600 ml-1">{counts.endTerm}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {students.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                                <p className="text-slate-500">No students found. Add your first student to get started.</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">{selectedStudent.name}</h2>
                                <p className="text-sm text-slate-500">{selectedStudent.examNumber} {selectedStudent.class?.name || 'No Class'}</p>
                                {!isClassTeacher && (
                                    <span className="mt-1 inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                        Subject Teacher (Attendance/Restricted)
                                    </span>
                                )}
                                {isClassTeacher && (
                                    <span className="mt-1 inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                        Class Teacher (Full Access)
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleSaveClick}
                            disabled={savingResults}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                        >
                            {savingResults ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save All Results
                                </>
                            )}
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                            <h3 className="font-semibold text-slate-800">Assessment Scores</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                {isClassTeacher
                                    ? "You can enter all assessment scores as class teacher."
                                    : "You can enter assessment scores for subjects you teach."
                                }
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Subject</th>
                                        <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">QA1 (0-100)</th>
                                        <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">QA2 (0-100)</th>
                                        <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">End of Term (0-100)</th>
                                        <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">Final Score*</th>
                                        <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {assessments.map((assessment) => {
                                        let finalScore = (assessment.qa1 + assessment.qa2 + assessment.end_of_term) / 3;
                                        if (activeConfig) {
                                            finalScore = calculateFinalScore(
                                                assessment.qa1,
                                                assessment.qa2,
                                                assessment.end_of_term,
                                                activeConfig
                                            );
                                        }

                                        const hasQa1 = assessment.qa1 > 0;
                                        const hasQa2 = assessment.qa2 > 0;
                                        const hasEndTerm = assessment.end_of_term > 0;
                                        const hasAnyScore = hasQa1 || hasQa2 || hasEndTerm;

                                        return (
                                            <tr key={assessment.subject_id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 font-medium text-slate-800">{assessment.subject_name}</td>
                                                <td className="px-6 py-4">
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={assessment.qa1 || ''}
                                                            onChange={(e) => updateAssessmentScore(assessment.subject_id, 'qa1', parseInt(e.target.value) || 0)}
                                                            className={`w-20 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mx-auto block ${hasQa1 ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300'
                                                                }`}
                                                        />
                                                        {hasQa1 && (
                                                            <div className="absolute top-3 left-3 w-2 h-2 bg-emerald-500 rounded-full"></div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={assessment.qa2 || ''}
                                                            onChange={(e) => updateAssessmentScore(assessment.subject_id, 'qa2', parseInt(e.target.value) || 0)}
                                                            className={`w-20 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mx-auto block ${hasQa2 ? 'border-blue-300 bg-blue-50' : 'border-slate-300'
                                                                }`}
                                                        />
                                                        {hasQa2 && (
                                                            <div className="absolute top-3 left-3 w-2 h-2 bg-blue-500 rounded-full"></div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={assessment.end_of_term || ''}
                                                            onChange={(e) => updateAssessmentScore(assessment.subject_id, 'end_of_term', parseInt(e.target.value) || 0)}
                                                            className={`w-20 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mx-auto block ${hasEndTerm ? 'border-amber-300 bg-amber-50' : 'border-slate-300'
                                                                }`}
                                                        />
                                                        {hasEndTerm && (
                                                            <div className="absolute top-3 left-3 w-2 h-2 bg-amber-500 rounded-full"></div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-semibold text-indigo-700">
                                                    {finalScore.toFixed(1)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {hasAnyScore && (
                                                        <div className="flex justify-center gap-1">
                                                            {hasQa1 && (
                                                                <button
                                                                    onClick={() => clearScore(assessment.subject_id, 'qa1')}
                                                                    className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                                                                    title="Clear QA1 score"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                    <span className="sr-only">Clear QA1</span>
                                                                </button>
                                                            )}
                                                            {hasQa2 && (
                                                                <button
                                                                    onClick={() => clearScore(assessment.subject_id, 'qa2')}
                                                                    className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                                                                    title="Clear QA2 score"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                    <span className="sr-only">Clear QA2</span>
                                                                </button>
                                                            )}
                                                            {hasEndTerm && (
                                                                <button
                                                                    onClick={() => clearScore(assessment.subject_id, 'end_of_term')}
                                                                    className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                                                                    title="Clear End Term score"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                    <span className="sr-only">Clear End Term</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-sm text-slate-500">
                                <div className="flex justify-between items-center">
                                    <div>
                                        * Final score calculated using active configuration: <span className="font-semibold">{activeConfig?.configuration_name || 'Default (Average of All)'}</span>
                                    </div>
                                    <div className="text-xs text-slate-600">
                                        Tip: To remove a score, click the X button or set the value to 0 and save
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {hasEndOfTermScores() && isClassTeacher && (
                        <div className="report-card-section bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-slate-800">Report Card Details</h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {isClassTeacher
                                                ? 'Report card details are REQUIRED when entering End of Term scores.'
                                                : 'Only class teacher can edit attendance and remarks.'
                                            }
                                        </p>
                                    </div>
                                    {!isClassTeacher && (
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                                            Class Teacher Only
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Days Present <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        value={reportCard.days_present === undefined || reportCard.days_present === null ? '' : reportCard.days_present}
                                        onChange={(e) => {
                                            if (!isClassTeacher) return;
                                            const rawValue = e.target.value;
                                            const value = rawValue === '' ? undefined : parseInt(rawValue);
                                            const finalValue = isNaN(value) ? undefined : value;
                                            setReportCard({ ...reportCard, days_present: finalValue });
                                            setReportCardErrors(prev => ({
                                                ...prev,
                                                days_present: finalValue === undefined
                                            }));
                                        }}
                                        disabled={!isClassTeacher}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${!isClassTeacher ? 'bg-slate-100 cursor-not-allowed' : ''} ${reportCardErrors.days_present
                                            ? 'border-red-500 bg-red-50'
                                            : 'border-slate-300'
                                            }`}
                                        placeholder={!isClassTeacher ? "Only class teacher can edit" : "Enter number of days"}
                                    />
                                    {reportCardErrors.days_present && isClassTeacher && (
                                        <p className="mt-1 text-sm text-red-600">Enter number of days present</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Days Absent <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        value={reportCard.days_absent === undefined || reportCard.days_absent === null ? '' : reportCard.days_absent}
                                        onChange={(e) => {
                                            if (!isClassTeacher) return;
                                            const rawValue = e.target.value;
                                            const value = rawValue === '' ? undefined : parseInt(rawValue);
                                            const finalValue = isNaN(value) ? undefined : value;
                                            setReportCard({ ...reportCard, days_absent: finalValue });
                                            setReportCardErrors(prev => ({
                                                ...prev,
                                                days_absent: finalValue === undefined
                                            }));
                                        }}
                                        disabled={!isClassTeacher}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${!isClassTeacher ? 'bg-slate-100 cursor-not-allowed' : ''} ${reportCardErrors.days_absent
                                            ? 'border-red-500 bg-red-50'
                                            : 'border-slate-300'
                                            }`}
                                        placeholder={!isClassTeacher ? "Only class teacher can edit" : "Enter number (0 for none)"}
                                    />
                                    {reportCardErrors.days_absent && isClassTeacher && (
                                        <p className="mt-1 text-sm text-red-600">Enter number of days absent (0 for none)</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Days Late <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        value={reportCard.days_late === undefined || reportCard.days_late === null ? '' : reportCard.days_late}
                                        onChange={(e) => {
                                            if (!isClassTeacher) return;
                                            const rawValue = e.target.value;
                                            const value = rawValue === '' ? undefined : parseInt(rawValue);
                                            const finalValue = isNaN(value) ? undefined : value;
                                            setReportCard({ ...reportCard, days_late: finalValue });
                                            setReportCardErrors(prev => ({
                                                ...prev,
                                                days_late: finalValue === undefined
                                            }));
                                        }}
                                        disabled={!isClassTeacher}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${!isClassTeacher ? 'bg-slate-100 cursor-not-allowed' : ''} ${reportCardErrors.days_late
                                            ? 'border-red-500 bg-red-50'
                                            : 'border-slate-300'
                                            }`}
                                        placeholder={!isClassTeacher ? "Only class teacher can edit" : "Enter number (0 for none)"}
                                    />
                                    {reportCardErrors.days_late && isClassTeacher && (
                                        <p className="mt-1 text-sm text-red-600">Enter number of days late (0 for none)</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ResultsManagement;

// import React, { useState, useEffect } from 'react';
// import { ArrowLeft, Save, X } from 'lucide-react';
// import { SubjectRecord } from '@/services/studentService';
// import { GradeConfiguration } from '@/services/gradeConfigService';
// import { Student, Assessment, ReportCardData } from '@/types/admin';

// interface ResultsManagementProps {
//     students: Student[];
//     classes: any[];
//     subjects: SubjectRecord[];
//     selectedStudent: Student | null;
//     assessments: Assessment[];
//     reportCard: ReportCardData;
//     savingResults: boolean;
//     activeConfig: GradeConfiguration | null;
//     setSelectedStudent: (student: Student | null) => void;
//     setAssessments: (assessments: Assessment[]) => void;
//     setReportCard: (reportCard: ReportCardData) => void;
//     loadStudentResults: (student: Student) => Promise<void>;
//     saveAllResults: () => Promise<void>;
//     updateAssessmentScore: (subjectId: string, field: 'qa1' | 'qa2' | 'end_of_term', value: number) => void;
//     calculateGrade: (score: number, passMark?: number) => string;
//     calculateFinalScore: (qa1: number, qa2: number, endOfTerm: number, config: GradeConfiguration) => number;
//     isTeacherView?: boolean;
// }

// const ResultsManagement: React.FC<ResultsManagementProps> = ({
//     students,
//     classes,
//     subjects,
//     selectedStudent,
//     assessments,
//     reportCard,
//     savingResults,
//     activeConfig,
//     setSelectedStudent,
//     setAssessments,
//     setReportCard,
//     loadStudentResults,
//     saveAllResults,
//     updateAssessmentScore,
//     calculateGrade,
//     calculateFinalScore,
// }) => {
//     const [studentAssessmentsCount, setStudentAssessmentsCount] = useState<{ [key: string]: { qa1: number; qa2: number; endTerm: number } }>({});

//     const [reportCardErrors, setReportCardErrors] = useState<{
//         days_present: boolean;
//         days_absent: boolean;
//         days_late: boolean;
//         teacher_remarks: boolean;
//     }>({
//         days_present: false,
//         days_absent: false,
//         days_late: false,
//         teacher_remarks: false
//     });

//     // // ▼▼▼ ADD THESE RIGHT HERE ▼▼▼
//     // const predefinedRemarks = [
//     //     "Excellent performance! Keep it up.",
//     //     "Very good work. Consistent effort.",
//     //     "Satisfactory performance. Could improve.",
//     //     "Needs improvement. Focus more.",
//     //     "Good progress. Continue working hard.",
//     //     "Shows potential. Needs more attention.",
//     //     "Outstanding performance. Well done!",
//     //     "Making good progress. Keep practicing.",
//     //     "Needs to complete assignments regularly.",
//     //     "Good participation. Should study more."
//     // ];

//     const predefinedRemarks = [
//         // BEST
//         "Outstanding performance. Excellent understanding of concepts.",
//         "Very good performance. Consistent effort and strong results.",

//         // MEDIUM
//         "Average performance. Shows understanding but needs more consistency.",
//         "Fair performance. Steady progress at this stage.",
//         "Satisfactory performance. Can improve with more practice.",

//         // LOW
//         "Below average performance. Needs to focus and work harder.",
//         "Poor performance. Requires serious improvement and support."
//     ];

//     // Fetch assessment counts for all students when component loads
//     useEffect(() => {
//         const fetchAllStudentAssessments = async () => {
//             const counts: { [key: string]: { qa1: number; qa2: number; endTerm: number } } = {};

//             for (const student of students) {
//                 try {
//                     // Use the same fetchStudentAssessments function that loadStudentResults uses
//                     const response = await fetch(`http://localhost:3000/api/students/${student.id}/assessments`);
//                     if (response.ok) {
//                         const assessmentsData = await response.json();

//                         // Count assessments by type
//                         let qa1Count = 0;
//                         let qa2Count = 0;
//                         let endTermCount = 0;

//                         if (Array.isArray(assessmentsData)) {
//                             assessmentsData.forEach((assessment: any) => {
//                                 const assessmentType = assessment.assessment_type || assessment.assessmentType;
//                                 const score = assessment.score || 0;

//                                 if (score > 0) {
//                                     if (assessmentType === 'qa1') qa1Count++;
//                                     if (assessmentType === 'qa2') qa2Count++;
//                                     if (assessmentType === 'end_of_term') endTermCount++;
//                                 }
//                             });
//                         }

//                         counts[student.id] = { qa1: qa1Count, qa2: qa2Count, endTerm: endTermCount };
//                     }
//                 } catch (error) {
//                     console.error(`Error fetching assessments for student ${student.id}:`, error);
//                     counts[student.id] = { qa1: 0, qa2: 0, endTerm: 0 };
//                 }
//             }

//             setStudentAssessmentsCount(counts);
//         };

//         if (students.length > 0 && !selectedStudent) {
//             fetchAllStudentAssessments();
//         }
//     }, [students, selectedStudent]);

//     // Function to get total subjects with any score for a student
//     const getStudentCompletedSubjects = (studentId: string) => {
//         const counts = studentAssessmentsCount[studentId];
//         if (!counts) return 0;

//         // We need the actual number of subjects from the database
//         // For now, we'll use the maximum of the three counts as an approximation
//         return Math.max(counts.qa1, counts.qa2, counts.endTerm);
//     };

//     // Function to check if a student has any assessments
//     const hasAnyAssessments = (studentId: string) => {
//         const counts = studentAssessmentsCount[studentId];
//         if (!counts) return false;
//         return counts.qa1 > 0 || counts.qa2 > 0 || counts.endTerm > 0;
//     };

//     // Function to clear a specific score
//     const clearScore = (subjectId: string, field: 'qa1' | 'qa2' | 'end_of_term') => {
//         updateAssessmentScore(subjectId, field, 0);
//     };

//     // Function to check if any end_of_term scores exist
//     const hasEndOfTermScores = () => {
//         return assessments.some(assessment => assessment.end_of_term > 0);
//     };

//     // Function to validate report card fields
//     // const validateReportCard = (): boolean => {
//     //     const errors = {
//     //         days_present: !reportCard.days_present && reportCard.days_present !== 0,
//     //         days_absent: !reportCard.days_absent && reportCard.days_absent !== 0,
//     //         days_late: !reportCard.days_late && reportCard.days_late !== 0,
//     //         teacher_remarks: !reportCard.teacher_remarks.trim()
//     //     };

//     //     setReportCardErrors(errors);

//     //     // Return true if all fields are valid
//     //     return !Object.values(errors).some(error => error);
//     // };

//     // Function to validate report card fields
//     // Function to validate report card fields
//     const validateReportCard = (): boolean => {
//         const errors = {
//             days_present: reportCard.days_present === undefined || reportCard.days_present === null,
//             days_absent: reportCard.days_absent === undefined || reportCard.days_absent === null,
//             days_late: reportCard.days_late === undefined || reportCard.days_late === null,
//             teacher_remarks: !reportCard.teacher_remarks.trim()
//         };

//         setReportCardErrors(errors);

//         // Return true if all fields are valid
//         return !Object.values(errors).some(error => error);
//     };

//     return (
//         <div className="space-y-6">
//             {!selectedStudent ? (
//                 <>
//                     <h2 className="text-lg font-semibold text-slate-800">Select a Student to Enter Results</h2>

//                     <div className="space-y-8">
//                         {classes.map(cls => {
//                             const classStudents = students.filter(s => s.class?.id === cls.id);
//                             if (classStudents.length === 0) return null;

//                             return (
//                                 <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
//                                     <div className="flex items-center justify-between mb-4">
//                                         <h3 className="text-lg font-semibold text-slate-800">
//                                             {cls.name} - {cls.term} ({cls.academic_year})
//                                         </h3>
//                                         <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">
//                                             {classStudents.length} students
//                                         </span>
//                                     </div>

//                                     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
//                                         {classStudents.map((student) => {
//                                             const counts = studentAssessmentsCount[student.id] || { qa1: 0, qa2: 0, endTerm: 0 };
//                                             const completedSubjects = getStudentCompletedSubjects(student.id);
//                                             const hasScores = hasAnyAssessments(student.id);

//                                             return (
//                                                 <button
//                                                     key={student.id}
//                                                     onClick={() => loadStudentResults(student)}
//                                                     className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all text-left hover:bg-indigo-50 relative"
//                                                 >
//                                                     {/* Assessment indicators */}
//                                                     {hasScores && (
//                                                         <div className="absolute top-3 right-3 flex gap-1">
//                                                             {counts.qa1 > 0 && (
//                                                                 <div className="w-2 h-2 bg-emerald-500 rounded-full" title={`${counts.qa1} QA1 subjects`}></div>
//                                                             )}
//                                                             {counts.qa2 > 0 && (
//                                                                 <div className="w-2 h-2 bg-blue-500 rounded-full" title={`${counts.qa2} QA2 subjects`}></div>
//                                                             )}
//                                                             {counts.endTerm > 0 && (
//                                                                 <div className="w-2 h-2 bg-amber-500 rounded-full" title={`${counts.endTerm} End Term subjects`}></div>
//                                                             )}
//                                                         </div>
//                                                     )}

//                                                     <div className="flex justify-between items-start mb-2">
//                                                         <p className="font-mono text-sm text-indigo-600">{student.examNumber}</p>
//                                                         {completedSubjects > 0 && (
//                                                             <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
//                                                                 {completedSubjects} subjects
//                                                             </span>
//                                                         )}
//                                                     </div>
//                                                     <p className="font-semibold text-slate-800">{student.name}</p>
//                                                     <p className="text-sm text-slate-500">
//                                                         {student.class?.name || 'No Class'}
//                                                         {student.class?.term || 'Term 1, 2024/2025'}
//                                                     </p>

//                                                     {/* Assessment summary */}
//                                                     {hasScores && (
//                                                         <div className="mt-3 pt-3 border-t border-slate-200">
//                                                             <div className="flex justify-between text-xs">
//                                                                 <div className="flex items-center gap-1">
//                                                                     <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
//                                                                     <span className="text-slate-600">QA1:</span>
//                                                                     <span className="font-semibold text-emerald-600 ml-1">{counts.qa1}</span>
//                                                                 </div>
//                                                                 <div className="flex items-center gap-1">
//                                                                     <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
//                                                                     <span className="text-slate-600">QA2:</span>
//                                                                     <span className="font-semibold text-blue-600 ml-1">{counts.qa2}</span>
//                                                                 </div>
//                                                                 <div className="flex items-center gap-1">
//                                                                     <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
//                                                                     <span className="text-slate-600">End:</span>
//                                                                     <span className="font-semibold text-amber-600 ml-1">{counts.endTerm}</span>
//                                                                 </div>
//                                                             </div>
//                                                         </div>
//                                                     )}
//                                                 </button>
//                                             );
//                                         })}
//                                     </div>
//                                 </div>
//                             );
//                         })}

//                         {students.length === 0 && (
//                             <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
//                                 <p className="text-slate-500">No students found. Add your first student to get started.</p>
//                             </div>
//                         )}
//                     </div>
//                 </>
//             ) : (
//                 <>
//                     <div className="flex items-center justify-between">
//                         <div className="flex items-center gap-4">
//                             <button
//                                 onClick={() => setSelectedStudent(null)}
//                                 className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
//                             >
//                                 <ArrowLeft className="w-5 h-5 text-slate-600" />
//                             </button>
//                             <div>
//                                 <h2 className="text-lg font-semibold text-slate-800">{selectedStudent.name}</h2>
//                                 <p className="text-sm text-slate-500">{selectedStudent.examNumber} {selectedStudent.class?.name || 'No Class'}</p>
//                             </div>
//                         </div>
//                         {/* <button
//                             onClick={saveAllResults}
//                             disabled={savingResults}
//                             className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
//                         >
//                             {savingResults ? (
//                                 <>
//                                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                                     Saving...
//                                 </>
//                             ) : (
//                                 <>
//                                     <Save className="w-4 h-4" />
//                                     Save All Results
//                                 </>
//                             )}
//                         </button> */}
//                         <button
//                             onClick={async () => {
//                                 // Validate report card if end of term scores exist
//                                 if (hasEndOfTermScores() && !validateReportCard()) {
//                                     // Scroll to report card section if validation fails
//                                     document.querySelector('.report-card-section')?.scrollIntoView({ behavior: 'smooth' });
//                                     return;
//                                 }
//                                 await saveAllResults();
//                             }}
//                             disabled={savingResults}
//                             className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
//                         >
//                             {savingResults ? (
//                                 <>
//                                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                                     Saving...
//                                 </>
//                             ) : (
//                                 <>
//                                     <Save className="w-4 h-4" />
//                                     Save All Results
//                                 </>
//                             )}
//                         </button>
//                     </div>

//                     <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
//                         <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
//                             <h3 className="font-semibold text-slate-800">Assessment Scores</h3>
//                             <p className="text-sm text-slate-500 mt-1">
//                                 Subjects loaded from database. Previously entered scores are shown and can be edited or cleared.
//                             </p>
//                         </div>
//                         <div className="overflow-x-auto">
//                             <table className="w-full">
//                                 <thead className="bg-slate-50">
//                                     <tr>
//                                         <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Subject</th>
//                                         <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">QA1 (0-100)</th>
//                                         <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">QA2 (0-100)</th>
//                                         <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">End of Term (0-100)</th>
//                                         <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">Final Score*</th>
//                                         <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">Actions</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody className="divide-y divide-slate-100">
//                                     {assessments.map((assessment) => {
//                                         let finalScore = (assessment.qa1 + assessment.qa2 + assessment.end_of_term) / 3;
//                                         if (activeConfig) {
//                                             finalScore = calculateFinalScore(
//                                                 assessment.qa1,
//                                                 assessment.qa2,
//                                                 assessment.end_of_term,
//                                                 activeConfig
//                                             );
//                                         }

//                                         // Check which assessments have scores
//                                         const hasQa1 = assessment.qa1 > 0;
//                                         const hasQa2 = assessment.qa2 > 0;
//                                         const hasEndTerm = assessment.end_of_term > 0;
//                                         const hasAnyScore = hasQa1 || hasQa2 || hasEndTerm;

//                                         return (
//                                             <tr key={assessment.subject_id} className="hover:bg-slate-50">
//                                                 <td className="px-6 py-4 font-medium text-slate-800">{assessment.subject_name}</td>
//                                                 <td className="px-6 py-4">
//                                                     <div className="relative">
//                                                         <input
//                                                             type="number"
//                                                             min="0"
//                                                             max="100"
//                                                             value={assessment.qa1 || ''}
//                                                             onChange={(e) => updateAssessmentScore(assessment.subject_id, 'qa1', parseInt(e.target.value) || 0)}
//                                                             className={`w-20 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mx-auto block ${hasQa1 ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300'
//                                                                 }`}
//                                                         />
//                                                         {hasQa1 && (
//                                                             <div className="absolute top-3 left-3 w-2 h-2 bg-emerald-500 rounded-full"></div>
//                                                         )}
//                                                     </div>
//                                                 </td>
//                                                 <td className="px-6 py-4">
//                                                     <div className="relative">
//                                                         <input
//                                                             type="number"
//                                                             min="0"
//                                                             max="100"
//                                                             value={assessment.qa2 || ''}
//                                                             onChange={(e) => updateAssessmentScore(assessment.subject_id, 'qa2', parseInt(e.target.value) || 0)}
//                                                             className={`w-20 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mx-auto block ${hasQa2 ? 'border-blue-300 bg-blue-50' : 'border-slate-300'
//                                                                 }`}
//                                                         />
//                                                         {hasQa2 && (
//                                                             <div className="absolute top-3 left-3 w-2 h-2 bg-blue-500 rounded-full"></div>
//                                                         )}
//                                                     </div>
//                                                 </td>
//                                                 <td className="px-6 py-4">
//                                                     <div className="relative">
//                                                         <input
//                                                             type="number"
//                                                             min="0"
//                                                             max="100"
//                                                             value={assessment.end_of_term || ''}
//                                                             onChange={(e) => updateAssessmentScore(assessment.subject_id, 'end_of_term', parseInt(e.target.value) || 0)}
//                                                             className={`w-20 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mx-auto block ${hasEndTerm ? 'border-amber-300 bg-amber-50' : 'border-slate-300'
//                                                                 }`}
//                                                         />
//                                                         {hasEndTerm && (
//                                                             <div className="absolute top-3 left-3 w-2 h-2 bg-amber-500 rounded-full"></div>
//                                                         )}
//                                                     </div>
//                                                 </td>
//                                                 <td className="px-6 py-4 text-center font-semibold text-indigo-700">
//                                                     {finalScore.toFixed(1)}
//                                                 </td>
//                                                 <td className="px-6 py-4 text-center">
//                                                     {hasAnyScore && (
//                                                         <div className="flex justify-center gap-1">
//                                                             {hasQa1 && (
//                                                                 <button
//                                                                     onClick={() => clearScore(assessment.subject_id, 'qa1')}
//                                                                     className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
//                                                                     title="Clear QA1 score"
//                                                                 >
//                                                                     <X className="w-4 h-4" />
//                                                                     <span className="sr-only">Clear QA1</span>
//                                                                 </button>
//                                                             )}
//                                                             {hasQa2 && (
//                                                                 <button
//                                                                     onClick={() => clearScore(assessment.subject_id, 'qa2')}
//                                                                     className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
//                                                                     title="Clear QA2 score"
//                                                                 >
//                                                                     <X className="w-4 h-4" />
//                                                                     <span className="sr-only">Clear QA2</span>
//                                                                 </button>
//                                                             )}
//                                                             {hasEndTerm && (
//                                                                 <button
//                                                                     onClick={() => clearScore(assessment.subject_id, 'end_of_term')}
//                                                                     className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
//                                                                     title="Clear End Term score"
//                                                                 >
//                                                                     <X className="w-4 h-4" />
//                                                                     <span className="sr-only">Clear End Term</span>
//                                                                 </button>
//                                                             )}
//                                                         </div>
//                                                     )}
//                                                 </td>
//                                             </tr>
//                                         );
//                                     })}
//                                 </tbody>
//                             </table>
//                             <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-sm text-slate-500">
//                                 <div className="flex justify-between items-center">
//                                     <div>
//                                         * Final score calculated using active configuration: <span className="font-semibold">{activeConfig?.configuration_name || 'Default (Average of All)'}</span>
//                                     </div>
//                                     <div className="text-xs text-slate-600">
//                                         Tip: To remove a score, click the X button or set the value to 0 and save
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Only show Report Card Details when End of Term scores exist */}
//                     {/* {hasEndOfTermScores() && (
//                         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
//                             <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
//                                 <h3 className="font-semibold text-slate-800">Report Card Details</h3>
//                                 <p className="text-sm text-slate-500 mt-1">
//                                     Report card details are only required when entering End of Term scores.
//                                 </p>
//                             </div>
//                             <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//                                 <div>
//                                     <label className="block text-sm font-medium text-slate-700 mb-1">Days Present</label>
//                                     <input
//                                         type="number"
//                                         min="0"
//                                         value={reportCard.days_present || ''}
//                                         onChange={(e) => setReportCard({ ...reportCard, days_present: parseInt(e.target.value) || 0 })}
//                                         className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium text-slate-700 mb-1">Days Absent</label>
//                                     <input
//                                         type="number"
//                                         min="0"
//                                         value={reportCard.days_absent || ''}
//                                         onChange={(e) => setReportCard({ ...reportCard, days_absent: parseInt(e.target.value) || 0 })}
//                                         className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium text-slate-700 mb-1">Days Late</label>
//                                     <input
//                                         type="number"
//                                         min="0"
//                                         value={reportCard.days_late || ''}
//                                         onChange={(e) => setReportCard({ ...reportCard, days_late: parseInt(e.target.value) || 0 })}
//                                         className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                                     />
//                                 </div>
//                                 <div className="md:col-span-2 lg:col-span-3">
//                                     <label className="block text-sm font-medium text-slate-700 mb-1">
//                                         Teacher's Remarks
//                                     </label>
//                                     <select
//                                         value=""
//                                         onChange={(e) => e.target.value && setReportCard({ ...reportCard, teacher_remarks: e.target.value })}
//                                         className="w-full mb-2 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                                     >
//                                         <option value="">Select predefined remark</option>
//                                         {predefinedRemarks.map((remark, index) => (
//                                             <option key={index} value={remark}>{remark}</option>
//                                         ))}
//                                     </select>
//                                     <textarea
//                                         value={reportCard.teacher_remarks}
//                                         onChange={(e) => setReportCard({ ...reportCard, teacher_remarks: e.target.value })}
//                                         rows={3}
//                                         placeholder="Or type your own custom remark here..."
//                                         className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                                     />
//                                 </div>
//                             </div>
//                         </div>
//                     )} */}

//                     {/* Only show Report Card Details when End of Term scores exist */}
//                     {hasEndOfTermScores() && (
//                         <div className="report-card-section bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
//                             <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
//                                 <h3 className="font-semibold text-slate-800">Report Card Details</h3>
//                                 <p className="text-sm text-slate-500 mt-1">
//                                     Report card details are <span className="font-semibold text-red-600">REQUIRED</span> when entering End of Term scores.
//                                 </p>
//                             </div>
//                             <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//                                 {/* <div>
//                                     <label className="block text-sm font-medium text-slate-700 mb-1">
//                                         Days Present <span className="text-red-500">*</span>
//                                     </label>
//                                     <input
//                                         type="number"
//                                         min="0"
//                                         required
//                                         value={reportCard.days_present || ''}
//                                         onChange={(e) => {
//                                             const value = parseInt(e.target.value) || 0;
//                                             setReportCard({ ...reportCard, days_present: value });
//                                             setReportCardErrors(prev => ({ ...prev, days_present: !value && value !== 0 }));
//                                         }}
//                                         className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${reportCardErrors.days_present
//                                                 ? 'border-red-500 bg-red-50'
//                                                 : 'border-slate-300'
//                                             }`}
//                                     />
//                                     {reportCardErrors.days_present && (
//                                         <p className="mt-1 text-sm text-red-600">Days Present is required</p>
//                                     )}
//                                 </div> */}
//                                 <div>
//                                     <label className="block text-sm font-medium text-slate-700 mb-1">
//                                         Days Present <span className="text-red-500">*</span>
//                                     </label>
//                                     <input
//                                         type="number"
//                                         min="0"
//                                         required
//                                         value={reportCard.days_present === undefined || reportCard.days_present === null ? '' : reportCard.days_present}
//                                         onChange={(e) => {
//                                             const rawValue = e.target.value;
//                                             const value = rawValue === '' ? undefined : parseInt(rawValue);
//                                             // Check if it's a valid number (not NaN)
//                                             const finalValue = isNaN(value) ? undefined : value;
//                                             setReportCard({ ...reportCard, days_present: finalValue });
//                                             setReportCardErrors(prev => ({
//                                                 ...prev,
//                                                 days_present: finalValue === undefined
//                                             }));
//                                         }}
//                                         className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${reportCardErrors.days_present
//                                             ? 'border-red-500 bg-red-50'
//                                             : 'border-slate-300'
//                                             }`}
//                                     />
//                                     {reportCardErrors.days_present && (
//                                         <p className="mt-1 text-sm text-red-600">Enter number of days present</p>
//                                     )}
//                                 </div>
//                                 {/* <div>
//                                     <label className="block text-sm font-medium text-slate-700 mb-1">
//                                         Days Absent <span className="text-red-500">*</span>
//                                     </label>
//                                     <input
//                                         type="number"
//                                         min="0"
//                                         required
//                                         value={reportCard.days_absent || ''}
//                                         onChange={(e) => {
//                                             const value = parseInt(e.target.value) || 0;
//                                             setReportCard({ ...reportCard, days_absent: value });
//                                             setReportCardErrors(prev => ({ ...prev, days_absent: !value && value !== 0 }));
//                                         }}
//                                         className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${reportCardErrors.days_absent
//                                                 ? 'border-red-500 bg-red-50'
//                                                 : 'border-slate-300'
//                                             }`}
//                                     />
//                                     {reportCardErrors.days_absent && (
//                                         <p className="mt-1 text-sm text-red-600">Days Absent is required</p>
//                                     )}
//                                 </div> */}

//                                 <div>
//                                     <label className="block text-sm font-medium text-slate-700 mb-1">
//                                         Days Absent <span className="text-red-500">*</span>
//                                     </label>
//                                     <input
//                                         type="number"
//                                         min="0"
//                                         required
//                                         value={reportCard.days_absent === undefined || reportCard.days_absent === null ? '' : reportCard.days_absent}
//                                         onChange={(e) => {
//                                             const rawValue = e.target.value;
//                                             const value = rawValue === '' ? undefined : parseInt(rawValue);
//                                             const finalValue = isNaN(value) ? undefined : value;
//                                             setReportCard({ ...reportCard, days_absent: finalValue });
//                                             setReportCardErrors(prev => ({
//                                                 ...prev,
//                                                 days_absent: finalValue === undefined
//                                             }));
//                                         }}
//                                         className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${reportCardErrors.days_absent
//                                             ? 'border-red-500 bg-red-50'
//                                             : 'border-slate-300'
//                                             }`}
//                                         placeholder="Enter number (0 for none)"
//                                     />
//                                     {reportCardErrors.days_absent && (
//                                         <p className="mt-1 text-sm text-red-600">Enter number of days absent (0 for none)</p>
//                                     )}
//                                 </div>
//                                 {/* <div>
//                                     <label className="block text-sm font-medium text-slate-700 mb-1">
//                                         Days Late <span className="text-red-500">*</span>
//                                     </label>
//                                     <input
//                                         type="number"
//                                         min="0"
//                                         required
//                                         value={reportCard.days_late || ''}
//                                         onChange={(e) => {
//                                             const value = parseInt(e.target.value) || 0;
//                                             setReportCard({ ...reportCard, days_late: value });
//                                             setReportCardErrors(prev => ({ ...prev, days_late: !value && value !== 0 }));
//                                         }}
//                                         className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${reportCardErrors.days_late
//                                                 ? 'border-red-500 bg-red-50'
//                                                 : 'border-slate-300'
//                                             }`}
//                                     />
//                                     {reportCardErrors.days_late && (
//                                         <p className="mt-1 text-sm text-red-600">Days Late is required</p>
//                                     )}
//                                 </div> */}

//                                 <div>
//                                     <label className="block text-sm font-medium text-slate-700 mb-1">
//                                         Days Late <span className="text-red-500">*</span>
//                                     </label>
//                                     <input
//                                         type="number"
//                                         min="0"
//                                         required
//                                         value={reportCard.days_late === undefined || reportCard.days_late === null ? '' : reportCard.days_late}
//                                         onChange={(e) => {
//                                             const rawValue = e.target.value;
//                                             const value = rawValue === '' ? undefined : parseInt(rawValue);
//                                             const finalValue = isNaN(value) ? undefined : value;
//                                             setReportCard({ ...reportCard, days_late: finalValue });
//                                             setReportCardErrors(prev => ({
//                                                 ...prev,
//                                                 days_late: finalValue === undefined
//                                             }));
//                                         }}
//                                         className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${reportCardErrors.days_late
//                                             ? 'border-red-500 bg-red-50'
//                                             : 'border-slate-300'
//                                             }`}
//                                         placeholder="Enter number (0 for none)"
//                                     />
//                                     {reportCardErrors.days_late && (
//                                         <p className="mt-1 text-sm text-red-600">Enter number of days late (0 for none)</p>
//                                     )}
//                                 </div>
//                                 <div className="md:col-span-2 lg:col-span-3">
//                                     <label className="block text-sm font-medium text-slate-700 mb-1">
//                                         Teacher's Remarks <span className="text-red-500">*</span>
//                                     </label>
//                                     <select
//                                         value=""
//                                         onChange={(e) => {
//                                             if (e.target.value) {
//                                                 setReportCard({ ...reportCard, teacher_remarks: e.target.value });
//                                                 setReportCardErrors(prev => ({ ...prev, teacher_remarks: !e.target.value.trim() }));
//                                             }
//                                         }}
//                                         className={`w-full mb-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${reportCardErrors.teacher_remarks
//                                             ? 'border-red-500 bg-red-50'
//                                             : 'border-slate-300'
//                                             }`}
//                                     >
//                                         <option value="">Select predefined remark</option>
//                                         {predefinedRemarks.map((remark, index) => (
//                                             <option key={index} value={remark}>{remark}</option>
//                                         ))}
//                                     </select>
//                                     <textarea
//                                         value={reportCard.teacher_remarks}
//                                         required
//                                         onChange={(e) => {
//                                             setReportCard({ ...reportCard, teacher_remarks: e.target.value });
//                                             setReportCardErrors(prev => ({ ...prev, teacher_remarks: !e.target.value.trim() }));
//                                         }}
//                                         rows={3}
//                                         placeholder="Or type your own custom remark here..."
//                                         className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${reportCardErrors.teacher_remarks
//                                             ? 'border-red-500 bg-red-50'
//                                             : 'border-slate-300'
//                                             }`}
//                                     />
//                                     {reportCardErrors.teacher_remarks && (
//                                         <p className="mt-1 text-sm text-red-600">Teacher's Remarks is required</p>
//                                     )}

//                                     {/* Validation summary */}
//                                     {/* {(reportCardErrors.days_present || reportCardErrors.days_absent || reportCardErrors.days_late || reportCardErrors.teacher_remarks) && (
//                                         <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
//                                             <p className="text-sm font-medium text-red-800">
//                                                 ⚠️ Please fill in all required report card fields before saving.
//                                             </p>
//                                         </div>
//                                     )} */}
//                                     {/* Validation summary */}
//                                     {(reportCardErrors.days_present || reportCardErrors.days_absent || reportCardErrors.days_late || reportCardErrors.teacher_remarks) && (
//                                         <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
//                                             <p className="text-sm font-medium text-red-800">
//                                                 ⚠️ All report card fields are required when entering End of Term scores.
//                                                 <span className="font-normal block mt-1">
//                                                     • Enter <strong>0</strong> for days if the student had perfect attendance/no absences/no late days
//                                                     <br />
//                                                     • Or enter the actual number of days
//                                                     <br />
//                                                     • Teacher's remarks cannot be empty
//                                                 </span>
//                                             </p>
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </>
//             )}
//         </div>
//     );
// };

// export default ResultsManagement;

// // // import React, { useState, useEffect } from 'react';
// // // import { ArrowLeft, Save } from 'lucide-react';
// // // import { SubjectRecord } from '@/services/studentService';
// // // import { GradeConfiguration } from '@/services/gradeConfigService';
// // // import { Student, Assessment, ReportCardData } from '@/types/admin';

// // <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
// //                         <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
// //                             <h3 className="font-semibold text-slate-800">Report Card Details</h3>
// //                         </div>
// //                         <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
// //                             <div>
// //                                 <label className="block text-sm font-medium text-slate-700 mb-1">Days Present</label>
// //                                 <input
// //                                     type="number"
// //                                     min="0"
// //                                     value={reportCard.days_present || ''}
// //                                     onChange={(e) => setReportCard({ ...reportCard, days_present: parseInt(e.target.value) || 0 })}
// //                                     className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"

// //                                 />
// //                             </div>
// //                             <div>
// //                                 <label className="block text-sm font-medium text-slate-700 mb-1">Days Absent</label>
// //                                 <input
// //                                     type="number"
// //                                     min="0"
// //                                     value={reportCard.days_absent || ''}
// //                                     onChange={(e) => setReportCard({ ...reportCard, days_absent: parseInt(e.target.value) || 0 })}
// //                                     className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
// //                                 />
// //                             </div>
// //                             <div>
// //                                 <label className="block text-sm font-medium text-slate-700 mb-1">Days Late</label>
// //                                 <input
// //                                     type="number"
// //                                     min="0"
// //                                     value={reportCard.days_late || ''}
// //                                     onChange={(e) => setReportCard({ ...reportCard, days_late: parseInt(e.target.value) || 0 })}
// //                                     className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
// //                                 />
// //                             </div>
// //                             {/* <div className="md:col-span-2 lg:col-span-3">
// //                                 <label className="block text-sm font-medium text-slate-700 mb-1">Teacher's Remarks</label>
// //                                 <textarea
// //                                     value={reportCard.teacher_remarks}
// //                                     onChange={(e) => setReportCard({ ...reportCard, teacher_remarks: e.target.value })}
// //                                     rows={3}
// //                                     placeholder="Enter teacher's remarks for this student..."
// //                                     className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
// //                                 />
// //                             </div> */}

// //                             <div className="md:col-span-2 lg:col-span-3">
// //                                 <label className="block text-sm font-medium text-slate-700 mb-1">
// //                                     Teacher's Remarks
// //                                 </label>
// //                                 <select
// //                                     value=""
// //                                     onChange={(e) => e.target.value && setReportCard({ ...reportCard, teacher_remarks: e.target.value })}
// //                                     className="w-full mb-2 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
// //                                 >
// //                                     <option value="">Select predefined remark</option>
// //                                     {predefinedRemarks.map((remark, index) => (
// //                                         <option key={index} value={remark}>{remark}</option>
// //                                     ))}
// //                                 </select>
// //                                 <textarea
// //                                     value={reportCard.teacher_remarks}
// //                                     onChange={(e) => setReportCard({ ...reportCard, teacher_remarks: e.target.value })}
// //                                     rows={3}
// //                                     placeholder="Or type your own custom remark here..."
// //                                     className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
// //                                 />
// //                             </div>

// //                         </div>
// //                     </div>

// // interface ResultsManagementProps {
// //     students: Student[];
// //     classes: any[];
// //     subjects: SubjectRecord[];
// //     selectedStudent: Student | null;
// //     assessments: Assessment[];
// //     reportCard: ReportCardData;
// //     savingResults: boolean;
// //     activeConfig: GradeConfiguration | null;
// //     setSelectedStudent: (student: Student | null) => void;
// //     setAssessments: (assessments: Assessment[]) => void;
// //     setReportCard: (reportCard: ReportCardData) => void;
// //     loadStudentResults: (student: Student) => Promise<void>;
// //     saveAllResults: () => Promise<void>;
// //     updateAssessmentScore: (subjectId: string, field: 'qa1' | 'qa2' | 'end_of_term', value: number) => void;
// //     calculateGrade: (score: number, passMark?: number) => string;
// //     calculateFinalScore: (qa1: number, qa2: number, endOfTerm: number, config: GradeConfiguration) => number;
// // }

// // const ResultsManagement: React.FC<ResultsManagementProps> = ({
// //     students,
// //     classes,
// //     subjects,
// //     selectedStudent,
// //     assessments,
// //     reportCard,
// //     savingResults,
// //     activeConfig,
// //     setSelectedStudent,
// //     setAssessments,
// //     setReportCard,
// //     loadStudentResults,
// //     saveAllResults,
// //     updateAssessmentScore,
// //     calculateGrade,
// //     calculateFinalScore,
// // }) => {
// //     const [studentAssessmentsCount, setStudentAssessmentsCount] = useState<{ [key: string]: { qa1: number; qa2: number; endTerm: number } }>({});

// //     // Fetch assessment counts for all students when component loads
// //     useEffect(() => {
// //         const fetchAllStudentAssessments = async () => {
// //             const counts: { [key: string]: { qa1: number; qa2: number; endTerm: number } } = {};

// //             for (const student of students) {
// //                 try {
// //                     // Use the same fetchStudentAssessments function that loadStudentResults uses
// //                     const response = await fetch(`http://localhost:3000/api/students/${student.id}/assessments`);
// //                     if (response.ok) {
// //                         const assessmentsData = await response.json();

// //                         // Count assessments by type
// //                         let qa1Count = 0;
// //                         let qa2Count = 0;
// //                         let endTermCount = 0;

// //                         if (Array.isArray(assessmentsData)) {
// //                             assessmentsData.forEach((assessment: any) => {
// //                                 const assessmentType = assessment.assessment_type || assessment.assessmentType;
// //                                 const score = assessment.score || 0;

// //                                 if (score > 0) {
// //                                     if (assessmentType === 'qa1') qa1Count++;
// //                                     if (assessmentType === 'qa2') qa2Count++;
// //                                     if (assessmentType === 'end_of_term') endTermCount++;
// //                                 }
// //                             });
// //                         }

// //                         counts[student.id] = { qa1: qa1Count, qa2: qa2Count, endTerm: endTermCount };
// //                     }
// //                 } catch (error) {
// //                     console.error(`Error fetching assessments for student ${student.id}:`, error);
// //                     counts[student.id] = { qa1: 0, qa2: 0, endTerm: 0 };
// //                 }
// //             }

// //             setStudentAssessmentsCount(counts);
// //         };

// //         if (students.length > 0 && !selectedStudent) {
// //             fetchAllStudentAssessments();
// //         }
// //     }, [students, selectedStudent]);

// //     // Function to get total subjects with any score for a student
// //     const getStudentCompletedSubjects = (studentId: string) => {
// //         const counts = studentAssessmentsCount[studentId];
// //         if (!counts) return 0;

// //         // We need the actual number of subjects from the database
// //         // For now, we'll use the maximum of the three counts as an approximation
// //         return Math.max(counts.qa1, counts.qa2, counts.endTerm);
// //     };

// //     // Function to check if a student has any assessments
// //     const hasAnyAssessments = (studentId: string) => {
// //         const counts = studentAssessmentsCount[studentId];
// //         if (!counts) return false;
// //         return counts.qa1 > 0 || counts.qa2 > 0 || counts.endTerm > 0;
// //     };

// //     return (
// //         <div className="space-y-6">
// //             {!selectedStudent ? (
// //                 <>
// //                     <h2 className="text-lg font-semibold text-slate-800">Select a Student to Enter Results</h2>

// //                     <div className="space-y-8">
// //                         {classes.map(cls => {
// //                             const classStudents = students.filter(s => s.class?.id === cls.id);
// //                             if (classStudents.length === 0) return null;

// //                             return (
// //                                 <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
// //                                     <div className="flex items-center justify-between mb-4">
// //                                         <h3 className="text-lg font-semibold text-slate-800">
// //                                             {cls.name} - {cls.term} ({cls.academic_year})
// //                                         </h3>
// //                                         <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">
// //                                             {classStudents.length} students
// //                                         </span>
// //                                     </div>

// //                                     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
// //                                         {classStudents.map((student) => {
// //                                             const counts = studentAssessmentsCount[student.id] || { qa1: 0, qa2: 0, endTerm: 0 };
// //                                             const completedSubjects = getStudentCompletedSubjects(student.id);
// //                                             const hasScores = hasAnyAssessments(student.id);

// //                                             return (
// //                                                 <button
// //                                                     key={student.id}
// //                                                     onClick={() => loadStudentResults(student)}
// //                                                     className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all text-left hover:bg-indigo-50 relative"
// //                                                 >
// //                                                     {/* Assessment indicators */}
// //                                                     {hasScores && (
// //                                                         <div className="absolute top-3 right-3 flex gap-1">
// //                                                             {counts.qa1 > 0 && (
// //                                                                 <div className="w-2 h-2 bg-emerald-500 rounded-full" title={`${counts.qa1} QA1 subjects`}></div>
// //                                                             )}
// //                                                             {counts.qa2 > 0 && (
// //                                                                 <div className="w-2 h-2 bg-blue-500 rounded-full" title={`${counts.qa2} QA2 subjects`}></div>
// //                                                             )}
// //                                                             {counts.endTerm > 0 && (
// //                                                                 <div className="w-2 h-2 bg-amber-500 rounded-full" title={`${counts.endTerm} End Term subjects`}></div>
// //                                                             )}
// //                                                         </div>
// //                                                     )}

// //                                                     <div className="flex justify-between items-start mb-2">
// //                                                         <p className="font-mono text-sm text-indigo-600">{student.examNumber}</p>
// //                                                         {completedSubjects > 0 && (
// //                                                             <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
// //                                                                 {completedSubjects} subjects
// //                                                             </span>
// //                                                         )}
// //                                                     </div>
// //                                                     <p className="font-semibold text-slate-800">{student.name}</p>
// //                                                     <p className="text-sm text-slate-500">
// //                                                         {student.class?.name || 'No Class'}
// //                                                         {student.class?.term || 'Term 1, 2024/2025'}
// //                                                     </p>

// //                                                     {/* Assessment summary */}
// //                                                     {hasScores && (
// //                                                         <div className="mt-3 pt-3 border-t border-slate-200">
// //                                                             <div className="flex justify-between text-xs">
// //                                                                 <div className="flex items-center gap-1">
// //                                                                     <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
// //                                                                     <span className="text-slate-600">QA1:</span>
// //                                                                     <span className="font-semibold text-emerald-600 ml-1">{counts.qa1}</span>
// //                                                                 </div>
// //                                                                 <div className="flex items-center gap-1">
// //                                                                     <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
// //                                                                     <span className="text-slate-600">QA2:</span>
// //                                                                     <span className="font-semibold text-blue-600 ml-1">{counts.qa2}</span>
// //                                                                 </div>
// //                                                                 <div className="flex items-center gap-1">
// //                                                                     <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
// //                                                                     <span className="text-slate-600">End:</span>
// //                                                                     <span className="font-semibold text-amber-600 ml-1">{counts.endTerm}</span>
// //                                                                 </div>
// //                                                             </div>
// //                                                         </div>
// //                                                     )}
// //                                                 </button>
// //                                             );
// //                                         })}
// //                                     </div>
// //                                 </div>
// //                             );
// //                         })}

// //                         {students.length === 0 && (
// //                             <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
// //                                 <p className="text-slate-500">No students found. Add your first student to get started.</p>
// //                             </div>
// //                         )}
// //                     </div>
// //                 </>
// //             ) : (
// //                 <>
// //                     <div className="flex items-center justify-between">
// //                         <div className="flex items-center gap-4">
// //                             <button
// //                                 onClick={() => setSelectedStudent(null)}
// //                                 className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
// //                             >
// //                                 <ArrowLeft className="w-5 h-5 text-slate-600" />
// //                             </button>
// //                             <div>
// //                                 <h2 className="text-lg font-semibold text-slate-800">{selectedStudent.name}</h2>
// //                                 <p className="text-sm text-slate-500">{selectedStudent.examNumber} {selectedStudent.class?.name || 'No Class'}</p>
// //                             </div>
// //                         </div>
// //                         <button
// //                             onClick={saveAllResults}
// //                             disabled={savingResults}
// //                             className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
// //                         >
// //                             {savingResults ? (
// //                                 <>
// //                                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
// //                                     Saving...
// //                                 </>
// //                             ) : (
// //                                 <>
// //                                     <Save className="w-4 h-4" />
// //                                     Save All Results
// //                                 </>
// //                             )}
// //                         </button>
// //                     </div>

// //                     <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
// //                         <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
// //                             <h3 className="font-semibold text-slate-800">Assessment Scores</h3>
// //                             <p className="text-sm text-slate-500 mt-1">
// //                                 Subjects loaded from database. Previously entered scores are shown and can be edited.
// //                             </p>
// //                         </div>
// //                         <div className="overflow-x-auto">
// //                             <table className="w-full">
// //                                 <thead className="bg-slate-50">
// //                                     <tr>
// //                                         <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Subject</th>
// //                                         <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">QA1 (0-100)</th>
// //                                         <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">QA2 (0-100)</th>
// //                                         <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">End of Term (0-100)</th>
// //                                         <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">Final Score*</th>
// //                                     </tr>
// //                                 </thead>
// //                                 <tbody className="divide-y divide-slate-100">
// //                                     {assessments.map((assessment) => {
// //                                         let finalScore = (assessment.qa1 + assessment.qa2 + assessment.end_of_term) / 3;
// //                                         if (activeConfig) {
// //                                             finalScore = calculateFinalScore(
// //                                                 assessment.qa1,
// //                                                 assessment.qa2,
// //                                                 assessment.end_of_term,
// //                                                 activeConfig
// //                                             );
// //                                         }

// //                                         // Check which assessments have scores
// //                                         const hasQa1 = assessment.qa1 > 0;
// //                                         const hasQa2 = assessment.qa2 > 0;
// //                                         const hasEndTerm = assessment.end_of_term > 0;

// //                                         return (
// //                                             <tr key={assessment.subject_id} className="hover:bg-slate-50">
// //                                                 <td className="px-6 py-4 font-medium text-slate-800">{assessment.subject_name}</td>
// //                                                 <td className="px-6 py-4">
// //                                                     <div className="relative">
// //                                                         <input
// //                                                             type="number"
// //                                                             min="0"
// //                                                             max="100"
// //                                                             value={assessment.qa1 || ''}
// //                                                             onChange={(e) => updateAssessmentScore(assessment.subject_id, 'qa1', parseInt(e.target.value) || 0)}
// //                                                             className={`w-20 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mx-auto block ${hasQa1 ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300'
// //                                                                 }`}
// //                                                         />
// //                                                         {hasQa1 && (
// //                                                             <div className="absolute top-3 left-3 w-2 h-2 bg-emerald-500 rounded-full"></div>
// //                                                         )}
// //                                                     </div>
// //                                                 </td>
// //                                                 <td className="px-6 py-4">
// //                                                     <div className="relative">
// //                                                         <input
// //                                                             type="number"
// //                                                             min="0"
// //                                                             max="100"
// //                                                             value={assessment.qa2 || ''}
// //                                                             onChange={(e) => updateAssessmentScore(assessment.subject_id, 'qa2', parseInt(e.target.value) || 0)}
// //                                                             className={`w-20 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mx-auto block ${hasQa2 ? 'border-blue-300 bg-blue-50' : 'border-slate-300'
// //                                                                 }`}
// //                                                         />
// //                                                         {hasQa2 && (
// //                                                             <div className="absolute top-3 left-3 w-2 h-2 bg-blue-500 rounded-full"></div>
// //                                                         )}
// //                                                     </div>
// //                                                 </td>
// //                                                 <td className="px-6 py-4">
// //                                                     <div className="relative">
// //                                                         <input
// //                                                             type="number"
// //                                                             min="0"
// //                                                             max="100"
// //                                                             value={assessment.end_of_term || ''}
// //                                                             onChange={(e) => updateAssessmentScore(assessment.subject_id, 'end_of_term', parseInt(e.target.value) || 0)}
// //                                                             className={`w-20 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mx-auto block ${hasEndTerm ? 'border-amber-300 bg-amber-50' : 'border-slate-300'
// //                                                                 }`}
// //                                                         />
// //                                                         {hasEndTerm && (
// //                                                             <div className="absolute top-3 left-3 w-2 h-2 bg-amber-500 rounded-full"></div>
// //                                                         )}
// //                                                     </div>
// //                                                 </td>
// //                                                 <td className="px-6 py-4 text-center font-semibold text-indigo-700">
// //                                                     {finalScore.toFixed(1)}
// //                                                 </td>
// //                                             </tr>
// //                                         );
// //                                     })}
// //                                 </tbody>
// //                             </table>
// //                             <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-sm text-slate-500">
// //                                 * Final score calculated using active configuration: {activeConfig?.configuration_name || 'Default (Average of All)'}
// //                             </div>
// //                         </div>
// //                     </div>

// //                     <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
// //                         <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
// //                             <h3 className="font-semibold text-slate-800">Report Card Details</h3>
// //                         </div>
// //                         <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
// //                             <div>
// //                                 <label className="block text-sm font-medium text-slate-700 mb-1">Days Present</label>
// //                                 <input
// //                                     type="number"
// //                                     min="0"
// //                                     value={reportCard.days_present || ''}
// //                                     onChange={(e) => setReportCard({ ...reportCard, days_present: parseInt(e.target.value) || 0 })}
// //                                     className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"

// //                                 />
// //                             </div>
// //                             <div>
// //                                 <label className="block text-sm font-medium text-slate-700 mb-1">Days Absent</label>
// //                                 <input
// //                                     type="number"
// //                                     min="0"
// //                                     value={reportCard.days_absent || ''}
// //                                     onChange={(e) => setReportCard({ ...reportCard, days_absent: parseInt(e.target.value) || 0 })}
// //                                     className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
// //                                 />
// //                             </div>
// //                             <div>
// //                                 <label className="block text-sm font-medium text-slate-700 mb-1">Days Late</label>
// //                                 <input
// //                                     type="number"
// //                                     min="0"
// //                                     value={reportCard.days_late || ''}
// //                                     onChange={(e) => setReportCard({ ...reportCard, days_late: parseInt(e.target.value) || 0 })}
// //                                     className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
// //                                 />
// //                             </div>
// //                             <div className="md:col-span-2 lg:col-span-3">
// //                                 <label className="block text-sm font-medium text-slate-700 mb-1">Teacher's Remarks</label>
// //                                 <textarea
// //                                     value={reportCard.teacher_remarks}
// //                                     onChange={(e) => setReportCard({ ...reportCard, teacher_remarks: e.target.value })}
// //                                     rows={3}
// //                                     placeholder="Enter teacher's remarks for this student..."
// //                                     className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
// //                                 />
// //                             </div>
// //                         </div>
// //                     </div>
// //                 </>
// //             )}
// //         </div>
// //     );
// // };

// // export default ResultsManagement;


// // // import React from 'react';
// // // import { ArrowLeft, Save } from 'lucide-react';
// // // import { SubjectRecord } from '@/services/studentService';
// // // import { GradeConfiguration } from '@/services/gradeConfigService';
// // // import { Student, Assessment, ReportCardData } from '@/types/admin';

// // // interface ResultsManagementProps {
// // //     students: Student[];
// // //     classes: any[];
// // //     subjects: SubjectRecord[];
// // //     selectedStudent: Student | null;
// // //     assessments: Assessment[];
// // //     reportCard: ReportCardData;
// // //     savingResults: boolean;
// // //     activeConfig: GradeConfiguration | null;
// // //     setSelectedStudent: (student: Student | null) => void;
// // //     setAssessments: (assessments: Assessment[]) => void;
// // //     setReportCard: (reportCard: ReportCardData) => void;
// // //     loadStudentResults: (student: Student) => Promise<void>;
// // //     saveAllResults: () => Promise<void>;
// // //     updateAssessmentScore: (subjectId: string, field: 'qa1' | 'qa2' | 'end_of_term', value: number) => void;
// // //     calculateGrade: (score: number, passMark?: number) => string;
// // //     calculateFinalScore: (qa1: number, qa2: number, endOfTerm: number, config: GradeConfiguration) => number;
// // // }

// // // const ResultsManagement: React.FC<ResultsManagementProps> = ({
// // //     students,
// // //     classes,
// // //     subjects,
// // //     selectedStudent,
// // //     assessments,
// // //     reportCard,
// // //     savingResults,
// // //     activeConfig,
// // //     setSelectedStudent,
// // //     setAssessments,
// // //     setReportCard,
// // //     loadStudentResults,
// // //     saveAllResults,
// // //     updateAssessmentScore,
// // //     calculateGrade,
// // //     calculateFinalScore,
// // // }) => {
// // //     return (
// // //         <div className="space-y-6">
// // //             {!selectedStudent ? (
// // //                 <>
// // //                     <h2 className="text-lg font-semibold text-slate-800">Select a Student to Enter Results</h2>

// // //                     <div className="space-y-8">
// // //                         {classes.map(cls => {
// // //                             const classStudents = students.filter(s => s.class?.id === cls.id);
// // //                             if (classStudents.length === 0) return null;

// // //                             return (
// // //                                 <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
// // //                                     <div className="flex items-center justify-between mb-4">
// // //                                         <h3 className="text-lg font-semibold text-slate-800">
// // //                                             {cls.name} - {cls.term} ({cls.academic_year})
// // //                                         </h3>
// // //                                         <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">
// // //                                             {classStudents.length} students
// // //                                         </span>
// // //                                     </div>

// // //                                     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
// // //                                         {classStudents.map((student) => (
// // //                                             <button
// // //                                                 key={student.id}
// // //                                                 onClick={() => loadStudentResults(student)}
// // //                                                 className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all text-left hover:bg-indigo-50"
// // //                                             >
// // //                                                 <p className="font-mono text-sm text-indigo-600 mb-1">{student.examNumber}</p>
// // //                                                 <p className="font-semibold text-slate-800">{student.name}</p>
// // //                                                 <p className="text-sm text-slate-500">
// // //                                                     {student.class?.name || 'No Class'}
// // //                                                     {student.class?.term || 'Term 1, 2024/2025'}
// // //                                                 </p>
// // //                                             </button>
// // //                                         ))}
// // //                                     </div>
// // //                                 </div>
// // //                             );
// // //                         })}

// // //                         {students.length === 0 && (
// // //                             <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
// // //                                 <p className="text-slate-500">No students found. Add your first student to get started.</p>
// // //                             </div>
// // //                         )}
// // //                     </div>
// // //                 </>
// // //             ) : (
// // //                 <>
// // //                     <div className="flex items-center justify-between">
// // //                         <div className="flex items-center gap-4">
// // //                             <button
// // //                                 onClick={() => setSelectedStudent(null)}
// // //                                 className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
// // //                             >
// // //                                 <ArrowLeft className="w-5 h-5 text-slate-600" />
// // //                             </button>
// // //                             <div>
// // //                                 <h2 className="text-lg font-semibold text-slate-800">{selectedStudent.name}</h2>
// // //                                 <p className="text-sm text-slate-500">{selectedStudent.examNumber} {selectedStudent.class?.name || 'No Class'}</p>
// // //                             </div>
// // //                         </div>
// // //                         <button
// // //                             onClick={saveAllResults}
// // //                             disabled={savingResults}
// // //                             className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
// // //                         >
// // //                             {savingResults ? (
// // //                                 <>
// // //                                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
// // //                                     Saving...
// // //                                 </>
// // //                             ) : (
// // //                                 <>
// // //                                     <Save className="w-4 h-4" />
// // //                                     Save All Results
// // //                                 </>
// // //                             )}
// // //                         </button>
// // //                     </div>

// // //                     <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
// // //                         <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
// // //                             <h3 className="font-semibold text-slate-800">Assessment Scores</h3>
// // //                             <p className="text-sm text-slate-500 mt-1">
// // //                                 Subjects loaded from database. Previously entered scores are shown and can be edited.
// // //                             </p>
// // //                         </div>
// // //                         <div className="overflow-x-auto">
// // //                             <table className="w-full">
// // //                                 <thead className="bg-slate-50">
// // //                                     <tr>
// // //                                         <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Subject</th>
// // //                                         <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">QA1 (0-100)</th>
// // //                                         <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">QA2 (0-100)</th>
// // //                                         <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">End of Term (0-100)</th>
// // //                                         <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">Final Score*</th>
// // //                                     </tr>
// // //                                 </thead>
// // //                                 <tbody className="divide-y divide-slate-100">
// // //                                     {assessments.map((assessment) => {
// // //                                         let finalScore = (assessment.qa1 + assessment.qa2 + assessment.end_of_term) / 3;
// // //                                         if (activeConfig) {
// // //                                             finalScore = calculateFinalScore(
// // //                                                 assessment.qa1,
// // //                                                 assessment.qa2,
// // //                                                 assessment.end_of_term,
// // //                                                 activeConfig
// // //                                             );
// // //                                         }

// // //                                         // Check which assessments have scores
// // //                                         const hasQa1 = assessment.qa1 > 0;
// // //                                         const hasQa2 = assessment.qa2 > 0;
// // //                                         const hasEndTerm = assessment.end_of_term > 0;

// // //                                         return (
// // //                                             <tr key={assessment.subject_id} className="hover:bg-slate-50">
// // //                                                 <td className="px-6 py-4 font-medium text-slate-800">{assessment.subject_name}</td>
// // //                                                 <td className="px-6 py-4">
// // //                                                     <div className="relative">
// // //                                                         <input
// // //                                                             type="number"
// // //                                                             min="0"
// // //                                                             max="100"
// // //                                                             value={assessment.qa1 || ''}
// // //                                                             onChange={(e) => updateAssessmentScore(assessment.subject_id, 'qa1', parseInt(e.target.value) || 0)}
// // //                                                             className={`w-20 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mx-auto block ${hasQa1 ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300'
// // //                                                                 }`}
// // //                                                         />
// // //                                                         {hasQa1 && (
// // //                                                             <div className="absolute top-3 left-3 w-2 h-2 bg-emerald-500 rounded-full"></div>
// // //                                                         )}
// // //                                                     </div>
// // //                                                 </td>
// // //                                                 <td className="px-6 py-4">
// // //                                                     <div className="relative">
// // //                                                         <input
// // //                                                             type="number"
// // //                                                             min="0"
// // //                                                             max="100"
// // //                                                             value={assessment.qa2 || ''}
// // //                                                             onChange={(e) => updateAssessmentScore(assessment.subject_id, 'qa2', parseInt(e.target.value) || 0)}
// // //                                                             className={`w-20 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mx-auto block ${hasQa2 ? 'border-blue-300 bg-blue-50' : 'border-slate-300'
// // //                                                                 }`}
// // //                                                         />
// // //                                                         {hasQa2 && (
// // //                                                             <div className="absolute top-3 left-3 w-2 h-2 bg-blue-500 rounded-full"></div>
// // //                                                         )}
// // //                                                     </div>
// // //                                                 </td>
// // //                                                 <td className="px-6 py-4">
// // //                                                     <div className="relative">
// // //                                                         <input
// // //                                                             type="number"
// // //                                                             min="0"
// // //                                                             max="100"
// // //                                                             value={assessment.end_of_term || ''}
// // //                                                             onChange={(e) => updateAssessmentScore(assessment.subject_id, 'end_of_term', parseInt(e.target.value) || 0)}
// // //                                                             className={`w-20 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mx-auto block ${hasEndTerm ? 'border-amber-300 bg-amber-50' : 'border-slate-300'
// // //                                                                 }`}
// // //                                                         />
// // //                                                         {hasEndTerm && (
// // //                                                             <div className="absolute top-3 left-3 w-2 h-2 bg-amber-500 rounded-full"></div>
// // //                                                         )}
// // //                                                     </div>
// // //                                                 </td>
// // //                                                 <td className="px-6 py-4 text-center font-semibold text-indigo-700">
// // //                                                     {finalScore.toFixed(1)}
// // //                                                 </td>
// // //                                             </tr>
// // //                                         );
// // //                                     })}
// // //                                 </tbody>
// // //                             </table>
// // //                             <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-sm text-slate-500">
// // //                                 * Final score calculated using active configuration: {activeConfig?.configuration_name || 'Default (Average of All)'}
// // //                             </div>
// // //                         </div>
// // //                     </div>

// // //                     <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
// // //                         <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
// // //                             <h3 className="font-semibold text-slate-800">Report Card Details</h3>
// // //                         </div>
// // //                         <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
// // //                             <div>
// // //                                 <label className="block text-sm font-medium text-slate-700 mb-1">Days Present</label>
// // //                                 <input
// // //                                     type="number"
// // //                                     min="0"
// // //                                     value={reportCard.days_present || ''}
// // //                                     onChange={(e) => setReportCard({ ...reportCard, days_present: parseInt(e.target.value) || 0 })}
// // //                                     className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"

// // //                                 />
// // //                             </div>
// // //                             <div>
// // //                                 <label className="block text-sm font-medium text-slate-700 mb-1">Days Absent</label>
// // //                                 <input
// // //                                     type="number"
// // //                                     min="0"
// // //                                     value={reportCard.days_absent || ''}
// // //                                     onChange={(e) => setReportCard({ ...reportCard, days_absent: parseInt(e.target.value) || 0 })}
// // //                                     className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
// // //                                 />
// // //                             </div>
// // //                             <div>
// // //                                 <label className="block text-sm font-medium text-slate-700 mb-1">Days Late</label>
// // //                                 <input
// // //                                     type="number"
// // //                                     min="0"
// // //                                     value={reportCard.days_late || ''}
// // //                                     onChange={(e) => setReportCard({ ...reportCard, days_late: parseInt(e.target.value) || 0 })}
// // //                                     className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
// // //                                 />
// // //                             </div>
// // //                             <div className="md:col-span-2 lg:col-span-3">
// // //                                 <label className="block text-sm font-medium text-slate-700 mb-1">Teacher's Remarks</label>
// // //                                 <textarea
// // //                                     value={reportCard.teacher_remarks}
// // //                                     onChange={(e) => setReportCard({ ...reportCard, teacher_remarks: e.target.value })}
// // //                                     rows={3}
// // //                                     placeholder="Enter teacher's remarks for this student..."
// // //                                     className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
// // //                                 />
// // //                             </div>
// // //                         </div>
// // //                     </div>
// // //                 </>
// // //             )}
// // //         </div>
// // //     );
// // // };

// // // export default ResultsManagement;



// // // import React from 'react';
// // // import { ArrowLeft, Save } from 'lucide-react';
// // // import { SubjectRecord } from '@/services/studentService';
// // // import { GradeConfiguration } from '@/services/gradeConfigService';
// // // import { Student, Assessment, ReportCardData } from '@/types/admin';

// // // interface ResultsManagementProps {
// // //     students: Student[];
// // //     classes: any[];
// // //     subjects: SubjectRecord[];
// // //     selectedStudent: Student | null;
// // //     assessments: Assessment[];
// // //     reportCard: ReportCardData;
// // //     savingResults: boolean;
// // //     activeConfig: GradeConfiguration | null;
// // //     setSelectedStudent: (student: Student | null) => void;
// // //     setAssessments: (assessments: Assessment[]) => void;
// // //     setReportCard: (reportCard: ReportCardData) => void;
// // //     loadStudentResults: (student: Student) => Promise<void>;
// // //     saveAllResults: () => Promise<void>;
// // //     updateAssessmentScore: (subjectId: string, field: 'qa1' | 'qa2' | 'end_of_term', value: number) => void;
// // //     calculateGrade: (score: number, passMark?: number) => string;
// // //     calculateFinalScore: (qa1: number, qa2: number, endOfTerm: number, config: GradeConfiguration) => number;
// // // }

// // // const ResultsManagement: React.FC<ResultsManagementProps> = ({
// // //     students,
// // //     classes,
// // //     subjects,
// // //     selectedStudent,
// // //     assessments,
// // //     reportCard,
// // //     savingResults,
// // //     activeConfig,
// // //     setSelectedStudent,
// // //     setAssessments,
// // //     setReportCard,
// // //     loadStudentResults,
// // //     saveAllResults,
// // //     updateAssessmentScore,
// // //     calculateGrade,
// // //     calculateFinalScore,
// // // }) => {
// // //     return (
// // //         <div className="space-y-6">
// // //             {!selectedStudent ? (
// // //                 <>
// // //                     <h2 className="text-lg font-semibold text-slate-800">Select a Student to Enter Results</h2>

// // //                     <div className="space-y-8">
// // //                         {classes.map(cls => {
// // //                             const classStudents = students.filter(s => s.class?.id === cls.id);
// // //                             if (classStudents.length === 0) return null;

// // //                             return (
// // //                                 <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
// // //                                     <div className="flex items-center justify-between mb-4">
// // //                                         <h3 className="text-lg font-semibold text-slate-800">
// // //                                             {cls.name} - {cls.term} ({cls.academic_year})
// // //                                         </h3>
// // //                                         <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">
// // //                                             {classStudents.length} students
// // //                                         </span>
// // //                                     </div>

// // //                                     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
// // //                                         {classStudents.map((student) => (
// // //                                             <button
// // //                                                 key={student.id}
// // //                                                 onClick={() => loadStudentResults(student)}
// // //                                                 className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all text-left hover:bg-indigo-50"
// // //                                             >
// // //                                                 <p className="font-mono text-sm text-indigo-600 mb-1">{student.examNumber}</p>
// // //                                                 <p className="font-semibold text-slate-800">{student.name}</p>
// // //                                                 <p className="text-sm text-slate-500">
// // //                                                     {student.class?.name || 'No Class'}
// // //                                                     {student.class?.term || 'Term 1, 2024/2025'}
// // //                                                 </p>
// // //                                             </button>
// // //                                         ))}
// // //                                     </div>
// // //                                 </div>
// // //                             );
// // //                         })}

// // //                         {students.length === 0 && (
// // //                             <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
// // //                                 <p className="text-slate-500">No students found. Add your first student to get started.</p>
// // //                             </div>
// // //                         )}
// // //                     </div>
// // //                 </>
// // //             ) : (
// // //                 <>
// // //                     <div className="flex items-center justify-between">
// // //                         <div className="flex items-center gap-4">
// // //                             <button
// // //                                 onClick={() => setSelectedStudent(null)}
// // //                                 className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
// // //                             >
// // //                                 <ArrowLeft className="w-5 h-5 text-slate-600" />
// // //                             </button>
// // //                             <div>
// // //                                 <h2 className="text-lg font-semibold text-slate-800">{selectedStudent.name}</h2>
// // //                                 <p className="text-sm text-slate-500">{selectedStudent.examNumber} {selectedStudent.class?.name || 'No Class'}</p>
// // //                             </div>
// // //                         </div>
// // //                         <button
// // //                             onClick={saveAllResults}
// // //                             disabled={savingResults}
// // //                             className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
// // //                         >
// // //                             {savingResults ? (
// // //                                 <>
// // //                                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
// // //                                     Saving...
// // //                                 </>
// // //                             ) : (
// // //                                 <>
// // //                                     <Save className="w-4 h-4" />
// // //                                     Save All Results
// // //                                 </>
// // //                             )}
// // //                         </button>
// // //                     </div>

// // //                     <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
// // //                         <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
// // //                             <h3 className="font-semibold text-slate-800">Assessment Scores</h3>
// // //                             <p className="text-sm text-slate-500 mt-1">
// // //                                 Subjects loaded from database. Add subjects in "Manage Subjects" tab.
// // //                             </p>
// // //                         </div>
// // //                         <div className="overflow-x-auto">
// // //                             <table className="w-full">
// // //                                 <thead className="bg-slate-50">
// // //                                     <tr>
// // //                                         <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Subject</th>
// // //                                         <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">QA1 (0-100)</th>
// // //                                         <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">QA2 (0-100)</th>
// // //                                         <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">End of Term (0-100)</th>
// // //                                         <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">Final Score*</th>
// // //                                     </tr>
// // //                                 </thead>
// // //                                 <tbody className="divide-y divide-slate-100">
// // //                                     {assessments.map((assessment) => {
// // //                                         let finalScore = (assessment.qa1 + assessment.qa2 + assessment.end_of_term) / 3;
// // //                                         if (activeConfig) {
// // //                                             finalScore = calculateFinalScore(
// // //                                                 assessment.qa1,
// // //                                                 assessment.qa2,
// // //                                                 assessment.end_of_term,
// // //                                                 activeConfig
// // //                                             );
// // //                                         }
// // //                                         return (
// // //                                             <tr key={assessment.subject_id} className="hover:bg-slate-50">
// // //                                                 <td className="px-6 py-4 font-medium text-slate-800">{assessment.subject_name}</td>
// // //                                                 <td className="px-6 py-4">
// // //                                                     <input
// // //                                                         type="number"
// // //                                                         min="0"
// // //                                                         max="100"
// // //                                                         value={assessment.qa1 || ''}
// // //                                                         onChange={(e) => updateAssessmentScore(assessment.subject_id, 'qa1', parseInt(e.target.value) || 0)}
// // //                                                         className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mx-auto block"
// // //                                                     />
// // //                                                 </td>
// // //                                                 <td className="px-6 py-4">
// // //                                                     <input
// // //                                                         type="number"
// // //                                                         min="0"
// // //                                                         max="100"
// // //                                                         value={assessment.qa2 || ''}
// // //                                                         onChange={(e) => updateAssessmentScore(assessment.subject_id, 'qa2', parseInt(e.target.value) || 0)}
// // //                                                         className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mx-auto block"
// // //                                                     />
// // //                                                 </td>
// // //                                                 <td className="px-6 py-4">
// // //                                                     <input
// // //                                                         type="number"
// // //                                                         min="0"
// // //                                                         max="100"
// // //                                                         value={assessment.end_of_term || ''}
// // //                                                         onChange={(e) => updateAssessmentScore(assessment.subject_id, 'end_of_term', parseInt(e.target.value) || 0)}
// // //                                                         className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mx-auto block"
// // //                                                     />
// // //                                                 </td>
// // //                                                 <td className="px-6 py-4 text-center font-semibold text-indigo-700">
// // //                                                     {finalScore.toFixed(1)}
// // //                                                 </td>
// // //                                             </tr>
// // //                                         );
// // //                                     })}
// // //                                 </tbody>
// // //                             </table>
// // //                             <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-sm text-slate-500">
// // //                                 * Final score calculated using active configuration: {activeConfig?.configuration_name || 'Default (Average of All)'}
// // //                             </div>
// // //                         </div>
// // //                     </div>

// // //                     <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
// // //                         <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
// // //                             <h3 className="font-semibold text-slate-800">Report Card Details</h3>
// // //                         </div>
// // //                         <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
// // //                             <div>
// // //                                 <label className="block text-sm font-medium text-slate-700 mb-1">Days Present</label>
// // //                                 <input
// // //                                     type="number"
// // //                                     min="0"
// // //                                     value={reportCard.days_present || ''}
// // //                                     onChange={(e) => setReportCard({ ...reportCard, days_present: parseInt(e.target.value) || 0 })}
// // //                                     className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"

// // //                                 />
// // //                             </div>
// // //                             <div>
// // //                                 <label className="block text-sm font-medium text-slate-700 mb-1">Days Absent</label>
// // //                                 <input
// // //                                     type="number"
// // //                                     min="0"
// // //                                     value={reportCard.days_absent || ''}
// // //                                     onChange={(e) => setReportCard({ ...reportCard, days_absent: parseInt(e.target.value) || 0 })}
// // //                                     className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
// // //                                 />
// // //                             </div>
// // //                             <div>
// // //                                 <label className="block text-sm font-medium text-slate-700 mb-1">Days Late</label>
// // //                                 <input
// // //                                     type="number"
// // //                                     min="0"
// // //                                     value={reportCard.days_late || ''}
// // //                                     onChange={(e) => setReportCard({ ...reportCard, days_late: parseInt(e.target.value) || 0 })}
// // //                                     className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
// // //                                 />
// // //                             </div>
// // //                             <div className="md:col-span-2 lg:col-span-3">
// // //                                 <label className="block text-sm font-medium text-slate-700 mb-1">Teacher's Remarks</label>
// // //                                 <textarea
// // //                                     value={reportCard.teacher_remarks}
// // //                                     onChange={(e) => setReportCard({ ...reportCard, teacher_remarks: e.target.value })}
// // //                                     rows={3}
// // //                                     placeholder="Enter teacher's remarks for this student..."
// // //                                     className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
// // //                                 />
// // //                             </div>
// // //                         </div>
// // //                     </div>
// // //                 </>
// // //             )}
// // //         </div>
// // //     );
// // // };

// // // export default ResultsManagement;