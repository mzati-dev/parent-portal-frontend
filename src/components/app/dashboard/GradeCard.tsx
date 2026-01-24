import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface GradeCardProps {
  subject: string;
  grade: string;
  percentage: number;
  trend: 'up' | 'down' | 'neutral';
  teacher: string;
  lastUpdated: string;
  color: string;
}

const GradeCard: React.FC<GradeCardProps> = ({
  subject,
  grade,
  percentage,
  trend,
  teacher,
  lastUpdated,
  color,
}) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-600 bg-emerald-50' : trend === 'down' ? 'text-red-600 bg-red-50' : 'text-gray-500 bg-gray-50';
  const trendLabel = trend === 'up' ? 'Improving' : trend === 'down' ? 'Needs Attention' : 'Stable';

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-emerald-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    if (grade.startsWith('D')) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: color }}
          >
            {subject.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{subject}</h3>
            <p className="text-sm text-gray-500">{teacher}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          <span>{trendLabel}</span>
        </div>
      </div>

      <div className="flex items-end justify-between mb-4">
        <div>
          <span className={`text-4xl font-bold ${getGradeColor(grade)}`}>{grade}</span>
          <span className="text-gray-400 text-lg ml-2">/ {percentage}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>

      <p className="text-xs text-gray-400 mt-3">Last updated: {lastUpdated}</p>
    </div>
  );
};

export default GradeCard;
