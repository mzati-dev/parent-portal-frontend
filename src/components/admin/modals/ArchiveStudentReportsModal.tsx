// import React, { useState } from 'react';
// import { X, Archive } from 'lucide-react';

// interface ArchiveStudentReportsModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     onArchive: (assessmentType: 'qa1' | 'qa2' | 'endOfTerm') => Promise<void>;
//     className?: string;
//     term?: string;
// }

// const ArchiveStudentReportsModal: React.FC<ArchiveStudentReportsModalProps> = ({
//     isOpen,
//     onClose,
//     onArchive,
//     className,
//     term
// }) => {
//     const [selectedType, setSelectedType] = useState<'qa1' | 'qa2' | 'endOfTerm'>('qa1');
//     const [loading, setLoading] = useState(false);

//     if (!isOpen) return null;

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setLoading(true);
//         try {
//             await onArchive(selectedType);
//             onClose();
//         } catch (error) {
//             console.error('Error archiving:', error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
//                 <div className="flex items-center justify-between p-6 border-b border-slate-200">
//                     <h2 className="text-xl font-semibold text-slate-800">📋 Archive Student Reports</h2>
//                     <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
//                         <X className="w-5 h-5 text-slate-500" />
//                     </button>
//                 </div>

//                 <form onSubmit={handleSubmit} className="p-6 space-y-6">
//                     {term && (
//                         <div className="bg-blue-50 p-3 rounded-lg">
//                             <p className="text-sm text-blue-700">
//                                 <span className="font-semibold">Term:</span> {term}
//                             </p>
//                         </div>
//                     )}

//                     <div>
//                         <label className="block text-sm font-medium text-slate-700 mb-2">
//                             Assessment Type
//                         </label>
//                         <select
//                             value={selectedType}
//                             onChange={(e) => setSelectedType(e.target.value as any)}
//                             className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
//                         >
//                             <option value="qa1">Quarterly Assessment 1 (QA1)</option>
//                             <option value="qa2">Quarterly Assessment 2 (QA2)</option>
//                             <option value="endOfTerm">End of Term</option>
//                         </select>
//                     </div>

//                     <div className="bg-amber-50 p-3 rounded-lg">
//                         <p className="text-xs text-amber-700">
//                             This will create individual report archives for each student in this class.
//                             You can view them in the Student Reports modal.
//                         </p>
//                     </div>

//                     <div className="flex gap-3 pt-4">
//                         <button
//                             type="button"
//                             onClick={onClose}
//                             className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
//                         >
//                             Cancel
//                         </button>
//                         <button
//                             type="submit"
//                             disabled={loading}
//                             className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
//                         >
//                             {loading ? (
//                                 <>
//                                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                                     Archiving...
//                                 </>
//                             ) : (
//                                 <>
//                                     <Archive className="w-4 h-4" />
//                                     Archive Reports
//                                 </>
//                             )}
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// };

// export default ArchiveStudentReportsModal;