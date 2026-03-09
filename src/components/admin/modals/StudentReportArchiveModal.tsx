import React, { useState } from 'react';
import { X, Download, Mail, MessageSquare, Eye, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import ReportCard from '@/components/app/searchResults/ReportCard';
import QAAssessment from '@/components/app/searchResults/QAAssessment';

interface StudentReportArchiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    archives: any[];
    schoolName?: string;
    onSendEmail: (archiveId: string) => Promise<void>;
    onSendWhatsApp: (archiveId: string) => Promise<void>;
    onSendSMS?: (archiveId: string) => Promise<void>; // Add this for built-in messaging
}

const StudentReportArchiveModal: React.FC<StudentReportArchiveModalProps> = ({
    isOpen,
    onClose,
    archives,
    schoolName = 'School Name',
    onSendEmail,
    onSendWhatsApp,
    onSendSMS // Add this prop
}) => {
    const [selectedArchive, setSelectedArchive] = useState<any>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [selectedReportType, setSelectedReportType] = useState<'qa1' | 'qa2' | 'endOfTerm' | 'overall'>('overall');
    const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);

    if (!isOpen) return null;

    const handleSendEmail = async (archiveId: string) => {
        setSendingId(archiveId);
        try {
            await onSendEmail(archiveId);
        } finally {
            setSendingId(null);
        }
    };

    const handleSendWhatsApp = async (archiveId: string) => {
        setSendingId(archiveId);
        try {
            await onSendWhatsApp(archiveId);
        } finally {
            setSendingId(null);
        }
    };

    const handleSendSMS = async (archiveId: string) => {
        setSendingId(archiveId);
        try {
            if (onSendSMS) {
                await onSendSMS(archiveId);
            } else {
                // Fallback for built-in messaging
                const archive = archives.find(a => a.id === archiveId);
                if (archive?.whatsappNumber) {
                    window.location.href = `sms:${archive.whatsappNumber}`;
                }
            }
        } finally {
            setSendingId(null);
        }
    };

    // Group archives by student
    const studentArchives = archives.filter(a => a.studentId === selectedArchive?.studentId);
    const availableTypes = studentArchives.map(a => a.assessmentType);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800">📄 Student Report Archives</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {!showDetail ? (
                        // GRID VIEW - Show all archives
                        archives.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-slate-500">No student report archives found</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {archives.map((archive) => {
                                    const studentData = archive.reportCardData;
                                    return (
                                        <div key={archive.id} className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                                            <div className="mb-3">
                                                <h3 className="font-semibold text-slate-800">{studentData?.name || archive.studentName}</h3>
                                                <p className="text-xs text-slate-500">{studentData?.examNumber || archive.examNumber}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                                                <div className="bg-slate-50 p-2 rounded">
                                                    <p className="text-xs text-slate-500">Term</p>
                                                    <p className="font-semibold">{studentData?.term || archive.term}</p>
                                                </div>
                                                <div className="bg-slate-50 p-2 rounded">
                                                    <p className="text-xs text-slate-500">Type</p>
                                                    <p className="font-semibold uppercase">
                                                        {archive.assessmentType === 'qa1' ? 'QA1' :
                                                            archive.assessmentType === 'qa2' ? 'QA2' :
                                                                archive.assessmentType === 'endOfTerm' ? 'End Term' : 'Overall'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Single View Button - Removed the duplicate */}
                                            <button
                                                onClick={() => {
                                                    setSelectedArchive(archive);
                                                    setSelectedReportType(archive.assessmentType === 'overall' ? 'overall' :
                                                        archive.assessmentType as 'qa1' | 'qa2' | 'endOfTerm');
                                                    setShowDetail(true);
                                                }}
                                                className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1 mb-2"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Report
                                            </button>

                                            {/* Sharing Buttons Section */}
                                            <div className="border-t border-slate-100 pt-3 mt-1">
                                                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                                                    <Share2 className="w-3 h-3" /> Share
                                                </p>
                                                <div className="flex gap-2">
                                                    {archive.parentEmail && (
                                                        <button
                                                            onClick={() => handleSendEmail(archive.id)}
                                                            disabled={sendingId === archive.id}
                                                            className="flex-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                                                            title="Send via Email"
                                                        >
                                                            <Mail className="w-3 h-3" />
                                                            Email
                                                        </button>
                                                    )}

                                                    {archive.whatsappNumber && (
                                                        <button
                                                            onClick={() => handleSendWhatsApp(archive.id)}
                                                            disabled={sendingId === archive.id}
                                                            className="flex-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                                                            title="Send via WhatsApp"
                                                        >
                                                            <MessageSquare className="w-3 h-3" />
                                                            WhatsApp
                                                        </button>
                                                    )}

                                                    {/* Built-in Messaging Button */}
                                                    {archive.whatsappNumber && (
                                                        <button
                                                            onClick={() => handleSendSMS(archive.id)}
                                                            disabled={sendingId === archive.id}
                                                            className="flex-1 px-2 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                                                            title="Send via SMS"
                                                        >
                                                            <MessageSquare className="w-3 h-3" />
                                                            SMS
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        // DETAIL VIEW - Show full report using your components
                        <div>
                            <button
                                onClick={() => setShowDetail(false)}
                                className="mb-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                            >
                                ← Back to Archives
                            </button>

                            {selectedArchive && (
                                <div>
                                    {/* Report Type Selector - if multiple archives for same student */}
                                    {studentArchives.length > 1 && (
                                        <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <label className="text-sm font-medium text-slate-700">View Report:</label>
                                                <select
                                                    value={selectedReportType}
                                                    onChange={(e) => setSelectedReportType(e.target.value as any)}
                                                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                                                >
                                                    {availableTypes.includes('qa1') && (
                                                        <option value="qa1">Quarterly Assessment 1 (QA1)</option>
                                                    )}
                                                    {availableTypes.includes('qa2') && (
                                                        <option value="qa2">Quarterly Assessment 2 (QA2)</option>
                                                    )}
                                                    {availableTypes.includes('endOfTerm') && (
                                                        <option value="endOfTerm">End of Term</option>
                                                    )}
                                                    <option value="overall">Complete Report Card (Overall)</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {/* Render the appropriate component */}
                                    {selectedReportType === 'overall' ? (
                                        <ReportCard
                                            studentData={selectedArchive.reportCardData}
                                            showActions={true} // Shows download button
                                        />
                                    ) : (
                                        <QAAssessment
                                            studentData={selectedArchive.reportCardData}
                                            activeTab={selectedReportType}
                                        />
                                    )}

                                    {/* Email/WhatsApp/SMS buttons in detail view */}
                                    <div className="mt-6 flex gap-2 justify-end border-t pt-4">
                                        {selectedArchive.parentEmail && (
                                            <button
                                                onClick={() => handleSendEmail(selectedArchive.id)}
                                                disabled={sendingId === selectedArchive.id}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg flex items-center gap-2"
                                            >
                                                <Mail className="w-4 h-4" />
                                                {sendingId === selectedArchive.id ? 'Sending...' : 'Send Email'}
                                            </button>
                                        )}
                                        {selectedArchive.whatsappNumber && (
                                            <button
                                                onClick={() => handleSendWhatsApp(selectedArchive.id)}
                                                disabled={sendingId === selectedArchive.id}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white rounded-lg flex items-center gap-2"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                                {sendingId === selectedArchive.id ? 'Sending...' : 'Send WhatsApp'}
                                            </button>
                                        )}
                                        {selectedArchive.whatsappNumber && (
                                            <button
                                                onClick={() => handleSendSMS(selectedArchive.id)}
                                                disabled={sendingId === selectedArchive.id}
                                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white rounded-lg flex items-center gap-2"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                                {sendingId === selectedArchive.id ? 'Sending...' : 'Send SMS'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-200 p-4 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentReportArchiveModal;


// import React, { useState } from 'react';
// import { X, Download, Mail, MessageSquare, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
// import ReportCard from '@/components/app/searchResults/ReportCard';
// import QAAssessment from '@/components/app/searchResults/QAAssessment';

// interface StudentReportArchiveModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     archives: any[];
//     schoolName?: string;
//     onSendEmail: (archiveId: string) => Promise<void>;
//     onSendWhatsApp: (archiveId: string) => Promise<void>;
// }

// const StudentReportArchiveModal: React.FC<StudentReportArchiveModalProps> = ({
//     isOpen,
//     onClose,
//     archives,
//     schoolName = 'School Name',
//     onSendEmail,
//     onSendWhatsApp
// }) => {
//     const [selectedArchive, setSelectedArchive] = useState<any>(null);
//     const [showDetail, setShowDetail] = useState(false);
//     const [sendingId, setSendingId] = useState<string | null>(null);
//     const [selectedReportType, setSelectedReportType] = useState<'qa1' | 'qa2' | 'endOfTerm' | 'overall'>('overall');
//     const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);

//     if (!isOpen) return null;

//     const handleSendEmail = async (archiveId: string) => {
//         setSendingId(archiveId);
//         try {
//             await onSendEmail(archiveId);
//         } finally {
//             setSendingId(null);
//         }
//     };

//     const handleSendWhatsApp = async (archiveId: string) => {
//         setSendingId(archiveId);
//         try {
//             await onSendWhatsApp(archiveId);
//         } finally {
//             setSendingId(null);
//         }
//     };

//     // Group archives by student
//     const studentArchives = archives.filter(a => a.studentId === selectedArchive?.studentId);
//     const availableTypes = studentArchives.map(a => a.assessmentType);

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
//                 <div className="flex items-center justify-between p-6 border-b border-slate-200">
//                     <h2 className="text-xl font-semibold text-slate-800">📄 Student Report Archives</h2>
//                     <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
//                         <X className="w-5 h-5 text-slate-500" />
//                     </button>
//                 </div>

//                 <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
//                     {!showDetail ? (
//                         // GRID VIEW - Show all archives
//                         archives.length === 0 ? (
//                             <div className="text-center py-12">
//                                 <p className="text-slate-500">No student report archives found</p>
//                             </div>
//                         ) : (
//                             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//                                 {archives.map((archive) => {
//                                     const studentData = archive.reportCardData;
//                                     return (
//                                         <div key={archive.id} className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
//                                             <div className="mb-3">
//                                                 <h3 className="font-semibold text-slate-800">{studentData?.name || archive.studentName}</h3>
//                                                 <p className="text-xs text-slate-500">{studentData?.examNumber || archive.examNumber}</p>
//                                             </div>

//                                             <div className="grid grid-cols-2 gap-2 text-sm mb-4">
//                                                 <div className="bg-slate-50 p-2 rounded">
//                                                     <p className="text-xs text-slate-500">Term</p>
//                                                     <p className="font-semibold">{studentData?.term || archive.term}</p>
//                                                 </div>
//                                                 <div className="bg-slate-50 p-2 rounded">
//                                                     <p className="text-xs text-slate-500">Type</p>
//                                                     <p className="font-semibold uppercase">
//                                                         {archive.assessmentType === 'qa1' ? 'QA1' :
//                                                             archive.assessmentType === 'qa2' ? 'QA2' :
//                                                                 archive.assessmentType === 'endOfTerm' ? 'End Term' : 'Overall'}
//                                                     </p>
//                                                 </div>
//                                             </div>

//                                             <div className="flex gap-2">
//                                                 <button
//                                                     onClick={() => {
//                                                         setSelectedArchive(archive);
//                                                         setSelectedReportType(archive.assessmentType === 'overall' ? 'overall' :
//                                                             archive.assessmentType as 'qa1' | 'qa2' | 'endOfTerm');
//                                                         setShowDetail(true);
//                                                     }}
//                                                     className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
//                                                 >
//                                                     <Eye className="w-4 h-4" />
//                                                     View
//                                                 </button>
//                                                 <button
//                                                     onClick={() => {
//                                                         // PDF download will be handled by the component itself in detail view
//                                                         setSelectedArchive(archive);
//                                                         setSelectedReportType(archive.assessmentType === 'overall' ? 'overall' :
//                                                             archive.assessmentType as 'qa1' | 'qa2' | 'endOfTerm');
//                                                         setShowDetail(true);
//                                                     }}
//                                                     className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
//                                                 >
//                                                     <Download className="w-4 h-4" />
//                                                     View
//                                                 </button>
//                                             </div>

//                                             {/* Email/WhatsApp buttons remain same */}
//                                             {archive.parentEmail && (
//                                                 <button
//                                                     onClick={() => handleSendEmail(archive.id)}
//                                                     disabled={sendingId === archive.id}
//                                                     className="mt-2 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
//                                                 >
//                                                     <Mail className="w-4 h-4" />
//                                                     {sendingId === archive.id ? 'Sending...' : 'Send Email'}
//                                                 </button>
//                                             )}

//                                             {archive.whatsappNumber && (
//                                                 <button
//                                                     onClick={() => handleSendWhatsApp(archive.id)}
//                                                     disabled={sendingId === archive.id}
//                                                     className="mt-2 w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
//                                                 >
//                                                     <MessageSquare className="w-4 h-4" />
//                                                     {sendingId === archive.id ? 'Sending...' : 'Send WhatsApp'}
//                                                 </button>
//                                             )}
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         )
//                     ) : (
//                         // DETAIL VIEW - Show full report using your components
//                         <div>
//                             <button
//                                 onClick={() => setShowDetail(false)}
//                                 className="mb-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
//                             >
//                                 ← Back to Archives
//                             </button>

//                             {selectedArchive && (
//                                 <div>
//                                     {/* Report Type Selector - if multiple archives for same student */}
//                                     {studentArchives.length > 1 && (
//                                         <div className="mb-4 p-4 bg-slate-50 rounded-lg">
//                                             <div className="flex items-center gap-4">
//                                                 <label className="text-sm font-medium text-slate-700">View Report:</label>
//                                                 <select
//                                                     value={selectedReportType}
//                                                     onChange={(e) => setSelectedReportType(e.target.value as any)}
//                                                     className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
//                                                 >
//                                                     {availableTypes.includes('qa1') && (
//                                                         <option value="qa1">Quarterly Assessment 1 (QA1)</option>
//                                                     )}
//                                                     {availableTypes.includes('qa2') && (
//                                                         <option value="qa2">Quarterly Assessment 2 (QA2)</option>
//                                                     )}
//                                                     {availableTypes.includes('endOfTerm') && (
//                                                         <option value="endOfTerm">End of Term</option>
//                                                     )}
//                                                     <option value="overall">Complete Report Card (Overall)</option>
//                                                 </select>
//                                             </div>
//                                         </div>
//                                     )}

//                                     {/* Render the appropriate component */}
//                                     {selectedReportType === 'overall' ? (
//                                         <ReportCard
//                                             studentData={selectedArchive.reportCardData}
//                                             showActions={true} // Shows download button
//                                         />
//                                     ) : (
//                                         <QAAssessment
//                                             studentData={selectedArchive.reportCardData}
//                                             activeTab={selectedReportType}
//                                         />
//                                     )}

//                                     {/* Email/WhatsApp buttons in detail view */}
//                                     <div className="mt-6 flex gap-2 justify-end border-t pt-4">
//                                         {selectedArchive.parentEmail && (
//                                             <button
//                                                 onClick={() => handleSendEmail(selectedArchive.id)}
//                                                 disabled={sendingId === selectedArchive.id}
//                                                 className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg flex items-center gap-2"
//                                             >
//                                                 <Mail className="w-4 h-4" />
//                                                 {sendingId === selectedArchive.id ? 'Sending...' : 'Send Email'}
//                                             </button>
//                                         )}
//                                         {selectedArchive.whatsappNumber && (
//                                             <button
//                                                 onClick={() => handleSendWhatsApp(selectedArchive.id)}
//                                                 disabled={sendingId === selectedArchive.id}
//                                                 className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white rounded-lg flex items-center gap-2"
//                                             >
//                                                 <MessageSquare className="w-4 h-4" />
//                                                 {sendingId === selectedArchive.id ? 'Sending...' : 'Send WhatsApp'}
//                                             </button>
//                                         )}
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     )}
//                 </div>

//                 <div className="border-t border-slate-200 p-4 bg-slate-50">
//                     <button
//                         onClick={onClose}
//                         className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
//                     >
//                         Close
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default StudentReportArchiveModal;

// import React, { useState } from 'react';
// import { X, Download, Mail, MessageSquare, Eye } from 'lucide-react';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';

// interface StudentReportArchiveModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     archives: any[];
//     schoolName?: string;
//     onSendEmail: (archiveId: string) => Promise<void>;
//     onSendWhatsApp: (archiveId: string) => Promise<void>;
// }

// const StudentReportArchiveModal: React.FC<StudentReportArchiveModalProps> = ({
//     isOpen,
//     onClose,
//     archives,
//     schoolName = 'School Name',
//     onSendEmail,
//     onSendWhatsApp
// }) => {
//     const [selectedArchive, setSelectedArchive] = useState<any>(null);
//     const [showDetail, setShowDetail] = useState(false);
//     const [sendingId, setSendingId] = useState<string | null>(null);

//     if (!isOpen) return null;

//     const handleDownloadPDF = (archive: any) => {
//         try {
//             const studentData = archive.reportCardData; // This is the full StudentData object
//             const doc = new jsPDF();

//             doc.setFontSize(16);
//             doc.text(`${schoolName} - Student Report`, 14, 15);
//             doc.setFontSize(12);
//             doc.text(`${studentData.name} (${studentData.examNumber})`, 14, 25);
//             doc.text(`${studentData.term} - ${archive.assessmentType.toUpperCase()}`, 14, 32);
//             doc.text(`Archived: ${new Date(archive.archivedAt).toLocaleDateString()}`, 14, 39);

//             // Student Info
//             doc.setFontSize(10);
//             doc.text('STUDENT INFORMATION', 14, 50);
//             doc.text(`Name: ${studentData.name}`, 14, 57);
//             doc.text(`Exam No: ${studentData.examNumber}`, 14, 64);
//             doc.text(`Class: ${studentData.class}`, 14, 71);
//             doc.text(`Class Rank: ${studentData.classRank}/${studentData.totalStudents}`, 14, 78);

//             // Attendance
//             doc.text('ATTENDANCE', 14, 92);
//             doc.text(`Present: ${studentData.attendance.present} days`, 14, 99);
//             doc.text(`Absent: ${studentData.attendance.absent} days`, 14, 106);
//             doc.text(`Late: ${studentData.attendance.late} days`, 14, 113);

//             // Subjects Table
//             const tableData = studentData.subjects.map((s: any) => [
//                 s.name,
//                 s[archive.assessmentType]?.toString() || '-',
//                 s.grade || '-',
//                 s[`${archive.assessmentType}_absent`] ? 'Absent' : 'Present'
//             ]);

//             autoTable(doc, {
//                 head: [['Subject', 'Score', 'Grade', 'Status']],
//                 body: tableData,
//                 startY: 125,
//                 styles: { fontSize: 8 },
//                 headStyles: { fillColor: [63, 81, 181] }
//             });

//             // Teacher's Remark
//             const finalY = (doc as any).lastAutoTable.finalY + 10;
//             doc.text("TEACHER'S REMARK", 14, finalY);
//             doc.setFontSize(9);
//             doc.text(`"${studentData.teacherRemarks || 'No remarks'}"`, 14, finalY + 7);

//             doc.save(`${studentData.name}_${archive.assessmentType}_Report.pdf`);
//         } catch (error) {
//             console.error('Error generating PDF:', error);
//         }
//     };

//     const handleSendEmail = async (archiveId: string) => {
//         setSendingId(archiveId);
//         try {
//             await onSendEmail(archiveId);
//         } finally {
//             setSendingId(null);
//         }
//     };

//     const handleSendWhatsApp = async (archiveId: string) => {
//         setSendingId(archiveId);
//         try {
//             await onSendWhatsApp(archiveId);
//         } finally {
//             setSendingId(null);
//         }
//     };

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
//                 <div className="flex items-center justify-between p-6 border-b border-slate-200">
//                     <h2 className="text-xl font-semibold text-slate-800">📄 Student Report Archives</h2>
//                     <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
//                         <X className="w-5 h-5 text-slate-500" />
//                     </button>
//                 </div>

//                 <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
//                     {!showDetail ? (
//                         archives.length === 0 ? (
//                             <div className="text-center py-12">
//                                 <p className="text-slate-500">No student report archives found</p>
//                             </div>
//                         ) : (
//                             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//                                 {archives.map((archive) => {
//                                     const studentData = archive.reportCardData;
//                                     return (
//                                         <div key={archive.id} className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
//                                             <div className="mb-3">
//                                                 <h3 className="font-semibold text-slate-800">{studentData?.name || archive.studentName}</h3>
//                                                 <p className="text-xs text-slate-500">{studentData?.examNumber || archive.examNumber}</p>
//                                             </div>

//                                             <div className="grid grid-cols-2 gap-2 text-sm mb-4">
//                                                 <div className="bg-slate-50 p-2 rounded">
//                                                     <p className="text-xs text-slate-500">Term</p>
//                                                     <p className="font-semibold">{studentData?.term || archive.term}</p>
//                                                 </div>
//                                                 <div className="bg-slate-50 p-2 rounded">
//                                                     <p className="text-xs text-slate-500">Type</p>
//                                                     <p className="font-semibold uppercase">{archive.assessmentType}</p>
//                                                 </div>
//                                             </div>

//                                             <div className="grid grid-cols-2 gap-2 text-sm mb-4">
//                                                 <div className="bg-slate-50 p-2 rounded">
//                                                     <p className="text-xs text-slate-500">Rank</p>
//                                                     <p className="font-semibold">{studentData?.classRank}/{studentData?.totalStudents}</p>
//                                                 </div>
//                                                 <div className="bg-slate-50 p-2 rounded">
//                                                     <p className="text-xs text-slate-500">Average</p>
//                                                     <p className="font-semibold">{studentData?.assessmentStats?.overall?.termAverage || 'N/A'}%</p>
//                                                 </div>
//                                             </div>

//                                             <div className="flex gap-2">
//                                                 <button
//                                                     onClick={() => {
//                                                         setSelectedArchive(archive);
//                                                         setShowDetail(true);
//                                                     }}
//                                                     className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
//                                                 >
//                                                     <Eye className="w-4 h-4" />
//                                                     View
//                                                 </button>
//                                                 <button
//                                                     onClick={() => handleDownloadPDF(archive)}
//                                                     className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
//                                                 >
//                                                     <Download className="w-4 h-4" />
//                                                     PDF
//                                                 </button>
//                                             </div>

//                                             {archive.parentEmail && (
//                                                 <button
//                                                     onClick={() => handleSendEmail(archive.id)}
//                                                     disabled={sendingId === archive.id}
//                                                     className="mt-2 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
//                                                 >
//                                                     <Mail className="w-4 h-4" />
//                                                     {sendingId === archive.id ? 'Sending...' : 'Send Email'}
//                                                 </button>
//                                             )}

//                                             {archive.whatsappNumber && (
//                                                 <button
//                                                     onClick={() => handleSendWhatsApp(archive.id)}
//                                                     disabled={sendingId === archive.id}
//                                                     className="mt-2 w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
//                                                 >
//                                                     <MessageSquare className="w-4 h-4" />
//                                                     {sendingId === archive.id ? 'Sending...' : 'Send WhatsApp'}
//                                                 </button>
//                                             )}
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         )
//                     ) : (
//                         <div>
//                             <button
//                                 onClick={() => setShowDetail(false)}
//                                 className="mb-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
//                             >
//                                 ← Back to Archives
//                             </button>

//                             {selectedArchive && (
//                                 <div>
//                                     <div className="flex justify-between items-center mb-4">
//                                         <h3 className="text-lg font-semibold">
//                                             {selectedArchive.reportCardData.name} - {selectedArchive.assessmentType}
//                                         </h3>
//                                         <div className="flex gap-2">
//                                             <button
//                                                 onClick={() => handleDownloadPDF(selectedArchive)}
//                                                 className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1"
//                                             >
//                                                 <Download className="w-4 h-4" />
//                                                 Download PDF
//                                             </button>
//                                         </div>
//                                     </div>

//                                     <div className="bg-slate-50 p-4 rounded-lg mb-4">
//                                         <div className="grid grid-cols-2 gap-4">
//                                             <div>
//                                                 <p className="text-sm text-slate-600">Student</p>
//                                                 <p className="font-semibold">{selectedArchive.reportCardData.name}</p>
//                                             </div>
//                                             <div>
//                                                 <p className="text-sm text-slate-600">Exam No.</p>
//                                                 <p className="font-semibold">{selectedArchive.reportCardData.examNumber}</p>
//                                             </div>
//                                             <div>
//                                                 <p className="text-sm text-slate-600">Class</p>
//                                                 <p className="font-semibold">{selectedArchive.reportCardData.class}</p>
//                                             </div>
//                                             <div>
//                                                 <p className="text-sm text-slate-600">Class Rank</p>
//                                                 <p className="font-semibold">{selectedArchive.reportCardData.classRank}/{selectedArchive.reportCardData.totalStudents}</p>
//                                             </div>
//                                             <div>
//                                                 <p className="text-sm text-slate-600">Average</p>
//                                                 <p className="font-semibold">{selectedArchive.reportCardData.assessmentStats?.overall?.termAverage || 'N/A'}%</p>
//                                             </div>
//                                             <div>
//                                                 <p className="text-sm text-slate-600">Overall Grade</p>
//                                                 <p className="font-semibold">{selectedArchive.reportCardData.assessmentStats?.overall?.overallGrade || 'N/A'}</p>
//                                             </div>
//                                         </div>
//                                     </div>

//                                     <table className="w-full border-collapse">
//                                         <thead className="bg-slate-50">
//                                             <tr>
//                                                 <th className="px-4 py-2 text-left">Subject</th>
//                                                 <th className="px-4 py-2 text-left">Score</th>
//                                                 <th className="px-4 py-2 text-left">Grade</th>
//                                                 <th className="px-4 py-2 text-left">Status</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {selectedArchive.reportCardData.subjects.map((subject: any, idx: number) => (
//                                                 <tr key={idx} className="border-b">
//                                                     <td className="px-4 py-2">{subject.name}</td>
//                                                     <td className="px-4 py-2">
//                                                         {subject[selectedArchive.assessmentType] ?? '-'}
//                                                         {subject[`${selectedArchive.assessmentType}_absent`] && ' (AB)'}
//                                                     </td>
//                                                     <td className="px-4 py-2">{subject.grade || '-'}</td>
//                                                     <td className="px-4 py-2">
//                                                         {subject[`${selectedArchive.assessmentType}_absent`] ? (
//                                                             <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Absent</span>
//                                                         ) : subject[selectedArchive.assessmentType] !== null ? (
//                                                             <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Present</span>
//                                                         ) : (
//                                                             <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">No Score</span>
//                                                         )}
//                                                     </td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>

//                                     <div className="mt-4 p-4 bg-slate-50 rounded-lg">
//                                         <p className="text-sm font-medium text-slate-700">Teacher's Remark</p>
//                                         <p className="text-slate-600 italic">"{selectedArchive.reportCardData.teacherRemarks || 'No remarks'}"</p>
//                                     </div>

//                                     <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
//                                         <p className="text-sm font-medium text-indigo-700">Grade Configuration</p>
//                                         <p className="text-xs text-indigo-600">
//                                             Method: {selectedArchive.reportCardData.gradeConfiguration?.calculation_method} |
//                                             Pass Mark: {selectedArchive.reportCardData.gradeConfiguration?.pass_mark}%
//                                         </p>
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     )}
//                 </div>

//                 <div className="border-t border-slate-200 p-4 bg-slate-50">
//                     <button
//                         onClick={onClose}
//                         className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
//                     >
//                         Close
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default StudentReportArchiveModal;
// import React, { useState } from 'react';
// import { X, Download, Mail, MessageSquare, Eye } from 'lucide-react';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';

// interface StudentReportArchiveModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     archives: any[];
//     schoolName?: string;
//     onSendEmail: (archiveId: string) => Promise<void>;
//     onSendWhatsApp: (archiveId: string) => Promise<void>;
// }

// const StudentReportArchiveModal: React.FC<StudentReportArchiveModalProps> = ({
//     isOpen,
//     onClose,
//     archives,
//     schoolName = 'School Name',
//     onSendEmail,
//     onSendWhatsApp
// }) => {
//     const [selectedArchive, setSelectedArchive] = useState<any>(null);
//     const [showDetail, setShowDetail] = useState(false);
//     const [sendingId, setSendingId] = useState<string | null>(null);

//     if (!isOpen) return null;

//     const handleDownloadPDF = (archive: any) => {
//         try {
//             const doc = new jsPDF();

//             doc.setFontSize(16);
//             doc.text(`${schoolName} - Student Report`, 14, 15);
//             doc.setFontSize(12);
//             doc.text(`${archive.studentName} (${archive.examNumber})`, 14, 25);
//             doc.text(`${archive.term} - ${archive.assessmentType.toUpperCase()}`, 14, 32);
//             doc.text(`Archived: ${new Date(archive.archivedAt).toLocaleDateString()}`, 14, 39);

//             // Student Info
//             doc.setFontSize(10);
//             doc.text('STUDENT INFORMATION', 14, 50);
//             doc.text(`Name: ${archive.studentName}`, 14, 57);
//             doc.text(`Exam No: ${archive.examNumber}`, 14, 64);
//             doc.text(`Class Rank: ${archive.reportCardData.classRank}/${archive.reportCardData.totalStudents}`, 14, 71);

//             // Attendance
//             doc.text('ATTENDANCE', 14, 85);
//             doc.text(`Present: ${archive.reportCardData.attendance.present} days`, 14, 92);
//             doc.text(`Absent: ${archive.reportCardData.attendance.absent} days`, 14, 99);
//             doc.text(`Late: ${archive.reportCardData.attendance.late} days`, 14, 106);

//             // Subjects Table
//             const tableData = archive.reportCardData.subjects.map((s: any) => [
//                 s.subjectName,
//                 s.score?.toString() || '-',
//                 s.grade || '-',
//                 s.isAbsent ? 'Absent' : 'Present'
//             ]);

//             autoTable(doc, {
//                 head: [['Subject', 'Score', 'Grade', 'Status']],
//                 body: tableData,
//                 startY: 115,
//                 styles: { fontSize: 8 },
//                 headStyles: { fillColor: [63, 81, 181] }
//             });

//             // Teacher's Remark
//             const finalY = (doc as any).lastAutoTable.finalY + 10;
//             doc.text("TEACHER'S REMARK", 14, finalY);
//             doc.setFontSize(9);
//             doc.text(`"${archive.reportCardData.teacherRemarks || 'No remarks'}"`, 14, finalY + 7);

//             doc.save(`${archive.studentName}_${archive.assessmentType}_Report.pdf`);
//         } catch (error) {
//             console.error('Error generating PDF:', error);
//         }
//     };

//     const handleSendEmail = async (archiveId: string) => {
//         setSendingId(archiveId);
//         try {
//             await onSendEmail(archiveId);
//         } finally {
//             setSendingId(null);
//         }
//     };

//     const handleSendWhatsApp = async (archiveId: string) => {
//         setSendingId(archiveId);
//         try {
//             await onSendWhatsApp(archiveId);
//         } finally {
//             setSendingId(null);
//         }
//     };

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
//                 <div className="flex items-center justify-between p-6 border-b border-slate-200">
//                     <h2 className="text-xl font-semibold text-slate-800">📄 Student Report Archives</h2>
//                     <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
//                         <X className="w-5 h-5 text-slate-500" />
//                     </button>
//                 </div>

//                 <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
//                     {!showDetail ? (
//                         archives.length === 0 ? (
//                             <div className="text-center py-12">
//                                 <p className="text-slate-500">No student report archives found</p>
//                             </div>
//                         ) : (
//                             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//                                 {archives.map((archive) => (
//                                     <div key={archive.id} className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
//                                         <div className="mb-3">
//                                             <h3 className="font-semibold text-slate-800">{archive.studentName}</h3>
//                                             <p className="text-xs text-slate-500">{archive.examNumber}</p>
//                                         </div>

//                                         <div className="grid grid-cols-2 gap-2 text-sm mb-4">
//                                             <div className="bg-slate-50 p-2 rounded">
//                                                 <p className="text-xs text-slate-500">Term</p>
//                                                 <p className="font-semibold">{archive.term}</p>
//                                             </div>
//                                             <div className="bg-slate-50 p-2 rounded">
//                                                 <p className="text-xs text-slate-500">Type</p>
//                                                 <p className="font-semibold uppercase">{archive.assessmentType}</p>
//                                             </div>
//                                         </div>

//                                         <div className="flex gap-2">
//                                             <button
//                                                 onClick={() => {
//                                                     setSelectedArchive(archive);
//                                                     setShowDetail(true);
//                                                 }}
//                                                 className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
//                                             >
//                                                 <Eye className="w-4 h-4" />
//                                                 View
//                                             </button>
//                                             <button
//                                                 onClick={() => handleDownloadPDF(archive)}
//                                                 className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
//                                             >
//                                                 <Download className="w-4 h-4" />
//                                                 PDF
//                                             </button>
//                                         </div>

//                                         {archive.parentEmail && (
//                                             <button
//                                                 onClick={() => handleSendEmail(archive.id)}
//                                                 disabled={sendingId === archive.id}
//                                                 className="mt-2 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
//                                             >
//                                                 <Mail className="w-4 h-4" />
//                                                 {sendingId === archive.id ? 'Sending...' : 'Send Email'}
//                                             </button>
//                                         )}

//                                         {archive.whatsappNumber && (
//                                             <button
//                                                 onClick={() => handleSendWhatsApp(archive.id)}
//                                                 disabled={sendingId === archive.id}
//                                                 className="mt-2 w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
//                                             >
//                                                 <MessageSquare className="w-4 h-4" />
//                                                 {sendingId === archive.id ? 'Sending...' : 'Send WhatsApp'}
//                                             </button>
//                                         )}
//                                     </div>
//                                 ))}
//                             </div>
//                         )
//                     ) : (
//                         <div>
//                             <button
//                                 onClick={() => setShowDetail(false)}
//                                 className="mb-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
//                             >
//                                 ← Back to Archives
//                             </button>

//                             {selectedArchive && (
//                                 <div>
//                                     <div className="flex justify-between items-center mb-4">
//                                         <h3 className="text-lg font-semibold">
//                                             {selectedArchive.studentName} - {selectedArchive.assessmentType}
//                                         </h3>
//                                         <div className="flex gap-2">
//                                             <button
//                                                 onClick={() => handleDownloadPDF(selectedArchive)}
//                                                 className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1"
//                                             >
//                                                 <Download className="w-4 h-4" />
//                                                 Download PDF
//                                             </button>
//                                         </div>
//                                     </div>

//                                     <div className="bg-slate-50 p-4 rounded-lg mb-4">
//                                         <div className="grid grid-cols-2 gap-4">
//                                             <div>
//                                                 <p className="text-sm text-slate-600">Student</p>
//                                                 <p className="font-semibold">{selectedArchive.studentName}</p>
//                                             </div>
//                                             <div>
//                                                 <p className="text-sm text-slate-600">Exam No.</p>
//                                                 <p className="font-semibold">{selectedArchive.examNumber}</p>
//                                             </div>
//                                             <div>
//                                                 <p className="text-sm text-slate-600">Class Rank</p>
//                                                 <p className="font-semibold">{selectedArchive.reportCardData.classRank}/{selectedArchive.reportCardData.totalStudents}</p>
//                                             </div>
//                                             <div>
//                                                 <p className="text-sm text-slate-600">Overall Grade</p>
//                                                 <p className="font-semibold">{selectedArchive.reportCardData.overallGrade}</p>
//                                             </div>
//                                         </div>
//                                     </div>

//                                     <table className="w-full border-collapse">
//                                         <thead className="bg-slate-50">
//                                             <tr>
//                                                 <th className="px-4 py-2 text-left">Subject</th>
//                                                 <th className="px-4 py-2 text-left">Score</th>
//                                                 <th className="px-4 py-2 text-left">Grade</th>
//                                                 <th className="px-4 py-2 text-left">Status</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {selectedArchive.reportCardData.subjects.map((subject: any, idx: number) => (
//                                                 <tr key={idx} className="border-b">
//                                                     <td className="px-4 py-2">{subject.subjectName}</td>
//                                                     <td className="px-4 py-2">{subject.score ?? '-'}</td>
//                                                     <td className="px-4 py-2">{subject.grade || '-'}</td>
//                                                     <td className="px-4 py-2">
//                                                         {subject.isAbsent ? (
//                                                             <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Absent</span>
//                                                         ) : (
//                                                             <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Present</span>
//                                                         )}
//                                                     </td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>

//                                     <div className="mt-4 p-4 bg-slate-50 rounded-lg">
//                                         <p className="text-sm font-medium text-slate-700">Teacher's Remark</p>
//                                         <p className="text-slate-600 italic">"{selectedArchive.reportCardData.teacherRemarks || 'No remarks'}"</p>
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     )}
//                 </div>

//                 <div className="border-t border-slate-200 p-4 bg-slate-50">
//                     <button
//                         onClick={onClose}
//                         className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
//                     >
//                         Close
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default StudentReportArchiveModal;