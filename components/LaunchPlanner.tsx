import React, { useState } from 'react';
import { generateLaunchPlan } from '../services/geminiService';
import { LaunchDayPlan, AdStrategyNode, Language, ProductContext } from '../types';
import { Calendar, Network, Loader2, ChevronRight, ChevronDown, DollarSign, Target, Rocket, AlertTriangle, ArrowRight } from 'lucide-react';

interface LaunchPlannerProps {
    language: Language;
    productContext: ProductContext;
    setActiveTab: (tab: 'keywords' | 'content' | 'launch') => void;
}

// Recursive component to render Mind Map Tree
const MindMapNode: React.FC<{ node: AdStrategyNode; level?: number }> = ({ node, level = 0 }) => {
    const [expanded, setExpanded] = useState(true);
    
    return (
        <div className="ml-4">
            <div 
                className={`flex items-center p-2 rounded-lg mb-2 cursor-pointer transition-colors ${level === 0 ? 'bg-amz-dark text-white' : level === 1 ? 'bg-amz-light text-white' : 'bg-gray-50 border border-gray-200 hover:bg-white'}`}
                onClick={() => setExpanded(!expanded)}
            >
                {node.children && (
                    <span className="mr-2">
                        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </span>
                )}
                <div className="flex-1">
                    <p className={`font-medium ${level > 1 ? 'text-gray-800 text-sm' : ''}`}>{node.name}</p>
                </div>
                {node.budget && (
                     <div className={`text-xs px-2 py-1 rounded ml-4 ${level < 2 ? 'bg-white bg-opacity-20' : 'bg-green-100 text-green-700'}`}>
                        {node.budget}
                     </div>
                )}
            </div>
            {expanded && node.children && (
                <div className={`border-l-2 ${level === 0 ? 'border-amz-dark' : 'border-gray-200'} ml-4 pl-2`}>
                    {node.children.map((child, idx) => (
                        <MindMapNode key={idx} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

const LaunchPlanner: React.FC<LaunchPlannerProps> = ({ language, productContext, setActiveTab }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [plan, setPlan] = useState<LaunchDayPlan[] | null>(null);
    const [adStrategy, setAdStrategy] = useState<AdStrategyNode | null>(null);

    const handleGenerate = async () => {
        if (!productContext.hasGeneratedContent) return;
        setIsLoading(true);
        try {
            // Using the Title and Description from the shared context
            const res = await generateLaunchPlan(productContext.title, productContext.description, language);
            setPlan(res.plan);
            setAdStrategy(res.adStrategy);
        } catch (e) {
            alert("生成计划时出错，请重试。");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    if (!productContext.hasGeneratedContent) {
        return (
            <div className="max-w-4xl mx-auto mt-10 p-10 bg-white rounded-xl shadow-sm border border-gray-200 text-center animate-fade-in-up">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-6">
                    <AlertTriangle className="w-8 h-8 text-amz-orange" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">尚未生成产品内容</h2>
                <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                    为了制定数据驱动的 60 天推广计划，我们需要先了解您的产品。
                    请先前往“文案/图片生成”页面生成内容。
                </p>
                <button 
                    onClick={() => setActiveTab('content')}
                    className="inline-flex items-center px-6 py-3 bg-amz-blue text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors"
                >
                    前往内容生成页面 <ArrowRight className="ml-2 w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
            {/* Action Header */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex-1">
                     <h2 className="text-2xl font-bold text-gray-800 mb-2">60天亚马逊新品推广路线图</h2>
                     <p className="text-gray-500">
                         正在规划产品: <span className="font-semibold text-amz-blue">{productContext.title || "Your Product"}</span>
                     </p>
                     <p className="text-xs text-gray-400 mt-1">目标: 日销 30-40 单 • 市场: {language}</p>
                 </div>
                 
                 <button 
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="bg-amz-orange text-white px-8 py-4 rounded-lg font-bold hover:bg-opacity-90 flex items-center shadow-md transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Rocket className="mr-2 w-5 h-5" />}
                    {plan ? "重新生成计划" : "生成60天推广计划"}
                </button>
            </div>

            {plan && adStrategy && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 60 Day Plan */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-blue-50 p-4 border-b border-blue-100 flex items-center">
                            <Rocket className="w-5 h-5 text-amz-blue mr-2" />
                            <h3 className="font-bold text-amz-dark">推广执行步骤 (Launch Execution)</h3>
                        </div>
                        <div className="p-4 space-y-6 max-h-[600px] overflow-y-auto">
                            {plan.map((phase, idx) => (
                                <div key={idx} className="relative pl-6 border-l-2 border-gray-200 pb-4">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-amz-orange border-2 border-white shadow-sm"></div>
                                    <div className="mb-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                        <span className="text-sm font-bold text-amz-blue uppercase tracking-wide">{phase.dayRange}</span>
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">{phase.budget}</span>
                                    </div>
                                    <h4 className="font-bold text-gray-800 mb-2">{phase.focus}</h4>
                                    
                                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">关键行动 (Key Actions)</p>
                                        <ul className="text-sm text-gray-600 space-y-2">
                                            {phase.actions.map((act, i) => (
                                                <li key={i} className="flex items-start">
                                                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                                    <span>{act}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {phase.metrics.map((m, i) => (
                                            <span key={i} className="text-xs border border-blue-100 bg-blue-50 text-blue-700 px-2 py-1 rounded flex items-center">
                                                <Target className="w-3 h-3 mr-1"/> {m}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* PPC Mind Map */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                        <div className="bg-purple-50 p-4 border-b border-purple-100 flex items-center">
                            <Network className="w-5 h-5 text-purple-700 mr-2" />
                            <h3 className="font-bold text-purple-900">3个月 PPC 广告架构</h3>
                        </div>
                        <div className="p-6 bg-slate-50 flex-1 overflow-auto min-h-[400px]">
                             <MindMapNode node={adStrategy} />
                        </div>
                        <div className="p-3 bg-white border-t border-gray-200 text-xs text-center text-gray-400">
                            点击节点展开/折叠结构。
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LaunchPlanner;

function Check(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}