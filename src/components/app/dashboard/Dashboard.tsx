import React, { useState } from 'react';
import { Calendar, Bell, TrendingUp, CheckCircle, AlertCircle, User, School, Award, BarChart2, LineChart, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Student {
    id: string;
    name: string;
    grade: string;
    school: string;
    class_teacher?: string;
}

const academicTerms = [
    'Term 1, 2025/2026',
    'Term 2, 2025/2026',
    'Term 3, 2025/2026',
];

interface DashboardProps {
    student: Student;
}

const Dashboard: React.FC<DashboardProps> = ({ student }) => {
    const { user } = useAuth();
    const displayName = user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Parent';
    // const [chartType, setChartType] = React.useState<'bar' | 'line'>('bar');
    const [graphType, setGraphType] = React.useState<'bar' | 'line'>('bar');

    const [isTermDropdownOpen, setIsTermDropdownOpen] = useState(false);
    const [currentTerm, setCurrentTerm] = useState('Term 1, 2025/2026');

    // School calendar dates
    const schoolCalendar = [
        { event: 'Term 1 Starts', date: 'Jan 15, 2025', type: 'opening' },
        { event: 'Term 1 Ends', date: 'Apr 4, 2025', type: 'closing' },
        { event: 'Term 2 Starts', date: 'Apr 29, 2025', type: 'opening' },
        { event: 'Term 2 Ends', date: 'Jul 18, 2025', type: 'closing' },
        { event: 'Term 3 Starts', date: 'Sep 2, 2025', type: 'opening' },
        { event: 'Term 3 Ends', date: 'Nov 28, 2025', type: 'closing' },
    ];

    type PerformanceTrend = {
        trend: {
            label: string;
            score: number;
        }[];
        trendDirection: 'up' | 'down' | 'stable';
    };

    const performanceTrend: PerformanceTrend = {
        trend: [
            { label: 'Term 1', score: 60 },
            { label: 'Term 2', score: 40 },
            { label: 'Term 3', score: 50 },
        ],
        trendDirection: 'up',
    };



    // School announcements
    const announcements = [
        { title: 'Sports Day 2025', date: 'Feb 15, 2025', priority: 'high' },
        { title: 'Parent-Teacher Meetings', date: 'Mar 10-12, 2025', priority: 'high' },
        { title: 'Library Week', date: 'Feb 20-24, 2025', priority: 'medium' },
        { title: 'Science Fair Registration', date: 'Apr 1, 2025', priority: 'medium' },
    ];

    // Upcoming events
    const upcomingEvents = [
        { event: 'School Assembly', date: 'Tomorrow, 8:30 AM', location: 'Main Hall' },
        { event: 'Swimming Lessons', date: 'Friday, 10:00 AM', location: 'School Pool' },
        { event: 'Art Exhibition', date: 'Next Monday', location: 'Art Room' },
    ];

    // Sample attendance data
    const attendance = {
        present: 160,
        absent: 5,
        late: 3,
        totalDays: 180,
        rate: Math.round((160 / 180) * 100)
    };

    // Performance analysis
    const performance = {
        positionInClass: '5',
        classSize: 45,
        averageScore: 68,
        overallGrade: 'B',
        strongestSubject: 'Mathematics',
        strongestScore: 92,
        needsImprovement: 'English',
        improvementScore: 78,
        subjectsPassed: '8/8',
        topGrades: '4',
        averageGrades: '2',
        belowPass: '0',

    };

    // Teacher remarks
    const teacherRemarks = "Excellent progress in Mathematics! Shows great improvement in problem-solving skills. Continue encouraging reading to improve English comprehension.";

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white p-6 rounded-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Welcome, {displayName}</h1>
                        <p className="text-green-100 mt-1">
                            {student.name} • {student.grade} • {student.school}
                        </p>
                        {/* --- NEW SECTION: Combined Message Class Teacher Button --- */}
                        <div className="mt-4">
                            <button
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-lg backdrop-blur-sm transition-all cursor-pointer group"
                            >
                                {/* Icon changes color on hover using 'group-hover' */}
                                <User className="w-4 h-4 text-green-200 group-hover:text-white transition-colors" />

                                <span className="text-sm font-medium text-green-50 group-hover:text-white transition-colors">
                                    Message Class Teacher: <span className="text-white font-bold ml-1">{student.class_teacher || 'Mr. Anderson'}</span>
                                </span>
                            </button>
                        </div>
                        {/* ---------------------------------------------------------- */}
                    </div>


                    {/* <div className="mt-4 md:mt-0 flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                        <Bell className="w-5 h-5" />
                        <span>Term 1, 2025/2026</span>
                    </div> */}
                    {/* --- TERM SELECTOR DROPDOWN --- */}
                    <div className="relative mt-4 md:mt-0">
                        <button
                            onClick={() => setIsTermDropdownOpen(!isTermDropdownOpen)}
                            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-colors cursor-pointer"
                        >
                            <Calendar className="w-4 h-4 text-green-100" />
                            <span className="font-medium">{currentTerm}</span>
                            <ChevronDown className={`w-4 h-4 text-green-100 transition-transform ${isTermDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isTermDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                {academicTerms.map((term) => (
                                    <button
                                        key={term}
                                        onClick={() => {
                                            setCurrentTerm(term);
                                            setIsTermDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between group transition-colors"
                                    >
                                        <span>{term}</span>
                                        {currentTerm === term && (
                                            <Check className="w-4 h-4 text-emerald-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* ------------------------------- */}
                </div>
            </div>

            {/* Two Columns Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Performance & Attendance */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Performance Analysis */}
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
                        <h5 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                            Performance Analysis
                        </h5>
                        <div className="space-y-4">
                            {/* Added: Class Position, Average Score, Overall Grade */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                                    <p className="text-sm text-slate-500">Position in Class</p>
                                    <p className="text-xl font-bold text-slate-800">
                                        {performance.positionInClass}
                                    </p>
                                    <p className="text-sm text-slate-600 mt-1">out of {performance.classSize} students</p>
                                </div>

                                <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                                    <p className="text-sm text-slate-500">Average Score</p>
                                    <p className="text-xl font-bold text-slate-800">
                                        {performance.averageScore}%
                                    </p>
                                </div>

                                <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                                    <p className="text-sm text-slate-500">Overall Grade</p>
                                    <p className="text-xl font-bold text-slate-800">
                                        {performance.overallGrade}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <p className="text-sm text-slate-500">Strongest Subject</p>
                                    <p className="text-xl font-bold text-emerald-700 mt-1">{performance.strongestSubject}</p>
                                    <p className="text-sm text-slate-600 mt-1">Score: {performance.strongestScore}%</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <p className="text-sm text-slate-500">Needs Improvement</p>
                                    <p className="text-xl font-bold text-amber-700 mt-1">{performance.needsImprovement}</p>
                                    <p className="text-sm text-slate-600 mt-1">Score: {performance.improvementScore}%</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-white p-3 rounded-lg text-center">
                                    <p className="text-sm text-slate-500">Subjects Passed</p>
                                    <p className="text-lg font-bold text-emerald-800">{performance.subjectsPassed}</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg text-center">
                                    <p className="text-sm text-slate-500">A & B Grades</p>
                                    <p className="text-lg font-bold text-blue-800">{performance.topGrades}</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg text-center">
                                    <p className="text-sm text-slate-500">C & D Grades</p>
                                    <p className="text-lg font-bold text-amber-800">{performance.averageGrades}</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg text-center">
                                    <p className="text-sm text-slate-500">Below Pass Mark</p>
                                    <p className="text-lg font-bold text-rose-800">{performance.belowPass}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Attendance Details */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h5 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            Attendance Details
                        </h5>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 p-4 rounded-lg text-center">
                                <p className="text-sm text-blue-600">Total School Days</p>
                                <p className="text-2xl font-bold text-blue-700">{attendance.totalDays}</p>
                            </div>

                            <div className={`${attendance.rate >= 75 ? 'bg-gradient-to-br from-green-50 to-green-100' : 'bg-gradient-to-br from-orange-50 to-orange-100'} p-4 rounded-lg`}>
                                <p className={`text-sm font-medium ${attendance.rate >= 75 ? 'text-green-800' : 'text-orange-800'}`}>
                                    Attendance Rate
                                </p>
                                <p className={`text-2xl font-bold ${attendance.rate >= 75 ? 'text-green-900' : 'text-orange-900'}`}>
                                    {attendance.rate}%
                                </p>
                                <p className={`text-xs mt-1 ${attendance.rate >= 75 ? 'text-green-700' : 'text-orange-700'}`}>
                                    {attendance.present}/{attendance.totalDays}
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-50 to-rose-50 p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="text-center">
                                        <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                                        <p className="text-sm text-emerald-600">Present</p>
                                        <p className="text-xl font-bold text-emerald-700">{attendance.present}</p>
                                    </div>
                                    <div className="text-center">
                                        <AlertCircle className="w-6 h-6 text-rose-600 mx-auto mb-1" />
                                        <p className="text-sm text-rose-600">Absent</p>
                                        <p className="text-xl font-bold text-rose-700">{attendance.absent}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 p-4 rounded-lg text-center">
                                <p className="text-sm text-amber-600">Days Late</p>
                                <p className="text-2xl font-bold text-amber-700">{attendance.late}</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-slate-700">Attendance Trend:</p>
                                <span className="text-sm font-semibold text-slate-700">{attendance.rate}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-3">
                                <div
                                    className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${attendance.rate}%` }}
                                ></div>
                            </div>
                            <p className={`text-sm mt-3 ${attendance.rate >= 95 ? 'text-emerald-600' : attendance.rate >= 80 ? 'text-blue-600' : 'text-amber-600'}`}>
                                {attendance.rate >= 95
                                    ? '✓ Excellent attendance! Keep it up.'
                                    : attendance.rate >= 80
                                        ? '✓ Good attendance record.'
                                        : '⚠ Needs improvement in attendance.'}
                            </p>
                        </div>
                    </div>
                    {/* Teacher's Remarks */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                        <h5 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <User className="w-5 h-5 text-indigo-600" />
                            Teacher's Remarks
                        </h5>
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <p className="text-slate-700 italic">"{teacherRemarks}"</p>
                        </div>
                    </div>
                </div>

                {/* Right Column - Teacher's Remarks, Announcements & Events */}
                <div className="space-y-6">
                    {/* Performance Trend */}
                    {/* Performance Trend */}
                    {/* <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h5 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                            Performance Trend
                        </h5>

                        <div className="space-y-3">
                            {performanceTrend.trend.map((item, index) => (
                                <div key={index}>
                                    <div className="flex justify-between text-sm text-slate-600 mb-1">
                                        <span>{item.label}</span>
                                        <span className="font-medium">{item.score}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div
                                            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${item.score}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className="text-sm text-slate-600 mt-4">
                            {performanceTrend.trendDirection === 'up'
                                ? '📈 Performance is improving over time.'
                                : performanceTrend.trendDirection === 'down'
                                    ? '📉 Performance has declined recently.'
                                    : '➖ Performance is stable.'}
                        </p>
                    </div> */}


                    {/* Performance Trend */}
                    {/* Performance Trend Card */}
                    {/* Performance Trend Card - UPDATED VERTICAL BARS */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h5 className="font-semibold text-slate-800 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                                Performance Trend
                            </h5>

                            {/* Toggle Buttons */}
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setGraphType('bar')}
                                    className={`p-1.5 rounded-md transition-all ${graphType === 'bar' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <BarChart2 className="w-4 h-4" />
                                    <p>Bar</p>
                                </button>
                                <button
                                    onClick={() => setGraphType('line')}
                                    className={`p-1.5 rounded-md transition-all ${graphType === 'line' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <LineChart className="w-4 h-4" />
                                    <p>Line</p>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 h-48">
                            {graphType === 'bar' ? (
                                // UPDATED VERTICAL BAR GRAPH LOGIC
                                <div className="h-full w-full flex flex-col justify-between pt-2">
                                    {/* The Bars Area */}
                                    <div className="flex items-end justify-between h-32 w-full px-2 border-b border-dashed border-slate-200">
                                        {performanceTrend.trend.map((item, index) => (
                                            <div key={index} className="flex flex-col items-center justify-end h-full w-full group">
                                                {/* Percentage on top */}
                                                <span className="text-xs font-bold text-emerald-700 mb-1">
                                                    {item.score}%
                                                </span>

                                                {/* The Vertical Bar */}
                                                <div
                                                    className="w-3 sm:w-5 bg-emerald-500 rounded-t-md transition-all duration-500 group-hover:bg-emerald-600"
                                                    style={{ height: `${item.score}%` }}
                                                ></div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* X-Axis Labels (Terms) */}
                                    <div className="flex justify-between text-xs text-slate-500 mt-2 px-1">
                                        {performanceTrend.trend.map((t, i) => (
                                            <div key={i} className="w-full text-center">
                                                {t.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                // LINE GRAPH LOGIC (Your existing one)
                                <div className="h-full w-full flex flex-col justify-between pt-2">
                                    <div className="relative h-32 w-full">
                                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                            {/* Grid Lines */}
                                            <line x1="0" y1="0" x2="100" y2="0" stroke="#e2e8f0" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeDasharray="4 4" />
                                            <line x1="0" y1="50" x2="100" y2="50" stroke="#e2e8f0" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeDasharray="4 4" />
                                            <line x1="0" y1="100" x2="100" y2="100" stroke="#e2e8f0" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />

                                            {/* The Line Path */}
                                            <polyline
                                                points={performanceTrend.trend.map((t, i) =>
                                                    `${(i / (performanceTrend.trend.length - 1)) * 100},${100 - t.score}`
                                                ).join(' ')}
                                                fill="none"
                                                stroke="#10b981"
                                                strokeWidth="2"
                                                vectorEffect="non-scaling-stroke"
                                            />

                                            {/* The Dots & Text */}
                                            {performanceTrend.trend.map((t, i) => (
                                                <g key={i}>
                                                    <text
                                                        x={`${(i / (performanceTrend.trend.length - 1)) * 100}%`}
                                                        y={`${100 - t.score - 8}%`}
                                                        textAnchor="middle"
                                                        fontSize="6"
                                                        fontWeight="bold"
                                                        fill="#0f766e"
                                                    >
                                                        {t.score}%
                                                    </text>
                                                    <circle
                                                        cx={`${(i / (performanceTrend.trend.length - 1)) * 100}%`}
                                                        cy={`${100 - t.score}%`}
                                                        r="2.5"
                                                        className="fill-white stroke-emerald-600 stroke-2"
                                                    />
                                                </g>
                                            ))}
                                        </svg>
                                    </div>
                                    {/* X-Axis Labels */}
                                    <div className="flex justify-between text-xs text-slate-500 mt-2 px-1">
                                        {performanceTrend.trend.map((t, i) => (
                                            <span key={i}>{t.label}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-slate-600 mt-4 pt-2 border-t border-slate-100">
                            {performanceTrend.trendDirection === 'up'
                                ? '📈 Performance is improving over time.'
                                : performanceTrend.trendDirection === 'down'
                                    ? '📉 Performance has declined recently.'
                                    : '➖ Performance is stable.'}
                        </p>
                    </div>



                    {/* School Announcements */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h5 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-red-600" />
                            School Announcements
                        </h5>
                        <div className="space-y-3">
                            {announcements.map((announcement, index) => (
                                <div key={index} className={`p-3 rounded-lg border ${announcement.priority === 'high' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                                    <div className="flex justify-between items-start">
                                        <p className="font-medium text-slate-800">{announcement.title}</p>
                                        <span className={`text-xs px-2 py-1 rounded ${announcement.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {announcement.priority === 'high' ? 'Important' : 'Update'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1">📅 {announcement.date}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Events */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h5 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-orange-600" />
                            Upcoming Events
                        </h5>
                        <div className="space-y-3">
                            {upcomingEvents.map((event, index) => (
                                <div key={index} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                                    <p className="font-medium text-slate-800">{event.event}</p>
                                    <div className="flex justify-between text-sm text-slate-600 mt-1">
                                        <span>📅 {event.date}</span>
                                        <span>📍 {event.location}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Full Width Horizontal School Calendar at the BOTTOM */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <h5 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <School className="w-5 h-5 text-purple-600" />
                    School Calendar 2025
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Term 1 */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                            <h6 className="font-semibold text-blue-800">Term 1</h6>
                            <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">Academic</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-2 bg-white rounded border">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <span className="text-sm">Opening</span>
                                </div>
                                <span className="text-sm font-medium">Jan 15, 2025</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white rounded border">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <span className="text-sm">Closing</span>
                                </div>
                                <span className="text-sm font-medium">Apr 4, 2025</span>
                            </div>
                            <div className="text-xs text-slate-600 text-center">
                                Duration: 12 weeks
                            </div>
                        </div>
                    </div>

                    {/* Term 2 */}
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-lg border border-emerald-200">
                        <div className="flex items-center justify-between mb-3">
                            <h6 className="font-semibold text-emerald-800">Term 2</h6>
                            <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2 py-1 rounded">Academic</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-2 bg-white rounded border">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <span className="text-sm">Opening</span>
                                </div>
                                <span className="text-sm font-medium">Apr 29, 2025</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white rounded border">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <span className="text-sm">Closing</span>
                                </div>
                                <span className="text-sm font-medium">Jul 18, 2025</span>
                            </div>
                            <div className="text-xs text-slate-600 text-center">
                                Duration: 11 weeks
                            </div>
                        </div>
                    </div>

                    {/* Term 3 */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
                        <div className="flex items-center justify-between mb-3">
                            <h6 className="font-semibold text-amber-800">Term 3</h6>
                            <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-1 rounded">Academic</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-2 bg-white rounded border">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <span className="text-sm">Opening</span>
                                </div>
                                <span className="text-sm font-medium">Sep 2, 2025</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white rounded border">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <span className="text-sm">Closing</span>
                                </div>
                                <span className="text-sm font-medium">Nov 28, 2025</span>
                            </div>
                            <div className="text-xs text-slate-600 text-center">
                                Duration: 13 weeks
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

// import React from 'react';
// import { Calendar, Bell, TrendingUp, CheckCircle, AlertCircle, User, School, Award, BookOpen } from 'lucide-react';
// import { useAuth } from '@/contexts/AuthContext';

// interface Student {
//     id: string;
//     name: string;
//     grade: string;
//     school: string;
// }

// interface DashboardProps {
//     student: Student;
// }

// const Dashboard: React.FC<DashboardProps> = ({ student }) => {
//     const { user } = useAuth();
//     const displayName = user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Parent';

//     // School calendar dates
//     const schoolCalendar = [
//         { event: 'Term 1 Starts', date: 'Jan 15, 2025', type: 'opening' },
//         { event: 'Term 1 Ends', date: 'Apr 4, 2025', type: 'closing' },
//         { event: 'Term 2 Starts', date: 'Apr 29, 2025', type: 'opening' },
//         { event: 'Term 2 Ends', date: 'Jul 18, 2025', type: 'closing' },
//         { event: 'Term 3 Starts', date: 'Sep 2, 2025', type: 'opening' },
//         { event: 'Term 3 Ends', date: 'Nov 28, 2025', type: 'closing' },
//     ];

//     // School announcements
//     const announcements = [
//         { title: 'Sports Day 2025', date: 'Feb 15, 2025', priority: 'high' },
//         { title: 'Parent-Teacher Meetings', date: 'Mar 10-12, 2025', priority: 'high' },
//         { title: 'Library Week', date: 'Feb 20-24, 2025', priority: 'medium' },
//         { title: 'Science Fair Registration', date: 'Apr 1, 2025', priority: 'medium' },
//     ];

//     // Upcoming events
//     const upcomingEvents = [
//         { event: 'School Assembly', date: 'Tomorrow, 8:30 AM', location: 'Main Hall' },
//         { event: 'Swimming Lessons', date: 'Friday, 10:00 AM', location: 'School Pool' },
//         { event: 'Art Exhibition', date: 'Next Monday', location: 'Art Room' },
//     ];

//     // Sample attendance data
//     const attendance = {
//         present: 160,
//         absent: 5,
//         late: 3,
//         totalDays: 180,
//         rate: Math.round((160 / 180) * 100)
//     };

//     // Performance analysis
//     const performance = {
//         strongestSubject: 'Mathematics',
//         strongestScore: 92,
//         needsImprovement: 'English',
//         improvementScore: 78,
//         subjectsPassed: '6/8',
//         topGrades: '4',
//         averageGrades: '2',
//         belowPass: '0'
//     };

//     // Teacher remarks
//     const teacherRemarks = "Excellent progress in Mathematics! Shows great improvement in problem-solving skills. Continue encouraging reading to improve English comprehension.";

//     return (
//         <div className="space-y-6 p-4 md:p-6">
//             {/* Welcome Header */}
//             <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 rounded-2xl">
//                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
//                     <div>
//                         <h1 className="text-2xl md:text-3xl font-bold">Welcome, {displayName}</h1>
//                         <p className="text-green-100 mt-1">
//                             {student.name} • {student.grade} • {student.school}
//                         </p>
//                     </div>
//                     <div className="mt-4 md:mt-0 flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
//                         <Bell className="w-5 h-5" />
//                         <span>Term 1, 2025</span>
//                     </div>
//                 </div>
//             </div>

//             {/* Main Grid */}
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 {/* Left Column - Performance & Attendance */}
//                 <div className="lg:col-span-2 space-y-6">
//                     {/* Performance Analysis */}
//                     <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
//                         <h5 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
//                             <TrendingUp className="w-5 h-5 text-emerald-600" />
//                             Performance Analysis
//                         </h5>
//                         <div className="space-y-4">
//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                 <div className="bg-white p-4 rounded-lg shadow-sm">
//                                     <p className="text-sm text-slate-500">Strongest Subject</p>
//                                     <p className="text-xl font-bold text-emerald-700 mt-1">{performance.strongestSubject}</p>
//                                     <p className="text-sm text-slate-600 mt-1">Score: {performance.strongestScore}%</p>
//                                 </div>
//                                 <div className="bg-white p-4 rounded-lg shadow-sm">
//                                     <p className="text-sm text-slate-500">Needs Improvement</p>
//                                     <p className="text-xl font-bold text-amber-700 mt-1">{performance.needsImprovement}</p>
//                                     <p className="text-sm text-slate-600 mt-1">Score: {performance.improvementScore}%</p>
//                                 </div>
//                             </div>

//                             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                                 <div className="bg-white p-3 rounded-lg text-center">
//                                     <p className="text-sm text-slate-500">Subjects Passed</p>
//                                     <p className="text-lg font-bold text-emerald-800">{performance.subjectsPassed}</p>
//                                 </div>
//                                 <div className="bg-white p-3 rounded-lg text-center">
//                                     <p className="text-sm text-slate-500">A & B Grades</p>
//                                     <p className="text-lg font-bold text-blue-800">{performance.topGrades}</p>
//                                 </div>
//                                 <div className="bg-white p-3 rounded-lg text-center">
//                                     <p className="text-sm text-slate-500">C & D Grades</p>
//                                     <p className="text-lg font-bold text-amber-800">{performance.averageGrades}</p>
//                                 </div>
//                                 <div className="bg-white p-3 rounded-lg text-center">
//                                     <p className="text-sm text-slate-500">Below Pass</p>
//                                     <p className="text-lg font-bold text-rose-800">{performance.belowPass}</p>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Attendance Details */}
//                     <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
//                         <h5 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
//                             <Calendar className="w-5 h-5 text-indigo-600" />
//                             Attendance Details
//                         </h5>

//                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//                             <div className="bg-blue-50 p-4 rounded-lg text-center">
//                                 <p className="text-sm text-blue-600">Total School Days</p>
//                                 <p className="text-2xl font-bold text-blue-700">{attendance.totalDays}</p>
//                             </div>

//                             <div className={`${attendance.rate >= 75 ? 'bg-gradient-to-br from-green-50 to-green-100' : 'bg-gradient-to-br from-orange-50 to-orange-100'} p-4 rounded-lg`}>
//                                 <p className={`text-sm font-medium ${attendance.rate >= 75 ? 'text-green-800' : 'text-orange-800'}`}>
//                                     Attendance Rate
//                                 </p>
//                                 <p className={`text-2xl font-bold ${attendance.rate >= 75 ? 'text-green-900' : 'text-orange-900'}`}>
//                                     {attendance.rate}%
//                                 </p>
//                                 <p className={`text-xs mt-1 ${attendance.rate >= 75 ? 'text-green-700' : 'text-orange-700'}`}>
//                                     {attendance.present}/{attendance.totalDays}
//                                 </p>
//                             </div>

//                             <div className="bg-gradient-to-br from-emerald-50 to-rose-50 p-4 rounded-lg">
//                                 <div className="grid grid-cols-2 gap-3">
//                                     <div className="text-center">
//                                         <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
//                                         <p className="text-sm text-emerald-600">Present</p>
//                                         <p className="text-xl font-bold text-emerald-700">{attendance.present}</p>
//                                     </div>
//                                     <div className="text-center">
//                                         <AlertCircle className="w-6 h-6 text-rose-600 mx-auto mb-1" />
//                                         <p className="text-sm text-rose-600">Absent</p>
//                                         <p className="text-xl font-bold text-rose-700">{attendance.absent}</p>
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="bg-amber-50 p-4 rounded-lg text-center">
//                                 <p className="text-sm text-amber-600">Days Late</p>
//                                 <p className="text-2xl font-bold text-amber-700">{attendance.late}</p>
//                             </div>
//                         </div>

//                         <div className="pt-4 border-t border-slate-200">
//                             <div className="flex items-center justify-between mb-2">
//                                 <p className="text-sm font-medium text-slate-700">Attendance Trend:</p>
//                                 <span className="text-sm font-semibold text-slate-700">{attendance.rate}%</span>
//                             </div>
//                             <div className="w-full bg-slate-200 rounded-full h-3">
//                                 <div
//                                     className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
//                                     style={{ width: `${attendance.rate}%` }}
//                                 ></div>
//                             </div>
//                             <p className={`text-sm mt-3 ${attendance.rate >= 95 ? 'text-emerald-600' : attendance.rate >= 80 ? 'text-blue-600' : 'text-amber-600'}`}>
//                                 {attendance.rate >= 95
//                                     ? '✓ Excellent attendance! Keep it up.'
//                                     : attendance.rate >= 80
//                                         ? '✓ Good attendance record.'
//                                         : '⚠ Needs improvement in attendance.'}
//                             </p>
//                         </div>
//                     </div>

//                     {/* Teacher's Remarks */}
//                     <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
//                         <h5 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
//                             <User className="w-5 h-5 text-indigo-600" />
//                             Teacher's Remarks
//                         </h5>
//                         <div className="bg-white p-4 rounded-lg border border-slate-200">
//                             <p className="text-slate-700 italic">"{teacherRemarks}"</p>
//                         </div>
//                     </div>

//                     {/* Horizontal School Calendar - MOVED HERE */}
//                     <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
//                         <h5 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
//                             <School className="w-5 h-5 text-purple-600" />
//                             School Calendar 2025
//                         </h5>
//                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
//                             {schoolCalendar.map((term, index) => (
//                                 <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-center">
//                                     <div className="flex flex-col items-center">
//                                         <div className={`w-3 h-3 rounded-full mb-2 ${term.type === 'opening' ? 'bg-green-500' : 'bg-red-500'}`}></div>
//                                         <p className="font-medium text-slate-800 text-sm">{term.event}</p>
//                                         <p className="text-xs text-slate-600 mt-1">{term.date}</p>
//                                         <span className={`text-xs font-medium px-2 py-1 rounded mt-2 ${term.type === 'opening' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
//                                             {term.type === 'opening' ? 'Opening' : 'Closing'}
//                                         </span>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 </div>

//                 {/* Right Column - Announcements & Events */}
//                 <div className="space-y-6">
//                     {/* School Announcements */}
//                     <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
//                         <h5 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
//                             <Bell className="w-5 h-5 text-red-600" />
//                             School Announcements
//                         </h5>
//                         <div className="space-y-3">
//                             {announcements.map((announcement, index) => (
//                                 <div key={index} className={`p-3 rounded-lg border ${announcement.priority === 'high' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
//                                     <div className="flex justify-between items-start">
//                                         <p className="font-medium text-slate-800">{announcement.title}</p>
//                                         <span className={`text-xs px-2 py-1 rounded ${announcement.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
//                                             {announcement.priority === 'high' ? 'Important' : 'Update'}
//                                         </span>
//                                     </div>
//                                     <p className="text-sm text-slate-600 mt-1">📅 {announcement.date}</p>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>

//                     {/* Upcoming Events */}
//                     <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
//                         <h5 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
//                             <Award className="w-5 h-5 text-orange-600" />
//                             Upcoming Events
//                         </h5>
//                         <div className="space-y-3">
//                             {upcomingEvents.map((event, index) => (
//                                 <div key={index} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
//                                     <p className="font-medium text-slate-800">{event.event}</p>
//                                     <div className="flex justify-between text-sm text-slate-600 mt-1">
//                                         <span>📅 {event.date}</span>
//                                         <span>📍 {event.location}</span>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>


//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Dashboard;

// import React from 'react';
// import { useAuth } from '@/contexts/AuthContext';

// interface Student {
//     id: string;
//     name: string;
//     grade: string;
//     school: string;
// }

// interface DashboardProps {
//     student: Student;
// }

// const Dashboard: React.FC<DashboardProps> = ({ student }) => {
//     const { user } = useAuth();

//     return (
//         <div className="p-4">
//             <div className="mb-6">
//                 <h1 className="text-2xl font-bold">Welcome</h1>
//                 <p>Viewing {student.name}'s information</p>
//             </div>

//             <div className="bg-white p-4 rounded-lg border">
//                 <p className="text-center text-gray-500">
//                     Dashboard content will appear here
//                 </p>
//             </div>
//         </div>
//     );
// };

// export default Dashboard;

// // import React from 'react';
// // import { GraduationCap, Calendar, ClipboardList, TrendingUp, BookOpen, Award } from 'lucide-react';
// // import StatCard from './StatCard';
// // import GradeCard from './GradeCard';
// // import { useAuth } from '@/contexts/AuthContext';

// // interface Student {
// //     id: string;
// //     name: string;
// //     grade: string;
// //     avatar: string;
// //     school: string;
// // }

// // interface DashboardProps {
// //     student: Student;
// // }

// // // Define the user type based on what your auth system provides
// // interface AuthUser {
// //     id?: string;
// //     email?: string;
// //     full_name?: string;
// //     user_metadata?: {
// //         full_name?: string;
// //     };
// //     // Add other properties as needed
// // }

// // const Dashboard: React.FC<DashboardProps> = ({ student }) => {
// //     const { user } = useAuth();

// //     // Cast user to AuthUser type
// //     const authUser = user as unknown as AuthUser;

// //     // Get user display name from metadata or email
// //     const getDisplayName = (): string => {
// //         if (!authUser) return 'Parent';

// //         // Check different possible properties
// //         if (authUser.full_name) return authUser.full_name.split(' ')[0];
// //         if (authUser.user_metadata?.full_name) return authUser.user_metadata.full_name.split(' ')[0];
// //         if (authUser.email) return authUser.email.split('@')[0];

// //         return 'Parent';
// //     };

// //     const displayName = getDisplayName();

// //     const stats = [
// //         {
// //             title: 'Current GPA',
// //             value: '3.85',
// //             subtitle: 'Out of 4.0',
// //             trend: 'up' as const,
// //             trendValue: '+0.15',
// //             icon: <GraduationCap className="w-5 h-5" />,
// //             color: 'blue' as const,
// //         },
// //         {
// //             title: 'Attendance Rate',
// //             value: '96%',
// //             subtitle: '172 of 180 days',
// //             trend: 'up' as const,
// //             trendValue: '+2%',
// //             icon: <Calendar className="w-5 h-5" />,
// //             color: 'green' as const,
// //         },
// //         {
// //             title: 'Assignments',
// //             value: '42/45',
// //             subtitle: '3 pending',
// //             trend: 'neutral' as const,
// //             trendValue: 'On track',
// //             icon: <ClipboardList className="w-5 h-5" />,
// //             color: 'purple' as const,
// //         },
// //         {
// //             title: 'Class Rank',
// //             value: '#5',
// //             subtitle: 'Out of 28 students',
// //             trend: 'up' as const,
// //             trendValue: '+2',
// //             icon: <Award className="w-5 h-5" />,
// //             color: 'orange' as const,
// //         },
// //     ];

// //     const grades = [
// //         { subject: 'Mathematics', grade: 'A', percentage: 95, trend: 'up' as const, teacher: 'Mr. Anderson', lastUpdated: 'Dec 20, 2024', color: '#3B82F6' },
// //         { subject: 'English Language Arts', grade: 'A-', percentage: 92, trend: 'up' as const, teacher: 'Mrs. Thompson', lastUpdated: 'Dec 19, 2024', color: '#8B5CF6' },
// //         { subject: 'Science', grade: 'A', percentage: 94, trend: 'neutral' as const, teacher: 'Dr. Martinez', lastUpdated: 'Dec 18, 2024', color: '#10B981' },
// //         { subject: 'Social Studies', grade: 'B+', percentage: 88, trend: 'up' as const, teacher: 'Ms. Williams', lastUpdated: 'Dec 17, 2024', color: '#F59E0B' },
// //         { subject: 'Art', grade: 'A', percentage: 96, trend: 'neutral' as const, teacher: 'Mrs. Chen', lastUpdated: 'Dec 16, 2024', color: '#EC4899' },
// //         { subject: 'Physical Education', grade: 'A', percentage: 98, trend: 'up' as const, teacher: 'Coach Davis', lastUpdated: 'Dec 15, 2024', color: '#EF4444' },
// //         { subject: 'Music', grade: 'A-', percentage: 91, trend: 'up' as const, teacher: 'Mr. Brown', lastUpdated: 'Dec 14, 2024', color: '#6366F1' },
// //         { subject: 'Computer Science', grade: 'A+', percentage: 99, trend: 'up' as const, teacher: 'Ms. Taylor', lastUpdated: 'Dec 13, 2024', color: '#14B8A6' },
// //     ];

// //     const upcomingAssignments = [
// //         { subject: 'Mathematics', title: 'Chapter 8 Quiz', dueDate: 'Dec 26', type: 'Quiz' },
// //         { subject: 'English', title: 'Book Report - Charlotte\'s Web', dueDate: 'Dec 28', type: 'Project' },
// //         { subject: 'Science', title: 'Lab Report - Plant Growth', dueDate: 'Dec 30', type: 'Lab' },
// //         { subject: 'Social Studies', title: 'History Timeline', dueDate: 'Jan 2', type: 'Assignment' },
// //     ];

// //     const recentActivity = [
// //         { action: 'Grade Posted', detail: 'Mathematics Quiz - 95%', time: '2 hours ago', icon: <GraduationCap className="w-4 h-4" /> },
// //         { action: 'Assignment Submitted', detail: 'Science Lab Report', time: '1 day ago', icon: <ClipboardList className="w-4 h-4" /> },
// //         { action: 'Attendance', detail: 'Marked present', time: '1 day ago', icon: <Calendar className="w-4 h-4" /> },
// //         { action: 'Grade Posted', detail: 'English Essay - A-', time: '2 days ago', icon: <GraduationCap className="w-4 h-4" /> },
// //         { action: 'Achievement', detail: 'Perfect Attendance Week', time: '3 days ago', icon: <Award className="w-4 h-4" /> },
// //     ];

// //     return (
// //         <div className="space-y-6">
// //             {/* Welcome Banner */}
// //             <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white">
// //                 <div className="relative z-10">
// //                     <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, {displayName}!</h1>
// //                     <p className="text-blue-100 max-w-xl">
// //                         Here's an overview of {student.name}'s academic progress. They're doing great this semester!
// //                     </p>
// //                 </div>
// //                 <div className="absolute right-0 top-0 w-64 h-64 opacity-10">
// //                     <BookOpen className="w-full h-full" />
// //                 </div>
// //                 <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
// //                 <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
// //             </div>

// //             {/* Stats Grid */}
// //             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
// //                 {stats.map((stat, index) => (
// //                     <StatCard key={index} {...stat} />
// //                 ))}
// //             </div>

// //             {/* Main Content Grid */}
// //             <div className="grid lg:grid-cols-3 gap-6">
// //                 {/* Grades Section */}
// //                 <div className="lg:col-span-2">
// //                     <div className="flex items-center justify-between mb-4">
// //                         <h2 className="text-lg font-semibold text-gray-900">Current Grades</h2>
// //                         <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
// //                     </div>
// //                     <div className="grid sm:grid-cols-2 gap-4">
// //                         {grades.slice(0, 6).map((grade, index) => (
// //                             <GradeCard key={index} {...grade} />
// //                         ))}
// //                     </div>
// //                 </div>

// //                 {/* Sidebar */}
// //                 <div className="space-y-6">
// //                     {/* Upcoming Assignments */}
// //                     <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
// //                         <h3 className="font-semibold text-gray-900 mb-4">Upcoming Assignments</h3>
// //                         <div className="space-y-3">
// //                             {upcomingAssignments.map((assignment, index) => (
// //                                 <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
// //                                     <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
// //                                         <ClipboardList className="w-5 h-5 text-blue-600" />
// //                                     </div>
// //                                     <div className="flex-1 min-w-0">
// //                                         <p className="font-medium text-gray-900 text-sm truncate">{assignment.title}</p>
// //                                         <p className="text-xs text-gray-500">{assignment.subject}</p>
// //                                     </div>
// //                                     <div className="text-right">
// //                                         <p className="text-xs font-medium text-gray-900">{assignment.dueDate}</p>
// //                                         <span className="text-xs text-gray-500">{assignment.type}</span>
// //                                     </div>
// //                                 </div>
// //                             ))}
// //                         </div>
// //                     </div>

// //                     {/* Recent Activity */}
// //                     <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
// //                         <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
// //                         <div className="space-y-4">
// //                             {recentActivity.map((activity, index) => (
// //                                 <div key={index} className="flex items-start gap-3">
// //                                     <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
// //                                         {activity.icon}
// //                                     </div>
// //                                     <div className="flex-1 min-w-0">
// //                                         <p className="text-sm font-medium text-gray-900">{activity.action}</p>
// //                                         <p className="text-xs text-gray-500 truncate">{activity.detail}</p>
// //                                     </div>
// //                                     <span className="text-xs text-gray-400 whitespace-nowrap">{activity.time}</span>
// //                                 </div>
// //                             ))}
// //                         </div>
// //                     </div>
// //                 </div>
// //             </div>

// //             {/* Performance Chart Placeholder */}
// //             <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
// //                 <div className="flex items-center justify-between mb-6">
// //                     <div>
// //                         <h2 className="text-lg font-semibold text-gray-900">Grade Trend</h2>
// //                         <p className="text-sm text-gray-500">Performance over the semester</p>
// //                     </div>
// //                     <div className="flex items-center gap-2">
// //                         <button className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">This Term</button>
// //                         <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Last Term</button>
// //                         <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Year</button>
// //                     </div>
// //                 </div>

// //                 {/* Simple Bar Chart */}
// //                 <div className="flex items-end justify-between h-48 gap-2 px-4">
// //                     {['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => {
// //                         const heights = [75, 80, 78, 85, 88, 90, 87, 92, 94, 95];
// //                         const height = heights[index] || 0;
// //                         const isCurrentMonth = month === 'Dec';
// //                         return (
// //                             <div key={month} className="flex-1 flex flex-col items-center gap-2">
// //                                 <div className="w-full flex flex-col items-center justify-end h-40">
// //                                     <span className="text-xs font-medium text-gray-700 mb-1">{height}%</span>
// //                                     <div
// //                                         className={`w-full rounded-t-lg transition-all duration-300 ${isCurrentMonth
// //                                             ? 'bg-gradient-to-t from-blue-600 to-indigo-500'
// //                                             : 'bg-gradient-to-t from-blue-200 to-blue-300 hover:from-blue-300 hover:to-blue-400'
// //                                             }`}
// //                                         style={{ height: `${height}%` }}
// //                                     />
// //                                 </div>
// //                                 <span className={`text-xs ${isCurrentMonth ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>
// //                                     {month}
// //                                 </span>
// //                             </div>
// //                         );
// //                     })}
// //                 </div>
// //             </div>
// //         </div>
// //     );
// // };

// // export default Dashboard;