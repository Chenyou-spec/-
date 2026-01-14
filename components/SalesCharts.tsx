import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, PieChart, Pie } from 'recharts';
import { SalesStat, ProductStat, GeoStat } from '../types';

interface SalesChartProps {
  data: SalesStat[];
}

interface ProductChartProps {
  data: ProductStat[];
}

interface GeoChartProps {
    data: GeoStat[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#3b82f6'];

export const RevenueTrendChart: React.FC<SalesChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Revenue Trend (30 Days)</h3>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `¥${value}`} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ color: '#6366f1' }}
          />
          <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const TopProductsChart: React.FC<ProductChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Top Products by Volume</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart layout="vertical" data={data}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={120} tick={{fill: '#475569', fontSize: 12}} axisLine={false} tickLine={false} />
            <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px' }} />
            <Bar dataKey="sales" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const GeoDistChart: React.FC<GeoChartProps> = ({ data }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96 flex flex-col items-center">
            <h3 className="text-lg font-semibold text-slate-800 mb-2 w-full text-left">Customer Distribution</h3>
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}