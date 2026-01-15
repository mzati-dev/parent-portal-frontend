import React from 'react';
import { BookOpen, Settings, Phone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom'; // Add this import

interface HeaderProps {
    onShowAdmin: () => void;

}

const Header: React.FC<HeaderProps> = ({ onShowAdmin }) => {
    const navigate = useNavigate(); // Initialize navigation
    const handleLogin = () => {
        navigate('/login'); // Navigate to login page
        // console.log('Login clicked');
    };

    const handleCreateAccount = () => {
        navigate('/signup');
        // console.log('Create Account clicked');
    };

    return (
        <header className="bg-white shadow-sm border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Parent Portal</h1>
                            <p className="text-xs text-slate-500">Student Results System</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">

                        {/* <Link to="/" className="hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-50">
                            Check Results
                        </Link> */}
                        <button
                            onClick={handleLogin}
                            className="hover:text-indigo-600 transition-colors px-3 py-2 rounded-lg hover:bg-indigo-50"
                        >
                            Login
                        </button>
                        <button
                            onClick={handleCreateAccount}
                            className="border border-indigo-600 text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                            Create Account
                        </button>
                        {/* <button
                            onClick={onShowAdmin}
                            className="hover:text-indigo-600 transition-colors flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-indigo-50"
                        >
                            <Settings className="w-4 h-4" />
                            <span className="hidden sm:inline">Admin</span>
                        </button> */}
                        <a
                            href="#contact"
                            className="hover:text-indigo-600 transition-colors flex items-center gap-1"
                        >
                            <Phone className="w-4 h-4" />
                            <span className="hidden sm:inline">Contact</span>
                        </a>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;