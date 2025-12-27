import React, { useState } from 'react';
import { Search, BookOpen, Award, FileText, Calendar, User, Phone, Mail, MapPin, ChevronRight, Download, Printer, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Minus, Settings } from 'lucide-react';
import { fetchStudentByExamNumber, StudentData, Subject, Class } from '@/services/studentService';
import AdminPanel from './AdminPanel';

type TabType = 'qa1' | 'qa2' | 'endOfTerm' | 'reportCard';

const AppLayout: React.FC = () => {
  const [examNumber, setExamNumber] = useState('');
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('qa1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const data = await fetchStudentByExamNumber(examNumber);
      if (data) {
        setStudentData(data);
        setError('');
      } else {
        setStudentData(null);
        setError('No student found with this exam number. Please check and try again.');
      }
    } catch (err) {
      console.error('Error fetching student:', err);
      setStudentData(null);
      setError('An error occurred while fetching results. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.includes('A')) return 'text-emerald-600 bg-emerald-50';
    if (grade === 'B') return 'text-blue-600 bg-blue-50';
    if (grade === 'C') return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getTrend = (qa1: number, qa2: number, endOfTerm: number) => {
    const avg1 = qa1;
    const avg2 = (qa1 + qa2) / 2;
    const final = (qa1 + qa2 + endOfTerm) / 3;
    if (final > avg2 && avg2 > avg1) return 'up';
    if (final < avg2 && avg2 < avg1) return 'down';
    return 'stable';
  };

  const calculateAverage = (subjects: Subject[], type: 'qa1' | 'qa2' | 'endOfTerm' | 'overall') => {
    if (subjects.length === 0) return '0.0';
    if (type === 'overall') {
      const total = subjects.reduce((acc, s) => acc + (s.qa1 + s.qa2 + s.endOfTerm) / 3, 0);
      return (total / subjects.length).toFixed(1);
    }
    const total = subjects.reduce((acc, s) => acc + s[type], 0);
    return (total / subjects.length).toFixed(1);
  };

  const handlePrint = () => {
    window.print();
  };

  const tabs = [
    { id: 'qa1' as TabType, label: 'Quarterly Assessment 1', icon: FileText },
    { id: 'qa2' as TabType, label: 'Quarterly Assessment 2', icon: FileText },
    { id: 'endOfTerm' as TabType, label: 'End of Term', icon: Award },
    { id: 'reportCard' as TabType, label: 'Report Card', icon: BookOpen },
  ];

  if (showAdmin) {
    return <AdminPanel onBack={() => setShowAdmin(false)} />;
  }

  function setShowAuthInfo(arg0: boolean): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      {/* <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Parent Portal</h1>
                <p className="text-xs text-slate-500">Student Results System</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <button 
                onClick={() => setShowAdmin(true)}
                className="hover:text-indigo-600 transition-colors flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-indigo-50"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </button>
              <a href="#contact" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Contact</span>
              </a>
            </div>
          </div>
        </div>
      </header> */}
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">

            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Parent Portal</h1>
                <p className="text-xs text-slate-500">Student Results System</p>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3 text-sm text-slate-600">

              {/* Login / Create Account */}
              <button
                onClick={() => setShowAuthInfo(true)}
                className="hover:text-indigo-600 transition-colors px-3 py-2 rounded-lg hover:bg-indigo-50"
              >
                Login
              </button>

              <button
                onClick={() => setShowAuthInfo(true)}
                className="border border-indigo-600 text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Create Account
              </button>

              {/* Existing buttons */}
              <button
                onClick={() => setShowAdmin(true)}
                className="hover:text-indigo-600 transition-colors flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-indigo-50"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </button>

              <a
                href="#contact"
                className="hover:text-indigo-600 transition-colors flex items-center gap-1"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Contact</span>
              </a>

            </div>
          </div>
        </div>
      </header>


      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://d64gsuwffb70l.cloudfront.net/694b7b0f6355b51b6b4aebac_1766554473268_2920ab90.jpg"
            alt="Students"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 to-indigo-800/80"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Check Your Child's Results
            </h2>
            <p className="text-lg md:text-xl text-indigo-100 mb-8">
              Enter your child's exam number to view quarterly assessments, end of term results, and complete report cards.
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Enter Exam Number (e.g., 25-8001)"
                    value={examNumber}
                    onChange={(e) => setExamNumber(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-0 shadow-lg text-slate-800 placeholder-slate-400 focus:ring-4 focus:ring-indigo-300 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!examNumber.trim() || isLoading}
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-400 text-white font-semibold rounded-xl shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <span>View Results</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
              {/* <p className="text-indigo-200 text-sm mt-3">

              </p> */}
            </form>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {hasSearched && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading results...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Student Not Found</h3>
              <p className="text-red-600">{error}</p>
            </div>
          ) : studentData ? (
            <div className="space-y-6">
              {/* Student Info Card */}
              {/* <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={studentData.photo}
                      alt={studentData.name}
                      className="w-20 h-20 rounded-full bg-slate-100 border-4 border-indigo-100"
                    />
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">{studentData.name}</h3>
                      <p className="text-slate-500">{studentData.class}</p>
                      <p className="text-sm text-indigo-600 font-medium">{studentData.term}</p>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 md:ml-auto">
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Exam No.</p>
                      <p className="text-lg font-bold text-slate-800">{studentData.examNumber}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-emerald-600 uppercase tracking-wide">Class Rank</p>
                      <p className="text-lg font-bold text-emerald-700">{studentData.classRank} / {studentData.totalStudents}</p>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-indigo-600 uppercase tracking-wide">Term Average</p>
                      <p className="text-lg font-bold text-indigo-700">{calculateAverage(studentData.subjects, 'overall')}%</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-amber-600 uppercase tracking-wide">Attendance</p>
                      <p className="text-lg font-bold text-amber-700">{studentData.attendance.present}/{studentData.attendance.present + studentData.attendance.absent}</p>
                    </div>
                  </div>
                </div>
              </div> */}

              {/* Update the Student Info Card section with safety checks: */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={studentData.photo}
                      alt={studentData.name}
                      className="w-20 h-20 rounded-full bg-slate-100 border-4 border-indigo-100"
                    />
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">{studentData.name}</h3>
                      <p className="text-slate-500">{studentData.class}</p>
                      <p className="text-sm text-indigo-600 font-medium">{studentData.term}</p>
                    </div>
                  </div>

                  {/* Assessment Stats Grid with safety checks */}
                  {studentData.assessmentStats ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 md:ml-auto">
                      {/* QA1 Stats */}

                      {/* QA1 Stats */}
                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">QA1</span>
                          <FileText className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-600">Rank:</span>
                            <span className="text-sm font-bold text-indigo-800">
                              {studentData.assessmentStats.qa1.classRank}/{studentData.totalStudents}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-600">Average:</span>
                            <span className="text-sm font-bold text-indigo-800">
                              {studentData.assessmentStats.qa1.termAverage}%
                            </span>
                          </div>
                          {/* ADD OVERALL GRADE INSTEAD OF ATTENDANCE */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-600">Overall Grade:</span>
                            <span className={`text-sm font-bold ${getGradeColor(studentData.assessmentStats.qa1.overallGrade)}`}>
                              {studentData.assessmentStats.qa1.overallGrade}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* QA2 Stats */}
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">QA2</span>
                          <FileText className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-600">Rank:</span>
                            <span className="text-sm font-bold text-emerald-800">
                              {studentData.assessmentStats.qa2.classRank}/{studentData.totalStudents}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-600">Average:</span>
                            <span className="text-sm font-bold text-emerald-800">
                              {studentData.assessmentStats.qa2.termAverage}%
                            </span>
                          </div>
                          {/* ADD OVERALL GRADE INSTEAD OF ATTENDANCE */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-600">Overall Grade:</span>
                            <span className={`text-sm font-bold ${getGradeColor(studentData.assessmentStats.qa2.overallGrade)}`}>
                              {studentData.assessmentStats.qa2.overallGrade}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* End of Term Stats */}
                      {/* End of Term Stats */}
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">End of Term</span>
                          <Award className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-600">Rank:</span>
                            <span className="text-sm font-bold text-amber-800">
                              {studentData.assessmentStats.endOfTerm.classRank}/{studentData.totalStudents}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-600">Average:</span>
                            <span className="text-sm font-bold text-amber-800">
                              {studentData.assessmentStats.endOfTerm.termAverage}%
                            </span>
                          </div>
                          {/* ADD OVERALL GRADE */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-600">Overall Grade:</span>
                            <span className={`text-sm font-bold ${getGradeColor(studentData.assessmentStats.endOfTerm.overallGrade)}`}>
                              {studentData.assessmentStats.endOfTerm.overallGrade}
                            </span>
                          </div>
                          {/* KEEP ATTENDANCE */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-600">Attendance:</span>
                            <span className="text-sm font-bold text-amber-800">
                              {studentData.assessmentStats.endOfTerm.attendance.present}/
                              {studentData.assessmentStats.endOfTerm.attendance.present +
                                studentData.assessmentStats.endOfTerm.attendance.absent}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Fallback to original layout if assessmentStats doesn't exist
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 md:ml-auto">
                      <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Exam No.</p>
                        <p className="text-lg font-bold text-slate-800">{studentData.examNumber}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-emerald-600 uppercase tracking-wide">Class Rank</p>
                        <p className="text-lg font-bold text-emerald-700">{studentData.classRank} / {studentData.totalStudents}</p>
                      </div>
                      <div className="bg-indigo-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-indigo-600 uppercase tracking-wide">Term Average</p>
                        <p className="text-lg font-bold text-indigo-700">{calculateAverage(studentData.subjects, 'overall')}%</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-amber-600 uppercase tracking-wide">Attendance</p>
                        <p className="text-lg font-bold text-amber-700">{studentData.attendance.present}/{studentData.attendance.present + studentData.attendance.absent}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
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
                      <span className="sm:hidden">{tab.id === 'qa1' ? 'QA1' : tab.id === 'qa2' ? 'QA2' : tab.id === 'endOfTerm' ? 'EOT' : 'Report'}</span>
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {/* QA1, QA2, End of Term Views */}
                  {(activeTab === 'qa1' || activeTab === 'qa2' || activeTab === 'endOfTerm') && (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h4 className="text-xl font-bold text-slate-800">
                            {activeTab === 'qa1' ? 'Quarterly Assessment 1' : activeTab === 'qa2' ? 'Quarterly Assessment 2' : 'End of Term Examination'}
                          </h4>
                          <p className="text-slate-500">Average Score: <span className="font-semibold text-indigo-600">{calculateAverage(studentData.subjects, activeTab)}%</span></p>
                        </div>
                      </div>

                      <div className="grid gap-4">
                        {studentData.subjects.map((subject, index) => {
                          const score = subject[activeTab];
                          const gradeForThisTab = (() => {
                            if (score >= 80) return 'A';
                            if (score >= 70) return 'B';
                            if (score >= 60) return 'C';
                            if (score >= 50) return 'D';
                            return 'F';
                          })();

                          return (
                            <div key={index} className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="flex-1">
                                  <h5 className="font-semibold text-slate-800">{subject.name}</h5>
                                  <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${getScoreColor(score)} transition-all duration-500`}
                                      style={{ width: `${score}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-2xl font-bold text-slate-800">{score}%</p>
                                    <p className="text-xs text-slate-500">Score</p>
                                  </div>
                                  {/* CHANGED THIS LINE: */}
                                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(gradeForThisTab)}`}>
                                    {gradeForThisTab}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Report Card View */}
                  {activeTab === 'reportCard' && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                          <h4 className="text-xl font-bold text-slate-800">Complete Report Card</h4>
                          <p className="text-slate-500">{studentData.term} { }</p>
                          {studentData.gradeConfiguration && (
                            <p className="text-sm text-indigo-600 mt-1">
                              Grade Calculation: {studentData.gradeConfiguration.configuration_name}
                              {studentData.gradeConfiguration.calculation_method === 'weighted_average' &&
                                ` (QA1: ${studentData.gradeConfiguration.weight_qa1}%, QA2: ${studentData.gradeConfiguration.weight_qa2}%, End Term: ${studentData.gradeConfiguration.weight_end_of_term}%)`}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handlePrint}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                          >
                            <Printer className="w-4 h-4" />
                            Print
                          </button>
                          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Download PDF
                          </button>
                        </div>
                      </div>

                      {/* Term Dates */}
                      {/* <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                          <div className="text-center md:text-left">
                            <p className="text-sm text-blue-700 font-medium mb-1">Current Term</p>
                            <p className="text-lg font-bold text-blue-800">{studentData.term}</p>
                            <p className="text-sm text-blue-600">Closing Date: December 20, 2024</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-blue-700 font-medium mb-1">Next Term</p>
                            <p className="text-lg font-bold text-blue-800">Term 2, 2024/2025</p>
                            <p className="text-sm text-blue-600">Opening Date: January 10, 2025</p>
                          </div>
                          <div className="text-center">
                            <Calendar className="w-12 h-12 text-blue-500 mx-auto" />
                          </div>
                        </div>
                      </div> */}

                      {/* Summary Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white">
                          <p className="text-indigo-100 text-sm">Final Average</p>
                          <p className="text-3xl font-bold">
                            {studentData.assessmentStats?.overall?.termAverage || calculateAverage(studentData.subjects, 'overall')}%
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
                          <p className="text-emerald-100 text-sm">Class Position</p>
                          <p className="text-3xl font-bold">{studentData.classRank}<span className="text-lg">/{studentData.totalStudents}</span></p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
                          <p className="text-amber-100 text-sm">Days Present</p>
                          <p className="text-3xl font-bold">{studentData.attendance.present}</p>
                        </div>
                        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-4 text-white">
                          <p className="text-rose-100 text-sm">Days Absent</p>
                          <p className="text-3xl font-bold">{studentData.attendance.absent}</p>
                        </div>
                      </div>

                      {/* FINAL RESULTS TABLE - Based on Grade Configuration */}
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
                                // Get final score based on grade configuration
                                const finalScore = subject.finalScore || ((subject.qa1 + subject.qa2 + subject.endOfTerm) / 3);
                                const remark = finalScore >= 50 ? 'Passed' : 'Failed';

                                return (
                                  <tr key={index} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-800">{subject.name}</td>
                                    <td className="px-6 py-4 text-center text-slate-600">100</td>
                                    <td className="px-6 py-4 text-center font-semibold text-slate-800">
                                      {finalScore.toFixed(1)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(subject.grade)}`}>
                                        {subject.grade}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${remark === 'Passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                        }`}>
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
                                  {(() => {
                                    const totalScored = studentData.subjects.reduce((sum, subject) => {
                                      const finalScore = subject.finalScore || ((subject.qa1 + subject.qa2 + subject.endOfTerm) / 3);
                                      return sum + finalScore;
                                    }, 0);
                                    return totalScored.toFixed(1);
                                  })()}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(
                                    studentData.subjects.reduce((sum, subject) => {
                                      const finalScore = subject.finalScore || ((subject.qa1 + subject.qa2 + subject.endOfTerm) / 3);
                                      return sum + (finalScore >= 50 ? 1 : 0);
                                    }, 0) === studentData.subjects.length ? 'A' : 'F'
                                  )
                                    }`}>
                                    {(() => {
                                      const totalScored = studentData.subjects.reduce((sum, subject) => {
                                        const finalScore = subject.finalScore || ((subject.qa1 + subject.qa2 + subject.endOfTerm) / 3);
                                        return sum + finalScore;
                                      }, 0);
                                      const average = totalScored / studentData.subjects.length;

                                      if (average >= 80) return 'A';
                                      if (average >= 70) return 'B';
                                      if (average >= 60) return 'C';
                                      if (average >= 50) return 'D';
                                      return 'F';
                                    })()}
                                  </span>
                                </td>
                                {/* <td className="px-6 py-4 text-center">
                                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${studentData.subjects.every(subject => {
                                    const finalScore = subject.finalScore || ((subject.qa1 + subject.qa2 + subject.endOfTerm) / 3);
                                    return finalScore >= 50;
                                  }) ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {studentData.subjects.every(subject => {
                                      const finalScore = subject.finalScore || ((subject.qa1 + subject.qa2 + subject.endOfTerm) / 3);
                                      return finalScore >= 50;
                                    }) ? 'PASSED' : 'FAILED'}
                                  </span>
                                </td> */}
                                <td className="px-6 py-4 text-center">
                                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${(() => {
                                    // Calculate OVERALL AVERAGE
                                    const totalAverage = studentData.subjects.reduce((sum, subject) => {
                                      const subjectAverage = subject.finalScore || ((subject.qa1 + subject.qa2 + subject.endOfTerm) / 3);
                                      return sum + subjectAverage;
                                    }, 0);
                                    const overallAverage = totalAverage / studentData.subjects.length;

                                    // Student passes if overall average >= 50
                                    return overallAverage >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
                                  })()}`}>
                                    {(() => {
                                      // Calculate OVERALL AVERAGE
                                      const totalAverage = studentData.subjects.reduce((sum, subject) => {
                                        const subjectAverage = subject.finalScore || ((subject.qa1 + subject.qa2 + subject.endOfTerm) / 3);
                                        return sum + subjectAverage;
                                      }, 0);
                                      const overallAverage = totalAverage / studentData.subjects.length;

                                      // Student passes if overall average >= 50
                                      return overallAverage >= 50 ? 'PASSED' : 'FAILED';
                                    })()}
                                  </span>
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>

                      {/* Performance Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Teacher Remarks */}
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                          <h5 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <User className="w-5 h-5 text-indigo-600" />
                            Teacher's Remarks
                          </h5>
                          <p className="text-slate-600 italic">"{studentData.teacherRemarks}"</p>
                        </div>

                        {/* Performance Summary */}
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
                          <h5 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                            Performance Summary
                          </h5>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Total Subjects:</span>
                              <span className="font-semibold text-emerald-700">{studentData.subjects.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Subjects Passed:</span>
                              <span className="font-semibold text-emerald-700">
                                {studentData.subjects.filter(subject => {
                                  const finalScore = subject.finalScore || ((subject.qa1 + subject.qa2 + subject.endOfTerm) / 3);
                                  return finalScore >= 50;
                                }).length}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Overall Average:</span>
                              <span className="font-bold text-emerald-800">
                                {studentData.assessmentStats?.overall?.termAverage || calculateAverage(studentData.subjects, 'overall')}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Attendance Summary */}
                      <div className="bg-white rounded-xl p-6 border border-slate-200">
                        <h5 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-indigo-600" />
                          Attendance Summary
                        </h5>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-emerald-50 rounded-lg">
                            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-emerald-700">{studentData.attendance.present}</p>
                            <p className="text-sm text-emerald-600">Days Present</p>
                          </div>
                          <div className="text-center p-4 bg-red-50 rounded-lg">
                            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-red-700">{studentData.attendance.absent}</p>
                            <p className="text-sm text-red-600">Days Absent</p>
                          </div>
                          <div className="text-center p-4 bg-amber-50 rounded-lg">
                            <Calendar className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-amber-700">{studentData.attendance.late}</p>
                            <p className="text-sm text-amber-600">Days Late</p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <p className="text-sm text-slate-500 text-center">
                            Attendance Rate: {Math.round((studentData.attendance.present / (studentData.attendance.present + studentData.attendance.absent)) * 100)}%
                          </p>
                        </div>
                      </div>

                      {/* Report Card Footer */}
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
                  )}

                </div>
              </div>
            </div>
          ) : null}
        </section>
      )}

      {/* Features Section (shown when no search) */}
      {!hasSearched && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">What You Can View</h3>
            <p className="text-slate-600 max-w-2xl mx-auto">Access comprehensive academic information for your child with just their exam number.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Quarterly Assessment 1</h4>
              <p className="text-slate-500 text-sm">View scores from the first quarterly assessment with subject-wise breakdown.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-emerald-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Quarterly Assessment 2</h4>
              <p className="text-slate-500 text-sm">Access the second quarterly assessment results and track progress.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">End of Term Exam</h4>
              <p className="text-slate-500 text-sm">View comprehensive end of term examination results and grades.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-rose-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Full Report Card</h4>
              <p className="text-slate-500 text-sm">Complete term report with all assessments, attendance, and teacher remarks.</p>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      {!hasSearched && (
        <section className="bg-slate-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">How It Works</h3>
              <p className="text-slate-600">Simple steps to access your child's academic results</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">1</div>
                <h4 className="text-lg font-semibold text-slate-800 mb-2">Enter Exam Number</h4>
                <p className="text-slate-500">Type your child's unique exam number in the search box above.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">2</div>
                <h4 className="text-lg font-semibold text-slate-800 mb-2">View Results</h4>
                <p className="text-slate-500">Browse through quarterly assessments and end of term results.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">3</div>
                <h4 className="text-lg font-semibold text-slate-800 mb-2">Download Report</h4>
                <p className="text-slate-500">Print or download the complete report card for your records.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer id="contact" className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold">Parent Portal</h4>
                  <p className="text-xs text-slate-400">Student Results System</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm max-w-md">
                Providing parents with easy access to their children's academic progress and results. Stay informed and support your child's educational journey.
              </p>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Quick Links</h5>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                {/* <li><a href="#" className="hover:text-white transition-colors">Academic Calendar</a></li> */}
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Contact Us</h5>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Education</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+265 (0) 888 447 122</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>support@parentportal.edu</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Parent Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
