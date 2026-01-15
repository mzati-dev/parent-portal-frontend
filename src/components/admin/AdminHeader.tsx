import React from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminHeaderProps {
    onBack: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onBack }) => {

    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear any authentication tokens/data
        localStorage.clear(); // or localStorage.removeItem('token')
        sessionStorage.clear();

        // Redirect to login page
        navigate('/login');
    };
    return (
        <header className="bg-white shadow-sm border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* <button
                            onClick={onBack}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button> */}
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Admin Panel</h1>
                            <p className="text-xs text-slate-500">Manage Classes, Students, Subjects, Results & Grade Configuration</p>
                        </div>
                    </div>
                    {/* LOGOUT BUTTON - ADDED HERE */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">

                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;