import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  isClickable?: boolean;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color, onClick, isClickable, className }) => {
  const cardClasses = `bg-surface p-6 rounded-lg shadow flex items-center justify-between ${isClickable ? 'cursor-pointer hover:shadow-md hover:border-primary border-transparent border' : ''} ${className || ''}`;

  return (
    <div className={cardClasses} onClick={onClick}>
      <div>
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        <p className="text-3xl font-bold text-text-primary">{value}</p>
      </div>
      <div className={`p-3 bg-gray-100 rounded-full ${color}`}>
        {icon}
      </div>
    </div>
  );
};

export default StatsCard;
