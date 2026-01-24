import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import StudentSwitcher from './StudentSwitcher';
import GradesPage from './GradesPage';
import AttendanceCalendar from './FeesPage';
import MessageCenter from './MessageCenter';
import ReportCards from './ReportCards';
import FamilyProfile from './FamilyProfile';
import HelpSupport from './HelpSupport';
import Dashboard from './Dashboard';
import Footer from '@/components/common/Footer';
import FeesPage from './FeesPage';

// ✅ FIXED: Added 'class_teacher' to the interface
interface Student {
    id: string;
    name: string;
    grade: string;
    avatar: string;
    school: string;
    dateOfBirth: string;
    studentId: string;
    class_teacher: string; // <--- This was missing
}

const UserAppLayout: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isStudentSwitcherOpen, setIsStudentSwitcherOpen] = useState(false);

    // ✅ FIXED: Added 'class_teacher' to the mock data objects
    const students: Student[] = [
        {
            id: '1',
            name: 'Emma Waliko',
            grade: 'Standard 6',
            avatar: 'https://d64gsuwffb70l.cloudfront.net/694a9d081e5ab3fa33ad06e6_1766497638727_3e1c0f81.png',
            school: 'Progress Primary School',
            dateOfBirth: 'Jan 15, 2014',
            studentId: 'STU-2024-001',
            class_teacher: 'Mrs. Anderson', // <--- Added
        },
        {
            id: '2',
            name: 'James Adam',
            grade: 'Standard 4',
            avatar: 'https://d64gsuwffb70l.cloudfront.net/694a9d081e5ab3fa33ad06e6_1766497635039_0ca40a17.jpg',
            school: 'Progress Primary School',
            dateOfBirth: 'Mar 22, 2016',
            studentId: 'STU-2024-002',
            class_teacher: 'Mr. Roberts', // <--- Added
        },
        {
            id: '3',
            name: 'Sophia Johnson',
            grade: 'Standard 8',
            avatar: 'https://d64gsuwffb70l.cloudfront.net/694a9d081e5ab3fa33ad06e6_1766497640200_66719bf7.png',
            school: 'Progress Primary School',
            dateOfBirth: 'Jul 8, 2018',
            studentId: 'STU-2024-003',
            class_teacher: 'Ms. Davis',
        },
    ];

    const [selectedStudent, setSelectedStudent] = useState<Student>(students[0]);

    // Mock Data remains the same...
    const assignments = [
        { id: '1', title: 'Chapter 8 Math Quiz', subject: 'Mathematics', dueDate: 'Dec 26, 2024', status: 'pending' as const },
        { id: '2', title: 'Book Report - Charlotte\'s Web', subject: 'English', dueDate: 'Dec 28, 2024', status: 'pending' as const },
        { id: '3', title: 'Science Lab Report', subject: 'Science', dueDate: 'Dec 20, 2024', status: 'graded' as const, score: '95', maxScore: '100' },
        { id: '4', title: 'History Timeline Project', subject: 'Social Studies', dueDate: 'Dec 18, 2024', status: 'graded' as const, score: '88', maxScore: '100' },
        { id: '5', title: 'Vocabulary Quiz Unit 5', subject: 'English', dueDate: 'Dec 15, 2024', status: 'graded' as const, score: '92', maxScore: '100' },
        { id: '6', title: 'Fractions Worksheet', subject: 'Mathematics', dueDate: 'Dec 12, 2024', status: 'graded' as const, score: '100', maxScore: '100' },
        { id: '7', title: 'Art Portfolio Review', subject: 'Art', dueDate: 'Dec 10, 2024', status: 'completed' as const },
        { id: '8', title: 'Spanish Oral Presentation', subject: 'Spanish', dueDate: 'Dec 8, 2024', status: 'graded' as const, score: '85', maxScore: '100' },
        { id: '9', title: 'Plant Growth Experiment', subject: 'Science', dueDate: 'Dec 5, 2024', status: 'graded' as const, score: '98', maxScore: '100' },
        { id: '10', title: 'Creative Writing Essay', subject: 'English', dueDate: 'Dec 3, 2024', status: 'graded' as const, score: '90', maxScore: '100' },
        { id: '11', title: 'Music Theory Test', subject: 'Music', dueDate: 'Jan 5, 2025', status: 'pending' as const },
        { id: '12', title: 'Physical Fitness Assessment', subject: 'P.E.', dueDate: 'Jan 8, 2025', status: 'pending' as const },
    ];

    const attendanceRecords = [
        { date: '2024-12-02', status: 'present' as const },
        { date: '2024-12-03', status: 'present' as const },
        { date: '2024-12-04', status: 'present' as const },
        { date: '2024-12-05', status: 'late' as const },
        { date: '2024-12-06', status: 'present' as const },
        { date: '2024-12-09', status: 'present' as const },
        { date: '2024-12-10', status: 'absent' as const },
        { date: '2024-12-11', status: 'excused' as const },
        { date: '2024-12-12', status: 'present' as const },
        { date: '2024-12-13', status: 'present' as const },
        { date: '2024-12-16', status: 'present' as const },
        { date: '2024-12-17', status: 'present' as const },
        { date: '2024-12-18', status: 'present' as const },
        { date: '2024-12-19', status: 'present' as const },
        { date: '2024-12-20', status: 'present' as const },
        { date: '2024-12-23', status: 'present' as const },
        { date: '2024-12-25', status: 'holiday' as const },
        { date: '2024-12-26', status: 'holiday' as const },
    ];

    const attendanceStats = {
        present: 85,
        absent: 3,
        late: 5,
        excused: 2,
        percentage: 96,
    };

    const messages = [
        { id: '1', sender: 'Mrs. Thompson', senderRole: 'English Teacher', subject: 'Book Report Feedback', preview: 'I wanted to share some feedback on Emma\'s recent book report...', date: 'Today', unread: true },
        { id: '2', sender: 'Mr. Anderson', senderRole: 'Math Teacher', subject: 'Math Quiz Results', preview: 'Emma did exceptionally well on the recent quiz...', date: 'Yesterday', unread: true },
        { id: '3', sender: 'Dr. Martinez', senderRole: 'Science Teacher', subject: 'Science Fair Project', preview: 'I wanted to discuss Emma\'s science fair project idea...', date: 'Dec 20', unread: false },
        { id: '4', sender: 'Principal Williams', senderRole: 'School Principal', subject: 'Holiday Schedule', preview: 'A reminder about the upcoming holiday break schedule...', date: 'Dec 18', unread: false },
        { id: '5', sender: 'Coach Davis', senderRole: 'P.E. Teacher', subject: 'Sports Day Participation', preview: 'Emma has been selected to participate in...', date: 'Dec 15', unread: false },
    ];

    const announcements = [
        { id: '1', title: 'Winter Break Schedule', content: 'School will be closed from December 23rd to January 3rd for winter break. Classes resume on January 6th.', date: 'Dec 20, 2024', category: 'Important' },
        { id: '2', title: 'Science Fair Registration Open', content: 'Registration for the annual science fair is now open. Deadline to register is January 15th.', date: 'Dec 18, 2024', category: 'Academic' },
        { id: '3', title: 'Parent-Teacher Conference', content: 'Spring parent-teacher conferences will be held on February 10-12. Sign-up sheets will be available soon.', date: 'Dec 15, 2024', category: 'Event' },
        { id: '4', title: 'New Library Hours', content: 'The school library will now be open until 5pm on weekdays for after-school studying.', date: 'Dec 12, 2024', category: 'General' },
        { id: '5', title: 'Art Show Coming Up', content: 'The annual student art show will be held on January 20th. All families are welcome to attend.', date: 'Dec 10, 2024', category: 'Event' },
        { id: '6', title: 'Lunch Menu Update', content: 'New healthy options have been added to the cafeteria menu starting next month.', date: 'Dec 8, 2024', category: 'General' },
        { id: '7', title: 'Basketball Team Tryouts', content: 'Tryouts for the spring basketball team will be held on January 8th after school.', date: 'Dec 5, 2024', category: 'Event' },
        { id: '8', title: 'Report Cards Available', content: 'Q2 report cards are now available for download in the parent portal.', date: 'Dec 3, 2024', category: 'Academic' },
    ];

    const reportCards = [
        { id: '1', term: 'Quarter 2', year: '2024-2025', type: 'Report Card' as const, dateIssued: 'Dec 20, 2024', gpa: '3.85', status: 'available' as const },
        { id: '2', term: 'Quarter 1', year: '2024-2025', type: 'Report Card' as const, dateIssued: 'Oct 15, 2024', gpa: '3.70', status: 'available' as const },
        { id: '3', term: 'Mid-Year', year: '2024-2025', type: 'Progress Report' as const, dateIssued: 'Nov 1, 2024', status: 'available' as const },
        { id: '4', term: 'Quarter 3', year: '2024-2025', type: 'Report Card' as const, dateIssued: 'Mar 2025', status: 'pending' as const },
        { id: '5', term: 'Full Year', year: '2023-2024', type: 'Transcript' as const, dateIssued: 'Jun 15, 2024', gpa: '3.65', status: 'available' as const },
        { id: '6', term: 'Quarter 4', year: '2023-2024', type: 'Report Card' as const, dateIssued: 'Jun 10, 2024', gpa: '3.75', status: 'available' as const },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <Dashboard student={selectedStudent} />;
            case 'grades':
                return <GradesPage selectedStudent={selectedStudent} />;
            case 'assignments':
                return (
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
                            <p className="text-gray-500">Track assignments and submissions for {selectedStudent.name}</p>
                        </div>

                    </div>
                );
            // ✅ PASTE THIS INSTEAD
            case 'fees':
                return <FeesPage selectedStudent={selectedStudent} />;
            case 'messages':
                return (
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                            <p className="text-gray-500">Communicate with teachers and view announcements</p>
                        </div>
                        <MessageCenter messages={messages} />
                    </div>
                );
            case 'reports':
                return (
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Report Cards</h1>
                            <p className="text-gray-500">Download official academic documents for {selectedStudent.name}</p>
                        </div>
                        <ReportCards reports={reportCards} />
                    </div>
                );
            case 'family':
                return <FamilyProfile students={students} />;
            case 'help':
                return <HelpSupport />;
            default:
                return <Dashboard student={selectedStudent} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                isMobileMenuOpen={isMobileMenuOpen}
            />

            <div className="flex">
                <Sidebar
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    isMobileOpen={isMobileMenuOpen}
                    onClose={() => setIsMobileMenuOpen(false)}
                />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 lg:ml-0">
                    <div className="max-w-7xl mx-auto">
                        {/* Student Switcher */}
                        {activeTab !== 'family' && activeTab !== 'help' && (
                            <div className="mb-6">
                                <StudentSwitcher
                                    students={students}
                                    selectedStudent={selectedStudent}
                                    onSelectStudent={(student: Student) => setSelectedStudent(student)}
                                    isOpen={isStudentSwitcherOpen}
                                    onToggle={() => setIsStudentSwitcherOpen(!isStudentSwitcherOpen)}
                                />
                            </div>
                        )}

                        {/* Main Content */}
                        {renderContent()}
                    </div>
                </main>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default UserAppLayout;

// import React, { useState } from 'react';
// import Header from './Header';
// import Sidebar from './Sidebar';
// import StudentSwitcher from './StudentSwitcher';
// // import Dashboard from './Dashboard';
// import GradesPage from './GradesPage';
// import AttendanceCalendar from './AttendanceCalendar';
// import MessageCenter from './MessageCenter';
// import ReportCards from './ReportCards';
// import FamilyProfile from './FamilyProfile';
// import HelpSupport from './HelpSupport';
// import Dashboard from './Dashboard';
// import Footer from '@/components/common/Footer';


// // ✅ Add this interface at the top
// interface Student {
//     id: string;
//     name: string;
//     grade: string;
//     avatar: string;
//     school: string;
//     dateOfBirth: string;
//     studentId: string;
// }

// const UserAppLayout: React.FC = () => {
//     const [activeTab, setActiveTab] = useState('dashboard');
//     const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//     const [isStudentSwitcherOpen, setIsStudentSwitcherOpen] = useState(false);

//     const students = [
//         {
//             id: '1',
//             name: 'Emma Johnson',
//             grade: '5th Grade',
//             avatar: 'https://d64gsuwffb70l.cloudfront.net/694a9d081e5ab3fa33ad06e6_1766497638727_3e1c0f81.png',
//             school: 'Lincoln Elementary School',
//             dateOfBirth: 'Jan 15, 2014',
//             studentId: 'STU-2024-001',
//         },
//         {
//             id: '2',
//             name: 'James Johnson',
//             grade: '3rd Grade',
//             avatar: 'https://d64gsuwffb70l.cloudfront.net/694a9d081e5ab3fa33ad06e6_1766497635039_0ca40a17.jpg',
//             school: 'Lincoln Elementary School',
//             dateOfBirth: 'Mar 22, 2016',
//             studentId: 'STU-2024-002',
//         },
//         {
//             id: '3',
//             name: 'Sophia Johnson',
//             grade: '1st Grade',
//             avatar: 'https://d64gsuwffb70l.cloudfront.net/694a9d081e5ab3fa33ad06e6_1766497640200_66719bf7.png',
//             school: 'Lincoln Elementary School',
//             dateOfBirth: 'Jul 8, 2018',
//             studentId: 'STU-2024-003',
//         },
//     ];


//     const [selectedStudent, setSelectedStudent] = useState<Student>(students[0]);

//     const assignments = [
//         { id: '1', title: 'Chapter 8 Math Quiz', subject: 'Mathematics', dueDate: 'Dec 26, 2024', status: 'pending' as const },
//         { id: '2', title: 'Book Report - Charlotte\'s Web', subject: 'English', dueDate: 'Dec 28, 2024', status: 'pending' as const },
//         { id: '3', title: 'Science Lab Report', subject: 'Science', dueDate: 'Dec 20, 2024', status: 'graded' as const, score: '95', maxScore: '100' },
//         { id: '4', title: 'History Timeline Project', subject: 'Social Studies', dueDate: 'Dec 18, 2024', status: 'graded' as const, score: '88', maxScore: '100' },
//         { id: '5', title: 'Vocabulary Quiz Unit 5', subject: 'English', dueDate: 'Dec 15, 2024', status: 'graded' as const, score: '92', maxScore: '100' },
//         { id: '6', title: 'Fractions Worksheet', subject: 'Mathematics', dueDate: 'Dec 12, 2024', status: 'graded' as const, score: '100', maxScore: '100' },
//         { id: '7', title: 'Art Portfolio Review', subject: 'Art', dueDate: 'Dec 10, 2024', status: 'completed' as const },
//         { id: '8', title: 'Spanish Oral Presentation', subject: 'Spanish', dueDate: 'Dec 8, 2024', status: 'graded' as const, score: '85', maxScore: '100' },
//         { id: '9', title: 'Plant Growth Experiment', subject: 'Science', dueDate: 'Dec 5, 2024', status: 'graded' as const, score: '98', maxScore: '100' },
//         { id: '10', title: 'Creative Writing Essay', subject: 'English', dueDate: 'Dec 3, 2024', status: 'graded' as const, score: '90', maxScore: '100' },
//         { id: '11', title: 'Music Theory Test', subject: 'Music', dueDate: 'Jan 5, 2025', status: 'pending' as const },
//         { id: '12', title: 'Physical Fitness Assessment', subject: 'P.E.', dueDate: 'Jan 8, 2025', status: 'pending' as const },
//     ];

//     const attendanceRecords = [
//         { date: '2024-12-02', status: 'present' as const },
//         { date: '2024-12-03', status: 'present' as const },
//         { date: '2024-12-04', status: 'present' as const },
//         { date: '2024-12-05', status: 'late' as const },
//         { date: '2024-12-06', status: 'present' as const },
//         { date: '2024-12-09', status: 'present' as const },
//         { date: '2024-12-10', status: 'absent' as const },
//         { date: '2024-12-11', status: 'excused' as const },
//         { date: '2024-12-12', status: 'present' as const },
//         { date: '2024-12-13', status: 'present' as const },
//         { date: '2024-12-16', status: 'present' as const },
//         { date: '2024-12-17', status: 'present' as const },
//         { date: '2024-12-18', status: 'present' as const },
//         { date: '2024-12-19', status: 'present' as const },
//         { date: '2024-12-20', status: 'present' as const },
//         { date: '2024-12-23', status: 'present' as const },
//         { date: '2024-12-25', status: 'holiday' as const },
//         { date: '2024-12-26', status: 'holiday' as const },
//     ];

//     const attendanceStats = {
//         present: 85,
//         absent: 3,
//         late: 5,
//         excused: 2,
//         percentage: 96,
//     };

//     const messages = [
//         { id: '1', sender: 'Mrs. Thompson', senderRole: 'English Teacher', subject: 'Book Report Feedback', preview: 'I wanted to share some feedback on Emma\'s recent book report...', date: 'Today', unread: true },
//         { id: '2', sender: 'Mr. Anderson', senderRole: 'Math Teacher', subject: 'Math Quiz Results', preview: 'Emma did exceptionally well on the recent quiz...', date: 'Yesterday', unread: true },
//         { id: '3', sender: 'Dr. Martinez', senderRole: 'Science Teacher', subject: 'Science Fair Project', preview: 'I wanted to discuss Emma\'s science fair project idea...', date: 'Dec 20', unread: false },
//         { id: '4', sender: 'Principal Williams', senderRole: 'School Principal', subject: 'Holiday Schedule', preview: 'A reminder about the upcoming holiday break schedule...', date: 'Dec 18', unread: false },
//         { id: '5', sender: 'Coach Davis', senderRole: 'P.E. Teacher', subject: 'Sports Day Participation', preview: 'Emma has been selected to participate in...', date: 'Dec 15', unread: false },
//     ];

//     const announcements = [
//         { id: '1', title: 'Winter Break Schedule', content: 'School will be closed from December 23rd to January 3rd for winter break. Classes resume on January 6th.', date: 'Dec 20, 2024', category: 'Important' },
//         { id: '2', title: 'Science Fair Registration Open', content: 'Registration for the annual science fair is now open. Deadline to register is January 15th.', date: 'Dec 18, 2024', category: 'Academic' },
//         { id: '3', title: 'Parent-Teacher Conference', content: 'Spring parent-teacher conferences will be held on February 10-12. Sign-up sheets will be available soon.', date: 'Dec 15, 2024', category: 'Event' },
//         { id: '4', title: 'New Library Hours', content: 'The school library will now be open until 5pm on weekdays for after-school studying.', date: 'Dec 12, 2024', category: 'General' },
//         { id: '5', title: 'Art Show Coming Up', content: 'The annual student art show will be held on January 20th. All families are welcome to attend.', date: 'Dec 10, 2024', category: 'Event' },
//         { id: '6', title: 'Lunch Menu Update', content: 'New healthy options have been added to the cafeteria menu starting next month.', date: 'Dec 8, 2024', category: 'General' },
//         { id: '7', title: 'Basketball Team Tryouts', content: 'Tryouts for the spring basketball team will be held on January 8th after school.', date: 'Dec 5, 2024', category: 'Event' },
//         { id: '8', title: 'Report Cards Available', content: 'Q2 report cards are now available for download in the parent portal.', date: 'Dec 3, 2024', category: 'Academic' },
//     ];

//     const reportCards = [
//         { id: '1', term: 'Quarter 2', year: '2024-2025', type: 'Report Card' as const, dateIssued: 'Dec 20, 2024', gpa: '3.85', status: 'available' as const },
//         { id: '2', term: 'Quarter 1', year: '2024-2025', type: 'Report Card' as const, dateIssued: 'Oct 15, 2024', gpa: '3.70', status: 'available' as const },
//         { id: '3', term: 'Mid-Year', year: '2024-2025', type: 'Progress Report' as const, dateIssued: 'Nov 1, 2024', status: 'available' as const },
//         { id: '4', term: 'Quarter 3', year: '2024-2025', type: 'Report Card' as const, dateIssued: 'Mar 2025', status: 'pending' as const },
//         { id: '5', term: 'Full Year', year: '2023-2024', type: 'Transcript' as const, dateIssued: 'Jun 15, 2024', gpa: '3.65', status: 'available' as const },
//         { id: '6', term: 'Quarter 4', year: '2023-2024', type: 'Report Card' as const, dateIssued: 'Jun 10, 2024', gpa: '3.75', status: 'available' as const },
//     ];

//     const renderContent = () => {
//         switch (activeTab) {
//             case 'dashboard':
//                 return <Dashboard student={selectedStudent} />;
//             case 'grades':
//                 return <GradesPage selectedStudent={selectedStudent} />;
//             case 'assignments':
//                 return (
//                     <div className="space-y-6">
//                         <div>
//                             <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
//                             <p className="text-gray-500">Track assignments and submissions for {selectedStudent.name}</p>
//                         </div>

//                     </div>
//                 );
//             case 'attendance':
//                 return (
//                     <div className="space-y-6">
//                         <div>
//                             <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
//                             <p className="text-gray-500">View attendance records for {selectedStudent.name}</p>
//                         </div>
//                         <AttendanceCalendar records={attendanceRecords} stats={attendanceStats} />
//                     </div>
//                 );
//             case 'messages':
//                 return (
//                     <div className="space-y-6">
//                         <div>
//                             <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
//                             <p className="text-gray-500">Communicate with teachers and view announcements</p>
//                         </div>
//                         <MessageCenter messages={messages} announcements={announcements} />
//                     </div>
//                 );
//             case 'reports':
//                 return (
//                     <div className="space-y-6">
//                         <div>
//                             <h1 className="text-2xl font-bold text-gray-900">Report Cards</h1>
//                             <p className="text-gray-500">Download official academic documents for {selectedStudent.name}</p>
//                         </div>
//                         <ReportCards reports={reportCards} />
//                     </div>
//                 );
//             case 'family':
//                 return <FamilyProfile students={students} />;
//             case 'help':
//                 return <HelpSupport />;
//             default:
//                 return <Dashboard student={selectedStudent} />;
//         }
//     };

//     return (
//         <div className="min-h-screen bg-gray-50">
//             <Header
//                 onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//                 isMobileMenuOpen={isMobileMenuOpen}
//             />

//             <div className="flex">
//                 <Sidebar
//                     activeTab={activeTab}
//                     onTabChange={setActiveTab}
//                     isMobileOpen={isMobileMenuOpen}
//                     onClose={() => setIsMobileMenuOpen(false)}
//                 />

//                 <main className="flex-1 p-4 sm:p-6 lg:p-8 lg:ml-0">
//                     <div className="max-w-7xl mx-auto">
//                         {/* Student Switcher */}
//                         {activeTab !== 'family' && activeTab !== 'help' && (
//                             <div className="mb-6">
//                                 <StudentSwitcher
//                                     students={students}
//                                     selectedStudent={selectedStudent}
//                                     onSelectStudent={(student: Student) => setSelectedStudent(student)} // ✅ wrap in function
//                                     isOpen={isStudentSwitcherOpen}
//                                     onToggle={() => setIsStudentSwitcherOpen(!isStudentSwitcherOpen)}
//                                 />
//                             </div>
//                         )}

//                         {/* Main Content */}
//                         {renderContent()}
//                     </div>
//                 </main>
//             </div>

//             {/* Footer */}
//             <Footer />
//         </div>
//     );
// };

// export default UserAppLayout;
