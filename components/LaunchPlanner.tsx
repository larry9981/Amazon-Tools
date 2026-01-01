import React, { useState } from 'react';
import { generateLaunchPlan } from '../services/geminiService';
import { LaunchDayPlan, AdStrategyNode, Language, ProductContext } from '../types';
import { 
    Calendar, Network, Loader2, ChevronRight, ChevronDown, 
    DollarSign, Target, Rocket, AlertTriangle, ArrowRight, 
    TrendingUp, Info, Tag, Layers, PlayCircle, RefreshCw,
    Video, MousePointerClick, BarChart4
} from 'lucide-react';

interface LaunchPlannerProps {
    language: Language;
    productContext: ProductContext;
    setActiveTab: (tab: 'keywords' | 'content' | 'launch' | 'video' | 'custom') => void;
    apiKey?: string;
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
                        <p className={`font-bold ${level > 1 ? 'text-gray-800 text-sm' : 'text-base'}`}>{node.name || "广告活动"}</p>
                    </div>
                    {node.budget && (
                        <div className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            level < 2 ? 'bg-white/20' : 'bg-green-100 text-green-700 border border-green-200'
                        }`}>
                            {node.budget}
                        </div>
                    )}
                </div>
                
                {expanded && (node.cpc || node.strategy || node.targets) && (
                    <div className="mt-2 pt-2 border-t border-gray-100/10 grid grid-cols-2 gap-2">
                        {node.cpc && <div className="text-[9px] opacity-70">出价: {node.cpc}</div>}
                        {node.strategy && <div className="text-[9px] opacity-70">策略: {node.strategy}</div>}
                        {node.targets && node.targets.length > 0 && (
                            <div className="col-span-2 text-[9px] opacity-70 italic truncate">
                                核心词: {node.targets.join(', ')}
                            </div>
                        )}
                    </div>
                )}
            </div>
            {expanded && node.children && node.children.length > 0 && (
                <div className={`border-l-2 ${level === 0 ? 'border-amz-orange' : 'border-gray-300'} ml-4 pl-3 py-1 space-y-1`}>
                    {node.children.map((child, idx) => (
                        <MindMapNode key={idx} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

const PPCDetailCard: React.FC<{ detail: NonNullable<LaunchDayPlan['ppcDetail']> }> = ({ detail }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-100 shadow-sm">
                <div className="flex items-center text-blue-800 font-bold text-[11px] mb-3 uppercase tracking-wider">
                    <RefreshCw className="w-4 h-4 mr-2" /> 自动广告 (Auto Ads)
                </div>
                <div className="space-y-2 text-xs text-blue-900/90">
                    <div className="flex justify-between"><span>预算/日:</span> <span className="font-bold">{detail.autoAds.budget}</span></div>
                    <div className="flex justify-between"><span>目标竞价:</span> <span className="font-bold">{detail.autoAds.cpc}</span></div>
                    <div className="flex justify-between"><span>竞价策略:</span> <span className="font-bold">{detail.autoAds.strategy}</span></div>
                </div>
            </div>

            <div className="bg-orange-50/70 p-4 rounded-xl border border-orange-100 shadow-sm">
                <div className="flex items-center text-orange-800 font-bold text-[11px] mb-3 uppercase tracking-wider">
                    <Target className="w-4 h-4 mr-2" /> 精准匹配 (Exact Match)
                </div>
                <div className="space-y-2 text-xs text-orange-900/90">
                    <div className="flex justify-between"><span>出价:</span> <span className="font-bold">{detail.manualExact.cpc}</span></div>
                    <div className="flex justify-between"><span>模式:</span> <span className="font-bold">{detail.manualExact.strategy}</span></div>
                    <div className="mt-2">
                        <p className="text-[10px] text-orange-400 font-bold uppercase mb-1">投放词:</p>
                        <div className="flex flex-wrap gap-1.5">
                            {(detail.manualExact.targets || []).map((t, i) => (
                                <span key={i} className="bg-white px-2 py-0.5 rounded border border-orange-200 text-[10px] font-medium">{t}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100 shadow-sm">
                <div className="flex items-center text-emerald-800 font-bold text-[11px] mb-3 uppercase tracking-wider">
                    <Layers className="w-4 h-4 mr-2" /> 词组匹配 (Phrase Match)
                </div>
                <div className="space-y-2 text-xs text-emerald-900/90">
                    <div className="flex justify-between"><span>出价:</span> <span className="font-bold">{detail.manualPhrase.cpc}</span></div>
                    <div className="flex justify-between"><span>策略:</span> <span className="font-bold">{detail.manualPhrase.strategy}</span></div>
                    <p className="text-[10px] mt-2 opacity-70 leading-relaxed"><b>目标词根:</b> {(detail.manualPhrase.targets || []).join(', ')}</p>
                </div>
            </div>

            <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-100 shadow-sm">
                <div className="flex items-center text-purple-800 font-bold text-[11px] mb-3 uppercase tracking-wider">
                    <Video className="w-4 h-4 mr-2" /> 品牌/视频 (SB/SBV)
                </div>
                <div className="space-y-2 text-xs text-purple-900/90">
                    <p className="leading-relaxed"><b>打位:</b> {(detail.brandAds.targets || []).join(', ')}</p>
                    <div className="bg-white/40 p-2 rounded border border-purple-200/50 mt-1">
                        <p className="text-[10px] text-purple-600 font-bold mb-1 uppercase">所需素材:</p>
                        <p className="text-[10px]">{detail.brandAds.creative}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LaunchPlanner: React.FC<LaunchPlannerProps> = ({ language, productContext, setActiveTab, apiKey }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [plan, setPlan] = useState<LaunchDayPlan[] | null>(null);
    const [adStrategy, setAdStrategy] = useState<AdStrategyNode | null>(null);

    const handleGenerate = async () => {
        if (!productContext.hasGeneratedContent) return;
        setIsLoading(true);
        try {
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                if (!(await window.aistudio.hasSelectedApiKey())) {
                    await window.aistudio.openSelectKey();
                }
            }

            const res = await generateLaunchPlan(
                productContext.title, 
                productContext.description, 
                productContext.keywords,
                language,
                apiKey
            );
            
            if (res && res.plan) {
                setPlan(res.plan);
                setAdStrategy(res.adStrategy || null);
            } else {
                throw new Error("生成失败。请确认 API Key 是否正确配置。");
            }
        } catch (e: any) {
            console.error("Error in handleGenerate (LaunchPlanner):", e);
            alert(e.message || "生成计划时出错。");
        } finally {
            setIsLoading(false);
        }
    };

    if (!productContext.hasGeneratedContent) {
        return (
            <div className="max-w-4xl mx-auto mt-10 p-10 bg-white rounded-xl shadow-sm border border-gray-200 text-center animate-fade-in-up">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-6 shadow-inner">
                    <AlertTriangle className="w-8 h-8 text-amz-orange" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">内容库为空</h2>
                <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                    爆发路线图需要基于您的产品标题、描述和关键词库进行深度 PPC 建模。请先完成“图片/文案”页面的生成。
                </p>
                <button 
                    onClick={() => setActiveTab('content')}
                    className="inline-flex items-center px-8 py-3 bg-amz-blue text-white font-bold rounded-xl hover:bg-amz-light transition-all shadow-lg hover:scale-105 active:scale-95"
                >
                    前往生成内容 <ArrowRight className="ml-2 w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up pb-20">
            {/* Control Panel */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xl flex flex-col xl:flex-row items-center justify-between gap-8 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-2 h-full bg-amz-orange"></div>
                 <div className="flex-1">
                     <div className="flex items-center mb-4">
                        <Rocket className="w-7 h-7 text-amz-orange mr-3 animate-pulse" />
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter">全渠道新品爆发路线图 (Pro)</h2>
                     </div>
                     <p className="text-gray-500 mb-6 flex items-center">
                        <BarChart4 className="w-4 h-4 mr-2" />
                        分析模型: <span className="font-bold text-amz-blue ml-1">Master Launch Algorithm v4.0 (Deep Keyword Push)</span>
                     </p>
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-inner">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-widest">目标市场</p>
                            <p className="text-sm font-bold text-gray-700">{language}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-inner">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-widest">关键词池</p>
                            <p className="text-sm font-bold text-gray-700">{productContext.keywords.length} 个核心词</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-inner">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-widest">规划周期</p>
                            <p className="text-sm font-bold text-amz-orange">60 天深度运营</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-inner">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-widest">自然位目标</p>
                            <p className="text-sm font-bold text-green-600">Top 5-10 核心词</p>
                        </div>
                     </div>
                 </div>
                 
                 <button 
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full xl:w-auto bg-amz-dark text-white px-12 py-6 rounded-2xl font-black text-lg hover:bg-amz-light flex items-center justify-center shadow-2xl transition-all active:scale-95 disabled:opacity-50 ring-4 ring-amz-orange/20"
                >
                    {isLoading ? <Loader2 className="animate-spin mr-3 w-6 h-6" /> : <TrendingUp className="mr-3 w-6 h-6" />}
                    {plan ? "重新智能生成计划" : "生成 60天 PPC 路线图"}
                </button>
            </div>

            {plan && adStrategy && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Phase Breakdown */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                            <div className="bg-amz-blue p-6 text-white flex items-center justify-between">
                                <div className="flex items-center">
                                    <Calendar className="w-6 h-6 mr-3" />
                                    <h3 className="text-xl font-black tracking-tight">60天阶段性执行路线 (Phase Detail)</h3>
                                </div>
                                <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded tracking-widest">VERIFIED STRATEGY</span>
                            </div>
                            <div className="p-8 space-y-12">
                                {plan.map((phase, idx) => (
                                    <div key={idx} className="relative pl-10 border-l-4 border-amz-blue/20 pb-12 last:pb-0">
                                        <div className="absolute -left-[14px] top-0 w-6 h-6 rounded-full bg-amz-blue border-4 border-white shadow-xl flex items-center justify-center text-[10px] text-white font-black">{idx + 1}</div>
                                        
                                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
                                            <span className="text-xs font-black text-amz-blue bg-blue-100/50 px-4 py-1.5 rounded-full uppercase tracking-widest border border-blue-200">{phase.dayRange}</span>
                                            <div className="flex items-center text-emerald-700 font-black text-sm bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200">
                                                <DollarSign className="w-4 h-4 mr-1" /> 阶段预估预算: {phase.budget}
                                            </div>
                                        </div>

                                        <h4 className="text-2xl font-black text-gray-900 mb-6">{phase.focus}</h4>
                                        
                                        <div className="grid grid-cols-1 gap-6">
                                            {/* Action List */}
                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
                                                <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                                                    <MousePointerClick className="w-3 h-3 mr-2" /> 关键运营动作
                                                </div>
                                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                                                    {(phase.actions || []).map((act, i) => (
                                                        <li key={i} className="flex items-start text-sm text-gray-700 leading-relaxed font-medium">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amz-orange mt-2 mr-3 flex-shrink-0"></div>
                                                            {act}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* PPC Detail Cards */}
                                            {phase.ppcDetail && <PPCDetailCard detail={phase.ppcDetail} />}

                                            {/* Metrics */}
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {(phase.metrics || []).map((m, i) => (
                                                    <span key={i} className="text-[10px] font-black border border-indigo-100 bg-indigo-50/30 text-indigo-600 px-3 py-1 rounded shadow-sm flex items-center uppercase tracking-tighter">
                                                        <Target className="w-3 h-3 mr-1.5"/> KPI: {m}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Ad Architecture Visual */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden sticky top-24">
                            <div className="bg-amz-dark p-6 text-white flex items-center justify-between">
                                <div className="flex items-center">
                                    <Network className="w-6 h-6 mr-3 text-amz-orange" />
                                    <h3 className="font-black text-sm tracking-widest">广告架构逻辑视图</h3>
                                </div>
                                <span className="bg-amz-orange text-[9px] font-black px-2 py-1 rounded">HI-RES LOGIC</span>
                            </div>
                            
                            <div className="p-6 bg-slate-50 overflow-auto max-h-[700px] custom-scrollbar">
                                 <div className="min-w-full py-4">
                                    {adStrategy && <MindMapNode node={adStrategy} />}
                                 </div>
                            </div>
                            
                            <div className="p-6 bg-white border-t border-gray-100">
                                <h5 className="text-xs font-black text-gray-500 mb-4 flex items-center uppercase tracking-widest">
                                    <Info className="w-4 h-4 mr-2 text-amz-blue" />
                                    策略解构建议
                                </h5>
                                <div className="space-y-4">
                                    <div className="text-[11px] text-gray-600 leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                        <b className="text-amz-blue block mb-1">自动广告 (Auto):</b>
                                        新品爆发期，自动广告应开启“紧密匹配”并关闭“同类产品”。竞价需高于建议竞价的 15%-20% 以快速扩充流量入口。
                                    </div>
                                    <div className="text-[11px] text-gray-600 leading-relaxed bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                                        <b className="text-amz-orange block mb-1">手动广告 (Manual):</b>
                                        精准匹配建议采用“Dynamic Bidding - Down Only”策略，通过高点击率的核心词快速累积销售额权重，推升自然排名。
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LaunchPlanner;
