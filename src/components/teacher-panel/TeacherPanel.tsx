import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, AlertCircle, CheckCircle
} from 'lucide-react';
import {
    fetchAllStudents, fetchAllSubjects, upsertAssessment, upsertReportCard,
    fetchStudentAssessments, fetchStudentReportCard, calculateGrade,
    calculateAndUpdateRanks, fetchClassResults,
    fetchAllClasses
} from '@/services/studentService';
import {
    getActiveGradeConfig, getAllGradeConfigs, calculateFinalScore
} from '@/services/gradeConfigService';
import { Assessment, ClassResultStudent, Student } from '@/types/admin';
import LoadingSpinner from '../common/LoadingSpinner';
import SubjectsManagement from '../admin/SubjectsManagement';
import ClassResultsManagement from '../admin/ClassResultsManagement';
import ResultsManagement from '../admin/ResultsManagement';
import TeacherHeader from './TeacherHeader';
import TeacherTabs from './TeacherTabs';
import {
    fetchTeacherAssignments,
    fetchTeacherClasses,
    fetchTeacherStudents,
    fetchTeacherSubjects,
    isClassTeacher
} from '@/services/teacherService';

interface TeacherPanelProps {
    onBack: () => void;
}

const TeacherPanel: React.FC<TeacherPanelProps> = ({ onBack }) => {
    // UI state
    const [activeTab, setActiveTab] = useState<'results' | 'classResults'>('results');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Teacher assignment state
    const [assignments, setAssignments] = useState<any[]>([]);           // Which subjects teacher teaches in which classes
    const [teacherClasses, setTeacherClasses] = useState<any[]>([]);     // Classes teacher is assigned to
    const [teacherSubjects, setTeacherSubjects] = useState<any[]>([]);   // Subjects teacher teaches
    const [isUserClassTeacher, setIsUserClassTeacher] = useState<boolean>(false); // Whether teacher is a class teacher
    const [students, setStudents] = useState<Student[]>([]);             // Students teacher can access

    // Individual student results state
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [reportCard, setReportCard] = useState({
        class_rank: 0,
        qa1_rank: 0,
        qa2_rank: 0,
        total_students: 0,
        days_present: undefined as number | undefined,
        days_absent: undefined as number | undefined,
        days_late: undefined as number | undefined,
        teacher_remarks: ''
    });
    const [savingResults, setSavingResults] = useState(false);

    // Grade configuration (read-only for teachers)
    const [activeConfig, setActiveConfigState] = useState<any>(null);

    // Class-wide results state
    const [classes, setClasses] = useState<any[]>([]);
    const [classResults, setClassResults] = useState<ClassResultStudent[]>([]);
    const [selectedClassForResults, setSelectedClassForResults] = useState<string>('');
    const [activeAssessmentType, setActiveAssessmentType] = useState<'qa1' | 'qa2' | 'endOfTerm' | 'overall'>('overall');
    const [resultsLoading, setResultsLoading] = useState(false);

    // Load all teacher data when component mounts
    useEffect(() => {
        loadData();
    }, []);

    /**
     * Load all necessary data for the teacher
     * - Fetches teacher's assignments (which subjects in which classes)
     * - Fetches classes, subjects, and students teacher has access to
     * - Checks if teacher is a class teacher for any class
     */
    const loadData = async () => {
        setLoading(true);
        try {
            const userStr = localStorage.getItem('user');
            const teacherUser = userStr ? JSON.parse(userStr) : null;
            const teacherId = teacherUser?.id;

            if (!teacherId) {
                throw new Error('Teacher ID not found');
            }

            // 1. Get teacher's assignments (which subjects they teach in which classes)
            const assignmentsData = await fetchTeacherAssignments(teacherId);
            setAssignments(assignmentsData);

            // 2. Get all related data in parallel
            const [assignedClasses, assignedSubjects, assignedStudents, activeConfigData] = await Promise.all([
                fetchTeacherClasses(teacherId),
                fetchTeacherSubjects(teacherId),
                fetchTeacherStudents(teacherId),
                getActiveGradeConfig()
            ]);

            setTeacherClasses(assignedClasses);
            setTeacherSubjects(assignedSubjects);
            setStudents(assignedStudents);
            setActiveConfigState(activeConfigData);
            setClasses(assignedClasses); // For backward compatibility

            // 3. Check if teacher is a class teacher for any of their classes
            let isClassTeacherForAnyClass = false;
            for (const cls of assignedClasses) {
                try {
                    const isCT = await isClassTeacher(teacherId, cls.id);
                    if (isCT) {
                        isClassTeacherForAnyClass = true;
                        break;
                    }
                } catch (err) {
                    console.error(`Error checking class teacher status for class ${cls.id}:`, err);
                }
            }
            setIsUserClassTeacher(isClassTeacherForAnyClass);

        } catch (err) {
            setError('Failed to load data');
            console.error('Error loading teacher data:', err);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Show temporary success/error message
     */
    const showMessage = (msg: string, isError = false) => {
        if (isError) {
            setError(msg);
            setTimeout(() => setError(''), 3000);
        } else {
            setSuccess(msg);
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    /**
     * Load results for a specific student
     * Only shows subjects the teacher is assigned to teach in that student's class
     */
    const loadStudentResults = async (student: Student) => {
        // Verify teacher has access to this student's class
        const isAssignedToClass = assignments.some(a => a.classId === student.class?.id);
        if (!isAssignedToClass) {
            showMessage('You are not assigned to this student\'s class', true);
            return;
        }

        setSelectedStudent(student);
        try {
            // Fetch existing assessments and report card
            const [assessmentsData, reportCardData] = await Promise.all([
                fetchStudentAssessments(student.id),
                fetchStudentReportCard(student.id, student.term || 'Term 1, 2024/2025')
            ]);

            // 👇 ADD LOG 1 HERE
            console.log('1. RAW DATA FROM BACKEND:', JSON.stringify(assessmentsData, null, 2));

            // Get subjects teacher is assigned to teach in THIS specific class
            const assignedSubjectIds = assignments
                .filter(a => a.classId === student.class?.id)
                .map(a => a.subjectId);

            // Filter subjects to only those teacher can teach
            const assignedSubjectsData = teacherSubjects.filter(sub =>
                assignedSubjectIds.includes(sub.id)
            );

            // Create a map of subjects with default values (null, not 0)
            const assessmentMap = new Map<string, Assessment>();
            assignedSubjectsData.forEach(sub => {
                assessmentMap.set(sub.id, {
                    subject_id: sub.id,
                    subject_name: sub.name,
                    qa1: null,           // null = not entered yet
                    qa2: null,            // null = not entered yet
                    end_of_term: null,    // null = not entered yet
                    qa1_absent: false,    // Not absent by default
                    qa2_absent: false,    // Not absent by default
                    end_of_term_absent: false // Not absent by default
                });
            });

            // Populate with existing assessment data
            assessmentsData.forEach((a: any) => {
                const subjectId = a.subject_id || a.subject?.id;
                const assessmentType = a.assessment_type || a.assessmentType;
                const score = a.score;
                // const absent = a.absent || false;
                const absent = a.isAbsent === true || a.absent === true;  // Check both possible names

                // Only include if teacher is assigned to this subject
                if (subjectId && assignedSubjectIds.includes(subjectId)) {
                    const existing = assessmentMap.get(subjectId);
                    if (existing) {
                        if (assessmentType === 'qa1') {
                            existing.qa1 = absent ? null : score;  // null if absent
                            existing.qa1_absent = absent;
                        }
                        if (assessmentType === 'qa2') {
                            existing.qa2 = absent ? null : score;  // null if absent
                            existing.qa2_absent = absent;
                        }
                        if (assessmentType === 'end_of_term') {
                            existing.end_of_term = absent ? null : score;  // null if absent
                            existing.end_of_term_absent = absent;
                        }
                    }
                }
            });

            setAssessments(Array.from(assessmentMap.values()));

            // 👇 ADD LOG 2 HERE
            console.log('2. MAPPED ASSESSMENTS:', JSON.stringify(Array.from(assessmentMap.values()), null, 2));

            // Set report card data (or defaults)
            if (reportCardData) {
                setReportCard({
                    class_rank: reportCardData.class_rank || 0,
                    qa1_rank: reportCardData.qa1_rank || 0,
                    qa2_rank: reportCardData.qa2_rank || 0,
                    total_students: reportCardData.total_students || 0,
                    days_present: reportCardData.days_present === 0 ? undefined : reportCardData.days_present,
                    days_absent: reportCardData.days_absent === 0 ? undefined : reportCardData.days_absent,
                    days_late: reportCardData.days_late === 0 ? undefined : reportCardData.days_late,
                    teacher_remarks: reportCardData.teacher_remarks || ''
                });
            } else {
                setReportCard({
                    class_rank: 0,
                    qa1_rank: 0,
                    qa2_rank: 0,
                    total_students: 0,
                    days_present: undefined,
                    days_absent: undefined,
                    days_late: undefined,
                    teacher_remarks: ''
                });
            }
        } catch (err) {
            showMessage('Failed to load student results', true);
            console.error('Error loading student results:', err);
        }
    };

    /**
     * Update a single assessment score
     * @param subjectId - The subject being updated
     * @param field - Which assessment field (qa1, qa2, end_of_term)
     * @param value - The score value (null for empty)
     * @param isAbsent - Whether student was absent for this assessment
     */
    const updateAssessmentScore = (
        subjectId: string,
        field: 'qa1' | 'qa2' | 'end_of_term',
        value: number | null,
        isAbsent?: boolean
    ) => {
        // Verify teacher is assigned to this subject in the current student's class
        const isAssignedSubject = assignments.some(a =>
            a.subjectId === subjectId &&
            a.classId === selectedStudent?.class?.id
        );

        if (!isAssignedSubject) {
            showMessage('You are not assigned to this subject', true);
            return;
        }

        // Update the assessment in state
        setAssessments(prev => prev.map(a => {
            if (a.subject_id === subjectId) {
                const update = { ...a };

                // Handle each field type
                if (field === 'qa1') {
                    update.qa1 = value;
                    update.qa1_absent = isAbsent || false;
                    if (isAbsent) {
                        update.qa1 = null;  // If absent, score is null
                    }
                } else if (field === 'qa2') {
                    update.qa2 = value;
                    update.qa2_absent = isAbsent || false;
                    if (isAbsent) {
                        update.qa2 = null;  // If absent, score is null
                    }
                } else if (field === 'end_of_term') {
                    update.end_of_term = value;
                    update.end_of_term_absent = isAbsent || false;
                    if (isAbsent) {
                        update.end_of_term = null;  // If absent, score is null
                    }
                }

                return update;
            }
            return a;
        }));
    };

    /**
     * Save all results for the current student
     * - Saves assessments for assigned subjects only
     * - Saves report card only if teacher is class teacher
     * - Triggers rank recalculation
     */
    const saveAllResults = async () => {
        if (!selectedStudent) return;

        // Verify teacher has access to this student's class
        const isAssignedToClass = assignments.some(a => a.classId === selectedStudent.class?.id);
        if (!isAssignedToClass) {
            showMessage('You are not assigned to this student\'s class', true);
            return;
        }

        setSavingResults(true);
        try {
            const passMark = activeConfig?.pass_mark || 50;

            // Save each assessment for subjects teacher is assigned to
            for (const assessment of assessments) {
                // Double-check teacher is assigned to this subject
                const isAssignedSubject = assignments.some(a =>
                    a.subjectId === assessment.subject_id &&
                    a.classId === selectedStudent.class?.id
                );

                if (!isAssignedSubject) continue; // Skip if not assigned

                console.log('3a. SENDING QA1 TO BACKEND:', {
                    student_id: selectedStudent.id,
                    subject_id: assessment.subject_id,
                    assessment_type: 'qa1',
                    score: assessment.qa1,
                    is_absent: assessment.qa1_absent
                });

                // Save QA1
                await upsertAssessment({
                    student_id: selectedStudent.id,
                    subject_id: assessment.subject_id,
                    assessment_type: 'qa1',
                    score: assessment.qa1,
                    grade: assessment.qa1 !== null ? calculateGrade(assessment.qa1, passMark) : null,
                    // absent: assessment.qa1_absent || false
                    is_absent: assessment.qa1_absent || false
                });

                // Save QA2
                await upsertAssessment({
                    student_id: selectedStudent.id,
                    subject_id: assessment.subject_id,
                    assessment_type: 'qa2',
                    score: assessment.qa2,
                    grade: assessment.qa2 !== null ? calculateGrade(assessment.qa2, passMark) : null,
                    // absent: assessment.qa2_absent || false
                    is_absent: assessment.qa2_absent || false
                });

                // Save End of Term
                await upsertAssessment({
                    student_id: selectedStudent.id,
                    subject_id: assessment.subject_id,
                    assessment_type: 'end_of_term',
                    score: assessment.end_of_term,
                    grade: assessment.end_of_term !== null ? calculateGrade(assessment.end_of_term, passMark) : null,
                    // absent: assessment.end_of_term_absent || false
                    is_absent: assessment.end_of_term_absent || false
                });
            }

            // Save report card ONLY if teacher is a class teacher
            if (isUserClassTeacher) {
                await upsertReportCard({
                    student_id: selectedStudent.id,
                    term: selectedStudent.term || 'Term 1, 2024/2025',
                    days_present: reportCard.days_present,
                    days_absent: reportCard.days_absent,
                    days_late: reportCard.days_late,
                    teacher_remarks: reportCard.teacher_remarks
                });
            }

            // Trigger automatic rank recalculation for the class
            if (selectedStudent.class?.id) {
                await calculateAndUpdateRanks(
                    selectedStudent.class.id,
                    selectedStudent.term || 'Term 1, 2024/2025'
                );
            }

            showMessage('Results saved and ranks auto-calculated!');

            // Reload to show updated data
            loadStudentResults(selectedStudent);
        } catch (err: any) {
            showMessage(err.message || 'Failed to save results', true);
            console.error('Error saving results:', err);
        } finally {
            setSavingResults(false);
        }
    };

    /**
     * Load results for an entire class
     */
    const loadClassResults = async (classId: string) => {
        // Verify teacher has access to this class
        const isAssignedToClass = assignments.some(a => a.classId === classId);
        if (!isAssignedToClass) {
            showMessage('You are not assigned to this class', true);
            return;
        }

        setResultsLoading(true);
        try {
            const results = await fetchClassResults(classId);
            setClassResults(results);
        } catch (error) {
            console.error('Failed to load class results:', error);
            showMessage('Failed to load class results', true);
        } finally {
            setResultsLoading(false);
        }
    };

    /**
     * Handle tab switching
     */
    const handleTabChange = (tab: 'results' | 'classResults') => {
        setActiveTab(tab);
        setSelectedStudent(null); // Clear selected student when switching tabs
    };

    return (
        <div className="min-h-screen bg-slate-100">
            <TeacherHeader onBack={onBack} />

            {/* Error message display */}
            {error && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {/* Success message display */}
            {success && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <p className="text-emerald-700">{success}</p>
                    </div>
                </div>
            )}

            {/* Tab navigation */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                <TeacherTabs activeTab={activeTab} onTabChange={handleTabChange} />
            </div>

            {/* Main content area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading ? (
                    <LoadingSpinner message="Loading teacher data..." />
                ) : activeTab === 'classResults' ? (
                    /* Class-wide results view */
                    <ClassResultsManagement
                        classes={teacherClasses}
                        subjects={teacherSubjects}
                        classResults={classResults}
                        students={students}
                        selectedClassForResults={selectedClassForResults}
                        activeAssessmentType={activeAssessmentType}
                        resultsLoading={resultsLoading}
                        activeConfig={activeConfig}
                        setSelectedClassForResults={setSelectedClassForResults}
                        setActiveAssessmentType={setActiveAssessmentType}
                        loadClassResults={loadClassResults}
                        calculateGrade={calculateGrade}
                        isTeacherView={true}
                    />
                ) : (
                    /* Individual student results view */
                    <ResultsManagement
                        students={students}
                        classes={teacherClasses}
                        subjects={teacherSubjects}
                        selectedStudent={selectedStudent}
                        assessments={assessments}
                        reportCard={reportCard}
                        savingResults={savingResults}
                        activeConfig={activeConfig}
                        setSelectedStudent={setSelectedStudent}
                        setAssessments={setAssessments}
                        setReportCard={setReportCard}
                        loadStudentResults={loadStudentResults}
                        saveAllResults={saveAllResults}
                        updateAssessmentScore={updateAssessmentScore}
                        calculateGrade={calculateGrade}
                        calculateFinalScore={calculateFinalScore}
                        isTeacherView={true}
                        isClassTeacher={isUserClassTeacher}
                    />
                )}
            </div>
        </div>
    );
};

export default TeacherPanel;

// import React, { useState, useEffect } from 'react';
// import {
//     ArrowLeft, AlertCircle, CheckCircle
// } from 'lucide-react';
// import {
//     fetchAllStudents, fetchAllSubjects, upsertAssessment, upsertReportCard,
//     fetchStudentAssessments, fetchStudentReportCard, calculateGrade,
//     calculateAndUpdateRanks, fetchClassResults,
//     fetchAllClasses
// } from '@/services/studentService';
// import {
//     getActiveGradeConfig, getAllGradeConfigs, calculateFinalScore
// } from '@/services/gradeConfigService';
// import { Assessment, ClassResultStudent, Student } from '@/types/admin';
// import LoadingSpinner from '../common/LoadingSpinner';
// import SubjectsManagement from '../admin/SubjectsManagement';
// import ClassResultsManagement from '../admin/ClassResultsManagement';
// import ResultsManagement from '../admin/ResultsManagement';
// import TeacherHeader from './TeacherHeader';
// import TeacherTabs from './TeacherTabs';
// import {
//     fetchTeacherAssignments,
//     fetchTeacherClasses,
//     fetchTeacherStudents,
//     fetchTeacherSubjects,
//     isClassTeacher // ADD THIS
// } from '@/services/teacherService';

// interface TeacherPanelProps {
//     onBack: () => void;
// }

// const TeacherPanel: React.FC<TeacherPanelProps> = ({ onBack }) => {
//     const [activeTab, setActiveTab] = useState<'results' | 'classResults'>('results');
//     const [students, setStudents] = useState<Student[]>([]);
//     const [subjects, setSubjects] = useState<any[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
//     const [success, setSuccess] = useState('');

//     // ===== START: NEW STATE FOR ASSIGNMENTS =====
//     const [assignments, setAssignments] = useState<any[]>([]);
//     const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
//     const [teacherSubjects, setTeacherSubjects] = useState<any[]>([]);
//     const [isUserClassTeacher, setIsUserClassTeacher] = useState<boolean>(false); // ADD THIS
//     // ===== END: NEW STATE FOR ASSIGNMENTS =====

//     // Results editing state
//     const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
//     const [assessments, setAssessments] = useState<Assessment[]>([]);
//     const [reportCard, setReportCard] = useState({
//         class_rank: 0,
//         qa1_rank: 0,
//         qa2_rank: 0,
//         total_students: 0,
//         days_present: undefined as number | undefined,
//         days_absent: undefined as number | undefined,
//         days_late: undefined as number | undefined,
//         teacher_remarks: ''
//     });
//     const [savingResults, setSavingResults] = useState(false);

//     // Grade configuration state (teachers can view only)
//     const [activeConfig, setActiveConfigState] = useState<any>(null);

//     // Class results state
//     const [classes, setClasses] = useState<any[]>([]);
//     const [classResults, setClassResults] = useState<ClassResultStudent[]>([]);
//     const [selectedClassForResults, setSelectedClassForResults] = useState<string>('');
//     const [activeAssessmentType, setActiveAssessmentType] = useState<'qa1' | 'qa2' | 'endOfTerm' | 'overall'>('overall');
//     const [resultsLoading, setResultsLoading] = useState(false);

//     // Load data on mount
//     useEffect(() => {
//         loadData();
//     }, []);

//     const loadData = async () => {
//         setLoading(true);
//         try {
//             const userStr = localStorage.getItem('user');
//             const teacherUser = userStr ? JSON.parse(userStr) : null;
//             const teacherId = teacherUser?.id;

//             if (!teacherId) {
//                 throw new Error('Teacher ID not found');
//             }

//             // ===== START: NEW - LOAD ASSIGNMENTS FIRST =====
//             // 1. Load teacher's assignments
//             const assignmentsData = await fetchTeacherAssignments(teacherId);
//             setAssignments(assignmentsData);

//             // 2. Load only assigned classes, subjects, and students
//             const [assignedClasses, assignedSubjects, assignedStudents, activeConfigData] = await Promise.all([
//                 fetchTeacherClasses(teacherId),
//                 fetchTeacherSubjects(teacherId),
//                 fetchTeacherStudents(teacherId),
//                 getActiveGradeConfig()
//             ]);

//             setTeacherClasses(assignedClasses);
//             setTeacherSubjects(assignedSubjects);
//             setStudents(assignedStudents);
//             setActiveConfigState(activeConfigData);

//             // For backward compatibility, keep the classes array too
//             setClasses(assignedClasses);

//             // 3. Check if teacher is class teacher for any of their assigned classes
//             let isClassTeacherForAnyClass = false;
//             for (const cls of assignedClasses) {
//                 try {
//                     const isCT = await isClassTeacher(teacherId, cls.id);
//                     if (isCT) {
//                         isClassTeacherForAnyClass = true;
//                         break;
//                     }
//                 } catch (err) {
//                     console.error(`Error checking class teacher status for class ${cls.id}:`, err);
//                 }
//             }

//             setIsUserClassTeacher(isClassTeacherForAnyClass);

//             console.log('Teacher assignments:', assignmentsData);
//             console.log('Assigned classes:', assignedClasses);
//             console.log('Assigned subjects:', assignedSubjects);
//             console.log('Assigned students:', assignedStudents);
//             console.log('Is class teacher?', isClassTeacherForAnyClass);

//         } catch (err) {
//             setError('Failed to load data');
//             console.error('Error loading teacher data:', err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const showMessage = (msg: string, isError = false) => {
//         if (isError) {
//             setError(msg);
//             setTimeout(() => setError(''), 3000);
//         } else {
//             setSuccess(msg);
//             setTimeout(() => setSuccess(''), 3000);
//         }
//     };

//     // Student results handlers - UPDATED TO CHECK ASSIGNMENTS
//     const loadStudentResults = async (student: Student) => {
//         // Check if teacher is assigned to this student's class
//         const isAssignedToClass = assignments.some(a => a.classId === student.class?.id);

//         if (!isAssignedToClass) {
//             showMessage('You are not assigned to this student\'s class', true);
//             return;
//         }

//         setSelectedStudent(student);
//         try {
//             const [assessmentsData, reportCardData] = await Promise.all([
//                 fetchStudentAssessments(student.id),
//                 fetchStudentReportCard(student.id, student.term || 'Term 1, 2024/2025')
//             ]);

//             // Only show subjects the teacher is assigned to
//             // const assignedSubjectIds = assignments.map(a => a.subjectId);
//             const assignedSubjectIds = assignments
//                 .filter(a => a.classId === student.class?.id)  // ADD THIS FILTER
//                 .map(a => a.subjectId);
//             const assignedSubjectsData = teacherSubjects.filter(sub =>
//                 assignedSubjectIds.includes(sub.id)
//             );

//             const assessmentMap = new Map<string, Assessment>();
//             assignedSubjectsData.forEach(sub => {
//                 assessmentMap.set(sub.id, {
//                     subject_id: sub.id,
//                     subject_name: sub.name,
//                     qa1: 0,
//                     qa2: 0,
//                     end_of_term: 0
//                 });
//             });

//             assessmentsData.forEach((a: any) => {
//                 const subjectId = a.subject_id || a.subject?.id;
//                 const assessmentType = a.assessment_type || a.assessmentType;
//                 const score = a.score || 0;

//                 if (subjectId && assignedSubjectIds.includes(subjectId)) {
//                     const existing = assessmentMap.get(subjectId);
//                     if (existing) {
//                         if (assessmentType === 'qa1') existing.qa1 = score;
//                         if (assessmentType === 'qa2') existing.qa2 = score;
//                         if (assessmentType === 'end_of_term') existing.end_of_term = score;
//                     }
//                 }
//             });

//             setAssessments(Array.from(assessmentMap.values()));

//             if (reportCardData) {
//                 setReportCard({
//                     class_rank: reportCardData.class_rank || 0,
//                     qa1_rank: reportCardData.qa1_rank || 0,
//                     qa2_rank: reportCardData.qa2_rank || 0,
//                     total_students: reportCardData.total_students || 0,
//                     days_present: reportCardData.days_present === 0 ? undefined : reportCardData.days_present,
//                     days_absent: reportCardData.days_absent === 0 ? undefined : reportCardData.days_absent,
//                     days_late: reportCardData.days_late === 0 ? undefined : reportCardData.days_late,
//                     teacher_remarks: reportCardData.teacher_remarks || ''
//                 });
//             } else {
//                 setReportCard({
//                     class_rank: 0,
//                     qa1_rank: 0,
//                     qa2_rank: 0,
//                     total_students: 0,
//                     days_present: undefined,
//                     days_absent: undefined,
//                     days_late: undefined,
//                     teacher_remarks: ''
//                 });
//             }
//         } catch (err) {
//             showMessage('Failed to load student results', true);
//             console.error('Error loading student results:', err);
//         }
//     };

//     const updateAssessmentScore = (subjectId: string, field: 'qa1' | 'qa2' | 'end_of_term', value: number) => {
//         // Check if teacher is assigned to this subject
//         // const isAssignedSubject = assignments.some(a => a.subjectId === subjectId);
//         // Change TO:
//         const isAssignedSubject = assignments.some(a =>
//             a.subjectId === subjectId &&
//             a.classId === selectedStudent?.class?.id  // ADD THIS CHECK
//         );

//         if (!isAssignedSubject) {
//             showMessage('You are not assigned to this subject', true);
//             return;
//         }

//         setAssessments(prev => prev.map(a =>
//             a.subject_id === subjectId ? { ...a, [field]: Math.min(100, Math.max(0, value)) } : a
//         ));
//     };

//     const saveAllResults = async () => {
//         if (!selectedStudent) return;

//         // Check if teacher is assigned to this student's class
//         const isAssignedToClass = assignments.some(a => a.classId === selectedStudent.class?.id);
//         if (!isAssignedToClass) {
//             showMessage('You are not assigned to this student\'s class', true);
//             return;
//         }

//         setSavingResults(true);
//         try {
//             const passMark = activeConfig?.pass_mark || 50;

//             // Save only assessments for assigned subjects
//             for (const assessment of assessments) {
//                 // Check if teacher is assigned to this subject
//                 const isAssignedSubject = assignments.some(a =>
//                     a.subjectId === assessment.subject_id &&
//                     a.classId === selectedStudent.class?.id
//                 );

//                 if (!isAssignedSubject) continue;

//                 await upsertAssessment({
//                     student_id: selectedStudent.id,
//                     subject_id: assessment.subject_id,
//                     assessment_type: 'qa1',
//                     score: assessment.qa1,
//                     grade: calculateGrade(assessment.qa1, passMark)
//                 });

//                 await upsertAssessment({
//                     student_id: selectedStudent.id,
//                     subject_id: assessment.subject_id,
//                     assessment_type: 'qa2',
//                     score: assessment.qa2,
//                     grade: calculateGrade(assessment.qa2, passMark)
//                 });

//                 await upsertAssessment({
//                     student_id: selectedStudent.id,
//                     subject_id: assessment.subject_id,
//                     assessment_type: 'end_of_term',
//                     score: assessment.end_of_term,
//                     grade: calculateGrade(assessment.end_of_term, passMark)
//                 });
//             }

//             // Save report card (only class teacher can save attendance/remarks via backend check)
//             // await upsertReportCard({
//             //     student_id: selectedStudent.id,
//             //     term: selectedStudent.term || 'Term 1, 2024/2025',
//             //     days_present: reportCard.days_present,
//             //     days_absent: reportCard.days_absent,
//             //     days_late: reportCard.days_late,
//             //     teacher_remarks: reportCard.teacher_remarks
//             // });

//             // Save report card ONLY if teacher is class teacher
//             if (isUserClassTeacher) {
//                 await upsertReportCard({
//                     student_id: selectedStudent.id,
//                     term: selectedStudent.term || 'Term 1, 2024/2025',
//                     days_present: reportCard.days_present,
//                     days_absent: reportCard.days_absent,
//                     days_late: reportCard.days_late,
//                     teacher_remarks: reportCard.teacher_remarks
//                 });
//             }
//             // Subject teachers don't save report card data

//             // Auto-calculate ranks
//             if (selectedStudent.class?.id) {
//                 await calculateAndUpdateRanks(
//                     selectedStudent.class.id,
//                     selectedStudent.term || 'Term 1, 2024/2025'
//                 );
//             }

//             showMessage('Results saved and ranks auto-calculated!');
//             loadStudentResults(selectedStudent);
//         } catch (err: any) {
//             showMessage(err.message || 'Failed to save results', true);
//             console.error('Error saving results:', err);
//         } finally {
//             setSavingResults(false);
//         }
//     };

//     // Class results handlers - UPDATED
//     const loadClassResults = async (classId: string) => {
//         // Check if teacher is assigned to this class
//         const isAssignedToClass = assignments.some(a => a.classId === classId);
//         if (!isAssignedToClass) {
//             showMessage('You are not assigned to this class', true);
//             return;
//         }

//         setResultsLoading(true);
//         try {
//             const results = await fetchClassResults(classId);
//             setClassResults(results);
//         } catch (error) {
//             console.error('Failed to load class results:', error);
//             showMessage('Failed to load class results', true);
//         } finally {
//             setResultsLoading(false);
//         }
//     };

//     const handleTabChange = (tab: 'results' | 'classResults') => {
//         setActiveTab(tab);
//         setSelectedStudent(null);
//     };

//     return (
//         <div className="min-h-screen bg-slate-100">
//             <TeacherHeader onBack={onBack} />

//             {error && (
//                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
//                     <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
//                         <AlertCircle className="w-5 h-5 text-red-500" />
//                         <p className="text-red-700">{error}</p>
//                     </div>
//                 </div>
//             )}

//             {success && (
//                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
//                     <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
//                         <CheckCircle className="w-5 h-5 text-emerald-500" />
//                         <p className="text-emerald-700">{success}</p>
//                     </div>
//                 </div>
//             )}

//             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
//                 <TeacherTabs activeTab={activeTab} onTabChange={handleTabChange} />
//             </div>

//             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//                 {loading ? (
//                     <LoadingSpinner message="Loading teacher data..." />
//                 ) : activeTab === 'classResults' ? (

//                     <ClassResultsManagement
//                         classes={teacherClasses}
//                         subjects={teacherSubjects}
//                         classResults={classResults}
//                         students={students}
//                         selectedClassForResults={selectedClassForResults}
//                         activeAssessmentType={activeAssessmentType}
//                         resultsLoading={resultsLoading}
//                         activeConfig={activeConfig}
//                         setSelectedClassForResults={setSelectedClassForResults}
//                         setActiveAssessmentType={setActiveAssessmentType}
//                         loadClassResults={loadClassResults}
//                         calculateGrade={calculateGrade}
//                         isTeacherView={true}
//                     />
//                 ) : (
//                     <ResultsManagement
//                         students={students}
//                         classes={teacherClasses}
//                         subjects={teacherSubjects}
//                         selectedStudent={selectedStudent}
//                         assessments={assessments}
//                         reportCard={reportCard}
//                         savingResults={savingResults}
//                         activeConfig={activeConfig}
//                         setSelectedStudent={setSelectedStudent}
//                         setAssessments={setAssessments}
//                         setReportCard={setReportCard}
//                         loadStudentResults={loadStudentResults}
//                         saveAllResults={saveAllResults}
//                         updateAssessmentScore={updateAssessmentScore}
//                         calculateGrade={calculateGrade}
//                         calculateFinalScore={calculateFinalScore}
//                         isTeacherView={true}
//                         isClassTeacher={isUserClassTeacher} // ADD THIS PROP
//                     />
//                 )}
//             </div>
//         </div>
//     );
// };

// export default TeacherPanel;