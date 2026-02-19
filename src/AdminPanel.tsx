import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, AlertCircle, CheckCircle
} from 'lucide-react';
import {
    fetchAllStudents, fetchAllSubjects, createStudent, updateStudent, deleteStudent,
    upsertAssessment, upsertReportCard, fetchStudentAssessments, fetchStudentReportCard,
    calculateGrade, SubjectRecord, createSubject, deleteSubject,
    fetchAllClasses, createClass, deleteClass, calculateAndUpdateRanks, fetchClassResults
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

    // const saveAllResults = async () => {
    //     if (!selectedStudent) return;
    //     setSavingResults(true);
    //     try {
    //         const passMark = activeConfig?.pass_mark || 50;

    //         // Save assessments
    //         for (const assessment of assessments) {
    //             if (assessment.qa1 > 0) {
    //                 await upsertAssessment({
    //                     student_id: selectedStudent.id,
    //                     subject_id: assessment.subject_id,
    //                     assessment_type: 'qa1',
    //                     score: assessment.qa1,
    //                     grade: calculateGrade(assessment.qa1, passMark)
    //                 });
    //             }
    //             if (assessment.qa2 > 0) {
    //                 await upsertAssessment({
    //                     student_id: selectedStudent.id,
    //                     subject_id: assessment.subject_id,
    //                     assessment_type: 'qa2',
    //                     score: assessment.qa2,
    //                     grade: calculateGrade(assessment.qa2, passMark)
    //                 });
    //             }
    //             if (assessment.end_of_term > 0) {
    //                 await upsertAssessment({
    //                     student_id: selectedStudent.id,
    //                     subject_id: assessment.subject_id,
    //                     assessment_type: 'end_of_term',
    //                     score: assessment.end_of_term,
    //                     grade: calculateGrade(assessment.end_of_term, passMark)
    //                 });
    //             }
    //         }

    //         // Save report card
    //         await upsertReportCard({
    //             student_id: selectedStudent.id,
    //             term: selectedStudent.term || 'Term 1, 2024/2025',
    //             days_present: reportCard.days_present,
    //             days_absent: reportCard.days_absent,
    //             days_late: reportCard.days_late,
    //             teacher_remarks: reportCard.teacher_remarks
    //         });

    //         // Auto-calculate ranks
    //         if (selectedStudent.class?.id) {
    //             await calculateAndUpdateRanks(
    //                 selectedStudent.class.id,
    //                 selectedStudent.term || 'Term 1, 2024/2025'
    //             );
    //         }

    //         showMessage('Results saved and ranks auto-calculated!');
    //         loadStudentResults(selectedStudent);
    //     } catch (err: any) {
    //         showMessage(err.message || 'Failed to save results', true);
    //     } finally {
    //         setSavingResults(false);
    //     }
    // };

    // const saveAllResults = async () => {
    //     if (!selectedStudent) return;
    //     setSavingResults(true);
    //     try {
    //         const passMark = activeConfig?.pass_mark || 50;

    //         // Save ALL assessments (including 0)
    //         for (const assessment of assessments) {
    //             await upsertAssessment({
    //                 student_id: selectedStudent.id,
    //                 subject_id: assessment.subject_id,
    //                 assessment_type: 'qa1',
    //                 score: assessment.qa1,
    //                 grade: calculateGrade(assessment.qa1, passMark)
    //             });

    //             await upsertAssessment({
    //                 student_id: selectedStudent.id,
    //                 subject_id: assessment.subject_id,
    //                 assessment_type: 'qa2',
    //                 score: assessment.qa2,
    //                 grade: calculateGrade(assessment.qa2, passMark)
    //             });

    //             await upsertAssessment({
    //                 student_id: selectedStudent.id,
    //                 subject_id: assessment.subject_id,
    //                 assessment_type: 'end_of_term',
    //                 score: assessment.end_of_term,
    //                 grade: calculateGrade(assessment.end_of_term, passMark)
    //             });
    //         }

    //         // Save report card
    //         await upsertReportCard({
    //             student_id: selectedStudent.id,
    //             term: selectedStudent.term || 'Term 1, 2024/2025',
    //             days_present: reportCard.days_present,
    //             days_absent: reportCard.days_absent,
    //             days_late: reportCard.days_late,
    //             teacher_remarks: reportCard.teacher_remarks
    //         });

    //         // Auto-calculate ranks
    //         if (selectedStudent.class?.id) {
    //             await calculateAndUpdateRanks(
    //                 selectedStudent.class.id,
    //                 selectedStudent.term || 'Term 1, 2024/2025'
    //             );
    //         }

    //         showMessage('Results saved and ranks auto-calculated!');
    //         loadStudentResults(selectedStudent);
    //     } catch (err: any) {
    //         showMessage(err.message || 'Failed to save results', true);
    //     } finally {
    //         setSavingResults(false);
    //     }
    // };


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
    // const saveAllResults = async () => {
    //     if (!selectedStudent) return;
    //     setSavingResults(true);
    //     try {
    //         const passMark = activeConfig?.pass_mark || 50;

    //         // Save assessments - IMPORTANT: Save even when score is 0 to clear it
    //         for (const assessment of assessments) {
    //             // Always save QA1 score (even if 0)
    //             await upsertAssessment({
    //                 student_id: selectedStudent.id,
    //                 subject_id: assessment.subject_id,
    //                 assessment_type: 'qa1',
    //                 score: assessment.qa1,
    //                 grade: calculateGrade(assessment.qa1, passMark)
    //             });

    //             // Always save QA2 score (even if 0)
    //             await upsertAssessment({
    //                 student_id: selectedStudent.id,
    //                 subject_id: assessment.subject_id,
    //                 assessment_type: 'qa2',
    //                 score: assessment.qa2,
    //                 grade: calculateGrade(assessment.qa2, passMark)
    //             });

    //             // Always save end_of_term score (even if 0)
    //             await upsertAssessment({
    //                 student_id: selectedStudent.id,
    //                 subject_id: assessment.subject_id,
    //                 assessment_type: 'end_of_term',
    //                 score: assessment.end_of_term,
    //                 grade: calculateGrade(assessment.end_of_term, passMark)
    //             });
    //         }

    //         // Save report card
    //         await upsertReportCard({
    //             student_id: selectedStudent.id,
    //             term: selectedStudent.term || 'Term 1, 2024/2025',
    //             days_present: reportCard.days_present,
    //             days_absent: reportCard.days_absent,
    //             days_late: reportCard.days_late,
    //             teacher_remarks: reportCard.teacher_remarks
    //         });

    //         // Auto-calculate ranks
    //         if (selectedStudent.class?.id) {
    //             await calculateAndUpdateRanks(
    //                 selectedStudent.class.id,
    //                 selectedStudent.term || 'Term 1, 2024/2025'
    //             );
    //         }

    //         showMessage('Results saved and ranks auto-calculated!');
    //         loadStudentResults(selectedStudent);
    //     } catch (err: any) {
    //         showMessage(err.message || 'Failed to save results', true);
    //     } finally {
    //         setSavingResults(false);
    //     }
    // };


    // const fixAllRanksOnce = async () => {
    //     for (const classItem of classes) {
    //         await calculateAndUpdateRanks(classItem.id, classItem.term);
    //     }
    //     alert('All ranks updated!');
    // };

    // const fixAllRanksOnce = async () => {
    //     // DEBUG 1: Did the button click actually register?
    //     alert('1. Button was clicked! Starting process...');

    //     // DEBUG 2: Do we have classes?
    //     console.log('Classes data:', classes);
    //     if (!classes || classes.length === 0) {
    //         alert('STOPPED: The "classes" list is empty. Please wait for the page to load fully or refresh.');
    //         return;
    //     }

    //     alert(`2. Found ${classes.length} classes. Starting loop...`);
    //     setSavingResults(true); // Using your existing loading state

    //     try {
    //         let count = 0;
    //         for (const classItem of classes) {
    //             // DEBUG 3: Loop progress
    //             console.log(`Processing ${classItem.name}...`);

    //             await calculateAndUpdateRanks(
    //                 classItem.id,
    //                 classItem.term || 'Term 1, 2024/2025'
    //             );
    //             count++;
    //         }

    //         // DEBUG 4: Finished
    //         alert(`3. Success! Updated ranks for ${count} classes.`);

    //         // IMPORTANT: Reload data to see changes
    //         window.location.reload();

    //     } catch (err: any) {
    //         console.error(err);
    //         alert(`ERROR: ${err.message}`);
    //     } finally {
    //         setSavingResults(false);
    //     }
    // };

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

                {/* 👇 ADD THE BUTTON RIGHT HERE 👇 */}
                {/* <div className="mt-4 flex justify-center">
                    <button
                        onClick={fixAllRanksOnce}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                        🔄 Fix All Rankings (One-Time)
                    </button>
                </div> */}
                {/* 👆 ADDED 👆 */}
            </div>

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
                            />
                        )}
            </div>
        </div>
    );
};

export default AdminPanel;