
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Sparkles, Download, RefreshCw, X, FileText, Copy, ListFilter, Trash2, CheckCircle, AlertTriangle, FileSpreadsheet, FileType, Search } from 'lucide-react';
import { generateSceneImages, generateListingContent, generateSingleImage } from '../services/geminiService';
import { ImageGeneratorState, Language, ListingContent } from '../types';

const MAIN_IMAGE_SCENES = [
  { id: 1, label: "Hero (白底主图)", promptSuffix: "Studio hero shot of the product on pure white background, center composition, 8k." },
  { id: 2, label: "Living Room (场景1)", promptSuffix: "Lifestyle shot, product in a bright modern living room, natural sunlight." },
  { id: 3, label: "Kitchen/Office (场景2)", promptSuffix: "Product placed on a high-end countertop, aesthetic workspace context." },
  { id: 4, label: "Hand/Usage (使用图)", promptSuffix: "A person's hand interacting with the product, showing scale and ergonomic design." },
  { id: 5, label: "Package (包装展示)", promptSuffix: "Product with its luxury retail packaging, gift-ready presentation." },
  { id: 6, label: "Macro (细节特写)", promptSuffix: "Extreme close-up of product textures and premium material details." }
];

const APLUS_IMAGE_SCENES = [
  { id: 101, label: "A+ Banner (品牌故事)", promptSuffix: "Panoramic cinematic wide banner for Amazon A+, showcasing brand identity and flagship product." },
  { id: 102, label: "Feature A (核心功能)", promptSuffix: "Wide shot focusing on the primary technical advantage, clean labeling space." },
  { id: 103, label: "Feature B (工艺细节)", promptSuffix: "Wide shot highlighting manufacturing excellence and material durability." },
  { id: 104, label: "Comparison (对比底图)", promptSuffix: "Visual background for a comparison chart, split screen style, high-end feel." },
  { id: 105, label: "Environment (全景场景)", promptSuffix: "Product in a vast, atmospheric environment that matches its branding." },
  { id: 106, label: "Tech Specs (参数展示图)", promptSuffix: "Exploded view or technical layout, minimalist professional background." },
  { id: 107, label: "Call to Action (底端横幅)", promptSuffix: "Strong visual finish, artistic brand logo integration with product." }
];

interface ImageGeneratorProps {
    language: Language;
    seedKeywords: string[];
    onListingGenerated: (title: string, description: string, uploadedImage: string | null, mimeType: string) => void;
    apiKey?: string;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ language, seedKeywords, onListingGenerated, apiKey }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [state, setState] = useState<ImageGeneratorState>({
    isGenerating: false,
    error: null,
    description: '',
    uploadedImage: null,
    mimeType: 'image/png',
    mainImages: MAIN_IMAGE_SCENES.map(s => ({ id: s.id, label: s.label, imageUrl: null, isLoading: false })),
    aplusImages: APLUS_IMAGE_SCENES.map(s => ({ id: s.id, label: s.label, imageUrl: null, isLoading: false }))
  });

  const [listing, setListing] = useState<ListingContent | null>(null);
  const [customPrompts, setCustomPrompts] = useState<{ [key: number]: string }>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const checkAndPromptKey = async () => {
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      if (!(await window.aistudio.hasSelectedApiKey())) {
        await window.aistudio.openSelectKey();
        return true; 
      }
    }
    return false;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
         setState(prev => ({ ...prev, error: "图片超过 5MB。" }));
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setState(prev => ({ ...prev, uploadedImage: base64String, mimeType: file.type, error: null }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAll = async () => {
    if (!state.uploadedImage || !state.description.trim()) return;
    await checkAndPromptKey();

    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
      mainImages: prev.mainImages.map(img => ({ ...img, isLoading: true })),
      aplusImages: prev.aplusImages.map(img => ({ ...img, isLoading: true }))
    }));

    try {
      const listingRes = await generateListingContent(state.description, seedKeywords, language, apiKey);
      setListing(listingRes);
      onListingGenerated(listingRes.title, state.description, state.uploadedImage, state.mimeType);

      const mainRes = await generateSceneImages(state.uploadedImage, state.mimeType, state.description, MAIN_IMAGE_SCENES, false, apiKey, customPrompts);
      setState(prev => ({
        ...prev,
        mainImages: prev.mainImages.map(img => ({ 
            ...img, isLoading: false, imageUrl: mainRes.find(r => r.id === img.id)?.imageUrl || img.imageUrl 
        }))
      }));

      const aplusRes = await generateSceneImages(state.uploadedImage, state.mimeType, state.description, APLUS_IMAGE_SCENES, true, apiKey, customPrompts);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        aplusImages: prev.aplusImages.map(img => ({ 
            ...img, isLoading: false, imageUrl: aplusRes.find(r => r.id === img.id)?.imageUrl || img.imageUrl 
        }))
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isGenerating: false, error: "生成失败，请检查密钥设置。" }));
    }
  };

  const regenerateSingle = async (id: number, isWide: boolean) => {
    if (!state.uploadedImage) return;
    await checkAndPromptKey();

    const updateImages = (list: any[]) => list.map(img => img.id === id ? { ...img, isLoading: true } : img);
    setState(prev => ({
        ...prev,
        mainImages: isWide ? prev.mainImages : updateImages(prev.mainImages),
        aplusImages: isWide ? updateImages(prev.aplusImages) : prev.aplusImages
    }));

    try {
        const scene = [...MAIN_IMAGE_SCENES, ...APLUS_IMAGE_SCENES].find(s => s.id === id);
        const prompt = `Product: ${state.description}. Scene: ${customPrompts[id] || scene?.promptSuffix}`;
        const imageUrl = await generateSingleImage(state.uploadedImage, state.mimeType, prompt, isWide, apiKey);
        
        setState(prev => ({
            ...prev,
            mainImages: prev.mainImages.map(img => img.id === id ? { ...img, isLoading: false, imageUrl } : img),
            aplusImages: prev.aplusImages.map(img => img.id === id ? { ...img, isLoading: false, imageUrl } : img)
        }));
    } catch (e) {
        setState(prev => ({
            ...prev,
            mainImages: prev.mainImages.map(img => img.id === id ? { ...img, isLoading: false } : img),
            aplusImages: prev.aplusImages.map(img => img.id === id ? { ...img, isLoading: false } : img)
        }));
    }
  };

  const bulkDownload = (images: { imageUrl: string | null; label: string }[]) => {
      images.forEach((img, idx) => {
          if (img.imageUrl) {
              const link = document.createElement('a');
              link.href = img.imageUrl;
              link.download = `AMZ-${img.label}.png`;
              link.click();
          }
      });
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Sidebar: Keywords Repository */}
      <div className="xl:w-80 flex-shrink-0 order-2 xl:order-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-20">
              <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-800 flex items-center">
                    <ListFilter className="w-5 h-5 mr-2 text-amz-blue" />
                    关键词收集库
                  </h3>
                  <span className="text-xs bg-amz-orange/10 text-amz-orange px-2 py-0.5 rounded-full font-bold">{seedKeywords.length}</span>
              </div>
              
              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
                  {seedKeywords.length > 0 ? seedKeywords.map((kw, i) => (
                      <div key={i} className="group flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-transparent hover:border-amz-blue hover:bg-white transition-all">
                          <span className="text-sm text-gray-700 font-medium truncate flex-1">{kw}</span>
                          <button onClick={() => {
                              navigator.clipboard.writeText(kw);
                              // Simple feedback
                          }} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 rounded-lg transition-opacity">
                              <Copy className="w-4 h-4 text-gray-400" />
                          </button>
                      </div>
                  )) : (
                      <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                         <Search className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                         <p className="text-sm text-gray-400 font-medium">暂无收集词</p>
                         <p className="text-[10px] text-gray-300 mt-1">请先在“关键词挖掘”页进行分析</p>
                      </div>
                  )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                      提示：以上关键词是在“关键词挖掘”页面分析出的高频词。撰写文案时请尽量埋入这些词汇以提升 SEO。
                  </p>
              </div>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-8 order-1 xl:order-2">
        {lightboxImage && (
            <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setLightboxImage(null)}>
                <img src={lightboxImage} className="max-w-full max-h-full object-contain" />
                <button className="absolute top-6 right-6 text-white"><X className="w-10 h-10" /></button>
            </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                        <Sparkles className="w-6 h-6 text-amz-orange mr-2" />
                        亚马逊视觉资产工作台
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">深度生成 SEO 标题、5点描述、2K 高清主图场景及高级 A+ Banner。</p>
                </div>
                <button 
                    onClick={handleGenerateAll} 
                    disabled={state.isGenerating || !state.uploadedImage || !state.description} 
                    className="px-8 py-3 bg-amz-blue text-white rounded-xl font-bold shadow-xl hover:bg-amz-light disabled:opacity-50 transition-all flex items-center justify-center"
                >
                    {state.isGenerating ? <RefreshCw className="animate-spin w-5 h-5 mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                    一键生成全套资产
                </button>
            </div>

            {state.error && (
                <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-3" /> {state.error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Inputs */}
                <div className="space-y-8">
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-3 tracking-widest">产品参考图</label>
                        {!state.uploadedImage ? (
                            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-amz-orange transition-all h-52 group">
                                <Upload className="w-10 h-10 text-gray-200 group-hover:text-amz-orange mb-3" />
                                <p className="text-xs text-gray-400 group-hover:text-amz-orange font-bold">点击上传产品原图</p>
                            </div>
                        ) : (
                            <div className="relative rounded-xl overflow-hidden border border-gray-200 h-52 bg-white flex items-center justify-center group shadow-sm">
                                <img src={`data:${state.mimeType};base64,${state.uploadedImage}`} className="max-h-full object-contain" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button onClick={() => setState(prev => ({...prev, uploadedImage: null}))} className="p-3 bg-white rounded-full text-red-500 hover:scale-110 transition-transform"><Trash2 className="w-6 h-6" /></button>
                                </div>
                            </div>
                        )}
                        <input ref={fileInputRef} type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>

                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-3 tracking-widest">核心卖点与功能</label>
                        <textarea
                            value={state.description}
                            onChange={(e) => setState(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full h-44 p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amz-blue focus:border-amz-blue shadow-inner bg-white resize-none"
                            placeholder="请描述产品的功能、材质、受众... AI 将自动匹配左侧关键词库生成 SEO 文案。"
                        />
                    </div>
                </div>

                {/* Outputs */}
                <div className="lg:col-span-2 space-y-12">
                    {/* 文案区 */}
                    <div className="bg-amz-dark rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <FileText className="w-20 h-20" />
                        </div>
                        <h3 className="text-lg font-bold mb-6 flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-amz-orange" />
                            Amazon SEO 优化文案
                        </h3>
                        <div className="space-y-4">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 group relative">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">SEO 优化标题</label>
                                <p className="text-sm font-bold text-white mt-1 leading-snug">{listing?.title || "等待生成..."}</p>
                                {listing?.title && <button onClick={() => navigator.clipboard.writeText(listing.title)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-lg transition-all"><Copy className="w-4 h-4 text-amz-orange" /></button>}
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {Array.from({length: 5}).map((_, i) => (
                                    <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10 group relative">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Bullet Point {i+1}</label>
                                        <p className="text-xs text-gray-300 mt-1">{listing?.bullets[i] || "等待生成..."}</p>
                                        {listing?.bullets[i] && <button onClick={() => navigator.clipboard.writeText(listing.bullets[i])} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-lg transition-all"><Copy className="w-4 h-4 text-amz-orange" /></button>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 主图场景区 */}
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                <ImageIcon className="w-5 h-5 mr-2 text-amz-blue" />
                                主图场景图 (2K高清)
                            </h3>
                            <button onClick={() => bulkDownload(state.mainImages)} className="text-xs font-bold text-amz-blue flex items-center hover:bg-amz-blue/5 px-3 py-1.5 rounded-lg transition-colors">
                                <Download className="w-4 h-4 mr-2" /> 打包下载主图
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {state.mainImages.map(img => (
                                <ImageCard 
                                    key={img.id} 
                                    img={img} 
                                    onEnlarge={setLightboxImage} 
                                    prompt={customPrompts[img.id] || ""} 
                                    setPrompt={(val: string) => setCustomPrompts(p => ({...p, [img.id]: val}))} 
                                    onRegenerate={() => regenerateSingle(img.id, false)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* 高级 A+ 内容区 */}
                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                                高级 A+ 品牌插图 (2928 * 1200)
                            </h3>
                            <button onClick={() => bulkDownload(state.aplusImages)} className="text-xs font-bold text-purple-600 flex items-center hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors">
                                <Download className="w-4 h-4 mr-2" /> 打包下载 A+ 全套
                            </button>
                        </div>
                        <div className="space-y-6">
                            {state.aplusImages.map(img => (
                                <div key={img.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 group hover:border-purple-200 transition-all shadow-sm">
                                    <div className="aspect-[2.44/1] bg-white rounded-xl border border-gray-100 overflow-hidden relative mb-4">
                                        {img.isLoading ? (
                                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center">
                                                <RefreshCw className="animate-spin text-purple-600 mb-2" />
                                                <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest animate-pulse">深度渲染中...</span>
                                            </div>
                                        ) : img.imageUrl ? (
                                            <div className="w-full h-full relative">
                                                <img src={img.imageUrl} onClick={() => setLightboxImage(img.imageUrl)} className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform duration-1000" />
                                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <a href={img.imageUrl} download={`A+_${img.label}.png`} className="p-2.5 bg-white/90 rounded-full shadow-lg text-gray-700 hover:text-purple-600"><Download className="w-5 h-5" /></a>
                                                    <button onClick={() => regenerateSingle(img.id, true)} className="p-2.5 bg-white/90 rounded-full shadow-lg text-gray-700 hover:text-purple-600"><RefreshCw className="w-5 h-5" /></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-200">
                                                <ImageIcon className="w-12 h-12 mb-2 opacity-10" />
                                                <span className="text-xs font-bold uppercase tracking-widest opacity-20">{img.label}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 relative">
                                            <input 
                                                value={customPrompts[img.id] || ""} 
                                                onChange={e => setCustomPrompts(p => ({...p, [img.id]: e.target.value}))} 
                                                className="w-full text-xs px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 shadow-inner" 
                                                placeholder={`微调提示词: ${img.label}...`} 
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-tighter flex-shrink-0">A+ Wide Banner</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const ImageCard = ({ img, onEnlarge, prompt, setPrompt, onRegenerate }: any) => (
    <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 hover:border-amz-blue transition-all group shadow-sm flex flex-col h-full">
        <div className="aspect-square bg-white rounded-xl border border-gray-100 overflow-hidden relative mb-3">
            {img.isLoading ? (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center">
                    <RefreshCw className="animate-spin text-amz-orange mb-2" />
                    <span className="text-[9px] font-bold text-amz-orange uppercase animate-pulse">渲染中...</span>
                </div>
            ) : img.imageUrl ? (
                <div className="w-full h-full relative">
                    <img src={img.imageUrl} onClick={() => onEnlarge(img.imageUrl)} className="w-full h-full object-cover cursor-zoom-in hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <a href={img.imageUrl} download={`Main_${img.label}.png`} className="p-2 bg-white/90 rounded-full shadow-md text-gray-600 hover:text-amz-blue"><Download className="w-3.5 h-3.5" /></a>
                        <button onClick={onRegenerate} className="p-2 bg-white/90 rounded-full shadow-md text-gray-600 hover:text-amz-blue"><RefreshCw className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="absolute bottom-0 inset-x-0 bg-black/50 p-1.5 text-center">
                        <p className="text-[9px] text-white font-bold uppercase truncate">{img.label}</p>
                    </div>
                </div>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-100 p-4 text-center">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-30">{img.label}</span>
                </div>
            )}
        </div>
        <input 
            value={prompt} 
            onChange={e => setPrompt(e.target.value)} 
            className="w-full text-[10px] px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-amz-blue outline-none shadow-inner" 
            placeholder="微调提示词..." 
        />
    </div>
);

export default ImageGenerator;
