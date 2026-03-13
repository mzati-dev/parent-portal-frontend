import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, AlertCircle, CheckCircle
} from 'lucide-react';
import {
    fetchAllStudents, fetchAllSubjects, createStudent, updateStudent, deleteStudent,
    upsertAssessment, upsertReportCard, fetchStudentAssessments, fetchStudentReportCard,
    calculateGrade, SubjectRecord, createSubject, deleteSubject,
    fetchAllClasses, createClass, deleteClass, calculateAndUpdateRanks, fetchClassResults,
    publishAssessment,
    archiveResults,
    fetchArchivedResults,
    lockResults,
    fetchLockedAssessments,
    archiveStudentReports,
    sendReportEmail,
    sendReportWhatsApp,
    fetchStudentReportArchives,
    generateReportCards
} from '@/services/studentService';
import {
    getActiveGradeConfig, getAllGradeConfigs, createGradeConfig,
    updateGradeConfig, setActiveConfig, GradeConfiguration, calculateFinalScore
} from '@/services/gradeConfigService';
import AdminHeader from './components/admin/AdminHeader';
import AdminTabs from './components/admin/AdminTabs';
import ClassesManagement from './components/admin/ClassesManagement';
import StudentsManagement from './components/admin/StudentsManagement';
import SubjectsManagement from './components/admin/SubjectsManagement';
import ResultsManagement from './components/admin/ResultsManagement';
import GradeConfigManagement from './components/admin/GradeConfigManagement';
import ClassResultsManagement from './components/admin/ClassResultsManagement';
import LoadingSpinner from './components/common/LoadingSpinner';
import { Student, Assessment, ClassResultStudent } from './types/admin';
import TeachersManagement from './components/admin/TeachersManagement';
import { createTeacher, deleteTeacher, fetchAllTeachers } from './services/teacherService';
import CustomConfirmModal from './components/common/CustomConfirmModal';
import CustomAlertModal from './components/common/CustomAlertModal';
import ArchivedResultsView from './components/admin/modals/ArchivedResultsView';
import ArchiveModal from './components/admin/modals/ArchiveModal';
import PublishModal from './components/admin/modals/PublishModal';
import LockedAssessmentsModal from './components/admin/modals/LockedAssessmentsModal';
import LockModal from './components/admin/modals/LockModal';
import StudentReportArchiveModal from './components/admin/modals/StudentReportArchiveModal';
// import ArchiveStudentReportsModal from './components/admin/modals/ArchiveStudentReportsModal';
import PreviewModal from './components/admin/modals/PreviewModal';

interface AdminPanelProps {
    onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'classes' | 'students' | 'teachers' | 'subjects' | 'results' | 'gradeConfig' | 'classResults'>('classes');
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Add with other state declarations
    const [selectedClassForPublish, setSelectedClassForPublish] = useState<string>('');
    const [selectedTermForPublish, setSelectedTermForPublish] = useState<string>('');
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [archivedResults, setArchivedResults] = useState<any[]>([]);
    const [showLockedModal, setShowLockedModal] = useState(false);
    const [lockedAssessments, setLockedAssessments] = useState<any[]>([]);
    const [showLockModal, setShowLockModal] = useState(false);
    const [showArchivedModal, setShowArchivedModal] = useState(false);
    // Add state
    const [showArchiveStudentModal, setShowArchiveStudentModal] = useState(false);
    // Add with other state
    const [showStudentReportModal, setShowStudentReportModal] = useState(false);
    const [studentReportArchives, setStudentReportArchives] = useState<any[]>([]);
    const [schoolName, setSchoolName] = useState<string>('School Name');
    // Add with other state declarations
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // Class management state
    const [classes, setClasses] = useState<any[]>([]);
    const [showClassForm, setShowClassForm] = useState(false);
    const [classForm, setClassForm] = useState({
        name: '',
        academic_year: '',
        term: 'Term 1'
    });
    const [classLoading, setClassLoading] = useState(false);

    // Student form state
    const [showStudentForm, setShowStudentForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [studentForm, setStudentForm] = useState({
        exam_number: '',
        name: '',
        class_id: '',
        photo_url: ''
    });

    // Teacher management state
    const [teachers, setTeachers] = useState<any[]>([]);
    const [showTeacherForm, setShowTeacherForm] = useState(false);
    const [teacherForm, setTeacherForm] = useState({
        name: '',
        email: '',
        password: '',

    });

    // Subject form state
    const [showSubjectForm, setShowSubjectForm] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [addingSubject, setAddingSubject] = useState(false);

    // Results editing state
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [reportCard, setReportCard] = useState({
        class_rank: 0,
        qa1_rank: 0,
        qa2_rank: 0,
        total_students: 0,
        // days_present: 0,
        // days_absent: 0,
        // days_late: 0,
        days_present: undefined,      // ✅
        days_absent: undefined,       // ✅
        days_late: undefined,         // ✅
        teacher_remarks: ''
    });
    const [savingResults, setSavingResults] = useState(false);

    // Grade configuration state
    const [gradeConfigs, setGradeConfigs] = useState<GradeConfiguration[]>([]);
    const [activeConfig, setActiveConfigState] = useState<GradeConfiguration | null>(null);
    const [showConfigForm, setShowConfigForm] = useState(false);
    const [editingConfig, setEditingConfig] = useState<GradeConfiguration | null>(null);
    const [configForm, setConfigForm] = useState({
        configuration_name: '',
        calculation_method: 'weighted_average' as 'average_all' | 'end_of_term_only' | 'weighted_average',
        weight_qa1: 30,
        weight_qa2: 30,
        weight_end_of_term: 40,
        pass_mark: 50,
    });

    // Class results state
    const [classResults, setClassResults] = useState<ClassResultStudent[]>([]);
    const [selectedClassForResults, setSelectedClassForResults] = useState<string>('');
    const [activeAssessmentType, setActiveAssessmentType] = useState<'qa1' | 'qa2' | 'endOfTerm' | 'overall'>('overall');
    const [resultsLoading, setResultsLoading] = useState(false);

    // Auto-generate exam number effect
    // useEffect(() => {
    //     if (studentForm.class_id) {
    //         const selectedClass = classes.find(c => c.id === studentForm.class_id);
    //         if (selectedClass) {
    //             const classNumberMatch = selectedClass.name.match(/\d+/);
    //             const classNumber = classNumberMatch ? classNumberMatch[0] : '0';
    //             const currentYear = new Date().getFullYear().toString().slice(-2);
    //             const studentCount = students.filter(s => s.class?.id === selectedClass.id).length;
    //             const nextNumber = studentCount + 1;
    //             const examNumber = `${currentYear}-${classNumber}${nextNumber.toString().padStart(3, '0')}`;
    //             setStudentForm(prev => ({ ...prev, exam_number: examNumber }));
    //         }
    //     }
    // }, [studentForm.class_id, classes, students]);


    // Auto-generate exam number effect
    useEffect(() => {
        if (studentForm.class_id) {
            const selectedClass = classes.find(c => c.id === studentForm.class_id);
            if (selectedClass) {
                const classNumberMatch = selectedClass.name.match(/\d+/);
                const classNumber = classNumberMatch ? classNumberMatch[0] : '0';
                const currentYear = new Date().getFullYear().toString().slice(-2);
                const studentCount = students.filter(s => s.class?.id === selectedClass.id).length;
                const nextNumber = studentCount + 1;

                // Get school ID from localStorage (same as backend will use)
                const userStr = localStorage.getItem('user');
                let schoolIdPrefix = 'SCH'; // default
                if (userStr) {
                    try {
                        const user = JSON.parse(userStr);
                        schoolIdPrefix = user.schoolId ? user.schoolId.substring(0, 3) : 'SCH';
                    } catch (e) {
                        // keep default
                    }
                }

                const examNumber = `${schoolIdPrefix}-${currentYear}-${classNumber}${nextNumber.toString().padStart(3, '0')}`;
                setStudentForm(prev => ({ ...prev, exam_number: examNumber }));
            }
        }
    }, [studentForm.class_id, classes, students]);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [studentsData, subjectsData, allConfigs, activeConfigData, classesData] = await Promise.all([
                fetchAllStudents(),
                fetchAllSubjects(),
                getAllGradeConfigs(),
                getActiveGradeConfig(),
                fetchAllClasses()
            ]);
            setStudents(studentsData);
            setSubjects(subjectsData);
            setGradeConfigs(allConfigs);
            setActiveConfigState(activeConfigData);
            setClasses(classesData || []);
            await loadTeachers();
        } catch (err) {
            setError('Failed to load data');
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

    // Class management handlers
    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        setClassLoading(true);
        try {
            await createClass(classForm);
            showMessage('Class created successfully!');
            setShowClassForm(false);
            setClassForm({ name: '', academic_year: '', term: 'Term 1' });
            loadData();
        } catch (err: any) {
            showMessage(err.message || 'Failed to create class', true);
        } finally {
            setClassLoading(false);
        }
    };

    const handleDeleteClass = async (classId: string) => {
        if (!confirm('Delete this class? All students in this class will also be deleted.')) {
            return;
        }
        try {
            await deleteClass(classId);
            showMessage('Class deleted successfully!');
            loadData();
        } catch (err: any) {
            showMessage(err.message || 'Failed to delete class', true);
        }
    };

    // Student management handlers
    const handleCreateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createStudent({
                name: studentForm.name,
                class_id: studentForm.class_id,
                photo_url: studentForm.photo_url
            });
            showMessage('Student created successfully!');
            setShowStudentForm(false);
            setStudentForm({ exam_number: '', name: '', class_id: '', photo_url: '' });
            loadData();
        } catch (err: any) {
            showMessage(err.message || 'Failed to create student', true);
        }
    };

    const handleUpdateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStudent) return;
        try {
            await updateStudent(editingStudent.id, {
                name: studentForm.name,
                class_id: studentForm.class_id,
                photo_url: studentForm.photo_url
            });
            showMessage('Student updated successfully!');
            setEditingStudent(null);
            setStudentForm({ exam_number: '', name: '', class_id: '', photo_url: '' });
            loadData();
        } catch (err: any) {
            showMessage(err.message || 'Failed to update student', true);
        }
    };

    const handleDeleteStudent = async (student: Student) => {
        if (!confirm(`Are you sure you want to delete ${student.name}? This will also delete all their assessments and report cards.`)) {
            return;
        }
        try {
            await deleteStudent(student.id);
            showMessage('Student deleted successfully!');
            loadData();
        } catch (err: any) {
            showMessage(err.message || 'Failed to delete student', true);
        }
    };

    const startEditStudent = (student: Student) => {
        setEditingStudent(student);
        setStudentForm({
            exam_number: student.examNumber,
            name: student.name,
            class_id: student.class?.id || '',
            photo_url: student.photo_url || ''
        });
    };

    // Teacher management handlers
    const loadTeachers = async () => {
        try {
            const teachersData = await fetchAllTeachers();
            setTeachers(teachersData);
        } catch (err: any) {
            showMessage(err.message || 'Failed to load teachers', true);
        }
    };

    const handleCreateTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createTeacher({
                name: teacherForm.name,
                email: teacherForm.email,
                password: teacherForm.password
            });

            showMessage('Teacher created successfully!');
            setShowTeacherForm(false);
            setTeacherForm({ name: '', email: '', password: '' });
            loadTeachers();
        } catch (err: any) {
            showMessage(err.message || 'Failed to create teacher', true);
        }
    };

    const handleDeleteTeacher = async (teacherId: string) => {
        if (!confirm('Delete this teacher? This will remove their access to the system.')) {
            return;
        }
        try {
            await deleteTeacher(teacherId);
            showMessage('Teacher deleted successfully!');
            loadTeachers();
        } catch (err: any) {
            showMessage(err.message || 'Failed to delete teacher', true);
        }
    };

    // Subject management handlers
    const handleAddSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubjectName.trim()) return;
        setAddingSubject(true);
        try {
            await createSubject({ name: newSubjectName.trim() });
            showMessage('Subject added successfully!');
            setNewSubjectName('');
            setShowSubjectForm(false);
            loadData();
        } catch (err: any) {
            showMessage(err.message || 'Failed to add subject', true);
        } finally {
            setAddingSubject(false);
        }
    };

    const handleDeleteSubject = async (subject: SubjectRecord) => {
        if (!confirm(`Delete subject "${subject.name}"? This will also delete all associated assessments.`)) {
            return;
        }
        try {
            await deleteSubject(subject.id);
            showMessage('Subject deleted successfully!');
            loadData();
        } catch (err: any) {
            showMessage(err.message || 'Failed to delete subject', true);
        }
    };



    const loadStudentResults = async (student: Student) => {
        setSelectedStudent(student);
        try {
            const [assessmentsData, reportCardData] = await Promise.all([
                fetchStudentAssessments(student.id),
                fetchStudentReportCard(student.id, student.term || 'Term 1, 2024/2025')
            ]);

            const assessmentMap = new Map<string, Assessment>();
            subjects.forEach(sub => {
                assessmentMap.set(sub.id, {
                    subject_id: sub.id,
                    subject_name: sub.name,
                    qa1: null,
                    qa2: null,
                    end_of_term: null
                });
            });

            // FIXED: Handle different property names
            assessmentsData.forEach((a: any) => {
                // Get subject ID - could be nested or flat
                const subjectId = a.subject_id || a.subject?.id;
                // Get assessment type - could be different naming
                const assessmentType = a.assessment_type || a.assessmentType;
                const score = a.score;
                const isAbsent = a.isAbsent || false;  // 👈 Add this

                if (subjectId) {
                    const existing = assessmentMap.get(subjectId);
                    if (existing) {
                        //     if (assessmentType === 'qa1') existing.qa1 = score;
                        //     if (assessmentType === 'qa2') existing.qa2 = score;
                        //     if (assessmentType === 'end_of_term') existing.end_of_term = score;
                        // }

                        if (assessmentType === 'qa1') {
                            // existing.qa1 = score;
                            existing.qa1 = score !== undefined ? score : null;
                            existing.qa1_absent = isAbsent;  // 👈 Add this
                        }
                        if (assessmentType === 'qa2') {
                            // existing.qa2 = score;
                            existing.qa2 = score !== undefined ? score : null;
                            existing.qa2_absent = isAbsent;  // 👈 Add this
                        }
                        if (assessmentType === 'end_of_term') {
                            // existing.end_of_term = score;
                            existing.end_of_term = score !== undefined ? score : null;
                            existing.end_of_term_absent = isAbsent;  // 👈 Add this
                        }
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
                    // days_present: reportCardData.days_present || 0,
                    // days_absent: reportCardData.days_absent || 0,
                    // days_late: reportCardData.days_late || 0,
                    days_present: reportCardData.days_present === 0 ? undefined : reportCardData.days_present,    // ✅
                    days_absent: reportCardData.days_absent === 0 ? undefined : reportCardData.days_absent,      // ✅
                    days_late: reportCardData.days_late === 0 ? undefined : reportCardData.days_late,            // ✅
                    teacher_remarks: reportCardData.teacher_remarks || ''
                });
            } else {
                setReportCard({
                    class_rank: 0,
                    qa1_rank: 0,
                    qa2_rank: 0,
                    total_students: 0,
                    // days_present: 0,
                    // days_absent: 0,
                    // days_late: 0,
                    days_present: undefined,
                    days_absent: undefined,
                    days_late: undefined,
                    teacher_remarks: ''
                });
            }
        } catch (err) {
            showMessage('Failed to load student results', true);
        }
    };

    const updateAssessmentScore = (subjectId: string, field: 'qa1' | 'qa2' | 'end_of_term', value: number, isAbsent: boolean = false) => {
        setAssessments(prev => prev.map(a =>
            a.subject_id === subjectId ? {
                ...a,
                // [field]: Math.min(100, Math.max(0, value)),
                [field]: value === null ? null : Math.min(100, Math.max(0, value)),
                // Also update the corresponding absent flag
                [`${field}_absent`]: isAbsent

            } : a
        ));
    };




    const saveAllResults = async () => {
        if (!selectedStudent) return;
        setSavingResults(true);
        try {
            const passMark = activeConfig?.pass_mark || 50;

            // Save ALL assessments (including 0)
            for (const assessment of assessments) {
                await upsertAssessment({
                    student_id: selectedStudent.id,
                    subject_id: assessment.subject_id,
                    assessment_type: 'qa1',
                    score: assessment.qa1,
                    is_absent: assessment.qa1_absent || false,
                    grade: calculateGrade(assessment.qa1, passMark, assessment.qa1_absent)
                });

                await upsertAssessment({
                    student_id: selectedStudent.id,
                    subject_id: assessment.subject_id,
                    assessment_type: 'qa2',
                    score: assessment.qa2,
                    is_absent: assessment.qa2_absent || false,  // 👈 ADD THIS
                    grade: calculateGrade(assessment.qa2, passMark, assessment.qa2_absent)
                });

                await upsertAssessment({
                    student_id: selectedStudent.id,
                    subject_id: assessment.subject_id,
                    assessment_type: 'end_of_term',
                    score: assessment.end_of_term,
                    is_absent: assessment.end_of_term_absent || false,  // 👈 ADD THIS
                    grade: calculateGrade(assessment.end_of_term, passMark, assessment.end_of_term_absent)
                });
            }

            // Save report card
            await upsertReportCard({
                student_id: selectedStudent.id,
                term: selectedStudent.term || 'Term 1, 2024/2025',
                days_present: reportCard.days_present,
                days_absent: reportCard.days_absent,
                days_late: reportCard.days_late,
                teacher_remarks: reportCard.teacher_remarks
            });

            // Auto-calculate ranks
            if (selectedStudent.class?.id) {
                await calculateAndUpdateRanks(
                    selectedStudent.class.id,
                    selectedStudent.term || 'Term 1, 2024/2025'
                );
            }

            // === START: AUTO-SWITCH TO END OF TERM ONLY IF QA1/QA2 ENTERED ===
            // Check if QA1/QA2 scores were entered but NO End of Term
            const hasQAScores = assessments.some(a => a.qa1 > 0 || a.qa2 > 0);
            const hasNoEndTerm = assessments.every(a => a.end_of_term === 0);

            if (hasQAScores && hasNoEndTerm) {
                // Find or create an "end_of_term_only" configuration
                const allConfigs = await getAllGradeConfigs();
                let endOfTermConfig = allConfigs.find(c => c.calculation_method === 'end_of_term_only');

                if (!endOfTermConfig) {
                    // Create one if it doesn't exist
                    endOfTermConfig = await createGradeConfig({
                        configuration_name: 'End of Term Only (Auto)',
                        calculation_method: 'end_of_term_only',
                        pass_mark: activeConfig?.pass_mark || 50,
                        is_active: false
                    });
                }

                // Activate the end_of_term_only configuration
                await setActiveConfig(endOfTermConfig.id);
                showMessage('Results saved! Grade calculation switched to End of Term Only because only QA1/QA2 scores are entered');
            } else {
                showMessage('Results saved and ranks auto-calculated!');
            }
            // === END: AUTO-SWITCH TO END OF TERM ONLY ===

            loadStudentResults(selectedStudent);
        } catch (err: any) {
            showMessage(err.message || 'Failed to save results', true);
        } finally {
            setSavingResults(false);
        }
    };

    // Grade config handlers
    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        if (configForm.calculation_method === 'weighted_average' &&
            configForm.weight_qa1 + configForm.weight_qa2 + configForm.weight_end_of_term !== 100) {
            showMessage('Total weights must equal 100%', true);
            return;
        }
        try {
            if (editingConfig) {
                await updateGradeConfig(editingConfig.id, configForm);
                showMessage('Configuration updated successfully!');
            } else {
                await createGradeConfig(configForm);
                showMessage('Configuration created successfully!');
            }
            setShowConfigForm(false);
            setEditingConfig(null);
            loadData();
        } catch (err: any) {
            showMessage(err.message || 'Failed to save configuration', true);
        }
    };

    const handleActivateConfig = async (id: string) => {
        try {
            await setActiveConfig(id);
            showMessage('Configuration activated successfully!');
            loadData();
        } catch (err: any) {
            showMessage(err.message || 'Failed to activate configuration', true);
        }
    };

    const startEditConfig = (config: GradeConfiguration) => {
        setEditingConfig(config);
        setConfigForm({
            configuration_name: config.configuration_name,
            calculation_method: config.calculation_method,
            weight_qa1: config.weight_qa1,
            weight_qa2: config.weight_qa2,
            weight_end_of_term: config.weight_end_of_term,
            pass_mark: config.pass_mark || 50,
        });
    };

    // Class results handlers
    const loadClassResults = async (classId: string) => {
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

    const handleTabChange = (tab: 'classes' | 'students' | 'teachers' | 'subjects' | 'results' | 'gradeConfig' | 'classResults') => {
        setActiveTab(tab);
        setSelectedStudent(null);
    };



    // Then update your handlers:

    // const handlePublishAssessment = async (classId: string, term: string, assessmentType: 'qa1' | 'qa2' | 'endOfTerm', publish: boolean) => {
    //     try {
    //         await publishAssessment(classId, term, assessmentType, publish);
    //         showMessage(`Assessment ${publish ? 'published' : 'unpublished'} successfully!`);
    //     } catch (error: any) {
    //         showMessage(error.message || 'Failed to update publish status', true);
    //     }
    // };
    const handlePublishAssessment = async (
        assessmentType: 'qa1' | 'qa2' | 'endOfTerm',
        publish: boolean,
        publishAll?: boolean
    ) => {
        try {
            if (publishAll) {
                // Loop through ALL classes
                for (const cls of classes) {
                    await publishAssessment(cls.id, cls.term, assessmentType, publish);
                }
                showMessage(`✅ Successfully ${publish ? 'published' : 'unpublished'} ${assessmentType} for ALL ${classes.length} classes!`);
            } else {
                // Publish for selected class only
                if (!selectedClassForResults) {
                    showMessage('Please select a class first', true);
                    return;
                }
                const selectedClass = classes.find(c => c.id === selectedClassForResults);
                await publishAssessment(
                    selectedClassForResults,
                    selectedClass?.term || 'Term 1',
                    assessmentType,
                    publish
                );
                showMessage(`✅ Successfully ${publish ? 'published' : 'unpublished'} ${assessmentType} for ${selectedClass?.name}`);
            }
        } catch (error: any) {
            showMessage(error.message || 'Failed to update publish status', true);
        }
    };

    const handleArchiveResults = async (classId: string, term: string, academicYear: string) => {
        try {
            await archiveResults(classId, term, academicYear);
            showMessage('Results archived successfully!');
            setShowArchiveModal(false);
        } catch (error: any) {
            showMessage(error.message || 'Failed to archive results', true);
        }
    };

    // Update your loadArchivedResults function:
    const loadArchivedResults = async (classId: string, term: string, academicYear: string) => {
        try {
            const data = await fetchArchivedResults(classId, term, academicYear);
            setArchivedResults(data ? [data] : []);
            setShowArchivedModal(true);  // ✅ Open modal AFTER data loads
        } catch (error: any) {
            showMessage(error.message || 'Failed to load archived results', true);
        }
    };
    // const handleLockResults = async (classId: string, term: string, lock: boolean) => {
    //     try {
    //         await lockResults(classId, term, lock);
    //         showMessage(`Results ${lock ? 'locked' : 'unlocked'} successfully!`);
    //     } catch (error: any) {
    //         showMessage(error.message || 'Failed to lock/unlock results', true);
    //     }
    // };

    // const handleLockResults = async (
    //     classId: string,
    //     term: string,
    //     assessmentType: 'qa1' | 'qa2' | 'endOfTerm',
    //     lock: boolean,
    //     studentIds?: string[]
    // ) => {
    //     try {
    //         await lockResults(classId, term, assessmentType, lock, studentIds);
    //         showMessage(`Results ${lock ? 'locked' : 'unlocked'} successfully!`);
    //         if (classId === selectedClassForResults) {
    //             loadClassResults(classId);
    //         }
    //     } catch (error: any) {
    //         showMessage(error.message || 'Failed to lock/unlock results', true);
    //     }
    // };

    const handleLockResults = async (
        classId: string,
        term: string,
        assessmentType: 'qa1' | 'qa2' | 'endOfTerm',
        lock: boolean,
        lockReason: 'fee' | 'teacher', // ADD THIS PARAMETER
        studentIds?: string[]
    ) => {
        try {
            await lockResults(classId, term, assessmentType, lock, lockReason, studentIds); // ADD lockReason
            showMessage(`Results ${lock ? 'locked' : 'unlocked'} successfully!`);
            if (classId === selectedClassForResults) {
                loadClassResults(classId);
            }
        } catch (error: any) {
            showMessage(error.message || 'Failed to lock/unlock results', true);
        }
    };

    // const loadLockedAssessments = async (classId: string, term: string) => {
    //     try {
    //         // You'll need to add this function to studentService
    //         const data = await fetchLockedAssessments(classId, term);
    //         setLockedAssessments(data);
    //         setShowLockedModal(true);
    //     } catch (error: any) {
    //         showMessage(error.message || 'Failed to load locked assessments', true);
    //     }
    // };

    // Update this function in your AdminPanel component:

    const loadLockedAssessments = async (classId: string, term: string) => {
        try {
            const data = await fetchLockedAssessments(classId, term);

            // Ensure data is always an array
            if (Array.isArray(data)) {
                setLockedAssessments(data);
            } else if (data && typeof data === 'object') {
                // If it's a single object, wrap it in an array
                setLockedAssessments([data]);
            } else {
                // If it's null/undefined, set empty array
                setLockedAssessments([]);
            }

            setShowLockedModal(true);
        } catch (error: any) {
            showMessage(error.message || 'Failed to load locked assessments', true);
            setLockedAssessments([]); // Reset on error
        }
    };

    // Add function
    const loadStudentReportArchives = async (classId: string, term: string) => {
        try {
            const data = await fetchStudentReportArchives(classId, term);
            console.log('🔍 RAW Archived data:', data); // 👈 CHECK THIS
            console.log('🔍 Data length:', data?.length);
            console.log('🔍 Archived data:', data); // 👈 ADD THIS LINE
            setStudentReportArchives(data);
            setShowStudentReportModal(true);
        } catch (error: any) {
            showMessage(error.message || 'Failed to load student reports', true);
        }
    };
    const handleArchiveStudentReports = async (classId: string, term: string, assessmentType: 'qa1' | 'qa2' | 'endOfTerm' | 'overall' | 'all') => {
        try {
            if (assessmentType === 'all') {
                // Archive all three types (not overall since overall is calculated)
                await archiveStudentReports(classId, term, 'qa1');
                await archiveStudentReports(classId, term, 'qa2');
                await archiveStudentReports(classId, term, 'endOfTerm');
                showMessage('All student reports archived successfully!');
            } else if (assessmentType === 'overall') {
                // For overall, you might archive all three or handle differently
                // Since overall is calculated from the three, you might want to archive all three
                await archiveStudentReports(classId, term, 'qa1');
                await archiveStudentReports(classId, term, 'qa2');
                await archiveStudentReports(classId, term, 'endOfTerm');
                showMessage('Overall report card archived successfully!');
            } else {
                await archiveStudentReports(classId, term, assessmentType);
                showMessage('Student reports archived successfully!');
            }
        } catch (error: any) {
            showMessage(error.message || 'Failed to archive student reports', true);
        }
    };

    const handleSendReportEmail = async (archiveId: string) => {
        try {
            await sendReportEmail(archiveId);
            showMessage('Email sent successfully!');
        } catch (error: any) {
            showMessage(error.message || 'Failed to send email', true);
        }
    };

    const handleSendReportWhatsApp = async (archiveId: string) => {
        try {
            await sendReportWhatsApp(archiveId);
            showMessage('WhatsApp sent successfully!');
        } catch (error: any) {
            showMessage(error.message || 'Failed to send WhatsApp', true);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100">
            <AdminHeader onBack={onBack} />

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
                <AdminTabs activeTab={activeTab} onTabChange={handleTabChange} />

                {/* Calculate Ranks Button */}

            </div>

            {/* Custom Confirm Modal */}
            <CustomConfirmModal
                isOpen={showConfirmModal}
                title="Calculate Final Ranks"
                message="This will recalculate rankings for all classes based on all entered scores. Are you sure you want to continue?"
                onConfirm={async () => {
                    setShowConfirmModal(false);
                    setSavingResults(true);
                    try {
                        const classData = JSON.parse(localStorage.getItem('selectedClassForRank') || '{}');

                        if (classData.id) {
                            await calculateAndUpdateRanks(classData.id, classData.term);
                            setSuccessMessage(`Ranks calculated for ${classData.name} successfully!`);
                            localStorage.removeItem('selectedClassForRank');
                        } else {
                            setErrorMessage('No class selected');
                        }

                        setShowSuccessModal(true);
                        await loadData();
                    } catch (error) {
                        setErrorMessage('Error calculating ranks');
                        setShowSuccessModal(true);
                    } finally {
                        setSavingResults(false);
                    }
                }}
                onCancel={() => setShowConfirmModal(false)}
            />

            {/* Success/Error Modal */}
            <CustomAlertModal
                isOpen={showSuccessModal}
                title={errorMessage ? 'Error' : 'Success'}
                message={errorMessage || successMessage}
                type={errorMessage ? 'error' : 'success'}
                onClose={() => {
                    setShowSuccessModal(false);
                    setErrorMessage('');
                    setSuccessMessage('');
                }}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading ? (
                    <LoadingSpinner message="Loading admin data..." />
                ) : activeTab === 'classes' ? (
                    <ClassesManagement
                        classes={classes}
                        students={students}
                        showClassForm={showClassForm}
                        classForm={classForm}
                        classLoading={classLoading}
                        setShowClassForm={setShowClassForm}
                        setClassForm={setClassForm}
                        handleCreateClass={handleCreateClass}
                        handleDeleteClass={handleDeleteClass}
                        handleDeleteStudent={handleDeleteStudent}
                        showMessage={showMessage}
                    />
                ) : activeTab === 'students' ? (
                    <StudentsManagement
                        students={students}
                        classes={classes}
                        showStudentForm={showStudentForm}
                        editingStudent={editingStudent}
                        studentForm={studentForm}
                        setShowStudentForm={setShowStudentForm}
                        setEditingStudent={setEditingStudent}
                        setStudentForm={setStudentForm}
                        handleCreateStudent={handleCreateStudent}
                        handleUpdateStudent={handleUpdateStudent}
                        handleDeleteStudent={handleDeleteStudent}
                        startEditStudent={startEditStudent}
                    />
                )
                    // : activeTab === 'teachers' ? (  // ADD THIS CONDITION
                    //     <TeachersManagement
                    //         teachers={teachers}
                    //         showTeacherForm={showTeacherForm}
                    //         teacherForm={teacherForm}
                    //         setShowTeacherForm={setShowTeacherForm}
                    //         setTeacherForm={setTeacherForm}
                    //         handleCreateTeacher={handleCreateTeacher}
                    //         handleDeleteTeacher={handleDeleteTeacher}
                    //     />
                    // )

                    : activeTab === 'teachers' ? (  // ADD THIS CONDITION
                        <TeachersManagement
                            teachers={teachers}
                            showTeacherForm={showTeacherForm}
                            teacherForm={teacherForm}
                            setShowTeacherForm={setShowTeacherForm}
                            setTeacherForm={setTeacherForm}
                            handleCreateTeacher={handleCreateTeacher}
                            handleDeleteTeacher={handleDeleteTeacher}
                            // ===== ADD THESE TWO PROPS =====
                            classes={classes}
                            subjects={subjects}
                        // ===== END ADD PROPS =====
                        />
                    )

                        : activeTab === 'subjects' ? (
                            <SubjectsManagement
                                subjects={subjects}
                                showSubjectForm={showSubjectForm}
                                newSubjectName={newSubjectName}
                                addingSubject={addingSubject}
                                setShowSubjectForm={setShowSubjectForm}
                                setNewSubjectName={setNewSubjectName}
                                handleAddSubject={handleAddSubject}
                                handleDeleteSubject={handleDeleteSubject}
                            />
                        ) : activeTab === 'gradeConfig' ? (
                            <GradeConfigManagement
                                gradeConfigs={gradeConfigs}
                                activeConfig={activeConfig}
                                showConfigForm={showConfigForm}
                                editingConfig={editingConfig}
                                configForm={configForm}
                                setShowConfigForm={setShowConfigForm}
                                setEditingConfig={setEditingConfig}
                                setConfigForm={setConfigForm}
                                handleSaveConfig={handleSaveConfig}
                                handleActivateConfig={handleActivateConfig}
                                startEditConfig={startEditConfig}
                                loadData={loadData}
                            />
                        ) : activeTab === 'classResults' ? (
                            <>
                                {/* Add buttons above ClassResultsManagement */}
                                <div className="flex gap-2 mb-4">
                                    <button
                                        onClick={() => {
                                            const selectedClass = classes.find(c => c.id === selectedClassForResults);
                                            if (selectedClass) {
                                                setShowLockModal(true);  // ✅ Opens modal
                                            } else {
                                                showMessage('Please select a class first', true);
                                            }
                                        }}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                                    >
                                        <span>🔒</span> Lock Results
                                    </button>

                                    <button
                                        onClick={() => {
                                            const selectedClass = classes.find(c => c.id === selectedClassForResults);
                                            if (selectedClass) {
                                                loadLockedAssessments(selectedClassForResults, selectedClass.term);
                                            } else {
                                                showMessage('Please select a class first', true);
                                            }
                                        }}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2"
                                    >
                                        <span>🔍</span> View Locked
                                    </button>


                                    <button
                                        onClick={() => setShowPublishModal(true)}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
                                    >
                                        <span>📢</span> Publish Results
                                    </button>
                                    <button
                                        onClick={() => setShowArchiveModal(true)}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                                    >
                                        <span>📦</span> Archive Term
                                    </button>
                                    <button
                                        onClick={() => {
                                            const selectedClass = classes.find(c => c.id === selectedClassForResults);
                                            if (selectedClass) {
                                                loadArchivedResults(
                                                    selectedClassForResults,
                                                    selectedClass.term,
                                                    selectedClass.academic_year
                                                );
                                            } else {
                                                showMessage('Please select a class first', true);
                                            }
                                        }}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
                                    >
                                        <span>📚</span> View Archives
                                    </button>
                                    <button
                                        onClick={() => {
                                            const selectedClass = classes.find(c => c.id === selectedClassForResults);
                                            if (selectedClass) {
                                                generateReportCards(selectedClassForResults, selectedClass.term, 'endOfTerm')
                                                    .then(data => {
                                                        // You need state for this
                                                        setPreviewData(data);
                                                        setShowPreviewModal(true);
                                                    })
                                                    .catch(err => showMessage(err.message, true));
                                            } else {
                                                showMessage('Please select a class first', true);
                                            }
                                        }}
                                        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg flex items-center gap-2"
                                    >
                                        <span>📋</span> Archive Student Reports
                                    </button>


                                    {/* <ArchiveStudentReportsModal
                                        isOpen={showArchiveStudentModal}
                                        onClose={() => setShowArchiveStudentModal(false)}
                                        onArchive={async (assessmentType) => {
                                            const selectedClass = classes.find(c => c.id === selectedClassForResults);
                                            if (selectedClass) {
                                                await handleArchiveStudentReports(selectedClassForResults, selectedClass.term, assessmentType);
                                            }
                                        }}
                                        term={classes.find(c => c.id === selectedClassForResults)?.term}
                                    /> */}

                                    <button
                                        onClick={() => {
                                            const selectedClass = classes.find(c => c.id === selectedClassForResults);
                                            if (selectedClass) {
                                                loadStudentReportArchives(selectedClassForResults, selectedClass.term);
                                            } else {
                                                showMessage('Please select a class first', true);
                                            }
                                        }}
                                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-2"
                                    >
                                        <span>📄</span> Student Reports
                                    </button>

                                </div>
                                <ClassResultsManagement
                                    classes={classes}
                                    subjects={subjects}
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
                                />
                            </>

                        ) : (


                            <ResultsManagement
                                students={students}
                                classes={classes}
                                subjects={subjects}
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
                                // ADD THESE THREE PROPS
                                setShowConfirmModal={setShowConfirmModal}
                                setSuccessMessage={setSuccessMessage}
                                setShowSuccessModal={setShowSuccessModal}
                                setErrorMessage={setErrorMessage}
                            />

                        )}
            </div>
            {/* Publish Modal */}
            {/* <PublishModal
                isOpen={showPublishModal}
                onClose={() => setShowPublishModal(false)}
                onPublish={async (assessmentType, publish) => {
                    if (selectedClassForResults) {
                        const selectedClass = classes.find(c => c.id === selectedClassForResults);
                        await handlePublishAssessment(
                            selectedClassForResults,
                            selectedClass?.term || 'Term 1',
                            assessmentType,
                            publish
                        );
                    }
                }}
                term={classes.find(c => c.id === selectedClassForResults)?.term}
            /> */}

            <PublishModal
                isOpen={showPublishModal}
                onClose={() => setShowPublishModal(false)}
                onPublish={handlePublishAssessment}  // This now matches the new signature
                term={classes.find(c => c.id === selectedClassForResults)?.term}
                className={classes.find(c => c.id === selectedClassForResults)?.name}
                totalClasses={classes.length}  // Add this line
            />

            {/* Archive Modal */}
            <ArchiveModal
                isOpen={showArchiveModal}
                onClose={() => setShowArchiveModal(false)}
                onArchive={async (term, academicYear) => {
                    if (selectedClassForResults) {
                        await handleArchiveResults(selectedClassForResults, term, academicYear);
                    }
                }}
                defaultTerm={classes.find(c => c.id === selectedClassForResults)?.term}
                defaultAcademicYear={classes.find(c => c.id === selectedClassForResults)?.academic_year}
            />

            {/* Archived Results View */}

            <ArchivedResultsView
                isOpen={showArchivedModal}  // ✅ Use separate state
                onClose={() => {
                    setShowArchivedModal(false);
                    setArchivedResults([]);
                }}
                archivedResults={archivedResults}
            />

            {/* <LockedAssessmentsModal
                isOpen={showLockedModal}
                onClose={() => setShowLockedModal(false)}
                assessments={lockedAssessments}
                onUnlock={async (assessmentId, assessmentType) => {
                    const selectedClass = classes.find(c => c.id === selectedClassForResults);
                    if (selectedClass) {
                        await handleLockResults(selectedClassForResults, selectedClass.term, false);
                        loadLockedAssessments(selectedClassForResults, selectedClass.term);
                    }
                }}
            /> */}
            {/* 
            <LockedAssessmentsModal
                isOpen={showLockedModal}
                onClose={() => setShowLockedModal(false)}
                assessments={lockedAssessments}
                onUnlock={async (assessmentId, assessmentType) => {
                    const selectedClass = classes.find(c => c.id === selectedClassForResults);
                    if (selectedClass) {
                        await handleLockResults(
                            selectedClassForResults,
                            selectedClass.term,
                            assessmentType as 'qa1' | 'qa2' | 'endOfTerm', // Add 'as' assertion
                            false
                        );
                        loadLockedAssessments(selectedClassForResults, selectedClass.term);
                    }
                }}
            /> */}

            {/* <LockedAssessmentsModal
                isOpen={showLockedModal}
                onClose={() => setShowLockedModal(false)}
                assessments={lockedAssessments}
                onUnlock={async (assessmentId, assessmentType) => {
                    const selectedClass = classes.find(c => c.id === selectedClassForResults);
                    if (selectedClass) {
                        await handleLockResults(
                            selectedClassForResults,
                            selectedClass.term,
                            assessmentType as 'qa1' | 'qa2' | 'endOfTerm',
                            false, // lock = false
                            'teacher', // ADD THIS - lockReason (doesn't matter for unlock)
                            undefined // studentIds (unlock all)
                        );
                        loadLockedAssessments(selectedClassForResults, selectedClass.term);
                    }
                }}
            /> */}

            {/* <LockedAssessmentsModal
                isOpen={showLockedModal}
                onClose={() => setShowLockedModal(false)}
                assessments={lockedAssessments}
                onUnlock={async (assessmentId, assessmentType, lockReason) => {  // ← ADD lockReason here
                    const selectedClass = classes.find(c => c.id === selectedClassForResults);
                    if (selectedClass) {
                        await handleLockResults(
                            selectedClassForResults,
                            selectedClass.term,
                            assessmentType as 'qa1' | 'qa2' | 'endOfTerm',
                            false, // lock = false
                            lockReason, // ← USE the lockReason from the modal
                            undefined // studentIds
                        );
                        loadLockedAssessments(selectedClassForResults, selectedClass.term);
                    }
                }}
            /> */}

            <LockedAssessmentsModal
                isOpen={showLockedModal}
                onClose={() => setShowLockedModal(false)}
                assessments={lockedAssessments}
                onUnlock={async (assessmentId, assessmentType, lockReason) => {
                    const selectedClass = classes.find(c => c.id === selectedClassForResults);
                    if (selectedClass) {
                        // Find the assessment object from the array
                        const assessmentObj = lockedAssessments.find(a => a && a.id === assessmentId);

                        // Get student ID from the assessment object
                        const studentId = assessmentObj?.student?.id;

                        if (studentId) {
                            await handleLockResults(
                                selectedClassForResults,
                                selectedClass.term,
                                assessmentType as 'qa1' | 'qa2' | 'endOfTerm',
                                false,
                                lockReason,
                                [studentId]  // ← Pass student ID
                            );
                        }
                        loadLockedAssessments(selectedClassForResults, selectedClass.term);
                    }
                }}
                className={classes.find(c => c.id === selectedClassForResults)?.name} // 👈 ADD THIS LINE
            />



            {/* <LockModal
                isOpen={showLockModal}
                onClose={() => setShowLockModal(false)}
                onLock={async (assessmentType, lock, lockReason, studentIds) => {  // ← ADD lockReason
                    const selectedClass = classes.find(c => c.id === selectedClassForResults);
                    if (selectedClass) {
                        try {
                            await lockResults(
                                selectedClassForResults,
                                selectedClass.term,
                                assessmentType,
                                lock,
                                lockReason,
                                studentIds
                            );
                            showMessage(`Results ${lock ? 'locked' : 'unlocked'} successfully!`);
                            if (selectedClassForResults) {
                                loadClassResults(selectedClassForResults);
                            }
                        } catch (error: any) {
                            showMessage(error.message || 'Failed to lock/unlock results', true);
                        }
                    }
                }}
                term={classes.find(c => c.id === selectedClassForResults)?.term}
                classId={selectedClassForResults}
                students={students}
            />
            <StudentReportArchiveModal
                isOpen={showStudentReportModal}
                onClose={() => setShowStudentReportModal(false)}
                archives={studentReportArchives}
                schoolName={schoolName} // You'll need to get this
                onSendEmail={handleSendReportEmail}
                onSendWhatsApp={handleSendReportWhatsApp}
            /> */}

            <LockModal
                isOpen={showLockModal}
                onClose={() => setShowLockModal(false)}
                onLock={async (assessmentType, lock, lockReason, studentIds) => {
                    const selectedClass = classes.find(c => c.id === selectedClassForResults);
                    if (selectedClass) {
                        try {
                            await lockResults(
                                selectedClassForResults,
                                selectedClass.term,
                                assessmentType,
                                lock,
                                lockReason,
                                studentIds
                            );
                            showMessage(`Results ${lock ? 'locked' : 'unlocked'} successfully!`);
                            if (selectedClassForResults) {
                                loadClassResults(selectedClassForResults);
                            }
                        } catch (error: any) {
                            showMessage(error.message || 'Failed to lock/unlock results', true);
                        }
                    }
                }}
                term={classes.find(c => c.id === selectedClassForResults)?.term}
                classId={selectedClassForResults}
                className={classes.find(c => c.id === selectedClassForResults)?.name} // 👈 Add this
                // Filter students to only those in the selected class
                students={students.filter(s => s.class?.id === selectedClassForResults)}
            />
            <PreviewModal
                isOpen={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                data={previewData}
                onArchive={async (type) => {
                    const selectedClass = classes.find(c => c.id === selectedClassForResults);
                    if (selectedClass) {
                        await handleArchiveStudentReports(selectedClassForResults, selectedClass.term, type);
                    }
                }}
                classId={selectedClassForResults}
                term={classes.find(c => c.id === selectedClassForResults)?.term}
            />
        </div>

    );
};

export default AdminPanel;