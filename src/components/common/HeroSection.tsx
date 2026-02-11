import React from 'react';
import { Search, ChevronRight, AlertCircle } from 'lucide-react';

interface HeroSectionProps {
    examNumber: string;
    setExamNumber: (value: string) => void;
    isLoading: boolean;
    handleSearch: (e: React.FormEvent) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({
    examNumber,
    setExamNumber,
    isLoading,
    handleSearch
}) => {
    return (
        <section className="relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 overflow-hidden">
            <div className="absolute inset-0 opacity-20">
                <img
                    src="https://d64gsuwffb70l.cloudfront.net/694b7b0f6355b51b6b4aebac_1766554473268_2920ab90.jpg"
                    alt="Students"
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 to-indigo-800/80"></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        Check Your Child's Results
                    </h2>
                    <p className="text-lg md:text-xl text-indigo-100 mb-8">
                        Enter your child's exam number to view quarterly assessments, end of term results, and complete report cards.
                    </p>

                    <form onSubmit={handleSearch} className="max-w-xl mx-auto">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Enter Exam Number here..."
                                    value={examNumber}
                                    onChange={(e) => setExamNumber(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border-0 shadow-lg text-slate-800 placeholder-slate-400 focus:ring-4 focus:ring-indigo-300 transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!examNumber.trim() || isLoading}
                                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-400 text-white font-semibold rounded-xl shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Searching...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>View Results</span>
                                        <ChevronRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>

                        {/* --- INSTRUCTION MESSAGE - DIRECTLY BELOW INPUT --- */}
                        <div className="mt-3 flex items-start justify-start gap-1.5 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0 text-amber-300 mt-0.5" />
                            <p className="text-indigo-100">
                                <span className="font-semibold">Use dashes (-)</span>, not underscores ( _ ).
                                Example: <span className="font-mono font-bold bg-indigo-800/50 px-1.5 py-0.5 rounded">6cf-26-0101</span>
                                {' '}(not <span className="font-mono">6cf_26_0101</span>)
                            </p>
                        </div>

                    </form>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;