import React from 'react';
import { BookOpen, MapPin, Phone, Mail } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer id="contact" className="bg-slate-900 text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-8">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            {/* <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div> */}
                            <div>
                                <h4 className="text-lg font-bold">Eduspace Portal</h4>
                                <p className="text-xs text-slate-400">A window to your child's academic success</p>
                                {/* <p className="text-xs text-slate-400">Student Results System</p> */}
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm max-w-md">
                            Providing parents with easy access to their children's academic progress and results.
                            Stay informed and support your child's educational journey.
                        </p>
                    </div>
                    <div>
                        <h5 className="font-semibold mb-4">Quick Links</h5>
                        <ul className="space-y-2 text-slate-400 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="font-semibold mb-4">Contact Us</h5>
                        <ul className="space-y-3 text-slate-400 text-sm">
                            <li className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>Education</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>+265 (0) 999 61 33 24</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>support@eduspaceportal.edu</span>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} Eduspace Portal. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;