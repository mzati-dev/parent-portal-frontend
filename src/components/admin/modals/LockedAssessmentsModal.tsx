import React, { useState } from 'react';
import { X, Lock, Unlock } from 'lucide-react';

interface LockedAssessmentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    assessments: any[];
    onUnlock: (assessmentId: string, assessmentType: string, lockReason: 'fee' | 'teacher') => Promise<void>; // CHANGED
    className?: string;
}

const LockedAssessmentsModal: React.FC<LockedAssessmentsModalProps> = ({
    isOpen,
    onClose,
    assessments,
    onUnlock,
    className
}) => {
    const [selectedType, setSelectedType] = useState<'all' | 'qa1' | 'qa2' | 'endOfTerm'>('all');
    const [selectedReason, setSelectedReason] = useState<'all' | 'fee' | 'teacher'>('all'); // ADDED
    const [unlockingId, setUnlockingId] = useState<string | null>(null);

    if (!isOpen) return null;

    const filteredAssessments = assessments.filter(a => {
        if (selectedType !== 'all' && a.assessmentType !== selectedType) return false;
        if (selectedReason !== 'all' && a.lock_reason !== selectedReason) return false;
        return true;
    });

    const handleUnlock = async (id: string, type: string, reason: string) => {
        setUnlockingId(id);
        try {
            await onUnlock(id, type, reason as 'fee' | 'teacher');
        } finally {
            setUnlockingId(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800">🔒 Locked Assessments</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 border-b border-slate-200 bg-slate-50 space-y-4">
                    {/* Assessment Type Filter */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Type</label>
                        <div className="flex gap-2">
                            {['all', 'qa1', 'qa2', 'endOfTerm'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedType(type as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedType === type
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    {type === 'all' ? 'All' : type === 'qa1' ? 'QA1' : type === 'qa2' ? 'QA2' : 'End Term'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Lock Reason Filter - ADDED */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Lock Reason</label>
                        <div className="flex gap-2">
                            {[
                                { value: 'all', label: 'All Locks' },
                                { value: 'fee', label: '💰 Fee Locks', color: 'bg-red-100 text-red-700' },
                                { value: 'teacher', label: '👨‍🏫 Teacher Locks', color: 'bg-yellow-100 text-yellow-700' }
                            ].map(reason => (
                                <button
                                    key={reason.value}
                                    onClick={() => setSelectedReason(reason.value as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedReason === reason.value
                                            ? 'bg-indigo-600 text-white'
                                            : reason.color || 'bg-white text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    {reason.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(80vh-280px)]">
                    {filteredAssessments.length === 0 ? (
                        <div className="text-center py-12">
                            <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">No locked assessments found</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="text-left px-4 py-2 text-sm font-semibold text-slate-600">Student</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold text-slate-600">Subject</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold text-slate-600">Type</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold text-slate-600">Lock Reason</th> {/* ADDED */}
                                    <th className="text-left px-4 py-2 text-sm font-semibold text-slate-600">Score</th>
                                    <th className="text-center px-4 py-2 text-sm font-semibold text-slate-600">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredAssessments.map((assessment) => (
                                    <tr key={assessment.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 text-sm text-slate-800">
                                            {assessment.student?.name || 'Unknown'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {assessment.subject?.name || 'Unknown'}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                                {assessment.assessmentType}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm"> {/* ADDED */}
                                            <span className={`px-2 py-1 rounded-full text-xs ${assessment.lock_reason === 'fee'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {assessment.lock_reason === 'fee' ? '💰 Fee Lock' : '👨‍🏫 Teacher Lock'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium">
                                            {assessment.score ?? '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleUnlock(assessment.id, assessment.assessmentType, assessment.lock_reason)}
                                                disabled={unlockingId === assessment.id}
                                                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-400 text-white text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                                            >
                                                {unlockingId === assessment.id ? (
                                                    <>Processing...</>
                                                ) : (
                                                    <>
                                                        <Unlock className="w-3 h-3" />
                                                        Unlock
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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

export default LockedAssessmentsModal;


// import React, { useState } from 'react';
// import { X, Lock, Unlock } from 'lucide-react';

// interface LockedAssessmentsModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     assessments: any[];
//     onUnlock: (assessmentId: string, assessmentType: string) => Promise<void>;
//     className?: string;
// }

// const LockedAssessmentsModal: React.FC<LockedAssessmentsModalProps> = ({
//     isOpen,
//     onClose,
//     assessments,
//     onUnlock,
//     className
// }) => {
//     const [selectedType, setSelectedType] = useState<'all' | 'qa1' | 'qa2' | 'endOfTerm'>('all');
//     const [unlockingId, setUnlockingId] = useState<string | null>(null);

//     if (!isOpen) return null;

//     const filteredAssessments = assessments.filter(a =>
//         selectedType === 'all' ? true : a.assessmentType === selectedType
//     );

//     const handleUnlock = async (id: string, type: string) => {
//         setUnlockingId(id);
//         try {
//             await onUnlock(id, type);
//         } finally {
//             setUnlockingId(null);
//         }
//     };

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
//                 <div className="flex items-center justify-between p-6 border-b border-slate-200">
//                     <h2 className="text-xl font-semibold text-slate-800">🔒 Locked Assessments</h2>
//                     <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
//                         <X className="w-5 h-5 text-slate-500" />
//                     </button>
//                 </div>

//                 <div className="p-6 border-b border-slate-200 bg-slate-50">
//                     <div className="flex gap-2">
//                         {['all', 'qa1', 'qa2', 'endOfTerm'].map(type => (
//                             <button
//                                 key={type}
//                                 onClick={() => setSelectedType(type as any)}
//                                 className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedType === type
//                                     ? 'bg-indigo-600 text-white'
//                                     : 'bg-white text-slate-600 hover:bg-slate-100'
//                                     }`}
//                             >
//                                 {type === 'all' ? 'All' : type === 'qa1' ? 'QA1' : type === 'qa2' ? 'QA2' : 'End Term'}
//                             </button>
//                         ))}
//                     </div>
//                 </div>

//                 <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
//                     {filteredAssessments.length === 0 ? (
//                         <div className="text-center py-12">
//                             <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
//                             <p className="text-slate-500">No locked assessments found</p>
//                         </div>
//                     ) : (
//                         <table className="w-full">
//                             <thead className="bg-slate-50">
//                                 <tr>
//                                     <th className="text-left px-4 py-2 text-sm font-semibold text-slate-600">Student</th>
//                                     <th className="text-left px-4 py-2 text-sm font-semibold text-slate-600">Subject</th>
//                                     <th className="text-left px-4 py-2 text-sm font-semibold text-slate-600">Type</th>
//                                     <th className="text-left px-4 py-2 text-sm font-semibold text-slate-600">Score</th>
//                                     <th className="text-center px-4 py-2 text-sm font-semibold text-slate-600">Action</th>
//                                 </tr>
//                             </thead>
//                             <tbody className="divide-y divide-slate-100">
//                                 {filteredAssessments.map((assessment) => (
//                                     <tr key={assessment.id} className="hover:bg-slate-50">
//                                         <td className="px-4 py-3 text-sm text-slate-800">
//                                             {assessment.student?.name || 'Unknown'}
//                                         </td>
//                                         <td className="px-4 py-3 text-sm text-slate-600">
//                                             {assessment.subject?.name || 'Unknown'}
//                                         </td>
//                                         <td className="px-4 py-3 text-sm">
//                                             <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
//                                                 {assessment.assessmentType}
//                                             </span>
//                                         </td>
//                                         <td className="px-4 py-3 text-sm font-medium">
//                                             {assessment.score ?? '-'}
//                                         </td>
//                                         <td className="px-4 py-3 text-center">
//                                             <button
//                                                 onClick={() => handleUnlock(assessment.id, assessment.assessmentType)}
//                                                 disabled={unlockingId === assessment.id}
//                                                 className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-400 text-white text-xs rounded-lg transition-colors inline-flex items-center gap-1"
//                                             >
//                                                 {unlockingId === assessment.id ? (
//                                                     <>Processing...</>
//                                                 ) : (
//                                                     <>
//                                                         <Unlock className="w-3 h-3" />
//                                                         Unlock
//                                                     </>
//                                                 )}
//                                             </button>
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
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

// export default LockedAssessmentsModal;