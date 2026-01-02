
import React, { useState } from 'react';
import { generateLaunchPlan } from '../services/geminiService';
import { LaunchDayPlan, AdStrategyNode, Language, ProductContext } from '../types';
import { 
    Calendar, Network, Loader2, ChevronRight, ChevronDown, 
    Rocket, AlertTriangle, TrendingUp, Info, Layers, 
    RefreshCw, Video, Target
} from 'lucide-react';

interface LaunchPlannerProps {
    language: Language;
    productContext: ProductContext;
    setActiveTab: (tab: 'keywords' | 'content' | 'launch' | 'video' | 'custom') => void;
}

const MindMapNode: React.FC<{ node: AdStrategyNode; level?: number }> = ({ node, level = 0 }) => {
    const [expanded, setExpanded] = useState(true);
    if (!node) return null;
    
    return (
        <div className="ml-4">
            <div 
                className={`flex flex-col p-3 rounded-xl mb-3 cursor-pointer transition-all border ${
                    level === 0 ? 'bg-amz-dark text-white ring-2 ring-amz-orange border-transparent' : 
                    level === 1 ? 'bg-amz-light text-white shadow-md border-transparent' : 
                    'bg-white border-gray-200 hover:border-amz-orange hover:shadow-lg'
                }`}
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        {node.children && node.children.length > 0 && (
                            <span className="mr-2">
                                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </span>
                        )}
                        <p className={`font-bold ${level > 1 ? 'text-gray-800 text-sm' : 'text-base'}`}>{node.name || "广告单元"}</p>
                    </div>
                </div>
                
                {expanded && (node.budget || node.cpc || node.strategy) && (
                    <div className="mt-2 pt-2 border-t border-gray-100/10 grid grid-cols-2 gap-2 text-[10px] opacity-80">
                        {node.budget && <div>预算: {node.budget}</div>}
                        {node.cpc && <div>出价: {node.cpc}</div>}
                        {node.strategy && <div className="col-span-2 italic">策略: {node.strategy}</div>}
                    </div>
                )}
            </div>
            {expanded && node.children && node.children.length > 0 && (
                <div className="border-l-2 border-gray-200 ml-4 pl-3 py-1">
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
            const res = await generateLaunchPlan(
                productContext.title, 
                productContext.description, 
                productContext.keywords,
                language
            );
            setPlan(res.plan);
            setAdStrategy(res.adStrategy);
        } catch (e: any) {
            alert(e.message || "生成计划失败");
        } finally {
            setIsLoading(false);
        }
    };

    if (!productContext.hasGeneratedContent) {
        return (
            <div className="max-w-4xl mx-auto mt-10 p-10 bg-white rounded-xl shadow-sm border border-gray-200 text-center">
                <AlertTriangle className="w-12 h-12 text-amz-orange mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-4">内容尚未生成</h2>
                <p className="text-gray-500 mb-6">路线图需要基于您的产品文案和关键词进行深度建模。</p>
                <button 
                    onClick={() => setActiveTab('content')}
                    className="bg-amz-blue text-white px-6 py-2 rounded-lg font-bold"
                >
                    前往生成内容
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up pb-20">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                    <h2 className="text-3xl font-black text-gray-900 flex items-center mb-2">
                        <Rocket className="w-8 h-8 text-amz-orange mr-3" />
                        全渠道新品爆发路线图 (Pro)
                    </h2>
                    <p className="text-gray-500 font-medium">深度关键词冲刺策略 · 60天首页排名规划</p>
                </div>
                <button 
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="bg-amz-dark text-white px-8 py-4 rounded-xl font-bold hover:bg-amz-light flex items-center shadow-lg disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="animate-spin mr-3" /> : <TrendingUp className="mr-3" />}
                    生成 60天 深度执行计划
                </button>
            </div>

            {plan && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {plan.map((phase, idx) => (
                            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-amz-blue p-4 text-white flex justify-between items-center">
                                    <div className="flex items-center">
                                        <Calendar className="w-5 h-5 mr-2" />
                                        <span className="font-bold">阶段 {idx + 1}: {phase.dayRange} 天</span>
                                    </div>
                                    <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">{phase.focus}</span>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Auto Ads */}
                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                            <h4 className="text-[10px] font-black text-blue-500 uppercase mb-2 flex items-center">
                                                <RefreshCw className="w-3 h-3 mr-1" /> 自动广告
                                            </h4>
                                            <div className="text-xs space-y-1">
                                                <p>预算: <b>{phase.ppcDetail.autoAds.budget}</b></p>
                                                <p>出价: <b>{phase.ppcDetail.autoAds.cpc}</b></p>
                                                <p className="italic text-blue-600">{phase.ppcDetail.autoAds.strategy}</p>
                                            </div>
                                        </div>
                                        {/* Manual Exact */}
                                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                            <h4 className="text-[10px] font-black text-orange-500 uppercase mb-2 flex items-center">
                                                <Target className="w-3 h-3 mr-1" /> 手动精准
                                            </h4>
                                            <div className="text-xs space-y-1">
                                                <p>出价: <b>{phase.ppcDetail.manualExact.cpc}</b></p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {phase.ppcDetail.manualExact.targets.map((t, i) => (
                                                        <span key={i} className="bg-white/80 px-1.5 py-0.5 rounded border border-orange-200 text-[9px]">{t}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Manual Phrase */}
                                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                            <h4 className="text-[10px] font-black text-emerald-500 uppercase mb-2 flex items-center">
                                                <Layers className="w-3 h-3 mr-1" /> 手动词组
                                            </h4>
                                            <div className="text-xs space-y-1">
                                                <p>出价: <b>{phase.ppcDetail.manualPhrase.cpc}</b></p>
                                                <p className="text-[9px] opacity-70">投放重点: {phase.ppcDetail.manualPhrase.targets.join(', ')}</p>
                                            </div>
                                        </div>
                                        {/* Brand Ads */}
                                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                            <h4 className="text-[10px] font-black text-purple-500 uppercase mb-2 flex items-center">
                                                <Video className="w-3 h-3 mr-1" /> 品牌 & 视频
                                            </h4>
                                            <div className="text-xs space-y-1">
                                                <p>素材建议: <b>{phase.ppcDetail.brandAds.creative}</b></p>
                                                <p className="text-[9px] opacity-70">规划: {phase.ppcDetail.brandAds.roadmap60}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100 pt-4">
                                        <h5 className="text-[10px] font-black text-gray-400 uppercase mb-3">关键运营动作</h5>
                                        <ul className="text-xs text-gray-700 space-y-2">
                                            {phase.actions.map((act, i) => (
                                                <li key={i} className="flex items-start">
                                                    <span className="text-amz-orange mr-2">•</span> {act}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-20">
                            <div className="bg-amz-dark p-4 text-white flex items-center">
                                <Network className="w-5 h-5 mr-2 text-amz-orange" />
                                <span className="font-bold">广告架构预览</span>
                            </div>
                            <div className="p-4 max-h-[600px] overflow-y-auto">
                                {adStrategy && <MindMapNode node={adStrategy} />}
                            </div>
                            <div className="p-4 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-500">
                                <Info className="w-3 h-3 inline mr-1" />
                                策略基于当前关键词池和产品描述自动推演，建议根据实际 ACOS 情况每 3 天微调一次。
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LaunchPlanner;
