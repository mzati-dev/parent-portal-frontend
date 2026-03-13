import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Eye } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SubjectRecord } from '@/services/studentService';
import { GradeConfiguration } from '@/services/gradeConfigService';
import ClassResultsTable from '../tables/ClassResultsTable';

interface ArchivedResultsViewProps {
    isOpen: boolean;
    onClose: () => void;
    archivedResults: any[];
    className?: string;
    schoolName?: string;
    subjects?: SubjectRecord[];
    activeConfig?: GradeConfiguration | null;
    calculateGrade?: (score: number, passMark?: number) => string;
}

const ArchivedResultsView: React.FC<ArchivedResultsViewProps> = ({
    isOpen,
    onClose,
    archivedResults,
    className,
    schoolName: propSchoolName = 'School Name',
    subjects = [],
    activeConfig = null,
    calculateGrade = (score) => {
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        if (score >= 50) return 'D';
        return 'F';
    }
}) => {
    const [selectedArchive, setSelectedArchive] = useState<any>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [activeView, setActiveView] = useState<'overall' | 'qa1' | 'qa2' | 'endOfTerm'>('overall');
    const [schoolName, setSchoolName] = useState<string>(propSchoolName);



    const getCurrentResults = (archive: any) => {
        if (!archive || !archive.results) return [];

        // Handle new structure with all assessment types
        if (archive.results.overall) {
            return archive.results[activeView] || [];
        }

        // Handle old structure (backward compatibility)
        return archive.results || [];
    };

    // Fetch school name based on the first student's exam number
    useEffect(() => {
        const fetchSchoolName = async () => {
            if (!selectedArchive || !selectedArchive.results) return;

            const results = getCurrentResults(selectedArchive);
            const firstStudent = results[0];

            if (!firstStudent || !firstStudent.examNumber) {
                setSchoolName(propSchoolName);
                return;
            }

            try {
                const token = localStorage.getItem('token');
                const response = await fetch('https://eduspace-portal-backend.onrender.com/schools', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                });

                if (response.ok) {
                    const schools: any[] = await response.json();

                    // Extract prefix from exam number
                    let examPrefix = '';
                    if (firstStudent.examNumber.includes('-')) {
                        examPrefix = firstStudent.examNumber.split('-')[0];
                    } else {
                        examPrefix = firstStudent.examNumber.substring(0, 3);
                    }

                    // Find matching school
                    const matchedSchool = schools.find(school =>
                        school.id.toString().toLowerCase().startsWith(examPrefix.toLowerCase())
                    );

                    if (matchedSchool) {
                        setSchoolName(matchedSchool.name);
                    } else {
                        setSchoolName(propSchoolName);
                    }
                }
            } catch (error) {
                console.error('Failed to load school name', error);
                setSchoolName(propSchoolName);
            }
        };

        fetchSchoolName();
    }, [selectedArchive, activeView, propSchoolName]);

    if (!isOpen) return null;

    const handleDownloadPDF = async (archive: any) => {
        setDownloading(true);
        try {
            const results = getCurrentResults(archive);
            const doc = new jsPDF('l', 'mm', 'a4');

            doc.setFontSize(16);
            doc.text(`${schoolName} - Archived Results`, 14, 15);
            doc.setFontSize(12);
            doc.text(`${archive.term} - ${archive.academicYear} (${activeView.toUpperCase()})`, 14, 25);
            doc.text(`Archived: ${new Date(archive.archivedAt).toLocaleDateString()}`, 14, 32);

            // Get all unique subject names from the results
            const subjectNames = new Set<string>();
            results.forEach((student: any) => {
                if (student.subjects) {
                    student.subjects.forEach((subject: any) => {
                        subjectNames.add(subject.name);
                    });
                }
            });
            const sortedSubjects = Array.from(subjectNames).sort();

            // Build table headers
            const tableHead = [
                'Rank',
                'Student Name',
                ...sortedSubjects,
                'Total',
                'Avg',
                'Grade',
                'Status'
            ];

            // Build table body with the same logic as ClassResultsTable
            const tableBody = results.map((student: any) => {
                // Calculate total marks and average based on active view
                let totalMarks = 0;
                let average = 0;
                let grade = 'F';
                let status = 'Failed';

                if (activeView === 'overall') {
                    // Calculate overall scores using subject final scores
                    const subjectsWithScores = student.subjects?.filter((s: any) => {
                        const hasScores = s.qa1 > 0 || s.qa2 > 0 || s.endOfTerm > 0;
                        const hasAbsent = s.qa1_absent || s.qa2_absent || s.endOfTerm_absent;
                        return hasScores || hasAbsent;
                    }) || [];

                    if (subjectsWithScores.length > 0) {
                        let totalFinalScore = 0;
                        subjectsWithScores.forEach((subject: any) => {
                            // Calculate final score based on grade config
                            let finalScore = 0;
                            if (subject.finalScore) {
                                finalScore = subject.finalScore;
                            } else {
                                // Calculate if not pre-calculated
                                const qa1 = subject.qa1 || 0;
                                const qa2 = subject.qa2 || 0;
                                const endTerm = subject.endOfTerm || 0;

                                if (activeConfig?.calculation_method === 'weighted_average') {
                                    const w1 = activeConfig.weight_qa1 || 0;
                                    const w2 = activeConfig.weight_qa2 || 0;
                                    const w3 = activeConfig.weight_end_of_term || 0;
                                    finalScore = (qa1 * w1 + qa2 * w2 + endTerm * w3) / 100;
                                } else if (activeConfig?.calculation_method === 'end_of_term_only') {
                                    finalScore = endTerm;
                                } else {
                                    finalScore = (qa1 + qa2 + endTerm) / 3;
                                }
                            }
                            totalFinalScore += finalScore;
                        });

                        average = totalFinalScore / subjectsWithScores.length;
                        totalMarks = totalFinalScore;
                        grade = calculateGrade(average);
                        status = grade === 'F' ? 'Failed' : 'Passed';
                    }
                } else {
                    // Calculate for specific assessment type (QA1, QA2, End Term)
                    student.subjects?.forEach((subject: any) => {
                        let score = 0;
                        let isAbsent = false;

                        if (activeView === 'qa1') {
                            score = subject.qa1;
                            isAbsent = subject.qa1_absent;
                        } else if (activeView === 'qa2') {
                            score = subject.qa2;
                            isAbsent = subject.qa2_absent;
                        } else { // endOfTerm
                            score = subject.endOfTerm;
                            isAbsent = subject.endOfTerm_absent;
                        }

                        if (!isAbsent && score !== null && score >= 0) {
                            totalMarks += score;
                        }
                    });

                    const subjectCount = student.subjects?.length || 1;
                    average = totalMarks / subjectCount;
                    grade = calculateGrade(average);
                    status = grade === 'F' ? 'Failed' : 'Passed';
                }

                // Build subject columns
                const subjectCols = sortedSubjects.map(subjName => {
                    const subject = student.subjects?.find((s: any) => s.name === subjName);
                    if (!subject) return '-';

                    if (activeView === 'overall') {
                        const hasScores = (subject.qa1 !== null && subject.qa1 >= 0) ||
                            (subject.qa2 !== null && subject.qa2 >= 0) ||
                            (subject.endOfTerm !== null && subject.endOfTerm >= 0);
                        const hasAbsent = subject.qa1_absent || subject.qa2_absent || subject.endOfTerm_absent;

                        if (!hasScores && !hasAbsent) return '-';

                        let finalScore = subject.finalScore;
                        if (!finalScore) {
                            const qa1 = subject.qa1 || 0;
                            const qa2 = subject.qa2 || 0;
                            const endTerm = subject.endOfTerm || 0;

                            if (activeConfig?.calculation_method === 'weighted_average') {
                                const w1 = activeConfig.weight_qa1 || 0;
                                const w2 = activeConfig.weight_qa2 || 0;
                                const w3 = activeConfig.weight_end_of_term || 0;
                                finalScore = (qa1 * w1 + qa2 * w2 + endTerm * w3) / 100;
                            } else if (activeConfig?.calculation_method === 'end_of_term_only') {
                                finalScore = endTerm;
                            } else {
                                finalScore = (qa1 + qa2 + endTerm) / 3;
                            }
                        }

                        const subjectGrade = calculateGrade(finalScore);

                        if (subject.endOfTerm_absent) {
                            return `AB (${subjectGrade})`;
                        }

                        return `${finalScore.toFixed(1)} (${subjectGrade})`;
                    } else {
                        let score = 0;
                        let isAbsent = false;

                        if (activeView === 'qa1') {
                            score = subject.qa1;
                            isAbsent = subject.qa1_absent;
                        } else if (activeView === 'qa2') {
                            score = subject.qa2;
                            isAbsent = subject.qa2_absent;
                        } else {
                            score = subject.endOfTerm;
                            isAbsent = subject.endOfTerm_absent;
                        }

                        if (isAbsent) return 'AB';
                        if (score !== null && score >= 0) {
                            const subjectGrade = calculateGrade(score);
                            return `${score} (${subjectGrade})`;
                        }
                        return '-';
                    }
                });

                return [
                    student.rank || '-',
                    student.name,
                    ...subjectCols,
                    totalMarks.toFixed(1),
                    average.toFixed(1) + '%',
                    grade,
                    status
                ];
            });

            autoTable(doc, {
                head: [tableHead],
                body: tableBody,
                startY: 40,
                styles: { fontSize: 7, cellPadding: 1 },
                headStyles: { fillColor: [63, 81, 181] }
            });

            doc.save(`${archive.term}_${archive.academicYear}_${activeView}_Archived_Results.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setDownloading(false);
        }
    };

    const renderAssessmentTypeTabs = (archive: any) => {
        if (!archive.results?.overall) return null;

        return (
            <div className="flex gap-2 mb-4 border-b border-slate-200 pb-2">
                {[
                    { id: 'overall', label: 'Overall' },
                    { id: 'qa1', label: 'QA1' },
                    { id: 'qa2', label: 'QA2' },
                    { id: 'endOfTerm', label: 'End Term' }
                ].map(type => (
                    <button
                        key={type.id}
                        onClick={() => setActiveView(type.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeView === type.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        {type.label}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800">📚 Archived Results</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {!showDetail ? (
                        // List view
                        archivedResults.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">No archived results found</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {archivedResults.map((archive, index) => {
                                    const hasMultipleTypes = archive.results?.overall ? true : false;
                                    const displayResults = hasMultipleTypes
                                        ? archive.results.overall
                                        : archive.results;

                                    return (
                                        <div key={index} className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-slate-800">
                                                        {archive.term} - {archive.academicYear}
                                                    </h3>
                                                    <p className="text-xs text-slate-500">
                                                        Archived: {new Date(archive.archivedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                {/* <span className={`px-2 py-1 text-xs rounded-full ${archive.is_published
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {archive.is_published ? 'Published' : 'Draft'}
                                                </span> */}
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                                                <div className="bg-slate-50 p-2 rounded">
                                                    <p className="text-xs text-slate-500">Students</p>
                                                    <p className="font-semibold">{displayResults?.length || 0}</p>
                                                </div>
                                                <div className="bg-slate-50 p-2 rounded">
                                                    <p className="text-xs text-slate-500">Pass Rate</p>
                                                    <p className="font-semibold">
                                                        {displayResults ?
                                                            Math.round((displayResults.filter((r: any) => r.overallGrade !== 'F').length / displayResults.length) * 100) : 0}%
                                                    </p>
                                                </div>
                                                <div className="bg-slate-50 p-2 rounded">
                                                    <p className="text-xs text-slate-500">Class Avg</p>
                                                    <p className="font-semibold">
                                                        {displayResults ?
                                                            (displayResults.reduce((acc: number, r: any) => acc + (r.average || 0), 0) / displayResults.length).toFixed(1) : 0}%
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedArchive(archive);
                                                        setShowDetail(true);
                                                    }}
                                                    className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadPDF(archive)}
                                                    disabled={downloading}
                                                    className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    PDF
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        // Detail view for single archive
                        <div>
                            <button
                                onClick={() => setShowDetail(false)}
                                className="mb-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                            >
                                ← Back to Archives
                            </button>

                            {selectedArchive && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold">
                                                {selectedArchive.term} - {selectedArchive.academicYear}
                                            </h3>
                                            <p className="text-sm text-slate-500">{schoolName}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDownloadPDF(selectedArchive)}
                                            disabled={downloading}
                                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1"
                                        >
                                            {downloading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Downloading...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-4 h-4" />
                                                    Download PDF
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Assessment Type Tabs */}
                                    {renderAssessmentTypeTabs(selectedArchive)}

                                    {/* Use ClassResultsTable to display the results */}
                                    <div className="border rounded-lg overflow-hidden">
                                        <ClassResultsTable
                                            classResults={getCurrentResults(selectedArchive)}
                                            subjects={subjects}
                                            activeAssessmentType={activeView}
                                            activeConfig={activeConfig}
                                            calculateGrade={calculateGrade}
                                            onPrint={() => { }}
                                            onExport={() => handleDownloadPDF(selectedArchive)}
                                            isDownloading={downloading}
                                            hideDownload={true}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-200 p-4 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArchivedResultsView;


// import React, { useState } from 'react';
// import { X, FileText, Download, Eye } from 'lucide-react';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// // import ClassResultsTable from '../ClassResultsTable'; // Import the same table component
// import { SubjectRecord } from '@/services/studentService';
// import { GradeConfiguration } from '@/services/gradeConfigService';
// import ClassResultsTable from '../tables/ClassResultsTable';

// interface ArchivedResultsViewProps {
//     isOpen: boolean;
//     onClose: () => void;
//     archivedResults: any[];
//     className?: string;
//     schoolName?: string;
//     subjects?: SubjectRecord[]; // Add these props
//     activeConfig?: GradeConfiguration | null;
//     calculateGrade?: (score: number, passMark?: number) => string;
// }

// const ArchivedResultsView: React.FC<ArchivedResultsViewProps> = ({
//     isOpen,
//     onClose,
//     archivedResults,
//     className,
//     schoolName = 'School Name',
//     subjects = [],
//     activeConfig = null,
//     calculateGrade = (score) => score >= 50 ? 'Pass' : 'Fail'
// }) => {
//     const [selectedArchive, setSelectedArchive] = useState<any>(null);
//     const [showDetail, setShowDetail] = useState(false);
//     const [downloading, setDownloading] = useState(false);
//     const [activeView, setActiveView] = useState<'overall' | 'qa1' | 'qa2' | 'endOfTerm'>('overall');

//     if (!isOpen) return null;

//     const getCurrentResults = (archive: any) => {
//         if (!archive || !archive.results) return [];

//         // Handle new structure with all assessment types
//         if (archive.results.overall) {
//             return archive.results[activeView] || [];
//         }

//         // Handle old structure (backward compatibility)
//         return archive.results || [];
//     };

//     const handleDownloadPDF = async (archive: any) => {
//         setDownloading(true);
//         try {
//             const results = getCurrentResults(archive);
//             const doc = new jsPDF('l', 'mm', 'a4');

//             doc.setFontSize(16);
//             doc.text(`${schoolName} - Archived Results`, 14, 15);
//             doc.setFontSize(12);
//             doc.text(`${archive.term} - ${archive.academicYear} (${activeView.toUpperCase()})`, 14, 25);
//             doc.text(`Archived: ${new Date(archive.archivedAt).toLocaleDateString()}`, 14, 32);

//             // Get all unique subject names from the results
//             const subjectNames = new Set<string>();
//             results.forEach((student: any) => {
//                 if (student.subjects) {
//                     student.subjects.forEach((subject: any) => {
//                         subjectNames.add(subject.name);
//                     });
//                 }
//             });
//             const sortedSubjects = Array.from(subjectNames).sort();

//             // Build table headers
//             const tableHead = [
//                 'Rank',
//                 'Student Name',
//                 ...sortedSubjects,
//                 'Total',
//                 'Avg',
//                 'Grade',
//                 'Status'
//             ];

//             // Build table body with the same logic as ClassResultsTable
//             const tableBody = results.map((student: any) => {
//                 // Calculate total marks and average based on active view
//                 let totalMarks = 0;
//                 let average = 0;
//                 let grade = 'F';
//                 let status = 'Failed';

//                 if (activeView === 'overall') {
//                     // Calculate overall scores using subject final scores
//                     const subjectsWithScores = student.subjects?.filter((s: any) => {
//                         const hasScores = s.qa1 > 0 || s.qa2 > 0 || s.endOfTerm > 0;
//                         const hasAbsent = s.qa1_absent || s.qa2_absent || s.endOfTerm_absent;
//                         return hasScores || hasAbsent;
//                     }) || [];

//                     if (subjectsWithScores.length > 0) {
//                         let totalFinalScore = 0;
//                         subjectsWithScores.forEach((subject: any) => {
//                             // Calculate final score based on grade config
//                             let finalScore = 0;
//                             if (subject.finalScore) {
//                                 finalScore = subject.finalScore;
//                             } else {
//                                 // Calculate if not pre-calculated
//                                 const qa1 = subject.qa1 || 0;
//                                 const qa2 = subject.qa2 || 0;
//                                 const endTerm = subject.endOfTerm || 0;

//                                 if (activeConfig?.calculation_method === 'weighted_average') {
//                                     const w1 = activeConfig.weight_qa1 || 0;
//                                     const w2 = activeConfig.weight_qa2 || 0;
//                                     const w3 = activeConfig.weight_end_of_term || 0;
//                                     finalScore = (qa1 * w1 + qa2 * w2 + endTerm * w3) / 100;
//                                 } else if (activeConfig?.calculation_method === 'end_of_term_only') {
//                                     finalScore = endTerm;
//                                 } else {
//                                     finalScore = (qa1 + qa2 + endTerm) / 3;
//                                 }
//                             }
//                             totalFinalScore += finalScore;
//                         });

//                         average = totalFinalScore / subjectsWithScores.length;
//                         totalMarks = totalFinalScore;
//                         grade = calculateGrade(average);
//                         status = grade === 'F' ? 'Failed' : 'Passed';
//                     }
//                 } else {
//                     // Calculate for specific assessment type (QA1, QA2, End Term)
//                     student.subjects?.forEach((subject: any) => {
//                         let score = 0;
//                         let isAbsent = false;

//                         if (activeView === 'qa1') {
//                             score = subject.qa1;
//                             isAbsent = subject.qa1_absent;
//                         } else if (activeView === 'qa2') {
//                             score = subject.qa2;
//                             isAbsent = subject.qa2_absent;
//                         } else { // endOfTerm
//                             score = subject.endOfTerm;
//                             isAbsent = subject.endOfTerm_absent;
//                         }

//                         if (!isAbsent && score !== null && score >= 0) {
//                             totalMarks += score;
//                         }
//                     });

//                     const subjectCount = student.subjects?.length || 1;
//                     average = totalMarks / subjectCount;
//                     grade = calculateGrade(average);
//                     status = grade === 'F' ? 'Failed' : 'Passed';
//                 }

//                 // Build subject columns
//                 const subjectCols = sortedSubjects.map(subjName => {
//                     const subject = student.subjects?.find((s: any) => s.name === subjName);
//                     if (!subject) return '-';

//                     if (activeView === 'overall') {
//                         const hasScores = (subject.qa1 !== null && subject.qa1 >= 0) ||
//                             (subject.qa2 !== null && subject.qa2 >= 0) ||
//                             (subject.endOfTerm !== null && subject.endOfTerm >= 0);
//                         const hasAbsent = subject.qa1_absent || subject.qa2_absent || subject.endOfTerm_absent;

//                         if (!hasScores && !hasAbsent) return '-';

//                         let finalScore = subject.finalScore;
//                         if (!finalScore) {
//                             const qa1 = subject.qa1 || 0;
//                             const qa2 = subject.qa2 || 0;
//                             const endTerm = subject.endOfTerm || 0;

//                             if (activeConfig?.calculation_method === 'weighted_average') {
//                                 const w1 = activeConfig.weight_qa1 || 0;
//                                 const w2 = activeConfig.weight_qa2 || 0;
//                                 const w3 = activeConfig.weight_end_of_term || 0;
//                                 finalScore = (qa1 * w1 + qa2 * w2 + endTerm * w3) / 100;
//                             } else if (activeConfig?.calculation_method === 'end_of_term_only') {
//                                 finalScore = endTerm;
//                             } else {
//                                 finalScore = (qa1 + qa2 + endTerm) / 3;
//                             }
//                         }

//                         const subjectGrade = calculateGrade(finalScore);

//                         if (subject.endOfTerm_absent) {
//                             return `AB (${subjectGrade})`;
//                         }

//                         return `${finalScore.toFixed(1)} (${subjectGrade})`;
//                     } else {
//                         let score = 0;
//                         let isAbsent = false;

//                         if (activeView === 'qa1') {
//                             score = subject.qa1;
//                             isAbsent = subject.qa1_absent;
//                         } else if (activeView === 'qa2') {
//                             score = subject.qa2;
//                             isAbsent = subject.qa2_absent;
//                         } else {
//                             score = subject.endOfTerm;
//                             isAbsent = subject.endOfTerm_absent;
//                         }

//                         if (isAbsent) return 'AB';
//                         if (score !== null && score >= 0) {
//                             const subjectGrade = calculateGrade(score);
//                             return `${score} (${subjectGrade})`;
//                         }
//                         return '-';
//                     }
//                 });

//                 return [
//                     student.rank || '-',
//                     student.name,
//                     ...subjectCols,
//                     totalMarks.toFixed(1),
//                     average.toFixed(1) + '%',
//                     grade,
//                     status
//                 ];
//             });

//             autoTable(doc, {
//                 head: [tableHead],
//                 body: tableBody,
//                 startY: 40,
//                 styles: { fontSize: 7, cellPadding: 1 },
//                 headStyles: { fillColor: [63, 81, 181] }
//             });

//             doc.save(`${archive.term}_${archive.academicYear}_${activeView}_Archived_Results.pdf`);
//         } catch (error) {
//             console.error('Error generating PDF:', error);
//         } finally {
//             setDownloading(false);
//         }
//     };

//     const renderAssessmentTypeTabs = (archive: any) => {
//         if (!archive.results?.overall) return null;

//         return (
//             <div className="flex gap-2 mb-4 border-b border-slate-200 pb-2">
//                 {[
//                     { id: 'overall', label: 'Overall' },
//                     { id: 'qa1', label: 'QA1' },
//                     { id: 'qa2', label: 'QA2' },
//                     { id: 'endOfTerm', label: 'End Term' }
//                 ].map(type => (
//                     <button
//                         key={type.id}
//                         onClick={() => setActiveView(type.id as any)}
//                         className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeView === type.id
//                             ? 'bg-indigo-600 text-white'
//                             : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
//                             }`}
//                     >
//                         {type.label}
//                     </button>
//                 ))}
//             </div>
//         );
//     };

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
//                 <div className="flex items-center justify-between p-6 border-b border-slate-200">
//                     <h2 className="text-xl font-semibold text-slate-800">📚 Archived Results</h2>
//                     <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
//                         <X className="w-5 h-5 text-slate-500" />
//                     </button>
//                 </div>

//                 <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
//                     {!showDetail ? (
//                         // List view
//                         archivedResults.length === 0 ? (
//                             <div className="text-center py-12">
//                                 <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
//                                 <p className="text-slate-500">No archived results found</p>
//                             </div>
//                         ) : (
//                             <div className="grid gap-4 md:grid-cols-2">
//                                 {archivedResults.map((archive, index) => {
//                                     const hasMultipleTypes = archive.results?.overall ? true : false;
//                                     const displayResults = hasMultipleTypes
//                                         ? archive.results.overall
//                                         : archive.results;

//                                     return (
//                                         <div key={index} className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
//                                             <div className="flex justify-between items-start mb-3">
//                                                 <div>
//                                                     <h3 className="font-semibold text-slate-800">
//                                                         {archive.term} - {archive.academicYear}
//                                                     </h3>
//                                                     <p className="text-xs text-slate-500">
//                                                         Archived: {new Date(archive.archivedAt).toLocaleDateString()}
//                                                     </p>
//                                                 </div>
//                                                 <span className={`px-2 py-1 text-xs rounded-full ${archive.is_published
//                                                     ? 'bg-green-100 text-green-700'
//                                                     : 'bg-slate-100 text-slate-600'
//                                                     }`}>
//                                                     {archive.is_published ? 'Published' : 'Draft'}
//                                                 </span>
//                                             </div>

//                                             <div className="grid grid-cols-3 gap-2 text-sm mb-4">
//                                                 <div className="bg-slate-50 p-2 rounded">
//                                                     <p className="text-xs text-slate-500">Students</p>
//                                                     <p className="font-semibold">{displayResults?.length || 0}</p>
//                                                 </div>
//                                                 <div className="bg-slate-50 p-2 rounded">
//                                                     <p className="text-xs text-slate-500">Pass Rate</p>
//                                                     <p className="font-semibold">
//                                                         {displayResults ?
//                                                             Math.round((displayResults.filter((r: any) => r.overallGrade !== 'F').length / displayResults.length) * 100) : 0}%
//                                                     </p>
//                                                 </div>
//                                                 <div className="bg-slate-50 p-2 rounded">
//                                                     <p className="text-xs text-slate-500">Class Avg</p>
//                                                     <p className="font-semibold">
//                                                         {displayResults ?
//                                                             (displayResults.reduce((acc: number, r: any) => acc + (r.average || 0), 0) / displayResults.length).toFixed(1) : 0}%
//                                                     </p>
//                                                 </div>
//                                             </div>

//                                             <div className="flex gap-2">
//                                                 <button
//                                                     onClick={() => {
//                                                         setSelectedArchive(archive);
//                                                         setShowDetail(true);
//                                                     }}
//                                                     className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
//                                                 >
//                                                     <Eye className="w-4 h-4" />
//                                                     View
//                                                 </button>
//                                                 <button
//                                                     onClick={() => handleDownloadPDF(archive)}
//                                                     disabled={downloading}
//                                                     className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
//                                                 >
//                                                     <Download className="w-4 h-4" />
//                                                     PDF
//                                                 </button>
//                                             </div>
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         )
//                     ) : (
//                         // Detail view for single archive - Use the same table as live results!
//                         <div>
//                             <button
//                                 onClick={() => setShowDetail(false)}
//                                 className="mb-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
//                             >
//                                 ← Back to Archives
//                             </button>

//                             {selectedArchive && (
//                                 <div>
//                                     <div className="flex justify-between items-center mb-4">
//                                         <h3 className="text-lg font-semibold">
//                                             {selectedArchive.term} - {selectedArchive.academicYear}
//                                         </h3>
//                                         <button
//                                             onClick={() => handleDownloadPDF(selectedArchive)}
//                                             disabled={downloading}
//                                             className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1"
//                                         >
//                                             {downloading ? (
//                                                 <>
//                                                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                                                     Downloading...
//                                                 </>
//                                             ) : (
//                                                 <>
//                                                     <Download className="w-4 h-4" />
//                                                     Download PDF
//                                                 </>
//                                             )}
//                                         </button>
//                                     </div>

//                                     {/* Assessment Type Tabs */}
//                                     {renderAssessmentTypeTabs(selectedArchive)}

//                                     {/* Use the same ClassResultsTable component! */}
//                                     <div className="border rounded-lg overflow-hidden">
//                                         <ClassResultsTable
//                                             classResults={getCurrentResults(selectedArchive)}
//                                             subjects={subjects}
//                                             activeAssessmentType={activeView}
//                                             activeConfig={activeConfig}
//                                             calculateGrade={calculateGrade}
//                                             onPrint={() => { }}
//                                             onExport={() => handleDownloadPDF(selectedArchive)}
//                                             isDownloading={downloading}
//                                         />
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     )}
//                 </div>

//                 <div className="border-t border-slate-200 p-4 bg-slate-50">
//                     <button
//                         onClick={onClose}
//                         className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
//                     >
//                         Close
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ArchivedResultsView;


// import React, { useState } from 'react';
// import { X, FileText, Download, Mail, Eye, BarChart2 } from 'lucide-react';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';

// interface ArchivedResultsViewProps {
//     isOpen: boolean;
//     onClose: () => void;
//     archivedResults: any[];
//     className?: string;
//     schoolName?: string;
// }

// const ArchivedResultsView: React.FC<ArchivedResultsViewProps> = ({
//     isOpen,
//     onClose,
//     archivedResults,
//     className,
//     schoolName = 'School Name'
// }) => {
//     const [selectedArchive, setSelectedArchive] = useState<any>(null);
//     const [showDetail, setShowDetail] = useState(false);
//     const [downloading, setDownloading] = useState(false);
//     const [activeView, setActiveView] = useState<'overall' | 'qa1' | 'qa2' | 'endOfTerm'>('overall');

//     if (!isOpen) return null;

//     const getCurrentResults = (archive: any) => {
//         if (!archive || !archive.results) return [];

//         // Handle new structure with all assessment types
//         if (archive.results.overall) {
//             return archive.results[activeView] || [];
//         }

//         // Handle old structure (backward compatibility)
//         return archive.results || [];
//     };

//     const handleDownloadPDF = async (archive: any) => {
//         setDownloading(true);
//         try {
//             const results = getCurrentResults(archive);
//             const doc = new jsPDF('l', 'mm', 'a4');

//             doc.setFontSize(16);
//             doc.text(`${schoolName} - Archived Results`, 14, 15);
//             doc.setFontSize(12);
//             doc.text(`${archive.term} - ${archive.academicYear} (${activeView.toUpperCase()})`, 14, 25);
//             doc.text(`Archived: ${new Date(archive.archivedAt).toLocaleDateString()}`, 14, 32);

//             const tableData = results.map((student: any) => [
//                 student.rank || '-',
//                 student.name,
//                 student.examNumber,
//                 (student.average || 0).toFixed(1) + '%',
//                 student.overallGrade || 'F'
//             ]) || [];

//             autoTable(doc, {
//                 head: [['Rank', 'Student', 'Exam No.', 'Average', 'Grade']],
//                 body: tableData,
//                 startY: 40,
//                 styles: { fontSize: 8 },
//                 headStyles: { fillColor: [63, 81, 181] }
//             });

//             doc.save(`${archive.term}_${archive.academicYear}_${activeView}_Archived_Results.pdf`);
//         } catch (error) {
//             console.error('Error generating PDF:', error);
//         } finally {
//             setDownloading(false);
//         }
//     };

//     const handleSendToParents = (archive: any) => {
//         alert('Send to parents feature coming soon!');
//     };

//     const renderAssessmentTypeTabs = (archive: any) => {
//         if (!archive.results?.overall) return null; // Only show tabs if using new structure

//         return (
//             <div className="flex gap-2 mb-4 border-b border-slate-200 pb-2">
//                 {[
//                     { id: 'overall', label: 'Overall' },
//                     { id: 'qa1', label: 'QA1' },
//                     { id: 'qa2', label: 'QA2' },
//                     { id: 'endOfTerm', label: 'End Term' }
//                 ].map(type => (
//                     <button
//                         key={type.id}
//                         onClick={() => setActiveView(type.id as any)}
//                         className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeView === type.id
//                                 ? 'bg-indigo-600 text-white'
//                                 : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
//                             }`}
//                     >
//                         {type.label}
//                     </button>
//                 ))}
//             </div>
//         );
//     };

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
//                 <div className="flex items-center justify-between p-6 border-b border-slate-200">
//                     <h2 className="text-xl font-semibold text-slate-800">📚 Archived Results</h2>
//                     <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
//                         <X className="w-5 h-5 text-slate-500" />
//                     </button>
//                 </div>

//                 <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
//                     {!showDetail ? (
//                         // List view
//                         archivedResults.length === 0 ? (
//                             <div className="text-center py-12">
//                                 <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
//                                 <p className="text-slate-500">No archived results found</p>
//                             </div>
//                         ) : (
//                             <div className="grid gap-4 md:grid-cols-2">
//                                 {archivedResults.map((archive, index) => {
//                                     const hasMultipleTypes = archive.results?.overall ? true : false;
//                                     const displayResults = hasMultipleTypes
//                                         ? archive.results.overall
//                                         : archive.results;

//                                     return (
//                                         <div key={index} className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
//                                             <div className="flex justify-between items-start mb-3">
//                                                 <div>
//                                                     <h3 className="font-semibold text-slate-800">
//                                                         {archive.term} - {archive.academicYear}
//                                                     </h3>
//                                                     <p className="text-xs text-slate-500">
//                                                         Archived: {new Date(archive.archivedAt).toLocaleDateString()}
//                                                     </p>
//                                                 </div>
//                                                 <span className={`px-2 py-1 text-xs rounded-full ${archive.is_published
//                                                     ? 'bg-green-100 text-green-700'
//                                                     : 'bg-slate-100 text-slate-600'
//                                                     }`}>
//                                                     {archive.is_published ? 'Published' : 'Draft'}
//                                                 </span>
//                                             </div>

//                                             <div className="grid grid-cols-3 gap-2 text-sm mb-4">
//                                                 <div className="bg-slate-50 p-2 rounded">
//                                                     <p className="text-xs text-slate-500">Students</p>
//                                                     <p className="font-semibold">{displayResults?.length || 0}</p>
//                                                 </div>
//                                                 <div className="bg-slate-50 p-2 rounded">
//                                                     <p className="text-xs text-slate-500">Pass Rate</p>
//                                                     <p className="font-semibold">
//                                                         {displayResults ?
//                                                             Math.round((displayResults.filter((r: any) => r.overallGrade !== 'F').length / displayResults.length) * 100) : 0}%
//                                                     </p>
//                                                 </div>
//                                                 <div className="bg-slate-50 p-2 rounded">
//                                                     <p className="text-xs text-slate-500">Class Avg</p>
//                                                     <p className="font-semibold">
//                                                         {displayResults ?
//                                                             (displayResults.reduce((acc: number, r: any) => acc + (r.average || 0), 0) / displayResults.length).toFixed(1) : 0}%
//                                                     </p>
//                                                 </div>
//                                             </div>

//                                             <div className="flex gap-2">
//                                                 <button
//                                                     onClick={() => {
//                                                         setSelectedArchive(archive);
//                                                         setShowDetail(true);
//                                                     }}
//                                                     className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
//                                                 >
//                                                     <Eye className="w-4 h-4" />
//                                                     View
//                                                 </button>
//                                                 <button
//                                                     onClick={() => {
//                                                         setSelectedArchive(archive);
//                                                         setShowDetail(true);
//                                                         // Optionally switch to a specific view
//                                                     }}
//                                                     className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
//                                                 >
//                                                     <Download className="w-4 h-4" />
//                                                     PDF
//                                                 </button>
//                                                 <button
//                                                     onClick={() => handleSendToParents(archive)}
//                                                     className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
//                                                 >
//                                                     <Mail className="w-4 h-4" />
//                                                     Email
//                                                 </button>
//                                             </div>
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         )
//                     ) : (
//                         // Detail view for single archive
//                         <div>
//                             <button
//                                 onClick={() => setShowDetail(false)}
//                                 className="mb-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
//                             >
//                                 ← Back to Archives
//                             </button>

//                             {selectedArchive && (
//                                 <div>
//                                     <div className="flex justify-between items-center mb-4">
//                                         <h3 className="text-lg font-semibold">
//                                             {selectedArchive.term} - {selectedArchive.academicYear}
//                                         </h3>
//                                         <button
//                                             onClick={() => handleDownloadPDF(selectedArchive)}
//                                             disabled={downloading}
//                                             className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1"
//                                         >
//                                             {downloading ? (
//                                                 <>
//                                                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                                                     Downloading...
//                                                 </>
//                                             ) : (
//                                                 <>
//                                                     <Download className="w-4 h-4" />
//                                                     Download PDF
//                                                 </>
//                                             )}
//                                         </button>
//                                     </div>

//                                     {/* Assessment Type Tabs */}
//                                     {renderAssessmentTypeTabs(selectedArchive)}

//                                     <table className="w-full border-collapse">
//                                         <thead className="bg-slate-50">
//                                             <tr>
//                                                 <th className="px-4 py-2 text-left">Rank</th>
//                                                 <th className="px-4 py-2 text-left">Student</th>
//                                                 <th className="px-4 py-2 text-left">Exam No.</th>
//                                                 <th className="px-4 py-2 text-left">Average</th>
//                                                 <th className="px-4 py-2 text-left">Grade</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {getCurrentResults(selectedArchive).map((student: any, idx: number) => (
//                                                 <tr key={idx} className="border-b">
//                                                     <td className="px-4 py-2">{student.rank || idx + 1}</td>
//                                                     <td className="px-4 py-2">{student.name}</td>
//                                                     <td className="px-4 py-2">{student.examNumber}</td>
//                                                     <td className="px-4 py-2">{(student.average || 0).toFixed(1)}%</td>
//                                                     <td className="px-4 py-2">
//                                                         <span className={`px-2 py-1 rounded-full text-xs ${student.overallGrade === 'F' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
//                                                             }`}>
//                                                             {student.overallGrade || 'F'}
//                                                         </span>
//                                                     </td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             )}
//                         </div>
//                     )}
//                 </div>

//                 <div className="border-t border-slate-200 p-4 bg-slate-50">
//                     <button
//                         onClick={onClose}
//                         className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
//                     >
//                         Close
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ArchivedResultsView;



// import React, { useState } from 'react';
// import { X, FileText, Download, Mail, Eye } from 'lucide-react';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';

// interface ArchivedResultsViewProps {
//     isOpen: boolean;
//     onClose: () => void;
//     archivedResults: any[];
//     className?: string;
//     schoolName?: string;
// }

// const ArchivedResultsView: React.FC<ArchivedResultsViewProps> = ({
//     isOpen,
//     onClose,
//     archivedResults,
//     className,
//     schoolName = 'School Name'
// }) => {
//     const [selectedArchive, setSelectedArchive] = useState<any>(null);
//     const [showDetail, setShowDetail] = useState(false);
//     const [downloading, setDownloading] = useState(false);

//     if (!isOpen) return null;

//     const handleDownloadPDF = async (archive: any) => {
//         setDownloading(true);
//         try {
//             const doc = new jsPDF('l', 'mm', 'a4');

//             // Generate PDF similar to your ClassResultsManagement PDF
//             doc.setFontSize(16);
//             doc.text(`${schoolName} - Archived Results`, 14, 15);
//             doc.setFontSize(12);
//             doc.text(`${archive.term} - ${archive.academicYear}`, 14, 25);
//             doc.text(`Archived: ${new Date(archive.archivedAt).toLocaleDateString()}`, 14, 32);

//             // Create table with results
//             const tableData = archive.results?.map((student: any) => [
//                 student.rank || '-',
//                 student.name,
//                 student.examNumber,
//                 (student.average || 0).toFixed(1) + '%',
//                 student.overallGrade || 'F'
//             ]) || [];

//             autoTable(doc, {
//                 head: [['Rank', 'Student', 'Exam No.', 'Average', 'Grade']],
//                 body: tableData,
//                 startY: 40,
//                 styles: { fontSize: 8 },
//                 headStyles: { fillColor: [63, 81, 181] }
//             });

//             doc.save(`${archive.term}_${archive.academicYear}_Archived_Results.pdf`);
//         } catch (error) {
//             console.error('Error generating PDF:', error);
//         } finally {
//             setDownloading(false);
//         }
//     };

//     const handleSendToParents = (archive: any) => {
//         // You can implement email functionality here
//         // This could open a modal with parent email list
//         alert('Send to parents feature coming soon!');
//     };

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
//                 <div className="flex items-center justify-between p-6 border-b border-slate-200">
//                     <h2 className="text-xl font-semibold text-slate-800">📚 Archived Results</h2>
//                     <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
//                         <X className="w-5 h-5 text-slate-500" />
//                     </button>
//                 </div>

//                 <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
//                     {!showDetail ? (
//                         // List view
//                         archivedResults.length === 0 ? (
//                             <div className="text-center py-12">
//                                 <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
//                                 <p className="text-slate-500">No archived results found</p>
//                             </div>
//                         ) : (
//                             <div className="grid gap-4 md:grid-cols-2">
//                                 {archivedResults.map((archive, index) => (
//                                     <div key={index} className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
//                                         <div className="flex justify-between items-start mb-3">
//                                             <div>
//                                                 <h3 className="font-semibold text-slate-800">
//                                                     {archive.term} - {archive.academicYear}
//                                                 </h3>
//                                                 <p className="text-xs text-slate-500">
//                                                     Archived: {new Date(archive.archivedAt).toLocaleDateString()}
//                                                 </p>
//                                             </div>
//                                             <span className={`px-2 py-1 text-xs rounded-full ${archive.is_published
//                                                     ? 'bg-green-100 text-green-700'
//                                                     : 'bg-slate-100 text-slate-600'
//                                                 }`}>
//                                                 {archive.is_published ? 'Published' : 'Draft'}
//                                             </span>
//                                         </div>

//                                         <div className="grid grid-cols-3 gap-2 text-sm mb-4">
//                                             <div className="bg-slate-50 p-2 rounded">
//                                                 <p className="text-xs text-slate-500">Students</p>
//                                                 <p className="font-semibold">{archive.results?.length || 0}</p>
//                                             </div>
//                                             <div className="bg-slate-50 p-2 rounded">
//                                                 <p className="text-xs text-slate-500">Pass Rate</p>
//                                                 <p className="font-semibold">
//                                                     {archive.results ?
//                                                         Math.round((archive.results.filter((r: any) => r.overallGrade !== 'F').length / archive.results.length) * 100) : 0}%
//                                                 </p>
//                                             </div>
//                                             <div className="bg-slate-50 p-2 rounded">
//                                                 <p className="text-xs text-slate-500">Class Avg</p>
//                                                 <p className="font-semibold">
//                                                     {archive.results ?
//                                                         (archive.results.reduce((acc: number, r: any) => acc + (r.average || 0), 0) / archive.results.length).toFixed(1) : 0}%
//                                                 </p>
//                                             </div>
//                                         </div>

//                                         <div className="flex gap-2">
//                                             <button
//                                                 onClick={() => {
//                                                     setSelectedArchive(archive);
//                                                     setShowDetail(true);
//                                                 }}
//                                                 className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
//                                             >
//                                                 <Eye className="w-4 h-4" />
//                                                 View
//                                             </button>
//                                             <button
//                                                 onClick={() => handleDownloadPDF(archive)}
//                                                 disabled={downloading}
//                                                 className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
//                                             >
//                                                 <Download className="w-4 h-4" />
//                                                 PDF
//                                             </button>
//                                             <button
//                                                 onClick={() => handleSendToParents(archive)}
//                                                 className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
//                                             >
//                                                 <Mail className="w-4 h-4" />
//                                                 Email
//                                             </button>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         )
//                     ) : (
//                         // Detail view for single archive
//                         <div>
//                             <button
//                                 onClick={() => setShowDetail(false)}
//                                 className="mb-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
//                             >
//                                 ← Back to Archives
//                             </button>

//                             {selectedArchive && (
//                                 <div>
//                                     <div className="flex justify-between items-center mb-4">
//                                         <h3 className="text-lg font-semibold">
//                                             {selectedArchive.term} - {selectedArchive.academicYear}
//                                         </h3>
//                                         <div className="flex gap-2">
//                                             <button
//                                                 onClick={() => handleDownloadPDF(selectedArchive)}
//                                                 className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1"
//                                             >
//                                                 <Download className="w-4 h-4" />
//                                                 Download PDF
//                                             </button>
//                                         </div>
//                                     </div>

//                                     <table className="w-full border-collapse">
//                                         <thead className="bg-slate-50">
//                                             <tr>
//                                                 <th className="px-4 py-2 text-left">Rank</th>
//                                                 <th className="px-4 py-2 text-left">Student</th>
//                                                 <th className="px-4 py-2 text-left">Exam No.</th>
//                                                 <th className="px-4 py-2 text-left">Average</th>
//                                                 <th className="px-4 py-2 text-left">Grade</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {selectedArchive.results?.map((student: any, idx: number) => (
//                                                 <tr key={idx} className="border-b">
//                                                     <td className="px-4 py-2">{student.rank || idx + 1}</td>
//                                                     <td className="px-4 py-2">{student.name}</td>
//                                                     <td className="px-4 py-2">{student.examNumber}</td>
//                                                     <td className="px-4 py-2">{(student.average || 0).toFixed(1)}%</td>
//                                                     <td className="px-4 py-2">
//                                                         <span className={`px-2 py-1 rounded-full text-xs ${student.overallGrade === 'F' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
//                                                             }`}>
//                                                             {student.overallGrade || 'F'}
//                                                         </span>
//                                                     </td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             )}
//                         </div>
//                     )}
//                 </div>

//                 <div className="border-t border-slate-200 p-4 bg-slate-50">
//                     <button
//                         onClick={onClose}
//                         className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
//                     >
//                         Close
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ArchivedResultsView;

// // import React from 'react';
// // import { X, FileText } from 'lucide-react';

// // interface ArchivedResultsViewProps {
// //     isOpen: boolean;
// //     onClose: () => void;
// //     archivedResults: any[];
// //     className?: string;
// // }

// // const ArchivedResultsView: React.FC<ArchivedResultsViewProps> = ({
// //     isOpen,
// //     onClose,
// //     archivedResults,
// //     className
// // }) => {
// //     if (!isOpen) return null;

// //     return (
// //         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
// //             <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
// //                 <div className="flex items-center justify-between p-6 border-b border-slate-200">
// //                     <h2 className="text-xl font-semibold text-slate-800">📚 Archived Results</h2>
// //                     <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
// //                         <X className="w-5 h-5 text-slate-500" />
// //                     </button>
// //                 </div>

// //                 <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
// //                     {archivedResults.length === 0 ? (
// //                         <div className="text-center py-12">
// //                             <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
// //                             <p className="text-slate-500">No archived results found</p>
// //                         </div>
// //                     ) : (
// //                         <div className="space-y-4">
// //                             {archivedResults.map((archive, index) => (
// //                                 <div key={index} className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
// //                                     <div className="flex justify-between items-start mb-3">
// //                                         <div>
// //                                             <h3 className="font-semibold text-slate-800">
// //                                                 {archive.term} - {archive.academicYear}
// //                                             </h3>
// //                                             <p className="text-xs text-slate-500">
// //                                                 Archived: {new Date(archive.archivedAt).toLocaleDateString()}
// //                                             </p>
// //                                         </div>
// //                                         <span className={`px-2 py-1 text-xs rounded-full ${archive.is_published
// //                                             ? 'bg-green-100 text-green-700'
// //                                             : 'bg-slate-100 text-slate-600'
// //                                             }`}>
// //                                             {archive.is_published ? 'Published' : 'Draft'}
// //                                         </span>
// //                                     </div>

// //                                     <div className="grid grid-cols-3 gap-2 text-sm">
// //                                         <div className="bg-slate-50 p-2 rounded">
// //                                             <p className="text-xs text-slate-500">Total Students</p>
// //                                             <p className="font-semibold">{archive.results?.length || 0}</p>
// //                                         </div>
// //                                         <div className="bg-slate-50 p-2 rounded">
// //                                             <p className="text-xs text-slate-500">Pass Rate</p>
// //                                             <p className="font-semibold">
// //                                                 {archive.results ?
// //                                                     Math.round((archive.results.filter((r: any) => r.overallGrade !== 'F').length / archive.results.length) * 100) : 0}%
// //                                             </p>
// //                                         </div>
// //                                         <div className="bg-slate-50 p-2 rounded">
// //                                             <p className="text-xs text-slate-500">Class Avg</p>
// //                                             <p className="font-semibold">
// //                                                 {archive.results ?
// //                                                     (archive.results.reduce((acc: number, r: any) => acc + (r.average || 0), 0) / archive.results.length).toFixed(1) : 0}%
// //                                             </p>
// //                                         </div>
// //                                     </div>

// //                                     <button className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
// //                                         View Full Report →
// //                                     </button>
// //                                 </div>
// //                             ))}
// //                         </div>
// //                     )}
// //                 </div>

// //                 <div className="border-t border-slate-200 p-4 bg-slate-50">
// //                     <button
// //                         onClick={onClose}
// //                         className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
// //                     >
// //                         Close
// //                     </button>
// //                 </div>
// //             </div>
// //         </div>
// //     );
// // };

// // export default ArchivedResultsView;