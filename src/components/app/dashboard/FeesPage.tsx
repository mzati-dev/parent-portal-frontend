import React, { useState, useMemo } from 'react';
import {
  Download,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

// --- Types ---
interface Student {
  id: string;
  name: string;
  // ... other props from your Student interface
}

interface FeeItem {
  id: string;
  studentId: string; // This links the fee to the specific child
  title: string;
  category: 'Tuition' | 'Transport' | 'Activities' | 'Uniform';
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  invoiceUrl?: string;
}

interface FeesPageProps {
  selectedStudent: Student; // We receive the specific child here
}

// --- Mock Data (In a real app, this comes from an API) ---
const MOCK_FEES_DATA: FeeItem[] = [
  // Fees for Student ID '1'
  { id: '101', studentId: '1', title: 'Term 1 Tuition', category: 'Tuition', amount: 1500, dueDate: '2024-01-15', status: 'paid' },
  { id: '102', studentId: '1', title: 'School Bus (Feb)', category: 'Transport', amount: 120, dueDate: '2024-02-01', status: 'pending' },
  { id: '103', studentId: '1', title: 'Science Fair Material', category: 'Activities', amount: 45, dueDate: '2024-02-10', status: 'pending' },

  // Fees for Student ID '2' (Different Child)
  { id: '201', studentId: '2', title: 'Term 1 Tuition', category: 'Tuition', amount: 1200, dueDate: '2024-01-15', status: 'overdue' },
  { id: '202', studentId: '2', title: 'Soccer Uniform', category: 'Uniform', amount: 85, dueDate: '2024-01-20', status: 'paid' },
];

const FeesPage: React.FC<FeesPageProps> = ({ selectedStudent }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  // 1. Filter fees specifically for the selected child
  const studentFees = useMemo(() => {
    return MOCK_FEES_DATA.filter(fee => fee.studentId === selectedStudent.id);
  }, [selectedStudent.id]);

  // 2. Calculate Balance
  const totalBalance = studentFees
    .filter(fee => fee.status === 'pending' || fee.status === 'overdue')
    .reduce((sum, fee) => sum + fee.amount, 0);

  // 3. Filter lists based on tab
  const pendingFees = studentFees.filter(fee => fee.status === 'pending' || fee.status === 'overdue');
  const historyFees = studentFees.filter(fee => fee.status === 'paid');

  const displayedFees = activeTab === 'pending' ? pendingFees : historyFees;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fees & Payments</h1>
        <p className="text-gray-500">Financial overview for <span className="font-semibold text-blue-600">{selectedStudent.name}</span></p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-blue-100 font-medium mb-1">Total Outstanding Balance</p>
            <h2 className="text-4xl font-bold">${totalBalance.toLocaleString()}</h2>
            {totalBalance > 0 ? (
              <div className="flex items-center gap-2 mt-2 text-red-200 bg-red-500/20 px-3 py-1 rounded-full w-fit">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Payment Due</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2 text-green-200 bg-green-500/20 px-3 py-1 rounded-full w-fit">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">All caught up!</span>
              </div>
            )}
          </div>
          <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold shadow-md hover:bg-blue-50 transition-colors flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Pay Now
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'pending' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Pending & Due
          {activeTab === 'pending' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'history' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Payment History
          {activeTab === 'history' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Fees List */}
      <div className="space-y-4">
        {displayedFees.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500">No records found for this view.</p>
          </div>
        ) : (
          displayedFees.map((fee) => (
            <div
              key={fee.id}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${fee.status === 'paid' ? 'bg-green-100 text-green-600' :
                    fee.status === 'overdue' ? 'bg-red-100 text-red-600' :
                      'bg-amber-100 text-amber-600'
                  }`}>
                  {fee.status === 'paid' ? <CheckCircle2 className="w-6 h-6" /> :
                    fee.status === 'overdue' ? <AlertCircle className="w-6 h-6" /> :
                      <Clock className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{fee.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-600">
                      {fee.category}
                    </span>
                    <span>• Due: {fee.dueDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0">
                <div className="text-right">
                  <span className="block text-lg font-bold text-gray-900">${fee.amount.toLocaleString()}</span>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${fee.status === 'paid' ? 'text-green-600' :
                      fee.status === 'overdue' ? 'text-red-500' :
                        'text-amber-500'
                    }`}>
                    {fee.status}
                  </span>
                </div>
                {fee.status === 'paid' && (
                  <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Download Invoice">
                    <Download className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default FeesPage;