import React, { useState, useMemo } from 'react';
import { X, Lock, Unlock, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';

// Define proper interfaces
interface Student {
    id: string;
    name: string;
    examNumber?: string;
    class?: {
        id: string;
        name: string;
    };
}

interface LockedAssessment {
    id: string;
    student_id: string;
    assessmentType: 'qa1' | 'qa2' | 'endOfTerm';
    lock_reason: 'fee' | 'teacher';
    student?: Student;
}

interface StudentLockData {
    student: Student;
    lock_reason: 'fee' | 'teacher' | 'mixed';
    assessmentIds: string[];
    assessments: LockedAssessment[];
}

interface ClassLockData {
    classId: string;
    className: string;
    students: StudentLockData[];
    totalStudents: number;
    totalLocks: number;
}

interface LockedAssessmentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    assessments: LockedAssessment[];
    onUnlock: (assessmentId: string, assessmentType: string, lockReason: 'fee' | 'teacher') => Promise<void>;
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
    const [selectedReason, setSelectedReason] = useState<'all' | 'fee' | 'teacher'>('all');
    const [unlockingId, setUnlockingId] = useState<string | null>(null);
    const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

    // Group assessments by class and then by student
    const groupedData: ClassLockData[] = useMemo(() => {
        // Safely handle assessments if it's not an array
        const safeAssessments = Array.isArray(assessments) ? assessments : [];

        // First filter by type and reason
        const filtered = safeAssessments.filter(a => {
            if (!a) return false;
            if (selectedType !== 'all' && a.assessmentType !== selectedType) return false;
            if (selectedReason !== 'all' && a.lock_reason !== selectedReason) return false;
            return true;
        });

        // Group by class
        const classMap = new Map<string, {
            classId: string;
            className: string;
            students: Map<string, StudentLockData>;
        }>();

        filtered.forEach(assessment => {
            const student = assessment.student;
            if (!student) return;

            const classId = student.class?.id || 'unknown';
            // const className = student.class?.name || 'Unknown Class';
            // Use the prop if available, otherwise fall back to student.class
            const classNameValue = className || student.class?.name || 'Unknown Class';
            const classKey = `${classId}-${classNameValue}`;
            // const classKey = `${classId}-${className}`;

            if (!classMap.has(classKey)) {
                classMap.set(classKey, {
                    classId,
                    className: classNameValue,
                    students: new Map<string, StudentLockData>()
                });
            }

            const classData = classMap.get(classKey)!;
            const studentId = student.id;

            if (!classData.students.has(studentId)) {
                classData.students.set(studentId, {
                    student: student,
                    lock_reason: assessment.lock_reason,
                    assessmentIds: [assessment.id],
                    assessments: [assessment]
                });
            } else {
                const existing = classData.students.get(studentId)!;
                existing.assessmentIds.push(assessment.id);
                existing.assessments.push(assessment);
                // Update lock reason if different
                if (existing.lock_reason !== assessment.lock_reason) {
                    existing.lock_reason = 'mixed';
                }
            }
        });

        // Convert to array format
        return Array.from(classMap.entries()).map(([key, classData]) => ({
            classId: classData.classId,
            className: classData.className,
            students: Array.from(classData.students.values()),
            totalStudents: classData.students.size,
            totalLocks: Array.from(classData.students.values()).reduce(
                (sum, s) => sum + s.assessmentIds.length, 0
            )
        }));
    }, [assessments, selectedType, selectedReason, className]);

    const toggleClass = (classKey: string) => {
        setExpandedClasses(prev => ({
            ...prev,
            [classKey]: !prev[classKey]
        }));
    };

    // const handleUnlockStudent = async (studentData: StudentLockData) => {
    //     // Unlock ALL subjects for this student
    //     for (const assessment of studentData.assessments) {
    //         await handleUnlock(assessment.id, assessment.assessmentType, assessment.lock_reason);
    //     }
    // };

    const handleUnlockStudent = async (studentData: StudentLockData) => {
        const studentId = studentData.student.id;

        // Set loading for this student
        setLoadingStates(prev => ({ ...prev, [studentId]: true }));
        setSuccessMessage('');

        try {
            // Unlock ALL subjects for this student
            for (const assessment of studentData.assessments) {
                await handleUnlock(assessment.id, assessment.assessmentType, assessment.lock_reason);
            }
            setSuccessMessage(`✅ Successfully unlocked ${studentData.student.name}`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setSuccessMessage(`❌ Failed to unlock ${studentData.student.name}`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } finally {
            setLoadingStates(prev => ({ ...prev, [studentId]: false }));
        }
    };

    // const handleUnlockAllInClass = async (classData: ClassLockData) => {
    //     for (const student of classData.students) {
    //         for (const assessment of student.assessments) {
    //             await handleUnlock(assessment.id, assessment.assessmentType, assessment.lock_reason);
    //         }
    //     }
    // };

    const handleUnlockAllInClass = async (classData: ClassLockData) => {
        const classId = classData.classId;

        // Set loading for this class
        setLoadingStates(prev => ({ ...prev, [classId]: true }));
        setSuccessMessage('');

        try {
            for (const student of classData.students) {
                for (const assessment of student.assessments) {
                    await handleUnlock(assessment.id, assessment.assessmentType, assessment.lock_reason);
                }
            }
            setSuccessMessage(`✅ Successfully unlocked all students in ${classData.className}`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setSuccessMessage(`❌ Failed to unlock all students in ${classData.className}`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } finally {
            setLoadingStates(prev => ({ ...prev, [classId]: false }));
        }
    }

    const handleUnlock = async (id: string, type: string, reason: string) => {
        setUnlockingId(id);
        try {
            await onUnlock(id, type, reason as 'fee' | 'teacher');
        } finally {
            setUnlockingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800">🔒 Locked Assessments</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <p className="text-emerald-700 text-sm">{successMessage}</p>
                    </div>
                )}

                <div className="p-6 border-b border-slate-200 bg-slate-50 space-y-4">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-500">Total Classes</p>
                            <p className="text-2xl font-bold text-slate-800">{groupedData.length}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-500">Total Students</p>
                            <p className="text-2xl font-bold text-slate-800">
                                {groupedData.reduce((sum, c) => sum + c.totalStudents, 0)}
                            </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-500">Total Locks</p>
                            <p className="text-2xl font-bold text-slate-800">
                                {groupedData.reduce((sum, c) => sum + c.totalLocks, 0)}
                            </p>
                        </div>
                    </div>

                    {/* Assessment Type Filter */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Type</label>
                        <div className="flex gap-2 flex-wrap">
                            {['all', 'qa1', 'qa2', 'endOfTerm'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedType(type as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedType === type
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    {type === 'all' ? 'All Types' : type === 'qa1' ? 'QA1' : type === 'qa2' ? 'QA2' : 'End Term'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Lock Reason Filter */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Lock Reason</label>
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { value: 'all', label: 'All Locks', className: 'bg-white text-slate-600 hover:bg-slate-100' },
                                { value: 'fee', label: '💰 Fee Locks', className: 'bg-red-100 text-red-700 hover:bg-red-200' },
                                { value: 'teacher', label: '👨‍🏫 Teacher Locks', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' }
                            ].map(reason => (
                                <button
                                    key={reason.value}
                                    onClick={() => setSelectedReason(reason.value as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedReason === reason.value
                                        ? 'bg-indigo-600 text-white'
                                        : reason.className
                                        }`}
                                >
                                    {reason.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-320px)]">
                    {groupedData.length === 0 ? (
                        <div className="text-center py-12">
                            <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">No locked students found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {groupedData.map((classData) => {
                                const classKey = `${classData.classId}-${classData.className}`;
                                const isExpanded = expandedClasses[classKey] !== false; // Default to expanded
                                const isClassLoading = loadingStates[classData.classId];

                                return (
                                    <div key={classKey} className="border border-slate-200 rounded-lg overflow-hidden">
                                        {/* Class Header */}
                                        <div
                                            onClick={() => toggleClass(classKey)}
                                            className="flex items-center justify-between p-4 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                {isExpanded ?
                                                    <ChevronDown className="w-5 h-5 text-slate-600" /> :
                                                    <ChevronRight className="w-5 h-5 text-slate-600" />
                                                }
                                                <div>
                                                    <h3 className="font-semibold text-slate-800">{classData.className}</h3>
                                                    <p className="text-xs text-slate-600">
                                                        {classData.totalStudents} student{classData.totalStudents !== 1 ? 's' : ''} •
                                                        {classData.totalLocks} lock{classData.totalLocks !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm(`Unlock ALL students in ${classData.className}?`)) {
                                                        handleUnlockAllInClass(classData);
                                                    }
                                                }}
                                                disabled={unlockingId !== null}
                                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-sm rounded-lg transition-colors inline-flex items-center gap-1"
                                            >
                                                <Unlock className="w-3 h-3" />
                                                Unlock All
                                            </button> */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();

                                                    handleUnlockAllInClass(classData);

                                                }}
                                                disabled={isClassLoading || unlockingId !== null}
                                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-sm rounded-lg transition-colors inline-flex items-center gap-1 min-w-[100px] justify-center"
                                            >
                                                {isClassLoading ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        Unlocking...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Unlock className="w-3 h-3" />
                                                        Unlock All
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Students in Class */}
                                        {isExpanded && (
                                            <div className="p-4 bg-white space-y-3">
                                                {classData.students.map((studentData) => {
                                                    const studentId = studentData.student.id;
                                                    const isStudentLoading = loadingStates[studentId];

                                                    return (
                                                        <div
                                                            key={studentId}
                                                            className={`flex items-center justify-between p-3 rounded-lg border ${studentData.lock_reason === 'fee'
                                                                ? 'bg-red-50 border-red-200'
                                                                : studentData.lock_reason === 'teacher'
                                                                    ? 'bg-yellow-50 border-yellow-200'
                                                                    : 'bg-orange-50 border-orange-200'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${studentData.lock_reason === 'fee'
                                                                    ? 'bg-red-200 text-red-700'
                                                                    : studentData.lock_reason === 'teacher'
                                                                        ? 'bg-yellow-200 text-yellow-700'
                                                                        : 'bg-orange-200 text-orange-700'
                                                                    }`}>
                                                                    {studentData.student.name?.charAt(0).toUpperCase() || '?'}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-medium text-slate-800">{studentData.student.name}</h4>
                                                                    <p className="text-xs text-slate-500">
                                                                        Exam: {studentData.student.examNumber || 'N/A'} •
                                                                        {studentData.assessmentIds.length} locked subject{studentData.assessmentIds.length !== 1 ? 's' : ''}
                                                                    </p>
                                                                    <div className="flex gap-1 mt-1">
                                                                        {studentData.assessments.map((a) => (
                                                                            <span key={a.id} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                                                                                {a.assessmentType === 'qa1' ? 'QA1' : a.assessmentType === 'qa2' ? 'QA2' : 'End'}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${studentData.lock_reason === 'fee'
                                                                    ? 'bg-red-200 text-red-700'
                                                                    : studentData.lock_reason === 'teacher'
                                                                        ? 'bg-yellow-200 text-yellow-700'
                                                                        : 'bg-orange-200 text-orange-700'
                                                                    }`}>
                                                                    {studentData.lock_reason === 'fee' ? '💰 Fee' :
                                                                        studentData.lock_reason === 'teacher' ? '👨‍🏫 Teacher' : '🔄 Mixed'}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleUnlockStudent(studentData)}
                                                                    disabled={isStudentLoading || unlockingId !== null}
                                                                    className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-400 text-white text-sm rounded-lg transition-colors inline-flex items-center gap-1 min-w-[90px] justify-center"
                                                                >
                                                                    {isStudentLoading ? (
                                                                        <>
                                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                            ...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Unlock className="w-3 h-3" />
                                                                            Unlock
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}


                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-200 p-4 bg-slate-50 flex justify-between items-center">
                    <p className="text-sm text-slate-600">
                        Showing {groupedData.reduce((sum, c) => sum + c.totalStudents, 0)} students in {groupedData.length} classes
                    </p>
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

// import React, { useState, useMemo } from 'react';
// import { X, Lock, Unlock } from 'lucide-react';

// interface LockedAssessmentsModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     assessments: any[];
//     onUnlock: (assessmentId: string, assessmentType: string, lockReason: 'fee' | 'teacher') => Promise<void>;
//     className?: string;
// }

// const LockedAssessmentsModal: React.FC<LockedAssessmentsModalProps> = ({
//     isOpen,
//     onClose,
//     assessments,
//     onUnlock,
//     className
// }) => {
//     // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURN
//     const [selectedType, setSelectedType] = useState<'all' | 'qa1' | 'qa2' | 'endOfTerm'>('all');
//     const [selectedReason, setSelectedReason] = useState<'all' | 'fee' | 'teacher'>('all');
//     const [unlockingId, setUnlockingId] = useState<string | null>(null);

//     // Group assessments by student to get unique students
//     const uniqueStudents = useMemo(() => {
//         // Safely handle assessments if it's not an array
//         const safeAssessments = Array.isArray(assessments) ? assessments : [];

//         const filtered = safeAssessments.filter(a => {
//             if (!a) return false;
//             if (selectedType !== 'all' && a.assessmentType !== selectedType) return false;
//             if (selectedReason !== 'all' && a.lock_reason !== selectedReason) return false;
//             return true;
//         });

//         // Create a Map to store unique students (using student id as key)
//         const studentMap = new Map();
//         filtered.forEach(assessment => {
//             const student = assessment.student;
//             if (student && student.id) {
//                 if (!studentMap.has(student.id)) {
//                     studentMap.set(student.id, {
//                         student: student,
//                         lock_reason: assessment.lock_reason,
//                         assessmentIds: [assessment.id]
//                     });
//                 } else {
//                     const existing = studentMap.get(student.id);
//                     existing.assessmentIds.push(assessment.id);
//                 }
//             }
//         });

//         return Array.from(studentMap.values());
//     }, [assessments, selectedType, selectedReason]);

//     // NOW you can do the conditional return
//     if (!isOpen) return null;

//     // const handleUnlockStudent = async (studentData: any) => {
//     //     const firstAssessment = studentData.assessmentIds[0];
//     //     const assessment = Array.isArray(assessments) ? assessments.find(a => a?.id === firstAssessment) : null;
//     //     if (assessment) {
//     //         await handleUnlock(assessment.id, assessment.assessmentType, assessment.lock_reason);
//     //     }
//     // };

//     const handleUnlockStudent = async (studentData: any) => {
//         // Unlock ALL subjects for this student
//         for (const assessmentId of studentData.assessmentIds) {
//             const assessment = Array.isArray(assessments) ? assessments.find(a => a?.id === assessmentId) : null;
//             if (assessment) {
//                 await handleUnlock(assessment.id, assessment.assessmentType, assessment.lock_reason);
//             }
//         }
//     };

//     const handleUnlock = async (id: string, type: string, reason: string) => {
//         setUnlockingId(id);
//         try {
//             await onUnlock(id, type, reason as 'fee' | 'teacher');
//         } finally {
//             setUnlockingId(null);
//         }
//     };

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
//                 <div className="flex items-center justify-between p-6 border-b border-slate-200">
//                     <h2 className="text-xl font-semibold text-slate-800">🔒 Locked Assessments</h2>
//                     <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
//                         <X className="w-5 h-5 text-slate-500" />
//                     </button>
//                 </div>

//                 <div className="p-6 border-b border-slate-200 bg-slate-50 space-y-4">
//                     {/* Assessment Type Filter */}
//                     <div>
//                         <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Type</label>
//                         <div className="flex gap-2 flex-wrap">
//                             {['all', 'qa1', 'qa2', 'endOfTerm'].map(type => (
//                                 <button
//                                     key={type}
//                                     onClick={() => setSelectedType(type as any)}
//                                     className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedType === type
//                                         ? 'bg-indigo-600 text-white'
//                                         : 'bg-white text-slate-600 hover:bg-slate-100'
//                                         }`}
//                                 >
//                                     {type === 'all' ? 'All' : type === 'qa1' ? 'QA1' : type === 'qa2' ? 'QA2' : 'End Term'}
//                                 </button>
//                             ))}
//                         </div>
//                     </div>

//                     {/* Lock Reason Filter */}
//                     <div>
//                         <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Lock Reason</label>
//                         <div className="flex gap-2 flex-wrap">
//                             {[
//                                 { value: 'all', label: 'All Locks', className: 'bg-white text-slate-600 hover:bg-slate-100' },
//                                 { value: 'fee', label: '💰 Fee Locks', className: 'bg-red-100 text-red-700 hover:bg-red-200' },
//                                 { value: 'teacher', label: '👨‍🏫 Teacher Locks', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' }
//                             ].map(reason => (
//                                 <button
//                                     key={reason.value}
//                                     onClick={() => setSelectedReason(reason.value as any)}
//                                     className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedReason === reason.value
//                                         ? 'bg-indigo-600 text-white'
//                                         : reason.className
//                                         }`}
//                                 >
//                                     {reason.label}
//                                 </button>
//                             ))}
//                         </div>
//                     </div>
//                 </div>

//                 <div className="p-6 overflow-y-auto max-h-[calc(80vh-280px)]">
//                     {uniqueStudents.length === 0 ? (
//                         <div className="text-center py-12">
//                             <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
//                             <p className="text-slate-500">No locked students found</p>
//                         </div>
//                     ) : (
//                         <div className="space-y-3">
//                             {uniqueStudents.map((item) => (
//                                 <div
//                                     key={item.student.id}
//                                     className={`flex items-center justify-between p-4 rounded-lg border ${item.lock_reason === 'fee'
//                                         ? 'bg-red-50 border-red-200'
//                                         : 'bg-yellow-50 border-yellow-200'
//                                         }`}
//                                 >
//                                     <div className="flex items-center gap-3">
//                                         <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${item.lock_reason === 'fee'
//                                             ? 'bg-red-200 text-red-700'
//                                             : 'bg-yellow-200 text-yellow-700'
//                                             }`}>
//                                             {item.student.name?.charAt(0).toUpperCase() || '?'}
//                                         </div>
//                                         <div>
//                                             <h3 className="font-medium text-slate-800">{item.student.name}</h3>
//                                             <p className="text-xs text-slate-500">
//                                                 {item.assessmentIds.length} locked subject{item.assessmentIds.length !== 1 ? 's' : ''}
//                                             </p>
//                                         </div>
//                                     </div>
//                                     <div className="flex items-center gap-3">
//                                         <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.lock_reason === 'fee'
//                                             ? 'bg-red-200 text-red-700'
//                                             : 'bg-yellow-200 text-yellow-700'
//                                             }`}>
//                                             {item.lock_reason === 'fee' ? '💰 Fee Lock' : '👨‍🏫 Teacher Lock'}
//                                         </span>
//                                         <button
//                                             onClick={() => handleUnlockStudent(item)}
//                                             disabled={unlockingId !== null}
//                                             className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-400 text-white text-sm rounded-lg transition-colors inline-flex items-center gap-1"
//                                         >
//                                             <Unlock className="w-3 h-3" />
//                                             Unlock
//                                         </button>
//                                     </div>
//                                 </div>
//                             ))}
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

// export default LockedAssessmentsModal;