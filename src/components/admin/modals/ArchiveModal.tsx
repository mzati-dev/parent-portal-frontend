import React, { useState } from 'react';
import { X, Archive } from 'lucide-react';

interface ArchiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onArchive: (term: string, academicYear: string) => Promise<void>;
    className?: string;
    defaultTerm?: string;
    defaultAcademicYear?: string;
}

const ArchiveModal: React.FC<ArchiveModalProps> = ({
    isOpen,
    onClose,
    onArchive,
    className,
    defaultTerm = 'Term 1',
    defaultAcademicYear = '2024/2025'
}) => {
    const [term, setTerm] = useState(defaultTerm);
    const [academicYear, setAcademicYear] = useState(defaultAcademicYear);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onArchive(term, academicYear);
            onClose();
        } catch (error) {
            console.error('Error archiving:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800">📦 Archive Term Results</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Term <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={term}
                            onChange={(e) => setTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                        >
                            <option value="Term 1">Term 1</option>
                            <option value="Term 2">Term 2</option>
                            <option value="Term 3">Term 3</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Academic Year <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={academicYear}
                            onChange={(e) => setAcademicYear(e.target.value)}
                            placeholder="e.g., 2024/2025"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div className="bg-amber-50 p-3 rounded-lg">
                        <p className="text-xs text-amber-700">
                            <span className="font-semibold">⚠️ Warning:</span> Archiving will save the current results permanently.
                            You can view them later but they will no longer be active in the current term.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Archiving...
                                </>
                            ) : (
                                <>
                                    <Archive className="w-4 h-4" />
                                    Archive
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ArchiveModal;