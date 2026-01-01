
import React, { useMemo } from 'react';
import { KeywordData } from '../types';
import { Download, Copy, ExternalLink, TrendingUp, TrendingDown, Minus, Layers } from 'lucide-react';

interface KeywordTableProps {
  data: KeywordData[];
}

const KeywordTable: React.FC<KeywordTableProps> = ({ data }) => {
  const downloadCSV = () => {
    if (!data || data.length === 0) return;
    const headers = ['层级 (Tier)', '关键词 (Keyword)', '搜索量 (Volume)', '竞争度 (Competition)', 'CPC', '意图 (Intent)'];
    const rows = data
      .filter(k => k) 
      .map(k => [
        k.tier || "N/A",
        `"${k.keyword || ""}"`, 
        k.searchVolume || 0, 
        k.competition || "N/A", 
        k.cpc || 0, 
        k.intent || "N/A"
      ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "amazon_keywords_tiered.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = () => {
    if (!data) return;
    const text = data
      .filter(k => k && k.keyword)
      .map(k => `${k.keyword} (${k.tier || 'N/A'})`)
      .join('\n');
    navigator.clipboard.writeText(text);
    alert('关键词已复制到剪贴板!');
  };

  const groupedData = useMemo(() => {
    const tiers: Record<string, KeywordData[]> = {
      'Tier 1 (Head)': [],
      'Tier 2 (Middle)': [],
      'Tier 3 (Long-tail)': []
    };
    
    if (!data || !Array.isArray(data)) return tiers;

    data.forEach(item => {
      if (!item) return;
      
      // Fixed: item.tier.toLowerCase() crash by ensuring it's a string first
      const tierValue = String(item.tier || '').toLowerCase();
      if (tierValue.includes('tier 1')) tiers['Tier 1 (Head)'].push(item);
      else if (tierValue.includes('tier 2')) tiers['Tier 2 (Middle)'].push(item);
      else if (tierValue.includes('tier 3') || tierValue.includes('long-tail')) tiers['Tier 3 (Long-tail)'].push(item);
      else tiers['Tier 3 (Long-tail)'].push(item); // Fallback to long-tail
    });

    return tiers;
  }, [data]);

  const getCompetitionColor = (comp: string) => {
    if (!comp) return 'text-gray-600 bg-gray-50';
    switch(String(comp).toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getVolumeIcon = (vol: number) => {
    if (vol > 75) return <TrendingUp className="w-4 h-4 text-green-500 mr-2" />;
    if (vol < 25) return <TrendingDown className="w-4 h-4 text-red-400 mr-2" />;
    return <Minus className="w-4 h-4 text-gray-400 mr-2" />;
  };

  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
         <h2 className="text-xl font-bold text-amz-dark flex items-center">
          <span className="bg-amz-orange w-2 h-6 mr-3 rounded-sm"></span>
          关键词分析列表 ({data.length})
        </h2>
        <div className="flex gap-2">
           <button onClick={copyToClipboard} className="btn-secondary flex items-center px-3 py-2 text-sm border rounded hover:bg-gray-50">
            <Copy className="w-4 h-4 mr-2" /> 复制列表
          </button>
          <button onClick={downloadCSV} className="btn-primary flex items-center px-3 py-2 text-sm bg-amz-blue text-white rounded hover:opacity-90">
            <Download className="w-4 h-4 mr-2" /> 导出 CSV
          </button>
        </div>
      </div>
      
      {(Object.entries(groupedData) as [string, KeywordData[]][]).map(([tierName, keywords]) => (
        <div key={tierName} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center">
            <Layers className="w-4 h-4 text-amz-orange mr-2" />
            <h3 className="font-bold text-gray-700">{tierName}</h3>
            <span className="ml-2 text-xs font-medium bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">{keywords.length}</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">关键词 (Keyword)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">预估搜索量</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">竞争难度</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">搜索意图</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {keywords.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-amz-dark">{row.keyword}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        {getVolumeIcon(row.searchVolume || 0)}
                        <span className="font-mono">{row.searchVolume || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full border ${getCompetitionColor(row.competition)}`}>{row.competition || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-3 text-sm font-mono text-gray-600">${(row.cpc || 0).toFixed(2)}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">{row.intent || 'N/A'}</td>
                    <td className="px-6 py-3 text-right text-sm">
                      <a href={`https://www.amazon.com/s?k=${encodeURIComponent(row.keyword || "")}`} target="_blank" rel="noreferrer" className="text-amz-blue hover:text-amz-orange">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))}
                {keywords.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-400">该层级暂无关键词</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KeywordTable;
