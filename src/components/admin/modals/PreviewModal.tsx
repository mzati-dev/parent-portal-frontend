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
                    {/* {selectedType === 'all' ? (
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
                    )} */}
                    {selectedType === 'all' ? (
                        // Show all four reports
                        <div className="space-y-8">
                            <div>
                                <div className="bg-indigo-50 p-3 rounded-lg mb-4">
                                    <h3 className="text-lg font-semibold text-indigo-800">QA1 Assessment</h3>
                                </div>
                                <QAAssessment studentData={currentStudent} activeTab="qa1" showPDFOnly={true} />
                            </div>

                            <div className="border-t pt-8">
                                <div className="bg-indigo-50 p-3 rounded-lg mb-4">
                                    <h3 className="text-lg font-semibold text-indigo-800">QA2 Assessment</h3>
                                </div>
                                <QAAssessment studentData={currentStudent} activeTab="qa2" showPDFOnly={true} />
                            </div>

                            <div className="border-t pt-8">
                                <div className="bg-indigo-50 p-3 rounded-lg mb-4">
                                    <h3 className="text-lg font-semibold text-indigo-800">End of Term Assessment</h3>
                                </div>
                                <QAAssessment studentData={currentStudent} activeTab="endOfTerm" showPDFOnly={true} />
                            </div>

                            <div className="border-t pt-8">
                                <div className="bg-indigo-50 p-3 rounded-lg mb-4">
                                    <h3 className="text-lg font-semibold text-indigo-800">Complete Report Card (Overall)</h3>
                                </div>
                                <ReportCard studentData={currentStudent} showActions={false} showPDFOnly={true} />
                            </div>
                        </div>
                    ) : selectedType === 'overall' ? (
                        <ReportCard studentData={currentStudent} showActions={false} showPDFOnly={true} />
                    ) : (
                        <QAAssessment
                            studentData={currentStudent}
                            activeTab={selectedType as 'qa1' | 'qa2' | 'endOfTerm'}
                            showPDFOnly={true}
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