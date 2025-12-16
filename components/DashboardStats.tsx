import React from 'react';
import { KeywordData, GroundingSource } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Tag } from 'lucide-react';

interface DashboardStatsProps {
  data: KeywordData[];
  sources: GroundingSource[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ data, sources }) => {
  if (data.length === 0) return null;

  // Prepare data for chart: Sort by volume and take top 8
  const chartData = [...data]
    .sort((a, b) => b.searchVolume - a.searchVolume)
    .slice(0, 8);

  const getBarColor = (competition: string) => {
    switch (competition.toLowerCase()) {
      case 'high': return '#f87171';
      case 'medium': return '#facc15';
      case 'low': return '#4ade80';
      default: return '#94a3b8';
    }
  };

  const highCompCount = data.filter(k => k.competition === 'High').length;
  const avgCpc = data.reduce((acc, curr) => acc + curr.cpc, 0) / data.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Chart Section */}
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Tag className="w-5 h-5 mr-2 text-amz-blue" />
          搜索量 vs. 竞争度 (前8名)
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis 
                type="category" 
                dataKey="keyword" 
                width={120} 
                tick={{fontSize: 12}} 
                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
              />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="searchVolume" radius={[0, 4, 4, 0]} barSize={20}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.competition)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-400 mr-2"></span>低竞争 (Low)</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></span>中等 (Med)</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-400 mr-2"></span>高竞争 (High)</div>
        </div>
      </div>

      {/* Summary Stats & Sources */}
      <div className="flex flex-col gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex-1">
          <h3 className="text-lg font-bold text-gray-800 mb-4">快速市场洞察</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">平均预估 CPC</p>
              <p className="text-2xl font-bold text-amz-blue">${avgCpc.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">高竞争关键词数量</p>
              <p className="text-2xl font-bold text-amz-orange">{highCompCount} <span className="text-sm font-normal text-gray-500">/ {data.length}</span></p>
            </div>
          </div>
        </div>

        {sources.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">数据来源 (Search Grounding)</h3>
             <ul className="space-y-2">
               {sources.slice(0, 3).map((source, idx) => (
                 <li key={idx}>
                   <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs text-amz-blue hover:underline truncate block"
                   >
                     {source.title}
                   </a>
                 </li>
               ))}
               {sources.length > 3 && (
                 <li className="text-xs text-gray-400 italic">...以及其他 {sources.length - 3} 个来源</li>
               )}
             </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardStats;