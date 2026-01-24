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
    isClassTeacher // ADD THIS
} from '@/services/teacherService';

interface TeacherPanelProps {
    onBack: () => void;
}

const TeacherPanel: React.FC<TeacherPanelProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'results' | 'classResults'>('results');
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // ===== START: NEW STATE FOR ASSIGNMENTS =====
    const [assignments, setAssignments] = useState<any[]>([]);
    const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
    const [teacherSubjects, setTeacherSubjects] = useState<any[]>([]);
    const [isUserClassTeacher, setIsUserClassTeacher] = useState<boolean>(false); // ADD THIS
    // ===== END: NEW STATE FOR ASSIGNMENTS =====

    // Results editing state
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

    // Grade configuration state (teachers can view only)
    const [activeConfig, setActiveConfigState] = useState<any>(null);

    // Class results state
    const [classes, setClasses] = useState<any[]>([]);
    const [classResults, setClassResults] = useState<ClassResultStudent[]>([]);
    const [selectedClassForResults, setSelectedClassForResults] = useState<string>('');
    const [activeAssessmentType, setActiveAssessmentType] = useState<'qa1' | 'qa2' | 'endOfTerm' | 'overall'>('overall');
    const [resultsLoading, setResultsLoading] = useState(false);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const userStr = localStorage.getItem('user');
            const teacherUser = userStr ? JSON.parse(userStr) : null;
            const teacherId = teacherUser?.id;

            if (!teacherId) {
                throw new Error('Teacher ID not found');
            }

            // ===== START: NEW - LOAD ASSIGNMENTS FIRST =====
            // 1. Load teacher's assignments
            const assignmentsData = await fetchTeacherAssignments(teacherId);
            setAssignments(assignmentsData);

            // 2. Load only assigned classes, subjects, and students
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

            // For backward compatibility, keep the classes array too
            setClasses(assignedClasses);

            // 3. Check if teacher is class teacher for any of their assigned classes
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

            console.log('Teacher assignments:', assignmentsData);
            console.log('Assigned classes:', assignedClasses);
            console.log('Assigned subjects:', assignedSubjects);
            console.log('Assigned students:', assignedStudents);
            console.log('Is class teacher?', isClassTeacherForAnyClass);

        } catch (err) {
            setError('Failed to load data');
            console.error('Error loading teacher data:', err);
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (msg: string, isError = false) => {
        if (isError) {
            setError(msg);
            setTimeout(() => setError(''), 3000);
        } else {
            setSuccess(msg);
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    // Student results handlers - UPDATED TO CHECK ASSIGNMENTS
    const loadStudentResults = async (student: Student) => {
        // Check if teacher is assigned to this student's class
        const isAssignedToClass = assignments.some(a => a.classId === student.class?.id);

        if (!isAssignedToClass) {
            showMessage('You are not assigned to this student\'s class', true);
            return;
        }

        setSelectedStudent(student);
        try {
            const [assessmentsData, reportCardData] = await Promise.all([
                fetchStudentAssessments(student.id),
                fetchStudentReportCard(student.id, student.term || 'Term 1, 2024/2025')
            ]);

            // Only show subjects the teacher is assigned to
            // const assignedSubjectIds = assignments.map(a => a.subjectId);
            const assignedSubjectIds = assignments
                .filter(a => a.classId === student.class?.id)  // ADD THIS FILTER
                .map(a => a.subjectId);
            const assignedSubjectsData = teacherSubjects.filter(sub =>
                assignedSubjectIds.includes(sub.id)
            );

            const assessmentMap = new Map<string, Assessment>();
            assignedSubjectsData.forEach(sub => {
                assessmentMap.set(sub.id, {
                    subject_id: sub.id,
                    subject_name: sub.name,
                    qa1: 0,
                    qa2: 0,
                    end_of_term: 0
                });
            });

            assessmentsData.forEach((a: any) => {
                const subjectId = a.subject_id || a.subject?.id;
                const assessmentType = a.assessment_type || a.assessmentType;
                const score = a.score || 0;

                if (subjectId && assignedSubjectIds.includes(subjectId)) {
                    const existing = assessmentMap.get(subjectId);
                    if (existing) {
                        if (assessmentType === 'qa1') existing.qa1 = score;
                        if (assessmentType === 'qa2') existing.qa2 = score;
                        if (assessmentType === 'end_of_term') existing.end_of_term = score;
                    }
                }
            });

            setAssessments(Array.from(assessmentMap.values()));

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

    const updateAssessmentScore = (subjectId: string, field: 'qa1' | 'qa2' | 'end_of_term', value: number) => {
        // Check if teacher is assigned to this subject
        // const isAssignedSubject = assignments.some(a => a.subjectId === subjectId);
        // Change TO:
        const isAssignedSubject = assignments.some(a =>
            a.subjectId === subjectId &&
            a.classId === selectedStudent?.class?.id  // ADD THIS CHECK
        );

        if (!isAssignedSubject) {
            showMessage('You are not assigned to this subject', true);
            return;
        }

        setAssessments(prev => prev.map(a =>
            a.subject_id === subjectId ? { ...a, [field]: Math.min(100, Math.max(0, value)) } : a
        ));
    };

    const saveAllResults = async () => {
        if (!selectedStudent) return;

        // Check if teacher is assigned to this student's class
        const isAssignedToClass = assignments.some(a => a.classId === selectedStudent.class?.id);
        if (!isAssignedToClass) {
            showMessage('You are not assigned to this student\'s class', true);
            return;
        }

        setSavingResults(true);
        try {
            const passMark = activeConfig?.pass_mark || 50;

            // Save only assessments for assigned subjects
            for (const assessment of assessments) {
                // Check if teacher is assigned to this subject
                const isAssignedSubject = assignments.some(a =>
                    a.subjectId === assessment.subject_id &&
                    a.classId === selectedStudent.class?.id
                );

                if (!isAssignedSubject) continue;

                await upsertAssessment({
                    student_id: selectedStudent.id,
                    subject_id: assessment.subject_id,
                    assessment_type: 'qa1',
                    score: assessment.qa1,
                    grade: calculateGrade(assessment.qa1, passMark)
                });

                await upsertAssessment({
                    student_id: selectedStudent.id,
                    subject_id: assessment.subject_id,
                    assessment_type: 'qa2',
                    score: assessment.qa2,
                    grade: calculateGrade(assessment.qa2, passMark)
                });

                await upsertAssessment({
                    student_id: selectedStudent.id,
                    subject_id: assessment.subject_id,
                    assessment_type: 'end_of_term',
                    score: assessment.end_of_term,
                    grade: calculateGrade(assessment.end_of_term, passMark)
                });
            }

            // Save report card (only class teacher can save attendance/remarks via backend check)
            // await upsertReportCard({
            //     student_id: selectedStudent.id,
            //     term: selectedStudent.term || 'Term 1, 2024/2025',
            //     days_present: reportCard.days_present,
            //     days_absent: reportCard.days_absent,
            //     days_late: reportCard.days_late,
            //     teacher_remarks: reportCard.teacher_remarks
            // });

            // Save report card ONLY if teacher is class teacher
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
            // Subject teachers don't save report card data

            // Auto-calculate ranks
            if (selectedStudent.class?.id) {
                await calculateAndUpdateRanks(
                    selectedStudent.class.id,
                    selectedStudent.term || 'Term 1, 2024/2025'
                );
            }

            showMessage('Results saved and ranks auto-calculated!');
            loadStudentResults(selectedStudent);
        } catch (err: any) {
            showMessage(err.message || 'Failed to save results', true);
            console.error('Error saving results:', err);
        } finally {
            setSavingResults(false);
        }
    };

    // Class results handlers - UPDATED
    const loadClassResults = async (classId: string) => {
        // Check if teacher is assigned to this class
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

    const handleTabChange = (tab: 'results' | 'classResults') => {
        setActiveTab(tab);
        setSelectedStudent(null);
    };

    return (
        <div className="min-h-screen bg-slate-100">
            <TeacherHeader onBack={onBack} />

            {error && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {success && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <p className="text-emerald-700">{success}</p>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                <TeacherTabs activeTab={activeTab} onTabChange={handleTabChange} />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading ? (
                    <LoadingSpinner message="Loading teacher data..." />
                ) : activeTab === 'classResults' ? (

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
                        isClassTeacher={isUserClassTeacher} // ADD THIS PROP
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
// // ===== START: NEW IMPORT =====
// // import { fetchTeacherAssignments, fetchTeacherClasses, fetchTeacherSubjects, fetchTeacherStudents } from '@/services/teacherService';
// // ===== END: NEW IMPORT =====
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
// import { fetchTeacherAssignments, fetchTeacherClasses, fetchTeacherStudents, fetchTeacherSubjects } from '@/services/teacherService';

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
//             // ===== END: NEW - LOAD ASSIGNMENTS FIRST =====

//             console.log('Teacher assignments:', assignmentsData);
//             console.log('Assigned classes:', assignedClasses);
//             console.log('Assigned subjects:', assignedSubjects);
//             console.log('Assigned students:', assignedStudents);

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
//             const assignedSubjectIds = assignments.map(a => a.subjectId);
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
//         const isAssignedSubject = assignments.some(a => a.subjectId === subjectId);

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

//             // Save report card
//             await upsertReportCard({
//                 student_id: selectedStudent.id,
//                 term: selectedStudent.term || 'Term 1, 2024/2025',
//                 days_present: reportCard.days_present,
//                 days_absent: reportCard.days_absent,
//                 days_late: reportCard.days_late,
//                 teacher_remarks: reportCard.teacher_remarks
//             });

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
//                         // ===== CHANGE: Use teacherClasses instead of all classes =====
//                         classes={teacherClasses}
//                         subjects={teacherSubjects}  // Only assigned subjects
//                         classResults={classResults}
//                         students={students}  // Only assigned students
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
//                         students={students}  // Only assigned students
//                         // ===== CHANGE: Use teacherClasses instead of all classes =====
//                         classes={teacherClasses}
//                         subjects={teacherSubjects}  // Only assigned subjects
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
//                     />
//                 )}
//             </div>
//         </div>
//     );
// };

// export default TeacherPanel;

// // import React, { useState, useEffect } from 'react';
// // import {
// //     ArrowLeft, AlertCircle, CheckCircle
// // } from 'lucide-react';
// // import {
// //     fetchAllStudents, fetchAllSubjects, upsertAssessment, upsertReportCard,
// //     fetchStudentAssessments, fetchStudentReportCard, calculateGrade,
// //     calculateAndUpdateRanks, fetchClassResults,
// //     fetchAllClasses
// // } from '@/services/studentService';
// // import {
// //     getActiveGradeConfig, getAllGradeConfigs, calculateFinalScore
// // } from '@/services/gradeConfigService';
// // import { Assessment, ClassResultStudent, Student } from '@/types/admin';
// // import LoadingSpinner from '../common/LoadingSpinner';
// // import SubjectsManagement from '../admin/SubjectsManagement';
// // import ClassResultsManagement from '../admin/ClassResultsManagement';
// // import ResultsManagement from '../admin/ResultsManagement';
// // import TeacherHeader from './TeacherHeader';
// // import TeacherTabs from './TeacherTabs';
// // // import TeacherHeader from './components/teacher/TeacherHeader';
// // // import TeacherTabs from './components/teacher/TeacherTabs';
// // // import SubjectsManagement from './components/admin/SubjectsManagement';
// // // import ResultsManagement from './components/admin/ResultsManagement';
// // // import ClassResultsManagement from './components/admin/ClassResultsManagement';
// // // import LoadingSpinner from './components/common/LoadingSpinner';
// // // import { Student, Assessment, ClassResultStudent } from './types/admin';

// // interface TeacherPanelProps {
// //     onBack: () => void;
// // }

// // const TeacherPanel: React.FC<TeacherPanelProps> = ({ onBack }) => {
// //     const [activeTab, setActiveTab] = useState<'results' | 'classResults'>('results');
// //     const [students, setStudents] = useState<Student[]>([]);
// //     const [subjects, setSubjects] = useState<any[]>([]);
// //     const [loading, setLoading] = useState(true);
// //     const [error, setError] = useState('');
// //     const [success, setSuccess] = useState('');

// //     // Results editing state
// //     const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
// //     const [assessments, setAssessments] = useState<Assessment[]>([]);
// //     const [reportCard, setReportCard] = useState({
// //         class_rank: 0,
// //         qa1_rank: 0,
// //         qa2_rank: 0,
// //         total_students: 0,
// //         days_present: undefined as number | undefined,
// //         days_absent: undefined as number | undefined,
// //         days_late: undefined as number | undefined,
// //         teacher_remarks: ''
// //     });
// //     const [savingResults, setSavingResults] = useState(false);

// //     // Grade configuration state (teachers can view only)
// //     const [activeConfig, setActiveConfigState] = useState<any>(null);

// //     // Class results state
// //     const [classes, setClasses] = useState<any[]>([]);
// //     const [classResults, setClassResults] = useState<ClassResultStudent[]>([]);
// //     const [selectedClassForResults, setSelectedClassForResults] = useState<string>('');
// //     const [activeAssessmentType, setActiveAssessmentType] = useState<'qa1' | 'qa2' | 'endOfTerm' | 'overall'>('overall');
// //     const [resultsLoading, setResultsLoading] = useState(false);

// //     // Load data on mount
// //     useEffect(() => {
// //         loadData();
// //     }, []);

// //     // const loadData = async () => {
// //     //     setLoading(true);
// //     //     try {
// //     //         // Teachers only need students, subjects, and active grade config
// //     //         const [studentsData, subjectsData, activeConfigData] = await Promise.all([
// //     //             fetchAllStudents(),  // Teachers can see all students in their school
// //     //             fetchAllSubjects(),
// //     //             getActiveGradeConfig()
// //     //         ]);
// //     //         setStudents(studentsData);
// //     //         setSubjects(subjectsData);
// //     //         setActiveConfigState(activeConfigData);

// //     //         // Teachers might need to know which classes exist
// //     //         // But they can't create/delete classes
// //     //         // You might want to fetch classes without edit permissions
// //     //     } catch (err) {
// //     //         setError('Failed to load data');
// //     //         console.error('Error loading teacher data:', err);
// //     //     } finally {
// //     //         setLoading(false);
// //     //     }
// //     // };


// //     // const loadData = async () => {
// //     //     setLoading(true);
// //     //     try {
// //     //         // DEBUG: Check what's in localStorage
// //     //         const userStr = localStorage.getItem('user');
// //     //         const teacherUser = userStr ? JSON.parse(userStr) : null;
// //     //         console.log('TEACHER USER OBJECT:', teacherUser);

// //     //         // Get schoolId from teacher object (try both variations)
// //     //         const schoolId = teacherUser?.schoolId || teacherUser?.school_id;
// //     //         console.log('Teacher schoolId:', schoolId);

// //     //         // Teachers only need students, subjects, and active grade config
// //     //         const [studentsData, subjectsData, activeConfigData] = await Promise.all([
// //     //             fetchAllStudents(),  // This will use the schoolId from localStorage
// //     //             fetchAllSubjects(),
// //     //             getActiveGradeConfig()
// //     //         ]);

// //     //         console.log('Loaded students:', studentsData);
// //     //         console.log('Loaded subjects:', subjectsData);

// //     //         setStudents(studentsData);
// //     //         setSubjects(subjectsData);
// //     //         setActiveConfigState(activeConfigData);

// //     //         // Teachers might need to know which classes exist
// //     //         // But they can't create/delete classes
// //     //         // You might want to fetch classes without edit permissions
// //     //     } catch (err) {
// //     //         setError('Failed to load data');
// //     //         console.error('Error loading teacher data:', err);
// //     //     } finally {
// //     //         setLoading(false);
// //     //     }
// //     // };

// //     const loadData = async () => {
// //         setLoading(true);
// //         try {
// //             // DEBUG: Check what's in localStorage
// //             const userStr = localStorage.getItem('user');
// //             const teacherUser = userStr ? JSON.parse(userStr) : null;
// //             console.log('TEACHER USER OBJECT:', teacherUser);

// //             // Get schoolId from teacher object (try both variations)
// //             const schoolId = teacherUser?.schoolId || teacherUser?.school_id;
// //             console.log('Teacher schoolId:', schoolId);

// //             // Teachers need classes too for the ResultsManagement component
// //             const [studentsData, subjectsData, activeConfigData, classesData] = await Promise.all([
// //                 fetchAllStudents(),
// //                 fetchAllSubjects(),
// //                 getActiveGradeConfig(),
// //                 fetchAllClasses()  // ADD THIS - teachers need classes too!
// //             ]);

// //             console.log('Loaded students:', studentsData);
// //             console.log('Loaded subjects:', subjectsData);
// //             console.log('Loaded classes:', classesData);  // ADD THIS

// //             setStudents(studentsData);
// //             setSubjects(subjectsData);
// //             setActiveConfigState(activeConfigData);
// //             setClasses(classesData);  // ADD THIS - set classes state
// //         } catch (err) {
// //             setError('Failed to load data');
// //             console.error('Error loading teacher data:', err);
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     const showMessage = (msg: string, isError = false) => {
// //         if (isError) {
// //             setError(msg);
// //             setTimeout(() => setError(''), 3000);
// //         } else {
// //             setSuccess(msg);
// //             setTimeout(() => setSuccess(''), 3000);
// //         }
// //     };

// //     // Student results handlers
// //     const loadStudentResults = async (student: Student) => {
// //         setSelectedStudent(student);
// //         try {
// //             const [assessmentsData, reportCardData] = await Promise.all([
// //                 fetchStudentAssessments(student.id),
// //                 fetchStudentReportCard(student.id, student.term || 'Term 1, 2024/2025')
// //             ]);

// //             const assessmentMap = new Map<string, Assessment>();
// //             subjects.forEach(sub => {
// //                 assessmentMap.set(sub.id, {
// //                     subject_id: sub.id,
// //                     subject_name: sub.name,
// //                     qa1: 0,
// //                     qa2: 0,
// //                     end_of_term: 0
// //                 });
// //             });

// //             assessmentsData.forEach((a: any) => {
// //                 const subjectId = a.subject_id || a.subject?.id;
// //                 const assessmentType = a.assessment_type || a.assessmentType;
// //                 const score = a.score || 0;

// //                 if (subjectId) {
// //                     const existing = assessmentMap.get(subjectId);
// //                     if (existing) {
// //                         if (assessmentType === 'qa1') existing.qa1 = score;
// //                         if (assessmentType === 'qa2') existing.qa2 = score;
// //                         if (assessmentType === 'end_of_term') existing.end_of_term = score;
// //                     }
// //                 }
// //             });

// //             setAssessments(Array.from(assessmentMap.values()));

// //             if (reportCardData) {
// //                 setReportCard({
// //                     class_rank: reportCardData.class_rank || 0,
// //                     qa1_rank: reportCardData.qa1_rank || 0,
// //                     qa2_rank: reportCardData.qa2_rank || 0,
// //                     total_students: reportCardData.total_students || 0,
// //                     days_present: reportCardData.days_present === 0 ? undefined : reportCardData.days_present,
// //                     days_absent: reportCardData.days_absent === 0 ? undefined : reportCardData.days_absent,
// //                     days_late: reportCardData.days_late === 0 ? undefined : reportCardData.days_late,
// //                     teacher_remarks: reportCardData.teacher_remarks || ''
// //                 });
// //             } else {
// //                 setReportCard({
// //                     class_rank: 0,
// //                     qa1_rank: 0,
// //                     qa2_rank: 0,
// //                     total_students: 0,
// //                     days_present: undefined,
// //                     days_absent: undefined,
// //                     days_late: undefined,
// //                     teacher_remarks: ''
// //                 });
// //             }
// //         } catch (err) {
// //             showMessage('Failed to load student results', true);
// //             console.error('Error loading student results:', err);
// //         }
// //     };

// //     const updateAssessmentScore = (subjectId: string, field: 'qa1' | 'qa2' | 'end_of_term', value: number) => {
// //         setAssessments(prev => prev.map(a =>
// //             a.subject_id === subjectId ? { ...a, [field]: Math.min(100, Math.max(0, value)) } : a
// //         ));
// //     };

// //     const saveAllResults = async () => {
// //         if (!selectedStudent) return;
// //         setSavingResults(true);
// //         try {
// //             const passMark = activeConfig?.pass_mark || 50;

// //             // Save assessments
// //             for (const assessment of assessments) {
// //                 await upsertAssessment({
// //                     student_id: selectedStudent.id,
// //                     subject_id: assessment.subject_id,
// //                     assessment_type: 'qa1',
// //                     score: assessment.qa1,
// //                     grade: calculateGrade(assessment.qa1, passMark)
// //                 });

// //                 await upsertAssessment({
// //                     student_id: selectedStudent.id,
// //                     subject_id: assessment.subject_id,
// //                     assessment_type: 'qa2',
// //                     score: assessment.qa2,
// //                     grade: calculateGrade(assessment.qa2, passMark)
// //                 });

// //                 await upsertAssessment({
// //                     student_id: selectedStudent.id,
// //                     subject_id: assessment.subject_id,
// //                     assessment_type: 'end_of_term',
// //                     score: assessment.end_of_term,
// //                     grade: calculateGrade(assessment.end_of_term, passMark)
// //                 });
// //             }

// //             // Save report card (teachers can only update remarks and attendance)
// //             await upsertReportCard({
// //                 student_id: selectedStudent.id,
// //                 term: selectedStudent.term || 'Term 1, 2024/2025',
// //                 days_present: reportCard.days_present,
// //                 days_absent: reportCard.days_absent,
// //                 days_late: reportCard.days_late,
// //                 teacher_remarks: reportCard.teacher_remarks
// //             });

// //             // Auto-calculate ranks (teachers can trigger this)
// //             if (selectedStudent.class?.id) {
// //                 await calculateAndUpdateRanks(
// //                     selectedStudent.class.id,
// //                     selectedStudent.term || 'Term 1, 2024/2025'
// //                 );
// //             }

// //             showMessage('Results saved and ranks auto-calculated!');
// //             loadStudentResults(selectedStudent);
// //         } catch (err: any) {
// //             showMessage(err.message || 'Failed to save results', true);
// //             console.error('Error saving results:', err);
// //         } finally {
// //             setSavingResults(false);
// //         }
// //     };

// //     // Class results handlers
// //     const loadClassResults = async (classId: string) => {
// //         setResultsLoading(true);
// //         try {
// //             const results = await fetchClassResults(classId);
// //             setClassResults(results);
// //         } catch (error) {
// //             console.error('Failed to load class results:', error);
// //             showMessage('Failed to load class results', true);
// //         } finally {
// //             setResultsLoading(false);
// //         }
// //     };

// //     const handleTabChange = (tab: 'results' | 'classResults') => {
// //         setActiveTab(tab);
// //         setSelectedStudent(null);
// //     };

// //     return (
// //         <div className="min-h-screen bg-slate-100">
// //             <TeacherHeader onBack={onBack} />

// //             {error && (
// //                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
// //                     <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
// //                         <AlertCircle className="w-5 h-5 text-red-500" />
// //                         <p className="text-red-700">{error}</p>
// //                     </div>
// //                 </div>
// //             )}

// //             {success && (
// //                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
// //                     <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
// //                         <CheckCircle className="w-5 h-5 text-emerald-500" />
// //                         <p className="text-emerald-700">{success}</p>
// //                     </div>
// //                 </div>
// //             )}

// //             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
// //                 <TeacherTabs activeTab={activeTab} onTabChange={handleTabChange} />
// //             </div>

// //             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
// //                 {loading ? (
// //                     <LoadingSpinner message="Loading teacher data..." />
// //                 ) : activeTab === 'classResults' ? (

// //                     <ClassResultsManagement
// //                         // classes={[]}  // Teachers don't manage classes
// //                         classes={classes}  // CHANGE FROM [] TO classes
// //                         subjects={subjects}
// //                         classResults={classResults}
// //                         students={students}
// //                         selectedClassForResults={selectedClassForResults}
// //                         activeAssessmentType={activeAssessmentType}
// //                         resultsLoading={resultsLoading}
// //                         activeConfig={activeConfig}
// //                         setSelectedClassForResults={setSelectedClassForResults}
// //                         setActiveAssessmentType={setActiveAssessmentType}
// //                         loadClassResults={loadClassResults}
// //                         calculateGrade={calculateGrade}
// //                         isTeacherView={true}  // Add this prop if needed
// //                     />
// //                 ) : (
// //                     <ResultsManagement
// //                         students={students}
// //                         // classes={[]}  // Teachers don't manage classes
// //                         classes={classes}  // CHANGE FROM [] TO classes
// //                         subjects={subjects}
// //                         selectedStudent={selectedStudent}
// //                         assessments={assessments}
// //                         reportCard={reportCard}
// //                         savingResults={savingResults}
// //                         activeConfig={activeConfig}
// //                         setSelectedStudent={setSelectedStudent}
// //                         setAssessments={setAssessments}
// //                         setReportCard={setReportCard}
// //                         loadStudentResults={loadStudentResults}
// //                         saveAllResults={saveAllResults}
// //                         updateAssessmentScore={updateAssessmentScore}
// //                         calculateGrade={calculateGrade}
// //                         calculateFinalScore={calculateFinalScore}
// //                         isTeacherView={true}  // Add this prop if needed
// //                     />
// //                 )}
// //             </div>
// //         </div>
// //     );
// // };

// // export default TeacherPanel;