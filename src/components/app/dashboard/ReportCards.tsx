import React, { useState } from 'react';
import { FileText, Download, Eye, Calendar, ChevronDown, CheckCircle } from 'lucide-react';

interface ReportCard {
  id: string;
  term: string;
  year: string;
  type: 'Report Card' | 'Progress Report' | 'Transcript';
  dateIssued: string;
  gpa?: string;
  status: 'available' | 'pending';
}

interface ReportCardsProps {
  reports: ReportCard[];
}

const ReportCards: React.FC<ReportCardsProps> = ({ reports }) => {
  const [selectedYear, setSelectedYear] = useState<string>('2024-2025');
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [viewingReport, setViewingReport] = useState<ReportCard | null>(null);

  const years = ['2024-2025', '2023-2024', '2022-2023'];

  const filteredReports = reports.filter(r => r.year === selectedYear);

  const handleDownload = (report: ReportCard) => {
    alert(`Downloading ${report.type} for ${report.term} ${report.year}`);
  };

  const handleView = (report: ReportCard) => {
    setViewingReport(report);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Report Card':
        return 'bg-gradient-to-br from-blue-500 to-blue-600';
      case 'Progress Report':
        return 'bg-gradient-to-br from-purple-500 to-purple-600';
      case 'Transcript':
        return 'bg-gradient-to-br from-emerald-500 to-emerald-600';
      default:
        return 'bg-gradient-to-br from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Report Cards & Documents</h2>
            <p className="text-sm text-gray-500">Download official academic documents</p>
          </div>
          {/* Year Selector */}
          <div className="relative">
            <button
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700">{selectedYear}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {showYearDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      setSelectedYear(year);
                      setShowYearDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      selectedYear === year ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="border border-gray-100 rounded-xl p-5 hover:shadow-lg hover:border-gray-200 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTypeIcon(report.type)}`}>
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{report.type}</h3>
                  <p className="text-sm text-gray-500">{report.term}</p>
                  {report.gpa && (
                    <p className="text-sm font-medium text-blue-600 mt-1">GPA: {report.gpa}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500">Issued: {report.dateIssued}</span>
                  {report.status === 'available' ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle className="w-3 h-3" />
                      Available
                    </span>
                  ) : (
                    <span className="text-xs text-yellow-600">Pending</span>
                  )}
                </div>

                {report.status === 'available' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(report)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(report)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-sm font-medium text-white hover:shadow-lg transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No reports available for this year</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{viewingReport.type}</h3>
                <p className="text-sm text-gray-500">{viewingReport.term} • {viewingReport.year}</p>
              </div>
              <button
                onClick={() => setViewingReport(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Sample Report Content */}
              <div className="space-y-6">
                <div className="text-center pb-6 border-b border-gray-100">
                  <h4 className="text-xl font-bold text-gray-900">Lincoln Elementary School</h4>
                  <p className="text-gray-500">Official {viewingReport.type}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Student Name</p>
                    <p className="font-medium text-gray-900">Emma Johnson</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Grade Level</p>
                    <p className="font-medium text-gray-900">5th Grade</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Term</p>
                    <p className="font-medium text-gray-900">{viewingReport.term}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">GPA</p>
                    <p className="font-medium text-gray-900">{viewingReport.gpa || 'N/A'}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h5 className="font-semibold text-gray-900 mb-3">Subject Grades</h5>
                  <div className="space-y-2">
                    {[
                      { subject: 'Mathematics', grade: 'A', score: '95%' },
                      { subject: 'English Language Arts', grade: 'A-', score: '92%' },
                      { subject: 'Science', grade: 'A', score: '94%' },
                      { subject: 'Social Studies', grade: 'B+', score: '88%' },
                      { subject: 'Art', grade: 'A', score: '96%' },
                      { subject: 'Physical Education', grade: 'A', score: '98%' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50">
                        <span className="text-gray-700">{item.subject}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-500">{item.score}</span>
                          <span className="font-semibold text-gray-900 w-8">{item.grade}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setViewingReport(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleDownload(viewingReport)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportCards;
