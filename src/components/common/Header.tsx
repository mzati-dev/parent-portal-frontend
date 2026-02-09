import React from 'react';
import { MessageSquare, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
    onShowAdmin: () => void;
}

const Header: React.FC<HeaderProps> = ({ onShowAdmin }) => {
    const navigate = useNavigate();

    const handleLogin = () => {
        navigate('/login');
    };

    return (
        <header className="bg-white shadow-sm border-b border-slate-200">
            <div className="max-w-7xl mx-auto pl-0 pr-4 sm:pr-6 lg:pr-8 py-4">
                <div className="flex items-center justify-between">

                    {/* LEFT SIDE: Logo & Pilot Message */}
                    <div className="flex items-center gap-3">
                        <img src="/eduspace-logo.png" alt="Eduspace Portal" className="w-20 h-20" />
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight flex flex-wrap items-center gap-2">
                                <span>
                                    <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                                        EduSpace
                                    </span>
                                    <span className="text-orange-400"> Portal</span>
                                </span>

                                {/* --- PILOT MESSAGE ADDED HERE --- */}
                                <span className="text-xs sm:text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                                    (Piloted at Progress Private Primary School)
                                </span>
                                {/* -------------------------------- */}
                            </h1>
                            <p className="text-sm text-gray-600 font-light">
                                A window to your child's academic success
                            </p>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Buttons */}
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <button
                            onClick={handleLogin}
                            className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-indigo-100 shadow-sm hover:shadow-md hover:border-indigo-300 hover:bg-indigo-50/80 transition-all duration-300"
                        >
                            <span className="font-bold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                                Login
                            </span>
                            <LogIn className="w-4 h-4 text-indigo-500 group-hover:text-indigo-700 group-hover:translate-x-0.5 transition-all duration-300" />
                        </button>

                        <a
                            href="#contact"
                            className="relative group hidden sm:inline-flex items-center gap-2 px-6 py-2.5 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:-translate-y-0.5"
                        >
                            <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 animate-gradient-xy" />
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[1px]" />
                            <div className="relative flex items-center gap-2 text-white font-medium tracking-wide text-sm">
                                <MessageSquare className="w-4 h-4 fill-white/20" />
                                <span>Get in Touch</span>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;

// import React from 'react';
// import { BookOpen, Settings, Phone, MessageSquare, LogIn, Sparkles } from 'lucide-react';
// import { Link, useNavigate } from 'react-router-dom'; // Add this import

// interface HeaderProps {
//     onShowAdmin: () => void;

// }

// const Header: React.FC<HeaderProps> = ({ onShowAdmin }) => {
//     const navigate = useNavigate(); // Initialize navigation
//     const handleLogin = () => {
//         navigate('/login'); // Navigate to login page
//         // console.log('Login clicked');
//     };

//     const handleCreateAccount = () => {
//         navigate('/signup');
//         // console.log('Create Account clicked');
//     };

//     return (
//         <header className="bg-white shadow-sm border-b border-slate-200">
//             {/* <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"> */}
//             <div className="max-w-7xl mx-auto pl-0 pr-4 sm:pr-6 lg:pr-8 py-4">
//                 <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-3">
//                         {/* Eduspace Portal Logo here */}
//                         <img src="/eduspace-logo.png" alt="Eduspace Portal" className="w-20 h-20" />
//                         <div>
//                             <h1 className="text-2xl font-bold tracking-tight">
//                                 <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
//                                     EduSpace
//                                 </span>
//                                 <span className="text-orange-400"> Portal</span>
//                                 {/* <span className="text-gray-900"> Portal</span> */}
//                             </h1>
//                             <p className="text-sm text-gray-600 font-light">
//                                 A window to your child's academic success
//                             </p>
//                         </div>
//                     </div>
//                     <div className="flex items-center gap-3 text-sm text-slate-600">

//                         {/* <Link to="/" className="hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-50">
//                             Check Results
//                         </Link> */}
//                         {/* <button
//                             onClick={handleLogin}
//                             className="hover:text-indigo-600 transition-colors px-3 py-2 rounded-lg hover:bg-indigo-50"
//                         >
//                             Login
//                         </button> */}
//                         {/* 1. Login: Clean & Minimal with Slide Effect */}
//                         {/* 1. Login: Bold Text with Magnetic Slide Effect */}
//                         {/* LOGIN BUTTON: Vibrant, Glamorous, but Compact */}
//                         <button
//                             onClick={handleLogin}
//                             className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-indigo-100 shadow-sm hover:shadow-md hover:border-indigo-300 hover:bg-indigo-50/80 transition-all duration-300"
//                         >
//                             {/* Gradient Text for the 'Glamour' look */}
//                             <span className="font-bold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
//                                 Login
//                             </span>

//                             {/* Icon matches the gradient color */}
//                             <LogIn className="w-4 h-4 text-indigo-500 group-hover:text-indigo-700 group-hover:translate-x-0.5 transition-all duration-300" />
//                         </button>

//                         <button
//                         // onClick={handleCreateAccount}
//                         // className="group relative p-[2px] rounded-lg transition-transform duration-300 active:scale-95 hover:-translate-y-0.5"
//                         >
//                             {/* Animated Gradient Border */}
//                             {/* <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 rounded-lg opacity-75 group-hover:opacity-100 animate-gradient-xy" /> */}

//                             {/* Inner White Container */}
//                             {/* <div className="relative flex items-center gap-2 px-4 py-2 bg-white rounded-[6px] transition-colors duration-300 group-hover:bg-blue-50/30">
//                                 <Sparkles className="w-4 h-4 text-blue-600 transition-transform duration-500 group-hover:rotate-12" />
//                                 <span className="text-sm font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
//                                     Create Account
//                                 </span>
//                             </div> */}
//                         </button>

//                         <a
//                             href="#contact"
//                             className="relative group hidden sm:inline-flex items-center gap-2 px-6 py-2.5 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:-translate-y-0.5"
//                         >
//                             {/* Moving Gradient Background */}
//                             <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 animate-gradient-xy" />

//                             {/* Shine Effect */}
//                             <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[1px]" />

//                             {/* Content */}
//                             <div className="relative flex items-center gap-2 text-white font-medium tracking-wide text-sm">
//                                 <MessageSquare className="w-4 h-4 fill-white/20" />
//                                 <span>Get in Touch</span>
//                             </div>
//                         </a>
//                     </div>
//                 </div>
//             </div>
//         </header>
//     );
// };

// export default Header;