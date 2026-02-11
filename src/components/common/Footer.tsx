import React from 'react';
import { MapPin, Phone, Mail, ArrowUp, MessageCircle } from 'lucide-react';

const Footer: React.FC = () => {

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <footer id="contact" className="bg-slate-900 text-white pt-4 pb-8 mt-12">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* --- BACK TO TOP BUTTON (Top Edge) --- */}
                <div className="flex justify-end mb-4">
                    <button
                        onClick={scrollToTop}
                        className="group flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-all duration-300 text-sm font-medium py-2"
                    >
                        <span>Back to Top</span>
                        <ArrowUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                    </button>
                </div>

                {/* --- WHATSAPP CONTACT CARD (Inside Footer flow) --- */}
                {/* Placed above the grid, so it's on top on desktop, and stacks first on mobile */}
                <div className="bg-indigo-600 rounded-xl shadow-xl p-6 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4 border border-indigo-500/30">
                    <div className="text-center sm:text-left">
                        <h3 className="text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                            <MessageCircle className="w-6 h-6" />
                            Need Help?
                        </h3>
                        <p className="text-indigo-100 text-sm mt-1">
                            Chat with us directly on WhatsApp for quick support.
                        </p>
                    </div>

                    <a
                        href="https://api.whatsapp.com/send?phone=265999613324"

                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-lg flex items-center gap-2 whitespace-nowrap text-sm"
                    >
                        <MessageCircle className="w-5 h-5" />
                        WhatsApp Us
                    </a>
                </div>

                {/* --- MAIN FOOTER LINKS GRID --- */}
                <div className="grid md:grid-cols-4 gap-8 border-b border-slate-800 pb-8">

                    {/* Brand Section */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div>
                                <h4 className="text-lg font-bold text-white">Eduspace Portal</h4>
                                <p className="text-xs text-slate-400">A window to your child's academic success</p>
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                            Providing parents with easy access to their children's academic progress and results.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h5 className="font-semibold mb-4 text-indigo-400">Quick Links</h5>
                        <ul className="space-y-2 text-slate-400 text-sm">
                            <li><button onClick={scrollToTop} className="hover:text-white transition-colors text-left">Home</button></li>
                            <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h5 className="font-semibold mb-4 text-indigo-400">Contact Info</h5>
                        <ul className="space-y-4 text-slate-400 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                <span>Education</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-indigo-500 shrink-0" />
                                <span>+265 (0) 999 61 33 24</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-indigo-500 shrink-0" />
                                <span>support@eduspaceportal.edu</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="pt-8 text-center md:text-left">
                    <p className="text-slate-500 text-sm">
                        &copy; {new Date().getFullYear()} Eduspace Portal. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

// import React from 'react';
// import { BookOpen, MapPin, Phone, Mail } from 'lucide-react';

// const Footer: React.FC = () => {
//     return (
//         <footer id="contact" className="bg-slate-900 text-white py-12">
//             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//                 <div className="grid md:grid-cols-4 gap-8">
//                     <div className="md:col-span-2">
//                         <div className="flex items-center gap-3 mb-4">
//                             {/* <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
//                                 <BookOpen className="w-6 h-6 text-white" />
//                             </div> */}
//                             <div>
//                                 <h4 className="text-lg font-bold">Eduspace Portal</h4>
//                                 <p className="text-xs text-slate-400">A window to your child's academic success</p>
//                                 {/* <p className="text-xs text-slate-400">Student Results System</p> */}
//                             </div>
//                         </div>
//                         <p className="text-slate-400 text-sm max-w-md">
//                             Providing parents with easy access to their children's academic progress and results.
//                             Stay informed and support your child's educational journey.
//                         </p>
//                     </div>
//                     <div>
//                         <h5 className="font-semibold mb-4">Quick Links</h5>
//                         <ul className="space-y-2 text-slate-400 text-sm">
//                             <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
//                             <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
//                             <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
//                         </ul>
//                     </div>
//                     <div>
//                         <h5 className="font-semibold mb-4">Contact Us</h5>
//                         <ul className="space-y-3 text-slate-400 text-sm">
//                             <li className="flex items-center gap-2">
//                                 <MapPin className="w-4 h-4" />
//                                 <span>Education</span>
//                             </li>
//                             <li className="flex items-center gap-2">
//                                 <Phone className="w-4 h-4" />
//                                 <span>+265 (0) 999 61 33 24</span>
//                             </li>
//                             <li className="flex items-center gap-2">
//                                 <Mail className="w-4 h-4" />
//                                 <span>support@eduspaceportal.edu</span>
//                             </li>
//                         </ul>
//                     </div>
//                 </div>
//                 <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-500 text-sm">
//                     <p>&copy; {new Date().getFullYear()} Eduspace Portal. All rights reserved.</p>
//                 </div>
//             </div>
//         </footer>
//     );
// };

// export default Footer;