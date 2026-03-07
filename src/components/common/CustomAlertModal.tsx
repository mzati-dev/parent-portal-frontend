import React from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface CustomAlertModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}

const CustomAlertModal: React.FC<CustomAlertModalProps> = ({
    isOpen,
    title,
    message,
    type,
    onClose
}) => {
    if (!isOpen) return null;

    const bgColor = type === 'success' ? 'bg-emerald-600' : 'bg-red-600';
    const Icon = type === 'success' ? CheckCircle : XCircle;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>

            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:max-w-md w-full">
                    <div className={`${bgColor} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Icon className="h-6 w-6 text-white" />
                                <h3 className="text-lg font-semibold text-white">{title}</h3>
                            </div>
                            <button onClick={onClose} className="text-white hover:text-gray-200">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-6">
                        <p className="text-gray-600 text-center">{message}</p>
                    </div>

                    <div className="bg-gray-50 px-6 py-3 flex justify-center">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                        >
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomAlertModal;