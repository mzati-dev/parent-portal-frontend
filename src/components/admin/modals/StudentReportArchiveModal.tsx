import React, { useState, useRef } from 'react';
import { X, Download, Mail, MessageSquare, Eye, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import ReportCard from '@/components/app/searchResults/ReportCard';
import QAAssessment from '@/components/app/searchResults/QAAssessment';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StudentReportArchiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    archives: any[];
    schoolName?: string;
    onSendEmail: (archiveId: string) => Promise<void>;
    onSendWhatsApp: (archiveId: string) => Promise<void>;
    onSendSMS?: (archiveId: string) => Promise<void>;
}

const StudentReportArchiveModal: React.FC<StudentReportArchiveModalProps> = ({
    isOpen,
    onClose,
    archives,
    schoolName = 'School Name',
    onSendEmail,
    onSendWhatsApp,
    onSendSMS
}) => {
    const [selectedArchive, setSelectedArchive] = useState<any>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [selectedReportType, setSelectedReportType] = useState<'qa1' | 'qa2' | 'endOfTerm' | 'overall'>('overall');
    const reportCardRef = useRef<HTMLDivElement>(null);
    const qaAssessmentRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const handleSendEmail = async (archiveId: string) => {
        setSendingId(archiveId);
        try {
            await onSendEmail(archiveId);
        } finally {
            setSendingId(null);
        }
    };

    const handleSendWhatsApp = async (archiveId: string) => {
        setSendingId(archiveId);
        try {
            await onSendWhatsApp(archiveId);
        } finally {
            setSendingId(null);
        }
    };

    const handleSendSMS = async (archiveId: string) => {
        setSendingId(archiveId);
        try {
            if (onSendSMS) {
                await onSendSMS(archiveId);
            } else {
                const archive = archives.find(a => a.id === archiveId);
                if (archive?.whatsappNumber) {
                    window.location.href = `sms:${archive.whatsappNumber}`;
                }
            }
        } finally {
            setSendingId(null);
        }
    };

    const handleDownloadPDF = (archive: any, type: string) => {
        setDownloadingId(archive.id);
        try {
            generatePDF(archive, type);
        } catch (error) {
            console.error('Download failed:', error);
        } finally {
            setDownloadingId(null);
        }
    };

    const calculateSubjectAverage = (subject: any, type: string, studentData: any): number | string => {
        if (type === 'overall') {
            return subject.finalScore ||
                ((subject.qa1 || 0) + (subject.qa2 || 0) + (subject.endOfTerm || 0)) / 3;
        } else {
            const isAbsent = type === 'qa1' ? subject.qa1_absent :
                type === 'qa2' ? subject.qa2_absent :
                    subject.endOfTerm_absent;
            if (isAbsent) return 'AB';
            return subject[type] || 0;
        }
    };

    const getGrade = (score: number): string => {
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        if (score >= 50) return 'D';
        return 'F';
    };

    const generatePDF = (archive: any, type: string) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 20;
        const studentData = archive.reportCardData;

        // ===== HEADER with gradient effect (simulated with colors) =====
        doc.setFillColor(79, 70, 229); // Indigo-600
        doc.rect(0, 0, pageWidth, 30, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(schoolName, pageWidth / 2, 18, { align: 'center' });

        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        const title = type === 'overall' ? 'Complete Report Card' :
            type === 'qa1' ? 'Quarterly Assessment 1 Results' :
                type === 'qa2' ? 'Quarterly Assessment 2 Results' :
                    'End of Term Examination Results';
        doc.text(title, pageWidth / 2, 26, { align: 'center' });

        y = 40;

        // ===== STUDENT & ACADEMIC INFORMATION with colored card =====
        doc.setFillColor(238, 242, 255); // Indigo-50
        doc.rect(10, y - 4, pageWidth - 20, 38, 'F');

        doc.setDrawColor(99, 102, 241); // Indigo-500
        doc.setLineWidth(0.5);
        doc.line(10, y - 4, 10, y + 34);

        doc.setTextColor(67, 56, 202); // Indigo-800
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('STUDENT & ACADEMIC INFORMATION', 14, y);

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        // Student info in grid
        doc.text(`Student Name: ${studentData?.name || archive.studentName}`, 14, y + 8);
        doc.text(`Exam Number: ${studentData?.examNumber || archive.examNumber}`, 14, y + 14);
        doc.text(`Class: ${studentData?.class || 'N/A'}`, 14, y + 20);
        doc.text(`Term: ${studentData?.term || archive.term}`, 120, y + 8);
        doc.text(`Academic Year: ${studentData?.academicYear || 'N/A'}`, 120, y + 14);
        doc.text(`Total Enrollment: ${studentData?.totalStudents || 'N/A'}`, 120, y + 20);

        y += 28;

        // ===== SUMMARY with colored card =====
        doc.setFillColor(245, 243, 255); // Purple-50
        doc.rect(10, y - 4, pageWidth - 20, 36, 'F');

        doc.setDrawColor(139, 92, 246); // Purple-500
        doc.setLineWidth(0.5);
        doc.line(10, y - 4, 10, y + 32);

        doc.setTextColor(107, 33, 168); // Purple-800
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('SUMMARY', 14, y);

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);

        if (type === 'overall') {
            doc.text(`Class Position: ${studentData?.classRank || 'N/A'}/${studentData?.totalStudents || 'N/A'}`, 14, y + 8);

            const overallStatus = studentData ? (studentData.classRank > 0 ? 'PASSED' : 'N/A') : 'N/A';
            doc.text(`Overall Status: `, 120, y + 8);
            if (overallStatus === 'PASSED') {
                doc.setTextColor(16, 185, 129); // Green
                doc.text(overallStatus, 150, y + 8);
                doc.setTextColor(0, 0, 0);
            } else {
                doc.text(overallStatus, 150, y + 8);
            }

            const finalAvg = studentData?.assessmentStats?.overall?.termAverage?.toFixed(1) || 'N/A';
            doc.text(`Final Average: ${finalAvg}%`, 14, y + 14);

            let overallGrade = 'N/A';
            if (studentData?.assessmentStats?.overall?.termAverage) {
                const avg = studentData.assessmentStats.overall.termAverage;
                overallGrade = avg >= 80 ? 'A' : avg >= 70 ? 'B' : avg >= 60 ? 'C' : avg >= 50 ? 'D' : 'F';
            }

            doc.text(`Overall Grade: `, 120, y + 14);
            // Color code the grade
            if (overallGrade === 'A') doc.setTextColor(5, 150, 105); // Emerald
            else if (overallGrade === 'B') doc.setTextColor(37, 99, 235); // Blue
            else if (overallGrade === 'C') doc.setTextColor(217, 119, 6); // Amber
            else if (overallGrade === 'D') doc.setTextColor(234, 88, 12); // Orange
            else if (overallGrade === 'F') doc.setTextColor(220, 38, 38); // Red
            else doc.setTextColor(0, 0, 0);

            doc.text(overallGrade, 150, y + 14);
            doc.setTextColor(0, 0, 0);
        } else {
            const subjectsWithScores = studentData?.subjects?.filter((s: any) =>
                s[type] !== null ||
                (type === 'qa1' ? s.qa1_absent : type === 'qa2' ? s.qa2_absent : s.endOfTerm_absent)
            ) || [];

            doc.text(`Assessment Type: ${title}`, 14, y + 8);
            doc.text(`Subjects Assessed: ${subjectsWithScores.length}/${studentData?.subjects?.length || 0}`, 120, y + 8);

            const scores = subjectsWithScores.map((s: any) => s[type]).filter((s: any) => typeof s === 'number');
            const avgScore = scores.length > 0 ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1) : 'N/A';

            doc.text(`Average Score: ${avgScore}%`, 14, y + 14);
            doc.text(`Class Position: ${studentData?.assessmentStats?.[type]?.classRank || 'N/A'}`, 120, y + 14);

            const passMark = 50;
            const status = avgScore !== 'N/A' ? (parseFloat(avgScore) >= passMark ? 'PASSED' : 'FAILED') : 'N/A';
            const grade = avgScore !== 'N/A' ?
                (parseFloat(avgScore) >= 80 ? 'A' :
                    parseFloat(avgScore) >= 70 ? 'B' :
                        parseFloat(avgScore) >= 60 ? 'C' :
                            parseFloat(avgScore) >= 50 ? 'D' : 'F') : 'N/A';

            doc.text(`Overall Grade: `, 14, y + 20);
            // Color code the grade
            if (grade === 'A') doc.setTextColor(5, 150, 105);
            else if (grade === 'B') doc.setTextColor(37, 99, 235);
            else if (grade === 'C') doc.setTextColor(217, 119, 6);
            else if (grade === 'D') doc.setTextColor(234, 88, 12);
            else if (grade === 'F') doc.setTextColor(220, 38, 38);
            doc.text(grade, 40, y + 20);

            doc.setTextColor(0, 0, 0);
            doc.text(`Overall Status: `, 120, y + 20);

            if (status === 'PASSED') {
                doc.setTextColor(16, 185, 129);
                doc.text(status, 160, y + 20);
                doc.setTextColor(0, 0, 0);
            } else if (status === 'FAILED') {
                doc.setTextColor(220, 38, 38);
                doc.text(status, 160, y + 20);
                doc.setTextColor(0, 0, 0);
            } else {
                doc.text(status, 160, y + 20);
            }
        }

        y += 28;

        // ===== RESULTS with colored table =====
        doc.setFillColor(236, 253, 245); // Emerald-50
        doc.rect(10, y - 4, pageWidth - 20, 8, 'F');

        doc.setDrawColor(16, 185, 129); // Emerald-500
        doc.setLineWidth(0.5);
        doc.line(10, y - 4, 10, y + 4);

        doc.setTextColor(6, 95, 70); // Emerald-800
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('RESULTS', 14, y);

        y += 4;

        const tableBody = studentData?.subjects
            ?.filter((sub: any) => sub.qa1 !== null || sub.qa2 !== null || sub.endOfTerm !== null ||
                sub.qa1_absent || sub.qa2_absent || sub.endOfTerm_absent)
            .map((sub: any, index: number) => {
                if (type === 'overall') {
                    const avg = sub.finalScore ||
                        ((sub.qa1 || 0) + (sub.qa2 || 0) + (sub.endOfTerm || 0)) / 3;
                    const avgDisplay = avg.toFixed(1);
                    const grade = avg >= 80 ? 'A' : avg >= 70 ? 'B' : avg >= 60 ? 'C' : avg >= 50 ? 'D' : 'F';
                    const remark = grade === 'F' ? 'Failed' : 'Passed';
                    return [sub.name, '100', avgDisplay, grade, remark];
                } else {
                    const score = sub[type];
                    const isAbsent = type === 'qa1' ? sub.qa1_absent :
                        type === 'qa2' ? sub.qa2_absent :
                            sub.endOfTerm_absent;
                    if (isAbsent) return [sub.name, '100', 'AB', 'AB', 'Absent'];
                    const grade = score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'F';
                    const remark = grade === 'F' ? 'Failed' : 'Passed';
                    return [sub.name, '100', score.toFixed(1), grade, remark];
                }
            }) || [];

        // Calculate totals
        const totalPossible = (studentData?.subjects?.length || 0) * 100;
        let totalScored = 0;

        if (type === 'overall') {
            totalScored = studentData?.subjects?.reduce((sum: number, sub: any) => {
                const avg = sub.finalScore || ((sub.qa1 || 0) + (sub.qa2 || 0) + (sub.endOfTerm || 0)) / 3;
                return sum + avg;
            }, 0) || 0;
        } else {
            totalScored = studentData?.subjects?.reduce((sum: number, sub: any) => {
                if (type === 'qa1' && sub.qa1_absent) return sum;
                if (type === 'qa2' && sub.qa2_absent) return sum;
                if (type === 'endOfTerm' && sub.endOfTerm_absent) return sum;
                return sum + (sub[type] || 0);
            }, 0) || 0;
        }

        let overallGrade = 'N/A';
        if (type === 'overall') {
            if (studentData?.assessmentStats?.overall?.termAverage) {
                const avg = studentData.assessmentStats.overall.termAverage;
                overallGrade = avg >= 80 ? 'A' : avg >= 70 ? 'B' : avg >= 60 ? 'C' : avg >= 50 ? 'D' : 'F';
            }
        } else {
            const scores = studentData?.subjects
                ?.filter((s: any) => !(type === 'qa1' ? s.qa1_absent : type === 'qa2' ? s.qa2_absent : s.endOfTerm_absent))
                .map((s: any) => s[type])
                .filter((s: any) => typeof s === 'number') || [];
            const avgScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
            overallGrade = avgScore >= 80 ? 'A' : avgScore >= 70 ? 'B' : avgScore >= 60 ? 'C' : avgScore >= 50 ? 'D' : 'F';
        }

        const overallRemark = overallGrade === 'F' ? 'Failed' : 'Passed';

        tableBody.push(['GRAND TOTAL', String(totalPossible), totalScored.toFixed(1), overallGrade, overallRemark]);

        autoTable(doc, {
            startY: y,
            head: [['Subject', 'Total Marks', 'Marks Scored', 'Grade', 'Remark']],
            body: tableBody,
            theme: 'striped',
            headStyles: {
                fillColor: [16, 185, 129], // Emerald-600
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [240, 253, 244] }, // Emerald-50
            didParseCell: (data) => {
                if (data.row.index === tableBody.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [209, 250, 229]; // Emerald-100
                }
                // Color code grades in table
                if (data.column.index === 3) { // Grade column
                    const grade = data.cell.raw as string;
                    if (grade === 'A') data.cell.styles.textColor = [5, 150, 105];
                    else if (grade === 'B') data.cell.styles.textColor = [37, 99, 235];
                    else if (grade === 'C') data.cell.styles.textColor = [217, 119, 6];
                    else if (grade === 'D') data.cell.styles.textColor = [234, 88, 12];
                    else if (grade === 'F') data.cell.styles.textColor = [220, 38, 38];
                    else if (grade === 'AB') data.cell.styles.textColor = [100, 116, 139];
                }
                // Color code remarks
                if (data.column.index === 4) { // Remark column
                    const remark = data.cell.raw as string;
                    if (remark === 'Passed') data.cell.styles.textColor = [5, 150, 105];
                    else if (remark === 'Failed') data.cell.styles.textColor = [220, 38, 38];
                    else if (remark === 'Absent') data.cell.styles.textColor = [100, 116, 139];
                }
            },
        });

        y = (doc as any).lastAutoTable.finalY + 10;

        // ===== PERFORMANCE ANALYSIS with colored cards =====
        // Strongest Subjects Card
        doc.setFillColor(255, 237, 213); // Orange-50
        doc.rect(10, y - 2, (pageWidth - 25) / 2, 30, 'F');
        doc.setDrawColor(245, 158, 11); // Amber-500
        doc.setLineWidth(0.5);
        doc.line(10, y - 2, 10, y + 28);

        doc.setTextColor(180, 83, 9); // Amber-800
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('STRONGEST SUBJECTS', 14, y + 4);

        // Calculate strongest subjects
        const subjectsWithScores = studentData?.subjects
            ?.filter((s: any) => {
                const avg = calculateSubjectAverage(s, type, studentData);
                return avg !== 'AB';
            })
            .map((s: any) => ({
                name: s.name,
                score: type === 'overall' ?
                    (s.finalScore || ((s.qa1 || 0) + (s.qa2 || 0) + (s.endOfTerm || 0)) / 3) :
                    s[type]
            }))
            .filter((s: any) => typeof s.score === 'number') || [];

        const highestScore = subjectsWithScores.length > 0 ?
            Math.max(...subjectsWithScores.map((s: any) => s.score)) : 0;
        const strongestSubjects = subjectsWithScores.filter((s: any) => s.score === highestScore);
        const strongestNames = strongestSubjects.map((s: any) => s.name).join(', ');

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(strongestNames || 'N/A', 14, y + 12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 83, 9);
        doc.text(`Score: ${Math.round(highestScore)}%`, 14, y + 20);

        // Needs Improvement Card
        doc.setFillColor(255, 241, 242); // Rose-50
        doc.rect(pageWidth / 2 + 5, y - 2, (pageWidth - 25) / 2, 30, 'F');
        doc.setDrawColor(244, 63, 94); // Rose-500
        doc.setLineWidth(0.5);
        doc.line(pageWidth / 2 + 5, y - 2, pageWidth / 2 + 5, y + 28);

        doc.setTextColor(190, 18, 60); // Rose-800
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('NEEDS IMPROVEMENT', pageWidth / 2 + 9, y + 4);

        const weakSubjects = studentData?.subjects
            ?.filter((s: any) => {
                const isAbsent = type !== 'overall' && (
                    (type === 'qa1' && s.qa1_absent) ||
                    (type === 'qa2' && s.qa2_absent) ||
                    (type === 'endOfTerm' && s.endOfTerm_absent)
                );
                if (isAbsent) return false;

                const score = type === 'overall' ?
                    (s.finalScore || ((s.qa1 || 0) + (s.qa2 || 0) + (s.endOfTerm || 0)) / 3) :
                    s[type];
                if (typeof score !== 'number') return false;
                const grade = getGrade(score);
                return ['D', 'F'].includes(grade);
            }) || [];

        const improvementNames = weakSubjects.length > 0
            ? weakSubjects.map((s: any) => {
                const score = type === 'overall' ?
                    (s.finalScore || ((s.qa1 || 0) + (s.qa2 || 0) + (s.endOfTerm || 0)) / 3) :
                    s[type];
                const grade = getGrade(score);
                return `${s.name} (${grade})`;
            }).join(', ')
            : 'None';

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const improvementLines = doc.splitTextToSize(improvementNames, (pageWidth - 50) / 2);
        doc.text(improvementLines, pageWidth / 2 + 9, y + 12);

        if (weakSubjects.length > 0) {
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text(`Total flagged: ${weakSubjects.length}`, pageWidth / 2 + 9, y + 12 + (improvementLines.length * 4) + 2);
        }

        y += 38;

        // ===== Performance Stats Grid =====
        const subjectsPassed = studentData?.subjects
            ?.filter((s: any) => {
                const isAbsent = type !== 'overall' && (
                    (type === 'qa1' && s.qa1_absent) ||
                    (type === 'qa2' && s.qa2_absent) ||
                    (type === 'endOfTerm' && s.endOfTerm_absent)
                );
                if (isAbsent) return false;

                const score = type === 'overall' ?
                    (s.finalScore || ((s.qa1 || 0) + (s.qa2 || 0) + (s.endOfTerm || 0)) / 3) :
                    s[type];
                if (typeof score !== 'number') return false;

                const grade = getGrade(score);
                return grade !== 'F';
            }).length || 0;

        const abGrades = studentData?.subjects
            ?.filter((s: any) => {
                const isAbsent = type !== 'overall' && (
                    (type === 'qa1' && s.qa1_absent) ||
                    (type === 'qa2' && s.qa2_absent) ||
                    (type === 'endOfTerm' && s.endOfTerm_absent)
                );
                if (isAbsent) return false;

                const score = type === 'overall' ?
                    (s.finalScore || ((s.qa1 || 0) + (s.qa2 || 0) + (s.endOfTerm || 0)) / 3) :
                    s[type];
                if (typeof score !== 'number') return false;

                const grade = getGrade(score);
                return grade === 'A' || grade === 'B';
            }).length || 0;

        const cdGrades = studentData?.subjects
            ?.filter((s: any) => {
                const isAbsent = type !== 'overall' && (
                    (type === 'qa1' && s.qa1_absent) ||
                    (type === 'qa2' && s.qa2_absent) ||
                    (type === 'endOfTerm' && s.endOfTerm_absent)
                );
                if (isAbsent) return false;

                const score = type === 'overall' ?
                    (s.finalScore || ((s.qa1 || 0) + (s.qa2 || 0) + (s.endOfTerm || 0)) / 3) :
                    s[type];
                if (typeof score !== 'number') return false;

                const grade = getGrade(score);
                return grade === 'C' || grade === 'D';
            }).length || 0;

        const passMark = 50;
        const belowPass = studentData?.subjects
            ?.filter((s: any) => {
                const isAbsent = type !== 'overall' && (
                    (type === 'qa1' && s.qa1_absent) ||
                    (type === 'qa2' && s.qa2_absent) ||
                    (type === 'endOfTerm' && s.endOfTerm_absent)
                );
                if (isAbsent) return false;

                const score = type === 'overall' ?
                    (s.finalScore || ((s.qa1 || 0) + (s.qa2 || 0) + (s.endOfTerm || 0)) / 3) :
                    s[type];
                return typeof score === 'number' && score < passMark;
            }).length || 0;

        // Stat 1: Subjects Passed
        doc.setFillColor(236, 253, 245);
        doc.rect(10, y - 2, (pageWidth - 30) / 4, 20, 'F');
        doc.setDrawColor(16, 185, 129);
        doc.setLineWidth(0.3);
        doc.rect(10, y - 2, (pageWidth - 30) / 4, 20, 'S');

        doc.setFontSize(8);
        doc.setTextColor(4, 120, 87);
        doc.text('Subjects Passed', 10 + ((pageWidth - 30) / 8), y + 2, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${subjectsPassed}/${studentData?.subjects?.length || 0}`, 10 + ((pageWidth - 30) / 8), y + 12, { align: 'center' });

        // Stat 2: A & B Grades
        doc.setFillColor(239, 246, 255);
        doc.rect(10 + ((pageWidth - 30) / 4) + 2, y - 2, (pageWidth - 30) / 4, 20, 'F');
        doc.setDrawColor(37, 99, 235);
        doc.rect(10 + ((pageWidth - 30) / 4) + 2, y - 2, (pageWidth - 30) / 4, 20, 'S');

        doc.setTextColor(30, 64, 175);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('A & B Grades', 10 + ((pageWidth - 30) / 4) + 2 + ((pageWidth - 30) / 8), y + 2, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(abGrades.toString(), 10 + ((pageWidth - 30) / 4) + 2 + ((pageWidth - 30) / 8), y + 12, { align: 'center' });

        // Stat 3: C & D Grades
        doc.setFillColor(254, 243, 199);
        doc.rect(10 + 2 * ((pageWidth - 30) / 4) + 4, y - 2, (pageWidth - 30) / 4, 20, 'F');
        doc.setDrawColor(217, 119, 6);
        doc.rect(10 + 2 * ((pageWidth - 30) / 4) + 4, y - 2, (pageWidth - 30) / 4, 20, 'S');

        doc.setTextColor(146, 64, 14);
        doc.text('C & D Grades', 10 + 2 * ((pageWidth - 30) / 4) + 4 + ((pageWidth - 30) / 8), y + 2, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(cdGrades.toString(), 10 + 2 * ((pageWidth - 30) / 4) + 4 + ((pageWidth - 30) / 8), y + 12, { align: 'center' });

        // Stat 4: Below Pass Mark
        doc.setFillColor(255, 241, 242);
        doc.rect(10 + 3 * ((pageWidth - 30) / 4) + 6, y - 2, (pageWidth - 30) / 4, 20, 'F');
        doc.setDrawColor(244, 63, 94);
        doc.rect(10 + 3 * ((pageWidth - 30) / 4) + 6, y - 2, (pageWidth - 30) / 4, 20, 'S');

        doc.setTextColor(190, 18, 60);
        doc.text(`Below ${passMark}%`, 10 + 3 * ((pageWidth - 30) / 4) + 6 + ((pageWidth - 30) / 8), y + 2, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(belowPass.toString(), 10 + 3 * ((pageWidth - 30) / 4) + 6 + ((pageWidth - 30) / 8), y + 12, { align: 'center' });

        y += 25;

        // ===== TEACHER'S REMARK with colored card =====
        doc.setFillColor(238, 242, 255); // Indigo-50
        doc.rect(10, y - 2, pageWidth - 20, 24, 'F');
        doc.setDrawColor(79, 70, 229); // Indigo-600
        doc.setLineWidth(0.5);
        doc.line(10, y - 2, 10, y + 22);

        doc.setTextColor(67, 56, 202); // Indigo-800
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("TEACHER'S REMARK", 14, y + 4);

        let teacherRemark = '';
        const avgScore = type === 'overall' ?
            parseFloat(studentData?.assessmentStats?.overall?.termAverage || '0') :
            (() => {
                const scores = studentData?.subjects
                    ?.filter((s: any) => !(type === 'qa1' ? s.qa1_absent : type === 'qa2' ? s.qa2_absent : s.endOfTerm_absent))
                    .map((s: any) => s[type])
                    .filter((s: any) => typeof s === 'number') || [];
                return scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
            })();

        if (avgScore >= 80) teacherRemark = 'An outstanding performance! Keep maintaining this high standard.';
        else if (avgScore >= 70) teacherRemark = 'A very good result. With a little more push, you can reach excellence.';
        else if (avgScore >= 60) teacherRemark = 'A satisfactory performance, but there is room for improvement.';
        else if (avgScore >= 50) teacherRemark = 'You have passed, but more effort is needed to improve grades.';
        else teacherRemark = 'Please focus more on your studies and seek help in weak subjects.';

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        const remarkLines = doc.splitTextToSize(`"${teacherRemark}"`, pageWidth - 40);
        doc.text(remarkLines, 14, y + 12);

        y += remarkLines.length * 5 + 12;

        // ===== ATTENDANCE with colored card =====
        if (studentData?.attendance) {
            doc.setFillColor(254, 243, 199); // Amber-50
            doc.rect(10, y - 2, pageWidth - 20, 36, 'F');
            doc.setDrawColor(245, 158, 11); // Amber-500
            doc.setLineWidth(0.5);
            doc.line(10, y - 2, 10, y + 34);

            doc.setTextColor(180, 83, 9); // Amber-800
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('ATTENDANCE', 14, y + 4);

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            const totalDays = studentData.attendance.present + studentData.attendance.absent;
            const attendanceRate = totalDays > 0 ? Math.round((studentData.attendance.present / totalDays) * 100) : 0;

            doc.text(`Total School Days: ${totalDays}`, 14, y + 12);
            doc.text(`Attendance Rate: ${attendanceRate}%`, 120, y + 12);
            doc.text(`Days Present: ${studentData.attendance.present}`, 14, y + 18);
            doc.text(`Days Absent: ${studentData.attendance.absent}`, 120, y + 18);
            doc.text(`Days Late: ${studentData.attendance.late}`, 14, y + 24);

            let attendanceComment = '';
            if (attendanceRate >= 95) attendanceComment = '✓ Excellent attendance! Keep it up.';
            else if (attendanceRate >= 80) attendanceComment = '✓ Good attendance record.';
            else attendanceComment = '⚠ Needs improvement in attendance.';

            doc.setFontSize(9);
            if (attendanceRate >= 95) doc.setTextColor(5, 150, 105);
            else if (attendanceRate >= 80) doc.setTextColor(37, 99, 235);
            else doc.setTextColor(245, 158, 11);

            doc.text(attendanceComment, 14, y + 30);

            y += 40;
        }

        // ===== FOOTER with gradient =====
        doc.setFillColor(31, 41, 55); // Slate-800
        doc.rect(0, y, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Report Card Generated', pageWidth / 2, y + 8, { align: 'center' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(203, 213, 225); // Slate-300
        doc.text('This report card was generated based on the school\'s active grade calculation configuration.', pageWidth / 2, y + 16, { align: 'center' });
        doc.text('For any questions or clarifications, please contact the school administration.', pageWidth / 2, y + 22, { align: 'center' });

        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}`, pageWidth / 2, y + 30, { align: 'center' });

        // ===== SAVE =====
        const studentName = studentData?.name || archive.studentName || 'Student';
        const reportType = type === 'overall' ? 'Complete_Report' :
            type === 'qa1' ? 'QA1' :
                type === 'qa2' ? 'QA2' : 'End_Term';
        doc.save(`${studentName}_${reportType}_Report.pdf`);
    };

    // Group archives by student
    const studentArchives = archives.filter(a => a.studentId === selectedArchive?.studentId);
    const availableTypes = studentArchives.map(a => a.assessmentType);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800">📄 Student Report Archives</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {!showDetail ? (
                        // GRID VIEW - Show all archives
                        archives.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-slate-500">No student report archives found</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {archives.map((archive) => {
                                    const studentData = archive.reportCardData;
                                    const type = archive.assessmentType === 'qa1' ? 'QA1' :
                                        archive.assessmentType === 'qa2' ? 'QA2' :
                                            archive.assessmentType === 'endOfTerm' ? 'End Term' : 'Overall';

                                    return (
                                        <div key={archive.id} className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                                            <div className="mb-3">
                                                <h3 className="font-semibold text-slate-800">{studentData?.name || archive.studentName}</h3>
                                                <p className="text-xs text-slate-500">{studentData?.examNumber || archive.examNumber}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                                                <div className="bg-slate-50 p-2 rounded">
                                                    <p className="text-xs text-slate-500">Term</p>
                                                    <p className="font-semibold">{studentData?.term || archive.term}</p>
                                                </div>
                                                <div className="bg-slate-50 p-2 rounded">
                                                    <p className="text-xs text-slate-500">Type</p>
                                                    <p className="font-semibold uppercase">{type}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 mb-2">
                                                {/* View Button */}
                                                <button
                                                    onClick={() => {
                                                        setSelectedArchive(archive);
                                                        setSelectedReportType(archive.assessmentType === 'overall' ? 'overall' :
                                                            archive.assessmentType as 'qa1' | 'qa2' | 'endOfTerm');
                                                        setShowDetail(true);
                                                    }}
                                                    className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </button>

                                                {/* Download Button */}
                                                <button
                                                    onClick={() => handleDownloadPDF(archive, archive.assessmentType)}
                                                    disabled={downloadingId === archive.id}
                                                    className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
                                                >
                                                    {downloadingId === archive.id ? (
                                                        <>
                                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                            ...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Download className="w-4 h-4" />
                                                            PDF
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Sharing Buttons Section */}
                                            <div className="border-t border-slate-100 pt-3 mt-1">
                                                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                                                    <Share2 className="w-3 h-3" /> Share
                                                </p>
                                                <div className="flex gap-2">
                                                    {archive.parentEmail && (
                                                        <button
                                                            onClick={() => handleSendEmail(archive.id)}
                                                            disabled={sendingId === archive.id}
                                                            className="flex-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                                                            title="Send via Email"
                                                        >
                                                            <Mail className="w-3 h-3" />
                                                            Email
                                                        </button>
                                                    )}

                                                    {archive.whatsappNumber && (
                                                        <button
                                                            onClick={() => handleSendWhatsApp(archive.id)}
                                                            disabled={sendingId === archive.id}
                                                            className="flex-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                                                            title="Send via WhatsApp"
                                                        >
                                                            <MessageSquare className="w-3 h-3" />
                                                            WhatsApp
                                                        </button>
                                                    )}

                                                    {/* Built-in Messaging Button */}
                                                    {archive.whatsappNumber && (
                                                        <button
                                                            onClick={() => handleSendSMS(archive.id)}
                                                            disabled={sendingId === archive.id}
                                                            className="flex-1 px-2 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                                                            title="Send via SMS"
                                                        >
                                                            <MessageSquare className="w-3 h-3" />
                                                            SMS
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        // DETAIL VIEW - Show full report with PDF-only view
                        <div>
                            <button
                                onClick={() => setShowDetail(false)}
                                className="mb-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                            >
                                ← Back to Archives
                            </button>

                            {selectedArchive && (
                                <div>
                                    {/* Report Type Selector - if multiple archives for same student */}
                                    {studentArchives.length > 1 && (
                                        <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <label className="text-sm font-medium text-slate-700">View Report:</label>
                                                <select
                                                    value={selectedReportType}
                                                    onChange={(e) => setSelectedReportType(e.target.value as any)}
                                                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                                                >
                                                    {availableTypes.includes('qa1') && (
                                                        <option value="qa1">Quarterly Assessment 1 (QA1)</option>
                                                    )}
                                                    {availableTypes.includes('qa2') && (
                                                        <option value="qa2">Quarterly Assessment 2 (QA2)</option>
                                                    )}
                                                    {availableTypes.includes('endOfTerm') && (
                                                        <option value="endOfTerm">End of Term</option>
                                                    )}
                                                    <option value="overall">Complete Report Card (Overall)</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {/* Download Button for Detail View */}
                                    <div className="flex justify-end mb-4">
                                        <button
                                            onClick={() => handleDownloadPDF(selectedArchive, selectedReportType)}
                                            disabled={downloadingId === selectedArchive.id}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-lg flex items-center gap-2"
                                        >
                                            {downloadingId === selectedArchive.id ? (
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

                                    {/* Render the appropriate component with PDF-only view */}
                                    <div className="bg-white rounded-lg shadow-lg overflow-auto max-h-[60vh] p-4">
                                        {selectedReportType === 'overall' ? (
                                            <ReportCard
                                                studentData={selectedArchive.reportCardData}
                                                showActions={false}
                                                showPDFOnly={true}
                                            />
                                        ) : (
                                            <QAAssessment
                                                studentData={selectedArchive.reportCardData}
                                                activeTab={selectedReportType}
                                                showPDFOnly={true}
                                            />
                                        )}
                                    </div>

                                    {/* Email/WhatsApp/SMS buttons in detail view */}
                                    <div className="mt-6 flex gap-2 justify-end border-t pt-4">
                                        {selectedArchive.parentEmail && (
                                            <button
                                                onClick={() => handleSendEmail(selectedArchive.id)}
                                                disabled={sendingId === selectedArchive.id}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg flex items-center gap-2"
                                            >
                                                <Mail className="w-4 h-4" />
                                                {sendingId === selectedArchive.id ? 'Sending...' : 'Send Email'}
                                            </button>
                                        )}
                                        {selectedArchive.whatsappNumber && (
                                            <button
                                                onClick={() => handleSendWhatsApp(selectedArchive.id)}
                                                disabled={sendingId === selectedArchive.id}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white rounded-lg flex items-center gap-2"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                                {sendingId === selectedArchive.id ? 'Sending...' : 'Send WhatsApp'}
                                            </button>
                                        )}
                                        {selectedArchive.whatsappNumber && (
                                            <button
                                                onClick={() => handleSendSMS(selectedArchive.id)}
                                                disabled={sendingId === selectedArchive.id}
                                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white rounded-lg flex items-center gap-2"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                                {sendingId === selectedArchive.id ? 'Sending...' : 'Send SMS'}
                                            </button>
                                        )}
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

export default StudentReportArchiveModal;


// import React, { useState } from 'react';
// import { X, Download, Mail, MessageSquare, Eye, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
// import ReportCard from '@/components/app/searchResults/ReportCard';
// import QAAssessment from '@/components/app/searchResults/QAAssessment';

// interface StudentReportArchiveModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     archives: any[];
//     schoolName?: string;
//     onSendEmail: (archiveId: string) => Promise<void>;
//     onSendWhatsApp: (archiveId: string) => Promise<void>;
//     onSendSMS?: (archiveId: string) => Promise<void>;
// }

// const StudentReportArchiveModal: React.FC<StudentReportArchiveModalProps> = ({
//     isOpen,
//     onClose,
//     archives,
//     schoolName = 'School Name',
//     onSendEmail,
//     onSendWhatsApp,
//     onSendSMS
// }) => {
//     const [selectedArchive, setSelectedArchive] = useState<any>(null);
//     const [showDetail, setShowDetail] = useState(false);
//     const [sendingId, setSendingId] = useState<string | null>(null);
//     const [selectedReportType, setSelectedReportType] = useState<'qa1' | 'qa2' | 'endOfTerm' | 'overall'>('overall');
//     const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);

//     if (!isOpen) return null;

//     const handleSendEmail = async (archiveId: string) => {
//         setSendingId(archiveId);
//         try {
//             await onSendEmail(archiveId);
//         } finally {
//             setSendingId(null);
//         }
//     };

//     const handleSendWhatsApp = async (archiveId: string) => {
//         setSendingId(archiveId);
//         try {
//             await onSendWhatsApp(archiveId);
//         } finally {
//             setSendingId(null);
//         }
//     };

//     const handleSendSMS = async (archiveId: string) => {
//         setSendingId(archiveId);
//         try {
//             if (onSendSMS) {
//                 await onSendSMS(archiveId);
//             } else {
//                 const archive = archives.find(a => a.id === archiveId);
//                 if (archive?.whatsappNumber) {
//                     window.location.href = `sms:${archive.whatsappNumber}`;
//                 }
//             }
//         } finally {
//             setSendingId(null);
//         }
//     };

//     // Group archives by student
//     const studentArchives = archives.filter(a => a.studentId === selectedArchive?.studentId);
//     const availableTypes = studentArchives.map(a => a.assessmentType);

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
//                 <div className="flex items-center justify-between p-6 border-b border-slate-200">
//                     <h2 className="text-xl font-semibold text-slate-800">📄 Student Report Archives</h2>
//                     <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
//                         <X className="w-5 h-5 text-slate-500" />
//                     </button>
//                 </div>

//                 <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
//                     {!showDetail ? (
//                         // GRID VIEW - Show all archives
//                         archives.length === 0 ? (
//                             <div className="text-center py-12">
//                                 <p className="text-slate-500">No student report archives found</p>
//                             </div>
//                         ) : (
//                             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//                                 {archives.map((archive) => {
//                                     const studentData = archive.reportCardData;
//                                     return (
//                                         <div key={archive.id} className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
//                                             <div className="mb-3">
//                                                 <h3 className="font-semibold text-slate-800">{studentData?.name || archive.studentName}</h3>
//                                                 <p className="text-xs text-slate-500">{studentData?.examNumber || archive.examNumber}</p>
//                                             </div>

//                                             <div className="grid grid-cols-2 gap-2 text-sm mb-4">
//                                                 <div className="bg-slate-50 p-2 rounded">
//                                                     <p className="text-xs text-slate-500">Term</p>
//                                                     <p className="font-semibold">{studentData?.term || archive.term}</p>
//                                                 </div>
//                                                 <div className="bg-slate-50 p-2 rounded">
//                                                     <p className="text-xs text-slate-500">Type</p>
//                                                     <p className="font-semibold uppercase">
//                                                         {archive.assessmentType === 'qa1' ? 'QA1' :
//                                                             archive.assessmentType === 'qa2' ? 'QA2' :
//                                                                 archive.assessmentType === 'endOfTerm' ? 'End Term' : 'Overall'}
//                                                     </p>
//                                                 </div>
//                                             </div>

//                                             {/* Single View Button */}
//                                             <button
//                                                 onClick={() => {
//                                                     setSelectedArchive(archive);
//                                                     setSelectedReportType(archive.assessmentType === 'overall' ? 'overall' :
//                                                         archive.assessmentType as 'qa1' | 'qa2' | 'endOfTerm');
//                                                     setShowDetail(true);
//                                                 }}
//                                                 className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1 mb-2"
//                                             >
//                                                 <Eye className="w-4 h-4" />
//                                                 View Report
//                                             </button>

//                                             {/* Sharing Buttons Section */}
//                                             <div className="border-t border-slate-100 pt-3 mt-1">
//                                                 <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
//                                                     <Share2 className="w-3 h-3" /> Share
//                                                 </p>
//                                                 <div className="flex gap-2">
//                                                     {archive.parentEmail && (
//                                                         <button
//                                                             onClick={() => handleSendEmail(archive.id)}
//                                                             disabled={sendingId === archive.id}
//                                                             className="flex-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
//                                                             title="Send via Email"
//                                                         >
//                                                             <Mail className="w-3 h-3" />
//                                                             Email
//                                                         </button>
//                                                     )}

//                                                     {archive.whatsappNumber && (
//                                                         <button
//                                                             onClick={() => handleSendWhatsApp(archive.id)}
//                                                             disabled={sendingId === archive.id}
//                                                             className="flex-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
//                                                             title="Send via WhatsApp"
//                                                         >
//                                                             <MessageSquare className="w-3 h-3" />
//                                                             WhatsApp
//                                                         </button>
//                                                     )}

//                                                     {/* Built-in Messaging Button */}
//                                                     {archive.whatsappNumber && (
//                                                         <button
//                                                             onClick={() => handleSendSMS(archive.id)}
//                                                             disabled={sendingId === archive.id}
//                                                             className="flex-1 px-2 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
//                                                             title="Send via SMS"
//                                                         >
//                                                             <MessageSquare className="w-3 h-3" />
//                                                             SMS
//                                                         </button>
//                                                     )}
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         )
//                     ) : (
//                         // DETAIL VIEW - Show full report with PDF-only view
//                         <div>
//                             <button
//                                 onClick={() => setShowDetail(false)}
//                                 className="mb-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
//                             >
//                                 ← Back to Archives
//                             </button>

//                             {selectedArchive && (
//                                 <div>
//                                     {/* Report Type Selector - if multiple archives for same student */}
//                                     {studentArchives.length > 1 && (
//                                         <div className="mb-4 p-4 bg-slate-50 rounded-lg">
//                                             <div className="flex items-center gap-4">
//                                                 <label className="text-sm font-medium text-slate-700">View Report:</label>
//                                                 <select
//                                                     value={selectedReportType}
//                                                     onChange={(e) => setSelectedReportType(e.target.value as any)}
//                                                     className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
//                                                 >
//                                                     {availableTypes.includes('qa1') && (
//                                                         <option value="qa1">Quarterly Assessment 1 (QA1)</option>
//                                                     )}
//                                                     {availableTypes.includes('qa2') && (
//                                                         <option value="qa2">Quarterly Assessment 2 (QA2)</option>
//                                                     )}
//                                                     {availableTypes.includes('endOfTerm') && (
//                                                         <option value="endOfTerm">End of Term</option>
//                                                     )}
//                                                     <option value="overall">Complete Report Card (Overall)</option>
//                                                 </select>
//                                             </div>
//                                         </div>
//                                     )}

//                                     {/* Render the appropriate component with PDF-only view */}
//                                     <div className="bg-white rounded-lg shadow-lg overflow-auto max-h-[60vh] p-4">
//                                         {selectedReportType === 'overall' ? (
//                                             <ReportCard
//                                                 studentData={selectedArchive.reportCardData}
//                                                 showActions={false}
//                                                 showPDFOnly={true}
//                                             />
//                                         ) : (
//                                             <QAAssessment
//                                                 studentData={selectedArchive.reportCardData}
//                                                 activeTab={selectedReportType}
//                                                 showPDFOnly={true}
//                                             />
//                                         )}
//                                     </div>

//                                     {/* Email/WhatsApp/SMS buttons in detail view */}
//                                     <div className="mt-6 flex gap-2 justify-end border-t pt-4">
//                                         {selectedArchive.parentEmail && (
//                                             <button
//                                                 onClick={() => handleSendEmail(selectedArchive.id)}
//                                                 disabled={sendingId === selectedArchive.id}
//                                                 className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg flex items-center gap-2"
//                                             >
//                                                 <Mail className="w-4 h-4" />
//                                                 {sendingId === selectedArchive.id ? 'Sending...' : 'Send Email'}
//                                             </button>
//                                         )}
//                                         {selectedArchive.whatsappNumber && (
//                                             <button
//                                                 onClick={() => handleSendWhatsApp(selectedArchive.id)}
//                                                 disabled={sendingId === selectedArchive.id}
//                                                 className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white rounded-lg flex items-center gap-2"
//                                             >
//                                                 <MessageSquare className="w-4 h-4" />
//                                                 {sendingId === selectedArchive.id ? 'Sending...' : 'Send WhatsApp'}
//                                             </button>
//                                         )}
//                                         {selectedArchive.whatsappNumber && (
//                                             <button
//                                                 onClick={() => handleSendSMS(selectedArchive.id)}
//                                                 disabled={sendingId === selectedArchive.id}
//                                                 className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white rounded-lg flex items-center gap-2"
//                                             >
//                                                 <MessageSquare className="w-4 h-4" />
//                                                 {sendingId === selectedArchive.id ? 'Sending...' : 'Send SMS'}
//                                             </button>
//                                         )}
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

// export default StudentReportArchiveModal;