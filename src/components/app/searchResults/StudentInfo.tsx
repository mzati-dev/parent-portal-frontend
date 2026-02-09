
import React from 'react';
import { StudentData } from '@/types';
import { FileText, Award } from 'lucide-react';

interface StudentInfoProps {
    studentData: StudentData;
}

const StudentInfo: React.FC<StudentInfoProps> = ({ studentData }) => {
    const getGradeColor = (grade: string) => {
        if (grade === 'N/A') return 'text-slate-600 bg-slate-100';
        if (grade.includes('A')) return 'text-emerald-600 bg-emerald-50';
        if (grade === 'B') return 'text-blue-600 bg-blue-50';
        if (grade === 'C') return 'text-amber-600 bg-amber-50';
        return 'text-red-600 bg-red-50';
    };

    const hasAssessmentScores = (assessmentType: 'qa1' | 'qa2' | 'endOfTerm'): boolean => {
        if (!studentData || !studentData.subjects || studentData.subjects.length === 0) {
            return false;
        }

        return studentData.subjects.some(subject => {
            const score = subject[assessmentType];
            return score !== null && score !== undefined && score > 0;
        });
    };

    const calculateAverage = (subjects: StudentData['subjects'], type: 'qa1' | 'qa2' | 'endOfTerm' | 'overall') => {
        if (subjects.length === 0) return 'N/A';

        if (type === 'overall') {
            const validSubjects = subjects.filter(s => {
                const finalScore = s.finalScore || ((s.qa1 + s.qa2 + s.endOfTerm) / 3);
                return finalScore > 0;
            });

            if (validSubjects.length === 0) return 'N/A';

            const total = validSubjects.reduce((acc, s) => {
                const finalScore = s.finalScore || ((s.qa1 + s.qa2 + s.endOfTerm) / 3);
                return acc + finalScore;
            }, 0);
            return (total / validSubjects.length).toFixed(1);
        }

        const validSubjects = subjects.filter(s => s[type] !== null && s[type] !== undefined && s[type] > 0);
        if (validSubjects.length === 0) return 'N/A';

        const total = validSubjects.reduce((acc, s) => acc + s[type], 0);
        return (total / validSubjects.length).toFixed(1);
    };

    return (
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
                        <p className="text-sm text-indigo-600 font-medium">{studentData.term}, {studentData.academicYear}</p>
                    </div>
                </div>

                {studentData.assessmentStats ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 md:ml-auto">
                        {/* QA1 Box */}
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">QA1</span>
                                <FileText className="w-4 h-4 text-indigo-600" />
                            </div>

                            {hasAssessmentScores('qa1') ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600">Position:</span>
                                        <span className="text-sm font-bold text-indigo-800">
                                            {studentData.assessmentStats.qa1.classRank}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600">Enrollment:</span>
                                        <span className="text-sm font-bold text-indigo-800">
                                            {studentData.totalStudents}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600">Average:</span>
                                        <span className="text-sm font-bold text-indigo-800">
                                            {studentData.assessmentStats.qa1.termAverage}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600">Overall Grade:</span>
                                        <span className={`text-sm font-bold ${getGradeColor(studentData.assessmentStats.qa1.overallGrade)}`}>
                                            {studentData.assessmentStats.qa1.overallGrade}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600">Remark:</span>
                                        <span className={`text-xs font-bold ${studentData.assessmentStats?.qa1?.overallGrade === 'F' ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {studentData.assessmentStats?.qa1?.overallGrade === 'F' ? 'FAILED' : 'PASSED'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-3">
                                    <p className="text-sm text-slate-500 italic">No QA1 scores recorded</p>
                                    <p className="text-xs text-slate-400">Student did not write this assessment</p>
                                </div>
                            )}
                        </div>

                        {/* QA2 Box */}
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">QA2</span>
                                <FileText className="w-4 h-4 text-emerald-600" />
                            </div>

                            {hasAssessmentScores('qa2') ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600">Position:</span>
                                        <span className="text-sm font-bold text-emerald-800">
                                            {studentData.assessmentStats.qa2.classRank}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600">Enrollment:</span>
                                        <span className="text-sm font-bold text-emerald-800">
                                            {studentData.totalStudents}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600">Average:</span>
                                        <span className="text-sm font-bold text-emerald-800">
                                            {studentData.assessmentStats.qa2.termAverage}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600">Overall Grade:</span>
                                        <span className={`text-sm font-bold ${getGradeColor(studentData.assessmentStats.qa2.overallGrade)}`}>
                                            {studentData.assessmentStats.qa2.overallGrade}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600">Remark:</span>
                                        <span className={`text-xs font-bold ${studentData.assessmentStats?.qa2?.overallGrade === 'F' ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {studentData.assessmentStats?.qa2?.overallGrade === 'F' ? 'FAILED' : 'PASSED'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-3">
                                    <p className="text-sm text-slate-500 italic">No QA2 scores recorded</p>
                                    <p className="text-xs text-slate-400">Student did not write this assessment</p>
                                </div>
                            )}
                        </div>

                        {/* End of Term Box */}
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">End of Term</span>
                                <Award className="w-4 h-4 text-amber-600" />
                            </div>

                            {hasAssessmentScores('endOfTerm') ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600">Position:</span>
                                        <span className="text-sm font-bold text-amber-800">
                                            {studentData.assessmentStats.endOfTerm.classRank}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600">Enrollment:</span>
                                        <span className="text-sm font-bold text-amber-800">
                                            {studentData.totalStudents}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600">Average:</span>
                                        <span className="text-sm font-bold text-amber-800">
                                            {studentData.assessmentStats.endOfTerm.termAverage}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600">Overall Grade:</span>
                                        <span className={`text-sm font-bold ${getGradeColor(studentData.assessmentStats.endOfTerm.overallGrade)}`}>
                                            {studentData.assessmentStats.endOfTerm.overallGrade}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600">Remark:</span>
                                        <span className={`text-xs font-bold ${studentData.assessmentStats?.endOfTerm?.overallGrade === 'F' ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {studentData.assessmentStats?.endOfTerm?.overallGrade === 'F' ? 'FAILED' : 'PASSED'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-3">
                                    <p className="text-sm text-slate-500 italic">No End of Term scores recorded</p>
                                    <p className="text-xs text-slate-400">Student did not write this assessment</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
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
                            <p className="text-lg font-bold text-amber-700">
                                {studentData.attendance.present}/{studentData.attendance.present + studentData.attendance.absent}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentInfo;