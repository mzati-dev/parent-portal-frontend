import React from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  grade: string;
  avatar: string;
  school: string;
}

interface StudentSwitcherProps {
  students: Student[];
  selectedStudent: Student;
  onSelectStudent: (student: Student) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const StudentSwitcher: React.FC<StudentSwitcherProps> = ({
  students,
  selectedStudent,
  onSelectStudent,
  isOpen,
  onToggle,
}) => {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
      >
        <img
          src={selectedStudent.avatar}
          alt={selectedStudent.name}
          className="w-14 h-14 rounded-xl object-cover ring-2 ring-blue-100"
        />
        <div className="flex-1 text-left">
          <h3 className="font-semibold text-gray-900">{selectedStudent.name}</h3>
          <p className="text-sm text-gray-500">{selectedStudent.grade} • {selectedStudent.school}</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20">
          <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
            Select Child
          </p>
          {students.map((student) => (
            <button
              key={student.id}
              onClick={() => {
                onSelectStudent(student);
                onToggle();
              }}
              className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                selectedStudent.id === student.id ? 'bg-blue-50' : ''
              }`}
            >
              <img
                src={student.avatar}
                alt={student.name}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div className="flex-1 text-left">
                <h4 className="font-medium text-gray-900">{student.name}</h4>
                <p className="text-sm text-gray-500">{student.grade}</p>
              </div>
              {selectedStudent.id === student.id && (
                <Check className="w-5 h-5 text-blue-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentSwitcher;
