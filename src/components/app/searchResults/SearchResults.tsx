import React from 'react';
import { StudentData } from '@/types';
import { TabType } from '@/types/app';
import StudentInfo from './StudentInfo';
import AssessmentTabs from './AssessmentTabs';
import QAAssessment from './QAAssessment';
import ReportCard from './ReportCard';


interface SearchResultsProps {
    studentData: StudentData;
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    onPrint: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
    studentData,
    activeTab,
    setActiveTab,
    onPrint
}) => {
    // ADD THIS BLOCK HERE - right after the function opening
    if (studentData.resultsLocked) {
        return (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden p-8">
                <div className="text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🔒</span>
                    </div>
                    <h2 className="text-2xl font-bold text-red-600 mb-3">Results Withheld</h2>
                    <p className="text-slate-600 mb-4">{studentData.message}</p>
                    <div className="bg-slate-50 p-4 rounded-lg max-w-md mx-auto">
                        <p className="text-sm text-slate-500">Student: {studentData.name}</p>
                        <p className="text-sm text-slate-500">Exam No: {studentData.examNumber}</p>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="space-y-6">
            <StudentInfo studentData={studentData} />

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <AssessmentTabs activeTab={activeTab} setActiveTab={setActiveTab} studentData={studentData} />

                <div className="p-6">
                    {(activeTab === 'qa1' || activeTab === 'qa2' || activeTab === 'endOfTerm') && (
                        <QAAssessment
                            studentData={studentData}
                            activeTab={activeTab}
                        />
                    )}

                    {activeTab === 'reportCard' && (
                        <ReportCard
                            studentData={studentData}
                            onPrint={onPrint}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchResults;