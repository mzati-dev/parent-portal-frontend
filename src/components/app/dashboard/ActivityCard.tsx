// components/ActivityCard.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ActivityCardProps {
    title: string;
    description: string;
    date: string;
    icon: React.ReactNode;
    type: 'academic' | 'social' | 'sport' | 'general';
    status?: 'completed' | 'upcoming' | 'in_progress';
}

const ActivityCard: React.FC<ActivityCardProps> = ({
    title,
    description,
    date,
    icon,
    type,
    status = 'upcoming'
}) => {
    const typeColors = {
        academic: 'bg-blue-100 text-blue-800',
        social: 'bg-green-100 text-green-800',
        sport: 'bg-orange-100 text-orange-800',
        general: 'bg-gray-100 text-gray-800'
    };

    const statusColors = {
        completed: 'bg-green-100 text-green-800',
        upcoming: 'bg-blue-100 text-blue-800',
        in_progress: 'bg-yellow-100 text-yellow-800'
    };

    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {icon}
                </div>

                <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium text-gray-900">{title}</h3>
                        <span className="text-xs font-medium text-gray-500">{date}</span>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{description}</p>

                    <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[type]}`}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status]}`}>
                            {status.replace('_', ' ')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityCard;