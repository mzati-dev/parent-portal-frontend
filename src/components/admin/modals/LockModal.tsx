import React, { useState, useEffect } from 'react';
import { X, Lock, Search } from 'lucide-react';

interface Student {
    id: string;
    name: string;
    examNumber: string;
}

interface LockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLock: (assessmentType: 'qa1' | 'qa2' | 'endOfTerm', lock: boolean, lockReason: 'fee' | 'teacher', studentIds?: string[]) => Promise<void>;
    className?: string;
    term?: string;
    classId?: string;
    students?: Student[];
}

const LockModal: React.FC<LockModalProps> = ({
    isOpen,
    onClose,
    onLock,
    className,
    term,
    classId,
    students: propStudents = []
}) => {
    const [selectedType, setSelectedType] = useState<'qa1' | 'qa2' | 'endOfTerm'>('qa1');
    const [lockAction, setLockAction] = useState<'lock' | 'unlock'>('lock');
    const [lockReason, setLockReason] = useState<'fee' | 'teacher'>('fee');
    const [loading, setLoading] = useState(false);
    const [lockScope, setLockScope] = useState<'all' | 'selected'>('all');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [fetching, setFetching] = useState(false);

    // Use useEffect to update students when propStudents changes or classId changes
    useEffect(() => {
        if (classId) {
            if (propStudents.length > 0) {
                // If students are provided as props, use them
                setStudents(propStudents);
            } else {
                // Otherwise fetch students for this class
                fetchStudents();
            }
        }
    }, [classId, propStudents]);

    const fetchStudents = async () => {
        if (!classId) return;

        setFetching(true);
        try {
            const response = await fetch(`/api/classes/${classId}/students`);
            const data = await response.json();
            setStudents(data);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setFetching(false);
        }
    };

    // Reset selected students when class changes
    useEffect(() => {
        setSelectedStudents([]);
        setSearchTerm('');
    }, [classId]);

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.examNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectAll = () => {
        if (selectedStudents.length === filteredStudents.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(filteredStudents.map(s => s.id));
        }
    };

    const handleStudentSelect = (studentId: string) => {
        setSelectedStudents(prev => {
            if (prev.includes(studentId)) {
                return prev.filter(id => id !== studentId);
            } else {
                return [...prev, studentId];
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const studentIds = lockScope === 'all' ? [] : selectedStudents;
            await onLock(selectedType, lockAction === 'lock', lockReason, studentIds);
            onClose();
        } catch (error) {
            console.error('Error locking:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Show class info and validate class selection
    if (!classId) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-slate-800 mb-4">❌ Class Required</h2>
                        <p className="text-slate-600 mb-6">Please select a class first to manage student locks.</p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800">🔒 Lock/Unlock Results</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                    {/* Class and Term Info */}
                    {(term || className) && (
                        <div className="bg-blue-50 p-3 rounded-lg space-y-1">
                            {className && (
                                <p className="text-sm text-blue-700">
                                    <span className="font-semibold">Class:</span> {className}
                                </p>
                            )}
                            {term && (
                                <p className="text-sm text-blue-700">
                                    <span className="font-semibold">Term:</span> {term}
                                </p>
                            )}
                            <p className="text-sm text-blue-700">
                                <span className="font-semibold">Total Students:</span> {students.length}
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Assessment Type
                        </label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value as any)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="qa1">Quarterly Assessment 1 (QA1)</option>
                            <option value="qa2">Quarterly Assessment 2 (QA2)</option>
                            <option value="endOfTerm">End of Term</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Action
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    checked={lockAction === 'lock'}
                                    onChange={() => setLockAction('lock')}
                                    className="w-4 h-4 text-indigo-600"
                                />
                                <span className="text-sm text-slate-700">Lock</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    checked={lockAction === 'unlock'}
                                    onChange={() => setLockAction('unlock')}
                                    className="w-4 h-4 text-indigo-600"
                                />
                                <span className="text-sm text-slate-700">Unlock</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {lockAction === 'lock' ? 'Lock Reason' : 'Unlock Type'}
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    checked={lockReason === 'fee'}
                                    onChange={() => setLockReason('fee')}
                                    className="w-4 h-4 text-indigo-600"
                                />
                                <span className="text-sm text-slate-700">
                                    {lockAction === 'lock' ? 'Fee Non-Payment (Hide from parents)' : 'Unlock Fee Locks'}
                                </span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    checked={lockReason === 'teacher'}
                                    onChange={() => setLockReason('teacher')}
                                    className="w-4 h-4 text-indigo-600"
                                />
                                <span className="text-sm text-slate-700">
                                    {lockAction === 'lock' ? 'Teacher Lock (Prevent editing only)' : 'Unlock Teacher Locks'}
                                </span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Lock Scope
                        </label>
                        <div className="flex gap-4 mb-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    checked={lockScope === 'all'}
                                    onChange={() => setLockScope('all')}
                                    className="w-4 h-4 text-indigo-600"
                                />
                                <span className="text-sm text-slate-700">All Students in {className || 'this class'}</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    checked={lockScope === 'selected'}
                                    onChange={() => setLockScope('selected')}
                                    className="w-4 h-4 text-indigo-600"
                                />
                                <span className="text-sm text-slate-700">Select Specific Students</span>
                            </label>
                        </div>

                        {lockScope === 'selected' && (
                            <div className="mt-4 border rounded-lg p-4 bg-slate-50">
                                <div className="mb-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search students by name or exam number..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                {fetching ? (
                                    <div className="text-center py-8">
                                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                        <p className="text-sm text-slate-500">Loading students...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-sm font-medium text-slate-700">
                                                {filteredStudents.length} students found in {className || 'this class'}
                                            </p>
                                            {filteredStudents.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={handleSelectAll}
                                                    className="text-sm text-indigo-600 hover:text-indigo-700"
                                                >
                                                    {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2 bg-white">
                                            {filteredStudents.length === 0 ? (
                                                <p className="text-sm text-slate-500 text-center py-4">
                                                    {students.length === 0
                                                        ? `No students found in this class`
                                                        : `No students matching "${searchTerm}"`}
                                                </p>
                                            ) : (
                                                filteredStudents.map(student => (
                                                    <label
                                                        key={student.id}
                                                        className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedStudents.includes(student.id)}
                                                            onChange={() => handleStudentSelect(student.id)}
                                                            className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                                                        />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-slate-800">{student.name}</p>
                                                            <p className="text-xs text-slate-500">{student.examNumber}</p>
                                                        </div>
                                                    </label>
                                                ))
                                            )}
                                        </div>

                                        {selectedStudents.length > 0 && (
                                            <p className="text-xs text-indigo-600 mt-2">
                                                {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (lockScope === 'selected' && selectedStudents.length === 0) || fetching}
                            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${lockAction === 'lock'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-yellow-600 hover:bg-yellow-700'
                                } ${loading || (lockScope === 'selected' && selectedStudents.length === 0) || fetching ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Lock className="w-4 h-4" />
                                    {lockAction === 'lock' ? 'Lock' : 'Unlock'}
                                    {lockScope === 'selected' && selectedStudents.length > 0 &&
                                        ` (${selectedStudents.length} student${selectedStudents.length !== 1 ? 's' : ''})`
                                    }
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LockModal;

// import React, { useState, useEffect } from 'react';
// import { X, Lock, Search } from 'lucide-react';

// interface Student {
//     id: string;
//     name: string;
//     examNumber: string;
// }

// interface LockModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     onLock: (assessmentType: 'qa1' | 'qa2' | 'endOfTerm', lock: boolean, lockReason: 'fee' | 'teacher', studentIds?: string[]) => Promise<void>;
//     className?: string;
//     term?: string;
//     classId?: string;
//     students?: Student[];
// }

// const LockModal: React.FC<LockModalProps> = ({
//     isOpen,
//     onClose,
//     onLock,
//     className,
//     term,
//     classId,
//     students: propStudents = []
// }) => {
//     const [selectedType, setSelectedType] = useState<'qa1' | 'qa2' | 'endOfTerm'>('qa1');
//     const [lockAction, setLockAction] = useState<'lock' | 'unlock'>('lock');
//     const [lockReason, setLockReason] = useState<'fee' | 'teacher'>('fee');
//     const [loading, setLoading] = useState(false);
//     const [lockScope, setLockScope] = useState<'all' | 'selected'>('all');
//     const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [students, setStudents] = useState<Student[]>(propStudents);
//     const [fetching, setFetching] = useState(false);

//     // useEffect(() => {
//     //     if (classId && propStudents.length === 0) {
//     //         fetchStudents();
//     //     }
//     // }, [classId]);

//     // const fetchStudents = async () => {
//     //     setFetching(true);
//     //     try {
//     //         const response = await fetch(`/api/classes/${classId}/students`);
//     //         const data = await response.json();
//     //         setStudents(data);
//     //     } catch (error) {
//     //         console.error('Error fetching students:', error);
//     //     } finally {
//     //         setFetching(false);
//     //     }
//     // };

//     useEffect(() => {
//         setStudents(propStudents);
//     }, [propStudents]);

//     const filteredStudents = students.filter(student =>
//         student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         student.examNumber.toLowerCase().includes(searchTerm.toLowerCase())
//     );

//     const handleSelectAll = () => {
//         if (selectedStudents.length === filteredStudents.length) {
//             setSelectedStudents([]);
//         } else {
//             setSelectedStudents(filteredStudents.map(s => s.id));
//         }
//     };

//     const handleStudentSelect = (studentId: string) => {
//         setSelectedStudents(prev => {
//             if (prev.includes(studentId)) {
//                 return prev.filter(id => id !== studentId);
//             } else {
//                 return [...prev, studentId];
//             }
//         });
//     };

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setLoading(true);
//         try {
//             const studentIds = lockScope === 'all' ? [] : selectedStudents;
//             await onLock(selectedType, lockAction === 'lock', lockReason, studentIds);
//             onClose();
//         } catch (error) {
//             console.error('Error locking:', error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     if (!isOpen) return null;

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
//                 <div className="flex items-center justify-between p-6 border-b border-slate-200">
//                     <h2 className="text-xl font-semibold text-slate-800">🔒 Lock/Unlock Results</h2>
//                     <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
//                         <X className="w-5 h-5 text-slate-500" />
//                     </button>
//                 </div>

//                 <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-100px)]">
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

//                     <div>
//                         <label className="block text-sm font-medium text-slate-700 mb-2">
//                             Action
//                         </label>
//                         <div className="flex gap-4">
//                             <label className="flex items-center gap-2">
//                                 <input
//                                     type="radio"
//                                     checked={lockAction === 'lock'}
//                                     onChange={() => setLockAction('lock')}
//                                     className="w-4 h-4 text-indigo-600"
//                                 />
//                                 <span className="text-sm text-slate-700">Lock</span>
//                             </label>
//                             <label className="flex items-center gap-2">
//                                 <input
//                                     type="radio"
//                                     checked={lockAction === 'unlock'}
//                                     onChange={() => setLockAction('unlock')}
//                                     className="w-4 h-4 text-indigo-600"
//                                 />
//                                 <span className="text-sm text-slate-700">Unlock</span>
//                             </label>
//                         </div>
//                     </div>

//                     {/* {lockAction === 'lock' && (
//                         <div>
//                             <label className="block text-sm font-medium text-slate-700 mb-2">
//                                 Lock Reason
//                             </label>
//                             <div className="flex gap-4">
//                                 <label className="flex items-center gap-2">
//                                     <input
//                                         type="radio"
//                                         checked={lockReason === 'fee'}
//                                         onChange={() => setLockReason('fee')}
//                                         className="w-4 h-4 text-indigo-600"
//                                     />
//                                     <span className="text-sm text-slate-700">Fee Non-Payment (Hide from parents)</span>
//                                 </label>
//                                 <label className="flex items-center gap-2">
//                                     <input
//                                         type="radio"
//                                         checked={lockReason === 'teacher'}
//                                         onChange={() => setLockReason('teacher')}
//                                         className="w-4 h-4 text-indigo-600"
//                                     />
//                                     <span className="text-sm text-slate-700">Teacher Lock (Prevent editing only)</span>
//                                 </label>
//                             </div>
//                         </div>
//                     )} */}
//                     {/* Remove the condition - show for both lock and unlock */}
//                     <div>
//                         <label className="block text-sm font-medium text-slate-700 mb-2">
//                             {lockAction === 'lock' ? 'Lock Reason' : 'Unlock Type'}
//                         </label>
//                         <div className="flex gap-4">
//                             <label className="flex items-center gap-2">
//                                 <input
//                                     type="radio"
//                                     checked={lockReason === 'fee'}
//                                     onChange={() => setLockReason('fee')}
//                                     className="w-4 h-4 text-indigo-600"
//                                 />
//                                 <span className="text-sm text-slate-700">
//                                     {lockAction === 'lock' ? 'Fee Non-Payment (Hide from parents)' : 'Unlock Fee Locks'}
//                                 </span>
//                             </label>
//                             <label className="flex items-center gap-2">
//                                 <input
//                                     type="radio"
//                                     checked={lockReason === 'teacher'}
//                                     onChange={() => setLockReason('teacher')}
//                                     className="w-4 h-4 text-indigo-600"
//                                 />
//                                 <span className="text-sm text-slate-700">
//                                     {lockAction === 'lock' ? 'Teacher Lock (Prevent editing only)' : 'Unlock Teacher Locks'}
//                                 </span>
//                             </label>
//                         </div>
//                     </div>
//                     <div>
//                         <label className="block text-sm font-medium text-slate-700 mb-2">
//                             Lock Scope
//                         </label>
//                         <div className="flex gap-4 mb-4">
//                             <label className="flex items-center gap-2">
//                                 <input
//                                     type="radio"
//                                     checked={lockScope === 'all'}
//                                     onChange={() => setLockScope('all')}
//                                     className="w-4 h-4 text-indigo-600"
//                                 />
//                                 <span className="text-sm text-slate-700">All Students</span>
//                             </label>
//                             <label className="flex items-center gap-2">
//                                 <input
//                                     type="radio"
//                                     checked={lockScope === 'selected'}
//                                     onChange={() => setLockScope('selected')}
//                                     className="w-4 h-4 text-indigo-600"
//                                 />
//                                 <span className="text-sm text-slate-700">Select Specific Students</span>
//                             </label>
//                         </div>

//                         {lockScope === 'selected' && (
//                             <div className="mt-4 border rounded-lg p-4 bg-slate-50">
//                                 <div className="mb-3">
//                                     <div className="relative">
//                                         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                                         <input
//                                             type="text"
//                                             placeholder="Search students by name or exam number..."
//                                             value={searchTerm}
//                                             onChange={(e) => setSearchTerm(e.target.value)}
//                                             className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
//                                         />
//                                     </div>
//                                 </div>

//                                 {fetching ? (
//                                     <div className="text-center py-8">
//                                         <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
//                                         <p className="text-sm text-slate-500">Loading students...</p>
//                                     </div>
//                                 ) : (
//                                     <>
//                                         <div className="flex items-center justify-between mb-3">
//                                             <p className="text-sm font-medium text-slate-700">
//                                                 {filteredStudents.length} students found
//                                             </p>
//                                             {filteredStudents.length > 0 && (
//                                                 <button
//                                                     type="button"
//                                                     onClick={handleSelectAll}
//                                                     className="text-sm text-indigo-600 hover:text-indigo-700"
//                                                 >
//                                                     {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
//                                                 </button>
//                                             )}
//                                         </div>

//                                         <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2 bg-white">
//                                             {filteredStudents.length === 0 ? (
//                                                 <p className="text-sm text-slate-500 text-center py-4">
//                                                     No students found matching "{searchTerm}"
//                                                 </p>
//                                             ) : (
//                                                 filteredStudents.map(student => (
//                                                     <label
//                                                         key={student.id}
//                                                         className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer"
//                                                     >
//                                                         <input
//                                                             type="checkbox"
//                                                             checked={selectedStudents.includes(student.id)}
//                                                             onChange={() => handleStudentSelect(student.id)}
//                                                             className="w-4 h-4 text-indigo-600 rounded border-slate-300"
//                                                         />
//                                                         <div className="flex-1">
//                                                             <p className="text-sm font-medium text-slate-800">{student.name}</p>
//                                                             <p className="text-xs text-slate-500">{student.examNumber}</p>
//                                                         </div>
//                                                     </label>
//                                                 ))
//                                             )}
//                                         </div>

//                                         {selectedStudents.length > 0 && (
//                                             <p className="text-xs text-indigo-600 mt-2">
//                                                 {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
//                                             </p>
//                                         )}
//                                     </>
//                                 )}
//                             </div>
//                         )}
//                     </div>

//                     <div className="flex gap-3 pt-4 border-t">
//                         <button
//                             type="button"
//                             onClick={onClose}
//                             className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
//                         >
//                             Cancel
//                         </button>
//                         <button
//                             type="submit"
//                             disabled={loading || (lockScope === 'selected' && selectedStudents.length === 0)}
//                             className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${lockAction === 'lock'
//                                 ? 'bg-red-600 hover:bg-red-700'
//                                 : 'bg-yellow-600 hover:bg-yellow-700'
//                                 } ${loading || (lockScope === 'selected' && selectedStudents.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
//                         >
//                             {loading ? (
//                                 <>
//                                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                                     Processing...
//                                 </>
//                             ) : (
//                                 <>
//                                     <Lock className="w-4 h-4" />
//                                     {lockAction === 'lock' ? 'Lock' : 'Unlock'}
//                                     {lockScope === 'selected' && selectedStudents.length > 0 &&
//                                         ` (${selectedStudents.length} student${selectedStudents.length !== 1 ? 's' : ''})`
//                                     }
//                                 </>
//                             )}
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// };

// export default LockModal;