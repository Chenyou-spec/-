import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trendUp, icon }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        {trend && (
          <div className={`flex items-center mt-2 text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            <span>{trendUp ? '↑' : '↓'} {trend}</span>
            <span className="text-slate-400 ml-1">vs last month</span>
          </div>
        )}
      </div>
      {icon && (
        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
          {icon}
        </div>
      )}
    </div>
  );
};

export default StatCard;