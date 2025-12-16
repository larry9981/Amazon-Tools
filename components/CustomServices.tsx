import React from 'react';
import { Users, PenTool, GraduationCap, CheckCircle, Briefcase, ShoppingBag, Globe, Video, Copy } from 'lucide-react';

const CustomServices: React.FC = () => {
  const avatarUrl = "https://images.unsplash.com/photo-1542206395-9feb3edaa68d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80";
  const wechatId = "larry_yangang";

  const handleCopy = () => {
      navigator.clipboard.writeText(wechatId);
      alert("微信号已复制到剪贴板");
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up pb-12">
      {/* Header */}
      <div className="text-center mb-16 pt-8">
        <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
          跨境电商 <span className="text-amz-orange">企业级定制服务</span>
        </h2>
        <p className="text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
          我们提供深度的行业解决方案，从人才孵化到品牌内容制作，助力企业在 Amazon、TikTok 及独立站领域实现从 0 到 1 的突破。
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 px-4">
        {/* Service 1: Enterprise Training */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                <GraduationCap className="w-7 h-7 text-amz-blue" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">全渠道企业培训</h3>
            <p className="text-gray-500 text-sm mb-6 h-10">覆盖主流跨境平台，通过实战演练提升团队核心竞争力。</p>
            <ul className="space-y-3">
                <li className="flex items-center text-gray-700 font-medium text-sm">
                    <span className="w-6 h-6 rounded-full bg-blue-50 text-amz-blue flex items-center justify-center mr-3 text-xs">AMZ</span>
                    <span>亚马逊高阶运营与PPC策略</span>
                </li>
                <li className="flex items-center text-gray-700 font-medium text-sm">
                    <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center mr-3 text-xs"><Video className="w-3 h-3"/></span>
                    <span>TK (TikTok) 短视频与直播变现</span>
                </li>
                <li className="flex items-center text-gray-700 font-medium text-sm">
                    <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3 text-xs"><Globe className="w-3 h-3"/></span>
                    <span>独立站 (DTC) 品牌建站与引流</span>
                </li>
            </ul>
        </div>

        {/* Service 2: Content Production */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-100 transition-colors">
                <PenTool className="w-7 h-7 text-amz-orange" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">专业文案 & 视觉设计</h3>
            <p className="text-gray-500 text-sm mb-6 h-10">由资深母语文案与国际化设计师操刀，打造极致品牌形象。</p>
            <ul className="space-y-3">
                <li className="flex items-start text-gray-700 text-sm">
                    <CheckCircle className="w-4 h-4 text-amz-orange mr-2 mt-0.5" />
                    <span>本土化 Listing 文案 (英/日/德/法)</span>
                </li>
                <li className="flex items-start text-gray-700 text-sm">
                    <CheckCircle className="w-4 h-4 text-amz-orange mr-2 mt-0.5" />
                    <span>A+ 页面策划与高级合成海报设计</span>
                </li>
                <li className="flex items-start text-gray-700 text-sm">
                    <CheckCircle className="w-4 h-4 text-amz-orange mr-2 mt-0.5" />
                    <span>品牌故事 (Brand Story) 深度定制</span>
                </li>
            </ul>
        </div>

        {/* Service 3: Team Building */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-100 transition-colors">
                <Briefcase className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">0-1 团队搭建与孵化</h3>
            <p className="text-gray-500 text-sm mb-6 h-10">从招聘到选品，提供保姆式陪跑服务，解决起步难题。</p>
            <ul className="space-y-3">
                <li className="flex items-start text-gray-700 text-sm">
                    <CheckCircle className="w-4 h-4 text-purple-600 mr-2 mt-0.5" />
                    <span>跨境电商团队架构设计与招聘</span>
                </li>
                <li className="flex items-start text-gray-700 text-sm">
                    <CheckCircle className="w-4 h-4 text-purple-600 mr-2 mt-0.5" />
                    <span>运营人才岗前培训与考核体系</span>
                </li>
                <li className="flex items-start text-gray-700 text-sm">
                    <CheckCircle className="w-4 h-4 text-purple-600 mr-2 mt-0.5" />
                    <span>大数据选品策略与爆款打造指导</span>
                </li>
            </ul>
        </div>
      </div>

      {/* WeChat Contact Card Section */}
      <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-3xl mx-4">
        <h3 className="text-2xl font-bold text-gray-900 mb-8">联系我们 / 定制方案</h3>
        
        {/* Simulated WeChat UI Card */}
        <div className="bg-white p-8 rounded-[24px] shadow-2xl border border-gray-100 max-w-[340px] w-full text-center relative overflow-hidden">
            {/* Top Info Row */}
            <div className="flex items-center w-full mb-8">
                 <div className="w-16 h-16 rounded-lg overflow-hidden mr-4 flex-shrink-0 border border-gray-100">
                    <img 
                        src={avatarUrl} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                    />
                 </div>
                 <div className="text-left flex flex-col justify-center">
                     <h4 className="font-bold text-gray-900 text-xl leading-tight">Larry</h4>
                     <p className="text-gray-400 text-sm mt-1">广东 深圳</p>
                 </div>
            </div>
            
            {/* Text ID Container */}
            <div className="w-full py-10 bg-gray-50 rounded-xl mb-8 flex flex-col items-center justify-center border border-dashed border-gray-200 group cursor-pointer" onClick={handleCopy}>
                 <p className="text-gray-400 text-xs uppercase tracking-widest mb-2 font-medium">WeChat ID</p>
                 <div className="flex items-center justify-center">
                    <p className="text-2xl font-bold text-gray-800 select-all mr-2">{wechatId}</p>
                    <Copy className="w-4 h-4 text-gray-400 group-hover:text-amz-blue transition-colors" />
                 </div>
            </div>
            
            <p className="text-gray-400 text-sm mb-10 font-light tracking-wide">添加请注明 "AmzKeyword 咨询"</p>
            
            {/* WeChat Bottom Actions */}
            <div className="flex justify-center w-full text-amz-blue text-[15px] font-medium px-4 border-t border-gray-100 pt-6">
                <button onClick={handleCopy} className="hover:opacity-70 transition-opacity flex items-center w-full justify-center">
                    <Copy className="w-4 h-4 mr-2" /> 一键复制微信号
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CustomServices;