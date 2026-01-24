// app/grade-results/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { StudentData } from '@/types';
import { TabType, TabItem } from '@/types/app';
import { FileText, Award, BookOpen, Download, Printer, TrendingUp, Calendar, User, AlertCircle, Loader2 } from 'lucide-react';


interface GradesPageProps {
  selectedStudent: {
    id: string;
    studentId: string;
    name: string;
    grade: string;
    avatar: string;
    school: string;
    dateOfBirth: string;
  };
}

export default function ({ selectedStudent }: GradesPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('reportCard');
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Get student ID from localStorage or context
        const studentId = selectedStudent?.studentId || localStorage.getItem('studentId') || 'current-user-id';
        const response = await fetch(`/api/student-data?studentId=${studentId}`);
        const data = await response.json();
        setStudentData(data);
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [selectedStudent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">No Student Data Found</h2>
          <p className="text-slate-600">Your results are not available yet.</p>
        </div>
      </div>
    );
  }

  const AssessmentTabs = () => {
    const tabs: TabItem[] = [
      { id: 'qa1', label: 'Quarterly Assessment 1', icon: FileText },
      { id: 'qa2', label: 'Quarterly Assessment 2', icon: FileText },
      { id: 'endOfTerm', label: 'End of Term', icon: Award },
      { id: 'reportCard', label: 'Report Card', icon: BookOpen },
    ];

    return (
      <div className="flex flex-wrap border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[150px] px-4 py-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === tab.id
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">
              {tab.id === 'qa1' ? 'QA1' : tab.id === 'qa2' ? 'QA2' : tab.id === 'endOfTerm' ? 'EOT' : 'Report'}
            </span>
          </button>
        ))}
      </div>
    );
  };

  const StudentInfo = () => {
    const getGradeColor = (grade: string) => {
      if (!grade || grade === 'N/A') return 'text-slate-600 bg-slate-100';
      if (grade.includes('A')) return 'text-emerald-600 bg-emerald-50';
      if (grade === 'B') return 'text-blue-600 bg-blue-50';
      if (grade === 'C') return 'text-amber-600 bg-amber-50';
      return 'text-red-600 bg-red-50';
    };

    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-100 border-4 border-indigo-100 flex items-center justify-center">
              {studentData.photo ? (
                <img src={studentData.photo} alt={studentData.name} className="w-full h-full rounded-full" />
              ) : (
                <User className="w-10 h-10 text-slate-400" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800">{studentData.name}</h3>
              <p className="text-slate-500">{studentData.class}</p>
              <p className="text-sm text-indigo-600 font-medium">{studentData.term}</p>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 md:ml-auto">
            {['qa1', 'qa2', 'endOfTerm'].map((type) => {
              const assessmentType = type as 'qa1' | 'qa2' | 'endOfTerm';
              const stats = studentData.assessmentStats?.[assessmentType];

              return (
                <div
                  key={type}
                  className={`bg-gradient-to-br ${type === 'qa1' ? 'from-indigo-50 to-indigo-100 border-indigo-200' :
                    type === 'qa2' ? 'from-emerald-50 to-emerald-100 border-emerald-200' :
                      'from-amber-50 to-amber-100 border-amber-200'
                    } rounded-xl p-4 border`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold ${type === 'qa1' ? 'text-indigo-700' :
                      type === 'qa2' ? 'text-emerald-700' :
                        'text-amber-700'
                      } uppercase tracking-wide`}>
                      {type === 'qa1' ? 'QA1' : type === 'qa2' ? 'QA2' : 'End of Term'}
                    </span>
                    <FileText className={`w-4 h-4 ${type === 'qa1' ? 'text-indigo-600' :
                      type === 'qa2' ? 'text-emerald-600' :
                        'text-amber-600'
                      }`} />
                  </div>
                  {stats ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-600">Rank:</span>
                        <span className={`text-sm font-bold ${type === 'qa1' ? 'text-indigo-800' :
                          type === 'qa2' ? 'text-emerald-800' :
                            'text-amber-800'
                          }`}>
                          {stats.classRank}/{studentData.totalStudents}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-600">Average:</span>
                        <span className={`text-sm font-bold ${type === 'qa1' ? 'text-indigo-800' :
                          type === 'qa2' ? 'text-emerald-800' :
                            'text-amber-800'
                          }`}>
                          {stats.termAverage}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-600">Grade:</span>
                        <span className={`text-sm font-bold ${getGradeColor(stats.overallGrade || 'N/A')}`}>
                          {stats.overallGrade || 'N/A'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-sm text-slate-500 italic">No scores recorded</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const QAAssessment = ({ assessmentType }: { assessmentType: 'qa1' | 'qa2' | 'endOfTerm' }) => {
    const getGradeColor = (grade: string) => {
      if (!grade || grade === 'N/A') return 'text-slate-600 bg-slate-100';
      if (grade.includes('A')) return 'text-emerald-600 bg-emerald-50';
      if (grade === 'B') return 'text-blue-600 bg-blue-50';
      if (grade === 'C') return 'text-amber-600 bg-amber-50';
      return 'text-red-600 bg-red-50';
    };

    const getScoreColor = (score: number) => {
      if (!score || score <= 0) return 'bg-slate-300';
      const passMark = studentData.gradeConfiguration?.pass_mark || 50;
      if (score >= 80) return 'bg-emerald-500';
      if (score >= 60) return 'bg-blue-500';
      if (score >= passMark) return 'bg-amber-500';
      return 'bg-red-500';
    };

    const getGrade = (score: number) => {
      if (!score || score <= 0) return 'N/A';
      const passMark = studentData.gradeConfiguration?.pass_mark || 50;
      if (score >= 80) return 'A';
      if (score >= 70) return 'B';
      if (score >= 60) return 'C';
      if (score >= passMark) return 'D';
      return 'F';
    };

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-500">
            Showing {assessmentType === 'qa1' ? 'Quarterly Assessment 1' : assessmentType === 'qa2' ? 'Quarterly Assessment 2' : 'End of Term'} Results
          </p>
        </div>
        <div className="grid gap-4">
          {studentData.subjects.map((subject, index) => {
            const score = subject[assessmentType] || 0;
            const grade = getGrade(score);

            return (
              <div key={index} className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <h5 className="font-semibold text-slate-800">{subject.name}</h5>
                    <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getScoreColor(score)} transition-all duration-500`}
                        style={{ width: `${Math.min(score, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-800">{score}%</p>
                      <p className="text-xs text-slate-500">Score</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(grade)}`}>
                      {grade}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const ReportCardComponent = () => {
    const getGradeColor = (grade: string) => {
      if (!grade || grade === 'N/A') return 'text-slate-600 bg-slate-100';
      if (grade.includes('A')) return 'text-emerald-600 bg-emerald-50';
      if (grade === 'B') return 'text-blue-600 bg-blue-50';
      if (grade === 'C') return 'text-amber-600 bg-amber-50';
      return 'text-red-600 bg-red-50';
    };

    const calculateSubjectAverage = (subject: typeof studentData.subjects[0]) => {
      if (subject.finalScore !== undefined && subject.finalScore !== null) {
        return subject.finalScore;
      }
      const qa1 = subject.qa1 || 0;
      const qa2 = subject.qa2 || 0;
      const endOfTerm = subject.endOfTerm || 0;
      return (qa1 + qa2 + endOfTerm) / 3;
    };

    const calculateOverallAverage = () => {
      const validSubjects = studentData.subjects.filter(s =>
        (s.qa1 || s.qa2 || s.endOfTerm || s.finalScore)
      );
      if (validSubjects.length === 0) return 0;

      const total = validSubjects.reduce((acc, s) => acc + calculateSubjectAverage(s), 0);
      return total / validSubjects.length;
    };

    const getSubjectGrade = (subject: typeof studentData.subjects[0]) => {
      const avg = calculateSubjectAverage(subject);
      const passMark = studentData.gradeConfiguration?.pass_mark || 50;
      if (avg >= 80) return 'A';
      if (avg >= 70) return 'B';
      if (avg >= 60) return 'C';
      if (avg >= passMark) return 'D';
      return 'F';
    };

    const getOverallGrade = () => {
      const overallAvg = calculateOverallAverage();
      const passMark = studentData.gradeConfiguration?.pass_mark || 50;
      if (overallAvg >= 80) return 'A';
      if (overallAvg >= 70) return 'B';
      if (overallAvg >= 60) return 'C';
      if (overallAvg >= passMark) return 'D';
      return 'F';
    };

    const handlePrint = () => window.print();

    const overallAverage = calculateOverallAverage();
    const overallGrade = getOverallGrade();

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h4 className="text-xl font-bold text-slate-800">Complete Report Card</h4>
            <p className="text-slate-500">{studentData.term}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2">
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white">
            <p className="text-indigo-100 text-sm">Final Average</p>
            <p className="text-3xl font-bold">{overallAverage.toFixed(1)}%</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
            <p className="text-emerald-100 text-sm">Class Position</p>
            <p className="text-3xl font-bold">{studentData.classRank || 0}<span className="text-lg">/{studentData.totalStudents || 0}</span></p>
          </div>
          <div className={`${overallGrade === 'F' ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-green-500 to-green-600'
            } rounded-xl p-4 text-white`}>
            <p className="text-white/90 text-sm">Overall Status</p>
            <p className="text-3xl font-bold">{overallGrade === 'F' ? 'FAILED' : 'PASSED'}</p>
          </div>
          <div className={`${overallGrade === 'A' || overallGrade === 'B' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
            overallGrade === 'C' || overallGrade === 'D' ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
              'bg-gradient-to-br from-slate-500 to-slate-600'
            } rounded-xl p-4 text-white`}>
            <p className="text-white/90 text-sm">Overall Grade</p>
            <p className="text-3xl font-bold">{overallGrade}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h5 className="font-semibold text-slate-800">Final Results</h5>
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
                  const avg = calculateSubjectAverage(subject);
                  const grade = getSubjectGrade(subject);
                  const hasScores = subject.qa1 || subject.qa2 || subject.endOfTerm || subject.finalScore;

                  if (!hasScores) return null;

                  return (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-800">{subject.name}</td>
                      <td className="px-6 py-4 text-center text-slate-600">100</td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-800">{avg.toFixed(1)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(grade)}`}>
                          {grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${grade === 'F' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                          {grade === 'F' ? 'Failed' : 'Passed'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h5 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />Attendance Details
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">Total School Days</p>
              <p className="text-2xl font-bold text-blue-700">
                {(studentData.attendance.present || 0) + (studentData.attendance.absent || 0)}
              </p>
            </div>
            <div className={`${Math.round(((studentData.attendance.present || 0) / ((studentData.attendance.present || 0) + (studentData.attendance.absent || 1))) * 100) >= 75 ?
              'bg-gradient-to-br from-green-50 to-green-100' : 'bg-gradient-to-br from-orange-50 to-orange-100'
              } rounded-xl p-4`}>
              <p className={`text-sm font-medium ${Math.round(((studentData.attendance.present || 0) / ((studentData.attendance.present || 0) + (studentData.attendance.absent || 1))) * 100) >= 75 ?
                'text-green-800' : 'text-orange-800'
                }`}>
                Attendance Rate
              </p>
              <p className={`text-2xl font-bold ${Math.round(((studentData.attendance.present || 0) / ((studentData.attendance.present || 0) + (studentData.attendance.absent || 1))) * 100) >= 75 ?
                'text-green-900' : 'text-orange-900'
                }`}>
                {Math.round(((studentData.attendance.present || 0) / ((studentData.attendance.present || 0) + (studentData.attendance.absent || 1))) * 100)}%
              </p>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm text-emerald-600">Days Present</p>
              <p className="text-2xl font-bold text-emerald-700">{studentData.attendance.present || 0}</p>
            </div>
            <div className="text-center p-4 bg-rose-50 rounded-lg">
              <p className="text-sm text-rose-600">Days Absent</p>
              <p className="text-2xl font-bold text-rose-700">{studentData.attendance.absent || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
          <h5 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />Teacher's Remarks
          </h5>
          <p className="text-slate-600 italic">"{studentData.teacherRemarks || 'No remarks available.'}"</p>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 lg:p-6">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Grade & Results</h1>
      <StudentInfo />
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mt-6">
        <AssessmentTabs />
        <div className="p-6">
          {(activeTab === 'qa1' || activeTab === 'qa2' || activeTab === 'endOfTerm') && (
            <QAAssessment assessmentType={activeTab as 'qa1' | 'qa2' | 'endOfTerm'} />
          )}
          {activeTab === 'reportCard' && <ReportCardComponent />}
        </div>
      </div>
    </div>
  );
}

// import React, { useState } from 'react';
// import { Search, Filter, ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
// import GradeCard from './GradeCard';

// interface GradesPageProps {
//   studentName: string;
// }

// type TrendType = 'up' | 'down' | 'neutral';

// interface GradeItem {
//   subject: string;
//   grade: string;
//   percentage: number;
//   trend: TrendType;
//   teacher: string;
//   lastUpdated: string;
//   color: string;
//   credits: number;
// }

// const GradesPage: React.FC<GradesPageProps> = ({ studentName }) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedTerm, setSelectedTerm] = useState('Q2 2024-2025');
//   const [showTermDropdown, setShowTermDropdown] = useState(false);
//   const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

//   const terms = ['Q1 2024-2025', 'Q2 2024-2025', 'Q3 2024-2025', 'Q4 2024-2025'];

//   const grades: GradeItem[] = [
//     { subject: 'Mathematics', grade: 'A', percentage: 95, trend: 'up', teacher: 'Mr. Anderson', lastUpdated: 'Dec 20, 2024', color: '#3B82F6', credits: 4 },
//     { subject: 'English Language Arts', grade: 'A-', percentage: 92, trend: 'up', teacher: 'Mrs. Thompson', lastUpdated: 'Dec 19, 2024', color: '#8B5CF6', credits: 4 },
//     { subject: 'Science', grade: 'A', percentage: 94, trend: 'neutral', teacher: 'Dr. Martinez', lastUpdated: 'Dec 18, 2024', color: '#10B981', credits: 4 },
//     { subject: 'Social Studies', grade: 'B+', percentage: 88, trend: 'up', teacher: 'Ms. Williams', lastUpdated: 'Dec 17, 2024', color: '#F59E0B', credits: 3 },
//     { subject: 'Art', grade: 'A', percentage: 96, trend: 'neutral', teacher: 'Mrs. Chen', lastUpdated: 'Dec 16, 2024', color: '#EC4899', credits: 2 },
//     { subject: 'Physical Education', grade: 'A', percentage: 98, trend: 'up', teacher: 'Coach Davis', lastUpdated: 'Dec 15, 2024', color: '#EF4444', credits: 2 },
//     { subject: 'Music', grade: 'A-', percentage: 91, trend: 'up', teacher: 'Mr. Brown', lastUpdated: 'Dec 14, 2024', color: '#6366F1', credits: 2 },
//     { subject: 'Computer Science', grade: 'A+', percentage: 99, trend: 'up', teacher: 'Ms. Taylor', lastUpdated: 'Dec 13, 2024', color: '#14B8A6', credits: 3 },
//     { subject: 'Spanish', grade: 'B+', percentage: 87, trend: 'neutral', teacher: 'Señora Garcia', lastUpdated: 'Dec 12, 2024', color: '#F97316', credits: 3 },
//     { subject: 'Health', grade: 'A', percentage: 95, trend: 'up', teacher: 'Ms. Johnson', lastUpdated: 'Dec 11, 2024', color: '#84CC16', credits: 1 },
//   ];

//   const filteredGrades = grades.filter(g =>
//     g.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     g.teacher.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const calculateGPA = () => {
//     const gradePoints: { [key: string]: number } = {
//       'A+': 4.0, 'A': 4.0, 'A-': 3.7,
//       'B+': 3.3, 'B': 3.0, 'B-': 2.7,
//       'C+': 2.3, 'C': 2.0, 'C-': 1.7,
//       'D+': 1.3, 'D': 1.0, 'D-': 0.7,
//       'F': 0.0
//     };

//     let totalPoints = 0;
//     let totalCredits = 0;

//     grades.forEach(g => {
//       totalPoints += (gradePoints[g.grade] || 0) * g.credits;
//       totalCredits += g.credits;
//     });

//     return (totalPoints / totalCredits).toFixed(2);
//   };

//   const getGradeDistribution = () => {
//     const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
//     grades.forEach(g => {
//       const letter = g.grade.charAt(0) as keyof typeof distribution;
//       if (distribution[letter] !== undefined) {
//         distribution[letter]++;
//       }
//     });
//     return distribution;
//   };

//   const distribution = getGradeDistribution();

//   // Helper function to get trend icon
//   const getTrendIcon = (trend: TrendType) => {
//     switch (trend) {
//       case 'up':
//         return TrendingUp;
//       case 'down':
//         return TrendingDown;
//       case 'neutral':
//         return Minus;
//       default:
//         return Minus;
//     }
//   };

//   // Helper function to get trend color
//   const getTrendColor = (trend: TrendType) => {
//     switch (trend) {
//       case 'up':
//         return 'text-emerald-600';
//       case 'down':
//         return 'text-red-600';
//       case 'neutral':
//         return 'text-gray-500';
//       default:
//         return 'text-gray-500';
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Grades & Results</h1>
//           <p className="text-gray-500">Viewing grades for {studentName}</p>
//         </div>
//         <div className="flex items-center gap-3">
//           {/* Term Selector */}
//           <div className="relative">
//             <button
//               onClick={() => setShowTermDropdown(!showTermDropdown)}
//               className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
//             >
//               <span className="font-medium text-gray-700">{selectedTerm}</span>
//               <ChevronDown className="w-4 h-4 text-gray-400" />
//             </button>
//             {showTermDropdown && (
//               <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10">
//                 {terms.map((term) => (
//                   <button
//                     key={term}
//                     onClick={() => {
//                       setSelectedTerm(term);
//                       setShowTermDropdown(false);
//                     }}
//                     className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${selectedTerm === term ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
//                       }`}
//                   >
//                     {term}
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Summary Cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//         <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
//           <p className="text-blue-100 text-sm font-medium">Current GPA</p>
//           <p className="text-4xl font-bold mt-2">{calculateGPA()}</p>
//           <div className="flex items-center gap-1 mt-2 text-blue-100">
//             <TrendingUp className="w-4 h-4" />
//             <span className="text-sm">+0.15 from last term</span>
//           </div>
//         </div>

//         <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
//           <p className="text-gray-500 text-sm font-medium">Total Subjects</p>
//           <p className="text-4xl font-bold text-gray-900 mt-2">{grades.length}</p>
//           <p className="text-sm text-gray-500 mt-2">Active this term</p>
//         </div>

//         <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
//           <p className="text-gray-500 text-sm font-medium">Highest Grade</p>
//           <p className="text-4xl font-bold text-emerald-600 mt-2">A+</p>
//           <p className="text-sm text-gray-500 mt-2">Computer Science (99%)</p>
//         </div>

//         <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
//           <p className="text-gray-500 text-sm font-medium">Improving</p>
//           <p className="text-4xl font-bold text-blue-600 mt-2">{grades.filter(g => g.trend === 'up').length}</p>
//           <p className="text-sm text-gray-500 mt-2">Subjects trending up</p>
//         </div>
//       </div>

//       {/* Grade Distribution */}
//       <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
//         <h2 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h2>
//         <div className="flex items-end gap-4 h-32">
//           {Object.entries(distribution).map(([letter, count]) => {
//             const maxCount = Math.max(...Object.values(distribution));
//             const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
//             const colors: { [key: string]: string } = {
//               A: 'from-emerald-400 to-emerald-500',
//               B: 'from-blue-400 to-blue-500',
//               C: 'from-yellow-400 to-yellow-500',
//               D: 'from-orange-400 to-orange-500',
//               F: 'from-red-400 to-red-500',
//             };
//             return (
//               <div key={letter} className="flex-1 flex flex-col items-center gap-2">
//                 <span className="text-sm font-semibold text-gray-700">{count}</span>
//                 <div
//                   className={`w-full bg-gradient-to-t ${colors[letter]} rounded-t-lg transition-all duration-500`}
//                   style={{ height: `${height}%`, minHeight: count > 0 ? '20px' : '4px' }}
//                 />
//                 <span className="text-sm font-medium text-gray-600">{letter}</span>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* Search and View Toggle */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div className="relative flex-1 max-w-md">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//           <input
//             type="text"
//             placeholder="Search subjects or teachers..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           />
//         </div>
//         <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
//           <button
//             onClick={() => setViewMode('grid')}
//             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
//               }`}
//           >
//             Grid
//           </button>
//           <button
//             onClick={() => setViewMode('list')}
//             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
//               }`}
//           >
//             List
//           </button>
//         </div>
//       </div>

//       {/* Grades Display */}
//       {viewMode === 'grid' ? (
//         <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
//           {filteredGrades.map((grade, index) => (
//             <GradeCard key={index} {...grade} />
//           ))}
//         </div>
//       ) : (
//         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
//           <table className="w-full">
//             <thead>
//               <tr className="bg-gray-50">
//                 <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
//                 <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Teacher</th>
//                 <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade</th>
//                 <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Percentage</th>
//                 <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trend</th>
//                 <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Updated</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-100">
//               {filteredGrades.map((grade, index) => {
//                 const TrendIcon = getTrendIcon(grade.trend);
//                 const trendColor = getTrendColor(grade.trend);

//                 return (
//                   <tr key={index} className="hover:bg-gray-50 transition-colors">
//                     <td className="px-6 py-4">
//                       <div className="flex items-center gap-3">
//                         <div
//                           className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
//                           style={{ backgroundColor: grade.color }}
//                         >
//                           {grade.subject.charAt(0)}
//                         </div>
//                         <span className="font-medium text-gray-900">{grade.subject}</span>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 text-gray-600">{grade.teacher}</td>
//                     <td className="px-6 py-4 text-center">
//                       <span className="font-bold text-lg text-gray-900">{grade.grade}</span>
//                     </td>
//                     <td className="px-6 py-4 text-center">
//                       <span className="font-medium text-gray-700">{grade.percentage}%</span>
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="flex justify-center">
//                         <TrendIcon className={`w-5 h-5 ${trendColor}`} />
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 text-gray-500 text-sm">{grade.lastUpdated}</td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {filteredGrades.length === 0 && (
//         <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
//           <p className="text-gray-500">No subjects found matching your search</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default GradesPage;