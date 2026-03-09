import React, { useState } from 'react';
import { X } from 'lucide-react';
import { StudentData } from '@/services/studentService';
import QAAssessment from '@/components/app/searchResults/QAAssessment';
import ReportCard from '@/components/app/searchResults/ReportCard';
// import QAAssessment from '@/components/QAAssessment';
// import ReportCard from '@/components/ReportCard';

interface PreviewReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: StudentData[];
    onArchive: (assessmentType: 'qa1' | 'qa2' | 'endOfTerm' | 'overall' | 'all') => Promise<void>;
    classId?: string;
    term?: string;
}

const PreviewReportModal: React.FC<PreviewReportModalProps> = ({
    isOpen,
    onClose,
    data,
    onArchive,
    classId,
    term
}) => {
    const [selectedType, setSelectedType] = useState<'qa1' | 'qa2' | 'endOfTerm' | 'overall' | 'all'>('overall');
    const [loading, setLoading] = useState(false);
    const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);

    if (!isOpen || !data.length) return null;

    const handleArchive = async () => {
        setLoading(true);
        try {
            await onArchive(selectedType);
            onClose();
        } catch (error) {
            console.error('Archive failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const currentStudent = data[selectedStudentIndex];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800">📋 Report Cards Preview</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Controls */}
                <div className="px-6 pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg">
                        <label className="text-sm font-medium text-slate-700">Report Type:</label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value as any)}
                            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                        >
                            <option value="qa1">Quarterly Assessment 1 (QA1)</option>
                            <option value="qa2">Quarterly Assessment 2 (QA2)</option>
                            <option value="endOfTerm">End of Term</option>
                            <option value="overall">Complete Report Card (Overall)</option>
                            <option value="all">All Reports (QA1, QA2, End Term & Overall)</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedStudentIndex(prev => Math.max(0, prev - 1))}
                            disabled={selectedStudentIndex === 0}
                            className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm">
                            Student {selectedStudentIndex + 1} of {data.length}
                        </span>
                        <button
                            onClick={() => setSelectedStudentIndex(prev => Math.min(data.length - 1, prev + 1))}
                            disabled={selectedStudentIndex === data.length - 1}
                            className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>

                {/* Preview content */}
                <div className="flex-1 overflow-auto p-6">
                    {selectedType === 'all' ? (
                        // Show all four reports
                        <div className="space-y-8">
                            <div>
                                <div className="bg-indigo-50 p-3 rounded-lg mb-4">
                                    <h3 className="text-lg font-semibold text-indigo-800">QA1 Assessment</h3>
                                </div>
                                <QAAssessment studentData={currentStudent} activeTab="qa1" />
                            </div>

                            <div className="border-t pt-8">
                                <div className="bg-indigo-50 p-3 rounded-lg mb-4">
                                    <h3 className="text-lg font-semibold text-indigo-800">QA2 Assessment</h3>
                                </div>
                                <QAAssessment studentData={currentStudent} activeTab="qa2" />
                            </div>

                            <div className="border-t pt-8">
                                <div className="bg-indigo-50 p-3 rounded-lg mb-4">
                                    <h3 className="text-lg font-semibold text-indigo-800">End of Term Assessment</h3>
                                </div>
                                <QAAssessment studentData={currentStudent} activeTab="endOfTerm" />
                            </div>

                            <div className="border-t pt-8">
                                <div className="bg-indigo-50 p-3 rounded-lg mb-4">
                                    <h3 className="text-lg font-semibold text-indigo-800">Complete Report Card (Overall)</h3>
                                </div>
                                <ReportCard studentData={currentStudent} showActions={false} />
                            </div>
                        </div>
                    ) : selectedType === 'overall' ? (
                        <ReportCard studentData={currentStudent} showActions={false} />
                    ) : (
                        <QAAssessment
                            studentData={currentStudent}
                            activeTab={selectedType as 'qa1' | 'qa2' | 'endOfTerm'}
                        />
                    )}
                </div>

                <div className="p-6 border-t flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleArchive}
                        disabled={loading}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Archiving...
                            </>
                        ) : (
                            <>
                                <span>📋</span> Archive {selectedType === 'all' ? 'All Reports' :
                                    selectedType === 'qa1' ? 'QA1' :
                                        selectedType === 'qa2' ? 'QA2' :
                                            selectedType === 'endOfTerm' ? 'End of Term' :
                                                'Complete Report Card'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PreviewReportModal;

// import React, { useState } from 'react';
// import { X } from 'lucide-react';
// import { StudentData } from '@/services/studentService';
// import ReportCard from '@/components/app/searchResults/ReportCard';
// // import ReportCard from '@/components/ReportCard'; // Import the actual ReportCard

// interface PreviewReportModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     data: StudentData[];
//     onArchive: (assessmentType: 'qa1' | 'qa2' | 'endOfTerm' | 'all') => Promise<void>;
//     classId?: string;
//     term?: string;
// }

// const PreviewReportModal: React.FC<PreviewReportModalProps> = ({
//     isOpen,
//     onClose,
//     data,
//     onArchive,
//     classId,
//     term
// }) => {
//     const [selectedType, setSelectedType] = useState<'qa1' | 'qa2' | 'endOfTerm' | 'all'>('endOfTerm');
//     const [loading, setLoading] = useState(false);
//     const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);

//     if (!isOpen || !data.length) return null;

//     const handleArchive = async () => {
//         setLoading(true);
//         try {
//             await onArchive(selectedType);
//             onClose();
//         } catch (error) {
//             console.error('Archive failed:', error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const currentStudent = data[selectedStudentIndex];

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col">
//                 <div className="flex items-center justify-between p-6 border-b border-slate-200">
//                     <h2 className="text-xl font-semibold text-slate-800">📋 Report Cards Preview</h2>
//                     <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
//                         <X className="w-5 h-5" />
//                     </button>
//                 </div>

//                 {/* Student Navigation */}
//                 <div className="px-6 pt-4 flex items-center justify-between">
//                     <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg">
//                         <label className="text-sm font-medium text-slate-700">Archive Type:</label>
//                         <select
//                             value={selectedType}
//                             onChange={(e) => setSelectedType(e.target.value as any)}
//                             className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
//                         >
//                             <option value="qa1">Quarterly Assessment 1 (QA1)</option>
//                             <option value="qa2">Quarterly Assessment 2 (QA2)</option>
//                             <option value="endOfTerm">End of Term</option>
//                             <option value="all">All Assessments</option>
//                         </select>
//                     </div>

//                     <div className="flex items-center gap-2">
//                         <button
//                             onClick={() => setSelectedStudentIndex(prev => Math.max(0, prev - 1))}
//                             disabled={selectedStudentIndex === 0}
//                             className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
//                         >
//                             Previous
//                         </button>
//                         <span className="text-sm">
//                             Student {selectedStudentIndex + 1} of {data.length}
//                         </span>
//                         <button
//                             onClick={() => setSelectedStudentIndex(prev => Math.min(data.length - 1, prev + 1))}
//                             disabled={selectedStudentIndex === data.length - 1}
//                             className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
//                         >
//                             Next
//                         </button>
//                     </div>
//                 </div>

//                 {/* Actual Report Card */}
//                 <div className="flex-1 overflow-auto p-6">
//                     <ReportCard
//                         studentData={currentStudent}
//                         showActions={false} // Hide download buttons in preview
//                     />
//                 </div>

//                 <div className="p-6 border-t flex justify-end gap-2">
//                     <button
//                         onClick={onClose}
//                         className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
//                     >
//                         Close
//                     </button>
//                     <button
//                         onClick={handleArchive}
//                         disabled={loading}
//                         className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 disabled:opacity-50"
//                     >
//                         {loading ? (
//                             <>
//                                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                                 Archiving...
//                             </>
//                         ) : (
//                             <>
//                                 <span>📋</span> Archive {selectedType === 'all' ? 'All Reports' :
//                                     selectedType === 'qa1' ? 'QA1' :
//                                         selectedType === 'qa2' ? 'QA2' : 'End of Term'} Reports
//                             </>
//                         )}
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default PreviewReportModal;

// // import React, { useState } from 'react';
// // import { X } from 'lucide-react';
// // import { StudentData } from '@/services/studentService';

// // interface PreviewReportModalProps {
// //     isOpen: boolean;
// //     onClose: () => void;
// //     data: StudentData[];
// //     onArchive: (assessmentType: 'qa1' | 'qa2' | 'endOfTerm' | 'all') => Promise<void>; // CHANGED
// //     classId?: string;
// //     term?: string;
// // }

// // const PreviewReportModal: React.FC<PreviewReportModalProps> = ({
// //     isOpen,
// //     onClose,
// //     data,
// //     onArchive,
// //     classId,
// //     term
// // }) => {
// //     const [selectedType, setSelectedType] = useState<'qa1' | 'qa2' | 'endOfTerm' | 'all'>('endOfTerm'); // CHANGED
// //     const [loading, setLoading] = useState(false);

// //     if (!isOpen || !data.length) return null;

// //     const handleArchive = async () => {
// //         setLoading(true);
// //         try {
// //             await onArchive(selectedType);
// //             onClose();
// //         } catch (error) {
// //             console.error('Archive failed:', error);
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     return (
// //         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
// //             <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
// //                 <div className="flex items-center justify-between p-6 border-b border-slate-200">
// //                     <h2 className="text-xl font-semibold text-slate-800">📋 Report Cards Preview</h2>
// //                     <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
// //                         <X className="w-5 h-5" />
// //                     </button>
// //                 </div>

// //                 {/* ASSESSMENT TYPE SELECTOR WITH ALL OPTION */}
// //                 <div className="px-6 pt-4">
// //                     <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg">
// //                         <label className="text-sm font-medium text-slate-700">Archive Type:</label>
// //                         <select
// //                             value={selectedType}
// //                             onChange={(e) => setSelectedType(e.target.value as any)}
// //                             className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
// //                         >
// //                             <option value="qa1">Quarterly Assessment 1 (QA1)</option>
// //                             <option value="qa2">Quarterly Assessment 2 (QA2)</option>
// //                             <option value="endOfTerm">End of Term</option>
// //                             <option value="all">All Assessments (QA1, QA2 & End of Term)</option> {/* ADDED */}
// //                         </select>
// //                     </div>
// //                 </div>

// //                 <div className="flex-1 overflow-auto p-6">
// //                     {data.map((student) => {
// //                         // Filter subjects that have at least one score
// //                         const subjectsWithScores = student.subjects.filter(s =>
// //                             s.qa1 !== null || s.qa2 !== null || s.endOfTerm !== null
// //                         );

// //                         if (subjectsWithScores.length === 0) return null;

// //                         return (
// //                             <div key={student.id} className="mb-8 border rounded-lg p-6">
// //                                 <div className="flex justify-between items-center mb-4">
// //                                     <div>
// //                                         <h3 className="text-lg font-semibold">{student.name}</h3>
// //                                         <p className="text-sm text-slate-600">{student.examNumber} - {student.class}</p>
// //                                     </div>
// //                                     <div className="text-right">
// //                                         <p className="text-sm">Rank: {student.classRank}/{student.totalStudents}</p>
// //                                         <p className="text-sm">Average: {student.assessmentStats?.overall.termAverage}%</p>
// //                                     </div>
// //                                 </div>

// //                                 <table className="w-full border-collapse">
// //                                     <thead>
// //                                         <tr className="bg-slate-100">
// //                                             <th className="p-2 text-left">Subject</th>
// //                                             <th className="p-2 text-center">QA1</th>
// //                                             <th className="p-2 text-center">QA2</th>
// //                                             <th className="p-2 text-center">End Term</th>
// //                                             <th className="p-2 text-center">Final</th>
// //                                             <th className="p-2 text-center">Grade</th>
// //                                         </tr>
// //                                     </thead>
// //                                     <tbody>
// //                                         {subjectsWithScores.map((subject, i) => (
// //                                             <tr key={i} className="border-b">
// //                                                 <td className="p-2">{subject.name}</td>
// //                                                 <td className="p-2 text-center">
// //                                                     {subject.qa1_absent ? 'AB' : (subject.qa1 || '-')}
// //                                                 </td>
// //                                                 <td className="p-2 text-center">
// //                                                     {subject.qa2_absent ? 'AB' : (subject.qa2 || '-')}
// //                                                 </td>
// //                                                 <td className="p-2 text-center">
// //                                                     {subject.endOfTerm_absent ? 'AB' : (subject.endOfTerm || '-')}
// //                                                 </td>
// //                                                 <td className="p-2 text-center font-medium">
// //                                                     {subject.finalScore?.toFixed(1) || '-'}
// //                                                 </td>
// //                                                 <td className="p-2 text-center font-bold">{subject.grade}</td>
// //                                             </tr>
// //                                         ))}
// //                                     </tbody>
// //                                 </table>
// //                             </div>
// //                         );
// //                     })}
// //                 </div>

// //                 <div className="p-6 border-t flex justify-end gap-2">
// //                     <button
// //                         onClick={onClose}
// //                         className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
// //                     >
// //                         Close
// //                     </button>
// //                     <button
// //                         onClick={handleArchive}
// //                         disabled={loading}
// //                         className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 disabled:opacity-50"
// //                     >
// //                         {loading ? (
// //                             <>
// //                                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
// //                                 Archiving...
// //                             </>
// //                         ) : (
// //                             <>
// //                                 <span>📋</span> Archive {selectedType === 'all' ? 'All Reports' :
// //                                     selectedType === 'qa1' ? 'QA1' :
// //                                         selectedType === 'qa2' ? 'QA2' : 'End of Term'} Reports
// //                             </>
// //                         )}
// //                     </button>
// //                 </div>
// //             </div>
// //         </div>
// //     );
// // };

// // export default PreviewReportModal;