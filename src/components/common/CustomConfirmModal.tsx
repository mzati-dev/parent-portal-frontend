import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface CustomConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const CustomConfirmModal: React.FC<CustomConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onCancel}></div>

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:max-w-lg w-full">
                    {/* Header */}
                    <div className="bg-red-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-6 w-6 text-white" />
                                <h3 className="text-lg font-semibold text-white">{title}</h3>
                            </div>
                            <button onClick={onCancel} className="text-white hover:text-gray-200">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-4">
                        <p className="text-gray-600">{message}</p>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                        >
                            Yes, Calculate Ranks
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomConfirmModal;