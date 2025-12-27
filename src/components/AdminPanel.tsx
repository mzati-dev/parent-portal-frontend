import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Users, BookOpen, FileText, Plus, Edit2, Trash2, Save, X,
  ChevronDown, ChevronUp, Search, AlertCircle, CheckCircle, Settings
} from 'lucide-react';
import {
  fetchAllStudents, fetchAllSubjects, createStudent, updateStudent, deleteStudent,
  upsertAssessment, upsertReportCard, fetchStudentAssessments, fetchStudentReportCard,
  calculateGrade, SubjectRecord, createSubject, deleteSubject,
  fetchAllClasses, createClass, deleteClass, fetchStudentsByClass, Class, calculateAndUpdateRanks
} from '@/services/studentService';
import {
  getActiveGradeConfig, getAllGradeConfigs, createGradeConfig,
  updateGradeConfig, setActiveConfig, GradeConfiguration, calculateFinalScore
} from '@/services/gradeConfigService';

interface AdminPanelProps {
  onBack: () => void;
}

interface Student {
  id: string;
  examNumber: string;
  name: string;
  class?: {
    id: string;
    name: string;
    term: string;
    academic_year: string;
    class_code: string;
  };
  term?: string;
  photo_url?: string;
}

interface Assessment {
  subject_id: string;
  subject_name: string;
  qa1: number;
  qa2: number;
  end_of_term: number;
}

const generateAcademicYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = -2; i <= 2; i++) {
    const year = currentYear + i;
    years.push(`${year}/${year + 1}`);
  }
  return years;
};

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'students' | 'subjects' | 'results' | 'gradeConfig'>('classes');
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Class management state
  const [classes, setClasses] = useState<Class[]>([]);
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
    days_present: 0,
    days_absent: 0,
    days_late: 0,
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
  });

  useEffect(() => {
    if (studentForm.class_id) {
      const selectedClass = classes.find(c => c.id === studentForm.class_id);
      if (selectedClass) {
        // Extract class number (e.g., "Standard 8" -> "8")
        const classNumberMatch = selectedClass.name.match(/\d+/);
        const classNumber = classNumberMatch ? classNumberMatch[0] : '0';

        // Get current year (e.g., 2025 -> "25")
        const currentYear = new Date().getFullYear().toString().slice(-2);

        // Count students in this class
        const studentCount = students.filter(s => s.class?.id === selectedClass.id).length;
        const nextNumber = studentCount + 1;

        // Format: YY-CLASS-3DIGIT (e.g., "25-8001")
        const examNumber = `${currentYear}-${classNumber}${nextNumber.toString().padStart(3, '0')}`;

        setStudentForm(prev => ({ ...prev, exam_number: examNumber }));
      }
    }
  }, [studentForm.class_id, classes, students]);

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
          qa1: 0,
          qa2: 0,
          end_of_term: 0
        });
      });
      assessmentsData.forEach((a: any) => {
        const existing = assessmentMap.get(a.subject_id);
        if (existing) {
          if (a.assessment_type === 'qa1') existing.qa1 = a.score;
          if (a.assessment_type === 'qa2') existing.qa2 = a.score;
          if (a.assessment_type === 'end_of_term') existing.end_of_term = a.score;
        }
      });
      setAssessments(Array.from(assessmentMap.values()));
      if (reportCardData) {
        setReportCard({
          class_rank: reportCardData.class_rank || 0,
          qa1_rank: reportCardData.qa1_rank || 0,
          qa2_rank: reportCardData.qa2_rank || 0,
          total_students: reportCardData.total_students || 0,
          days_present: reportCardData.days_present || 0,
          days_absent: reportCardData.days_absent || 0,
          days_late: reportCardData.days_late || 0,
          teacher_remarks: reportCardData.teacher_remarks || ''
        });
      } else {
        setReportCard({
          class_rank: 0,
          qa1_rank: 0,
          qa2_rank: 0,
          total_students: 0,
          days_present: 0,
          days_absent: 0,
          days_late: 0,
          teacher_remarks: ''
        });
      }
    } catch (err) {
      showMessage('Failed to load student results', true);
    }
  };

  const updateAssessmentScore = (subjectId: string, field: 'qa1' | 'qa2' | 'end_of_term', value: number) => {
    setAssessments(prev => prev.map(a =>
      a.subject_id === subjectId ? { ...a, [field]: Math.min(100, Math.max(0, value)) } : a
    ));
  };


  const saveAllResults = async () => {
    if (!selectedStudent) return;
    setSavingResults(true);
    try {
      // 1. Save assessments
      for (const assessment of assessments) {
        if (assessment.qa1 > 0) {
          await upsertAssessment({
            student_id: selectedStudent.id,
            subject_id: assessment.subject_id,
            assessment_type: 'qa1',
            score: assessment.qa1,
            grade: calculateGrade(assessment.qa1)
          });
        }
        if (assessment.qa2 > 0) {
          await upsertAssessment({
            student_id: selectedStudent.id,
            subject_id: assessment.subject_id,
            assessment_type: 'qa2',
            score: assessment.qa2,
            grade: calculateGrade(assessment.qa2)
          });
        }
        if (assessment.end_of_term > 0) {
          await upsertAssessment({
            student_id: selectedStudent.id,
            subject_id: assessment.subject_id,
            assessment_type: 'end_of_term',
            score: assessment.end_of_term,
            grade: calculateGrade(assessment.end_of_term)
          });
        }
      }

      // 2. Save report card
      await upsertReportCard({
        student_id: selectedStudent.id,
        term: selectedStudent.term || 'Term 1, 2024/2025',
        days_present: reportCard.days_present,
        days_absent: reportCard.days_absent,
        days_late: reportCard.days_late,
        teacher_remarks: reportCard.teacher_remarks
      });

      // 3. AUTO-RANK HERE
      if (selectedStudent.class?.id) {
        await calculateAndUpdateRanks(
          selectedStudent.class.id,
          selectedStudent.term || 'Term 1, 2024/2025'
        );
      }

      showMessage('Results saved and ranks auto-calculated!');

      // 4. Reload to see updated ranks
      loadStudentResults(selectedStudent);
    } catch (err: any) {
      showMessage(err.message || 'Failed to save results', true);
    } finally {
      setSavingResults(false);
    }
  };

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
    });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Admin Panel</h1>
                <p className="text-xs text-slate-500">Manage Classes, Students, Subjects, Results & Grade Configuration</p>
              </div>
            </div>
          </div>
        </div>
      </header>

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
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => { setActiveTab('classes'); setSelectedStudent(null); }}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'classes'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
          >
            <Users className="w-4 h-4" />
            Manage Classes
          </button>
          <button
            onClick={() => { setActiveTab('students'); setSelectedStudent(null); }}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'students'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
          >
            <Users className="w-4 h-4" />
            Manage Students
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'subjects'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
          >
            <BookOpen className="w-4 h-4" />
            Manage Subjects
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'results'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
          >
            <FileText className="w-4 h-4" />
            Enter Results
          </button>
          <button
            onClick={() => setActiveTab('gradeConfig')}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'gradeConfig'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
          >
            <Settings className="w-4 h-4" />
            Grade Configuration
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading...</p>
          </div>
        ) : activeTab === 'classes' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Class Management ({classes.length})</h2>
              <button
                onClick={() => setShowClassForm(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create New Class
              </button>
            </div>

            <div className="space-y-8">
              {classes.map(cls => (
                <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{cls.name}</h3>
                      <p className="text-slate-600">
                        {cls.term} • {cls.academic_year}
                      </p>
                      <p className="text-sm text-indigo-600 font-mono mt-1">
                        Class Code: {cls.class_code || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-600">{students.filter(s => s.class?.id === cls.id).length}</p>
                      <p className="text-sm text-slate-500">students</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="font-semibold text-slate-700 mb-3">Students in this class:</h4>
                    {students.filter(s => s.class?.id === cls.id).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {students
                          .filter(s => s.class?.id === cls.id)
                          .map(student => (
                            <div key={student.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-slate-800">{student.name}</p>
                                  <p className="text-sm font-mono text-indigo-600">{student.examNumber}</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteStudent(student)}
                                  className="text-slate-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">No students added yet</p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200">
                    {/* <button
                      onClick={() => {
                        setActiveTab('students');
                        setShowStudentForm(true);
                        setStudentForm(prev => ({
                          ...prev,
                          class_id: cls.id
                        }));
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Student to {cls.name}
                    </button> */}
                    <button
                      onClick={() => handleDeleteClass(cls.id)}
                      className="ml-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                    >
                      Delete Class
                    </button>
                  </div>
                </div>
              ))}
              {classes.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                  <p className="text-slate-500">No classes found. Create your first class to get started.</p>
                </div>
              )}
            </div>

            {showClassForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-800">Create New Class</h3>
                    <button
                      onClick={() => setShowClassForm(false)}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateClass} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Class Name</label>
                      <input
                        type="text"
                        value={classForm.name}
                        onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                        placeholder="Enter any class name, e.g., Grade 8A, Form 3B, Nursery B"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Academic Year</label>
                      <select
                        value={classForm.academic_year}
                        onChange={(e) => setClassForm({ ...classForm, academic_year: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        <option value="">Select Academic Year</option>
                        {generateAcademicYears().map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                        <option value="custom">Add Custom Year...</option>
                      </select>
                      {classForm.academic_year === 'custom' && (
                        <input
                          type="text"
                          placeholder="e.g., 2025/2026"
                          className="w-full mt-2 px-4 py-2 border border-slate-300 rounded-lg"
                          onChange={(e) => setClassForm({ ...classForm, academic_year: e.target.value })}
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Term</label>
                      <select
                        value={classForm.term}
                        onChange={(e) => setClassForm({ ...classForm, term: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        <option value="Term 1">Term 1</option>
                        <option value="Term 2">Term 2</option>
                        <option value="Term 3">Term 3</option>
                        <option value="custom">Add Custom Term...</option>
                      </select>
                      {classForm.term === 'custom' && (
                        <input
                          type="text"
                          placeholder="e.g., Semester 1, Quarter 1"
                          className="w-full mt-2 px-4 py-2 border border-slate-300 rounded-lg"
                          onChange={(e) => setClassForm({ ...classForm, term: e.target.value })}
                        />
                      )}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowClassForm(false)}
                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={classLoading}
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors"
                      >
                        {classLoading ? 'Creating...' : 'Create Class'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'students' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">All Students ({students.length})</h2>
              <button
                onClick={() => { setShowStudentForm(true); setEditingStudent(null); setStudentForm({ exam_number: '', name: '', class_id: '', photo_url: '' }); }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Student
              </button>
            </div>

            {(showStudentForm || editingStudent) && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-800">
                      {editingStudent ? 'Edit Student' : 'Add New Student'}
                    </h3>
                    <button
                      onClick={() => { setShowStudentForm(false); setEditingStudent(null); }}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>
                  <form onSubmit={editingStudent ? handleUpdateStudent : handleCreateStudent} className="space-y-4">
                    {studentForm.class_id && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-indigo-800">Auto-generated Exam Number</p>
                            <p className="font-mono text-lg font-bold text-indigo-700">{studentForm.exam_number}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(studentForm.exam_number)}
                            className="px-3 py-1 bg-white border border-indigo-300 text-indigo-600 rounded text-sm hover:bg-indigo-50 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="text-xs text-indigo-600 mt-2">
                          This exam number will be assigned to the student
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={studentForm.name}
                        onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Select Class</label>
                      <select
                        value={studentForm.class_id}
                        onChange={(e) => setStudentForm({ ...studentForm, class_id: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        <option value="">Select a class</option>
                        {classes.map(cls => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} - {cls.term} ({cls.academic_year})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-500 mt-1">
                        Create new classes in "Manage Classes" tab first
                      </p>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => { setShowStudentForm(false); setEditingStudent(null); }}
                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {editingStudent ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

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

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Exam Number</th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Name</th>
                            <th className="text-right px-4 py-3 text-sm font-semibold text-slate-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {classStudents.map((student) => (
                            <tr key={student.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-mono text-sm text-indigo-600">{student.examNumber}</td>
                              <td className="px-4 py-3 font-medium text-slate-800">{student.name}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => startEditStudent(student)}
                                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStudent(student)}
                                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
          </div>
        ) : activeTab === 'subjects' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">All Subjects ({subjects.length})</h2>
              <button
                onClick={() => setShowSubjectForm(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Subject
              </button>
            </div>

            {showSubjectForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-800">Add New Subject</h3>
                    <button
                      onClick={() => { setShowSubjectForm(false); setNewSubjectName(''); }}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>
                  <form onSubmit={handleAddSubject} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Subject Name</label>
                      <input
                        type="text"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        placeholder="e.g., Mathematics, English, Science"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => { setShowSubjectForm(false); setNewSubjectName(''); }}
                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={addingSubject || !newSubjectName.trim()}
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        {addingSubject ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Add Subject
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800">{subject.name}</span>
                      <button
                        onClick={() => handleDeleteSubject(subject)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {subjects.length === 0 && (
                  <div className="md:col-span-2 lg:col-span-3 text-center py-12 text-slate-500">
                    No subjects found. Add your first subject to get started.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'gradeConfig' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Grade Calculation Configuration</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Configure how final grades are calculated for report cards
                </p>
              </div>
              <button
                onClick={() => {
                  setShowConfigForm(true);
                  setEditingConfig(null);
                  setConfigForm({
                    configuration_name: '',
                    calculation_method: 'weighted_average',
                    weight_qa1: 30,
                    weight_qa2: 30,
                    weight_end_of_term: 40,
                  });
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Configuration
              </button>
            </div>

            {activeConfig && (
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white">
                        Active
                      </span>
                      <h3 className="text-lg font-semibold text-emerald-800">{activeConfig.configuration_name}</h3>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-emerald-700">
                        <span className="font-medium">Method:</span>{' '}
                        {activeConfig.calculation_method === 'average_all' && 'Average of All Tests'}
                        {activeConfig.calculation_method === 'end_of_term_only' && 'End of Term Only'}
                        {activeConfig.calculation_method === 'weighted_average' && 'Weighted Average'}
                      </p>
                      {activeConfig.calculation_method === 'weighted_average' && (
                        <div className="flex gap-6 text-sm text-emerald-700">
                          <div><span className="font-medium">QA1:</span> {activeConfig.weight_qa1}%</div>
                          <div><span className="font-medium">QA2:</span> {activeConfig.weight_qa2}%</div>
                          <div><span className="font-medium">End Term:</span> {activeConfig.weight_end_of_term}%</div>
                        </div>
                      )}
                      <p className="text-xs text-emerald-600">
                        <span className="font-medium">Total Weight:</span> {activeConfig.weight_qa1 + activeConfig.weight_qa2 + activeConfig.weight_end_of_term}%
                      </p>
                    </div>
                  </div>
                  <Settings className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
            )}

            {(showConfigForm || editingConfig) && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-800">
                      {editingConfig ? 'Edit Configuration' : 'New Grade Configuration'}
                    </h3>
                    <button
                      onClick={() => { setShowConfigForm(false); setEditingConfig(null); }}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>
                  <form onSubmit={handleSaveConfig} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Configuration Name</label>
                      <input
                        type="text"
                        value={configForm.configuration_name}
                        onChange={(e) => setConfigForm({ ...configForm, configuration_name: e.target.value })}
                        placeholder="e.g., Standard Weighting, End Term Focus, etc."
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">Calculation Method</label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="calculation_method"
                            value="average_all"
                            checked={configForm.calculation_method === 'average_all'}
                            onChange={(e) => setConfigForm({ ...configForm, calculation_method: e.target.value as any })}
                            className="w-4 h-4 text-indigo-600"
                          />
                          <div>
                            <p className="font-medium text-slate-800">Average of All Tests</p>
                            <p className="text-sm text-slate-500">(QA1 + QA2 + End of Term) ÷ 3</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="calculation_method"
                            value="end_of_term_only"
                            checked={configForm.calculation_method === 'end_of_term_only'}
                            onChange={(e) => setConfigForm({ ...configForm, calculation_method: e.target.value as any })}
                            className="w-4 h-4 text-indigo-600"
                          />
                          <div>
                            <p className="font-medium text-slate-800">End of Term Only</p>
                            <p className="text-sm text-slate-500">Use only the End of Term score</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="calculation_method"
                            value="weighted_average"
                            checked={configForm.calculation_method === 'weighted_average'}
                            onChange={(e) => setConfigForm({ ...configForm, calculation_method: e.target.value as any })}
                            className="w-4 h-4 text-indigo-600"
                          />
                          <div>
                            <p className="font-medium text-slate-800">Weighted Average</p>
                            <p className="text-sm text-slate-500">Custom weights for each assessment</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {configForm.calculation_method === 'weighted_average' && (
                      <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-medium text-slate-800">Set Weights (Must total 100%)</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">QA1 %</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={configForm.weight_qa1}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                setConfigForm({ ...configForm, weight_qa1: value });
                              }}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">QA2 %</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={configForm.weight_qa2}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                setConfigForm({ ...configForm, weight_qa2: value });
                              }}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">End Term %</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={configForm.weight_end_of_term}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                setConfigForm({ ...configForm, weight_end_of_term: value });
                              }}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className={`text-sm font-medium ${configForm.weight_qa1 + configForm.weight_qa2 + configForm.weight_end_of_term === 100
                            ? 'text-emerald-600'
                            : 'text-red-600'
                            }`}>
                            Total: {configForm.weight_qa1 + configForm.weight_qa2 + configForm.weight_end_of_term}%
                            {configForm.weight_qa1 + configForm.weight_qa2 + configForm.weight_end_of_term !== 100 &&
                              ' (Must equal 100%)'}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => { setShowConfigForm(false); setEditingConfig(null); }}
                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={
                          configForm.calculation_method === 'weighted_average' &&
                          configForm.weight_qa1 + configForm.weight_qa2 + configForm.weight_end_of_term !== 100
                        }
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {editingConfig ? 'Update' : 'Save'} Configuration
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">All Configurations</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Select a configuration to make it active for all report cards
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {gradeConfigs.map((config) => (
                  <div key={config.id} className="p-6 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-slate-800">{config.configuration_name}</h4>
                          {config.is_active && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">Method:</span>{' '}
                            {config.calculation_method === 'average_all' && 'Average of All Tests'}
                            {config.calculation_method === 'end_of_term_only' && 'End of Term Only'}
                            {config.calculation_method === 'weighted_average' && 'Weighted Average'}
                          </p>
                          {config.calculation_method === 'weighted_average' && (
                            <div className="flex gap-6 text-sm text-slate-600">
                              <div><span className="font-medium">QA1:</span> {config.weight_qa1}%</div>
                              <div><span className="font-medium">QA2:</span> {config.weight_qa2}%</div>
                              <div><span className="font-medium">End Term:</span> {config.weight_end_of_term}%</div>
                            </div>
                          )}
                          <p className="text-xs text-slate-500">
                            Created: {new Date(config.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!config.is_active && (
                          <button
                            onClick={() => handleActivateConfig(config.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => startEditConfig(config)}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {gradeConfigs.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    No configurations found. Create your first grade calculation configuration.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {!selectedStudent ? (
              <>
                <h2 className="text-lg font-semibold text-slate-800">Select a Student to Enter Results</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => loadStudentResults(student)}
                      className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all text-left"
                    >
                      <p className="font-mono text-sm text-indigo-600 mb-1">{student.examNumber}</p>
                      <p className="font-semibold text-slate-800">{student.name}</p>
                      <p className="text-sm text-slate-500">
                        {student.class?.name || 'No Class'}
                        {student.class?.term || 'Term 1, 2024/2025'}
                      </p>
                    </button>
                  ))}
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
                    </div>
                  </div>
                  <button
                    onClick={saveAllResults}
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
                      Subjects loaded from database. Add subjects in "Manage Subjects" tab.
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
                          return (
                            <tr key={assessment.subject_id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 font-medium text-slate-800">{assessment.subject_name}</td>
                              <td className="px-6 py-4">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={assessment.qa1 || ''}
                                  onChange={(e) => updateAssessmentScore(assessment.subject_id, 'qa1', parseInt(e.target.value) || 0)}
                                  className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mx-auto block"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={assessment.qa2 || ''}
                                  onChange={(e) => updateAssessmentScore(assessment.subject_id, 'qa2', parseInt(e.target.value) || 0)}
                                  className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mx-auto block"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={assessment.end_of_term || ''}
                                  onChange={(e) => updateAssessmentScore(assessment.subject_id, 'end_of_term', parseInt(e.target.value) || 0)}
                                  className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mx-auto block"
                                />
                              </td>
                              <td className="px-6 py-4 text-center font-semibold text-indigo-700">
                                {finalScore.toFixed(1)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-sm text-slate-500">
                      * Final score calculated using active configuration: {activeConfig?.configuration_name || 'Default (Average of All)'}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800">Report Card Details</h3>
                  </div>
                  <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Days Present</label>
                      <input
                        type="number"
                        min="0"
                        value={reportCard.days_present || ''}
                        onChange={(e) => setReportCard({ ...reportCard, days_present: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Days Absent</label>
                      <input
                        type="number"
                        min="0"
                        value={reportCard.days_absent || ''}
                        onChange={(e) => setReportCard({ ...reportCard, days_absent: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Days Late</label>
                      <input
                        type="number"
                        min="0"
                        value={reportCard.days_late || ''}
                        onChange={(e) => setReportCard({ ...reportCard, days_late: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Teacher's Remarks</label>
                      <textarea
                        value={reportCard.teacher_remarks}
                        onChange={(e) => setReportCard({ ...reportCard, teacher_remarks: e.target.value })}
                        rows={3}
                        placeholder="Enter teacher's remarks for this student..."
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;