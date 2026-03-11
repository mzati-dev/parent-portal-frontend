import React from 'react';
import { FileText, Award, BookOpen } from 'lucide-react';
import { StudentData } from '@/types';
import { TabType, TabItem } from '@/types/app';

interface AssessmentTabsProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    studentData: StudentData;
}

const AssessmentTabs: React.FC<AssessmentTabsProps> = ({ activeTab, setActiveTab, studentData }) => {
    const tabs: TabItem[] = [
        { id: 'qa1', label: 'Quarterly Assessment 1', icon: FileText },
        { id: 'qa2', label: 'Quarterly Assessment 2', icon: FileText },
        { id: 'endOfTerm', label: 'End of Term', icon: Award },
        { id: 'reportCard', label: 'Report Card', icon: BookOpen },
    ];

    return (
        <>
            <div className="flex flex-wrap border-b border-slate-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 min-w-[150px] px-4 py-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === tab.id
                            ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">
                            {tab.id === 'qa1' ? 'Test 1' : tab.id === 'qa2' ? 'Test 2' : tab.id === 'endOfTerm' ? 'End Of Term' : 'Report'}
                        </span>
                    </button>
                ))}
            </div>

            {/* <div className="px-6 pt-5 pb-3 bg-slate-50 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 min-w-[180px] justify-center">
                        <span className="text-base font-medium text-slate-700">Pass Mark:</span>
                        <span className="text-lg font-bold text-emerald-800">
                            {studentData.gradeConfiguration?.pass_mark || 50}%
                        </span>
                    </div>

                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 min-w-[180px] justify-center">
                        <span className="text-base font-medium text-slate-700">Attendance:</span>
                        <span className="text-lg font-bold text-amber-800">
                            {studentData.assessmentStats?.endOfTerm?.attendance?.present || studentData.attendance.present}/
                            {(studentData.assessmentStats?.endOfTerm?.attendance?.present || studentData.attendance.present) +
                                (studentData.assessmentStats?.endOfTerm?.attendance?.absent || studentData.attendance.absent)}
                        </span>
                    </div>
                </div>
            </div> */}
        </>
    );
};

export default AssessmentTabs;