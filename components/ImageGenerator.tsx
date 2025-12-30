
import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Sparkles, Download, RefreshCw, X, Maximize2, FileText, Copy, ListFilter, Trash2, CheckCircle } from 'lucide-react';
import { generateSceneImages, generateListingContent } from '../services/geminiService';
import { ImageGeneratorState, Language, ListingContent } from '../types';

const MAIN_IMAGE_SCENES = [
  { id: 1, label: "白底英雄图", promptSuffix: "Studio hero shot of the product on pure white background, center composition, high contrast." },
  { id: 2, label: "场景展示图 1", promptSuffix: "Product in a clean, high-end living room environment, warm ambient light, sharp focus." },
  { id: 3, label: "场景展示图 2", promptSuffix: "Product in use by a person, lifestyle photography, natural morning light." },
  { id: 4, label: "多角度展示", promptSuffix: "Two products showing different angles, clean minimal background." },
  { id: 5, label: "礼物/包装展示", promptSuffix: "Product with premium gift wrapping next to it, festive atmosphere." },
  { id: 6, label: "细节特写图", promptSuffix: "Extreme macro shot of the product material and texture, blurred background." }
];

const APLUS_IMAGE_SCENES = [
  { id: 101, label: "A+ 顶部长图 (Banner)", promptSuffix: "A panoramic cinematic wide shot of the product brand story, professional lighting, room for text on left." },
  { id: 102, label: "功能解析 1", promptSuffix: "Product technical structure view, minimalist gray background, sharp details." },
  { id: 103, label: "功能解析 2", promptSuffix: "Product durability/quality demonstration, close up macro." },
  { id: 104, label: "使用场景 A", promptSuffix: "Wide shot showing the product in a professional kitchen or workspace." },
  { id: 105, label: "使用场景 B", promptSuffix: "Outdoor lifestyle wide shot, sunrise lighting, energetic feel." },
  { id: 106, label: "对比展示", promptSuffix: "Clean divided shot, showing before and after or product vs environment." },
  { id: 107, label: "品牌底图", promptSuffix: "Artistic abstract shot of the product material, very high resolution, 2928x1200 style." }
];

interface ImageGeneratorProps {
    language: Language;
    seedKeywords: string[];
    onListingGenerated: (title: string, description: string, uploadedImage: string | null, mimeType: string) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ language, seedKeywords, onListingGenerated }) => {
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

  const handleGenerate = async () => {
    if (!state.uploadedImage || !state.description.trim()) return;

    setState(prev => ({
      ...prev,
      isGenerating: true,
      mainImages: prev.mainImages.map(img => ({ ...img, isLoading: true })),
      aplusImages: prev.aplusImages.map(img => ({ ...img, isLoading: true }))
    }));

    try {
      // 1. Generate Listing First (Text is fast and has different quota)
      const listingRes = await generateListingContent(state.description, seedKeywords, language);
      setListing(listingRes);
      onListingGenerated(listingRes.title, state.description, state.uploadedImage, state.mimeType);

      // 2. Generate Main Images (Sequential inside service)
      const mainRes = await generateSceneImages(state.uploadedImage, state.mimeType, state.description, MAIN_IMAGE_SCENES, false);
      setState(prev => ({
        ...prev,
        mainImages: prev.mainImages.map(img => ({ 
            ...img, 
            isLoading: false, 
            imageUrl: mainRes.find(r => r.id === img.id)?.imageUrl || img.imageUrl 
        }))
      }));

      // 3. Generate A+ Images (Sequential inside service)
      const aplusRes = await generateSceneImages(state.uploadedImage, state.mimeType, state.description, APLUS_IMAGE_SCENES, true);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        aplusImages: prev.aplusImages.map(img => ({ 
            ...img, 
            isLoading: false, 
            imageUrl: aplusRes.find(r => r.id === img.id)?.imageUrl || img.imageUrl 
        }))
      }));

    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: "部分内容生成受限。由于 API 配额限制，请尝试点击下方单独按钮重新生成失败的图片。",
        mainImages: prev.mainImages.map(img => ({ ...img, isLoading: false })),
        aplusImages: prev.aplusImages.map(img => ({ ...img, isLoading: false }))
      }));
    }
  };

  const handleRegenSingle = async (id: number, isAplus: boolean) => {
      if (!state.uploadedImage) return;
      const scenes = isAplus ? APLUS_IMAGE_SCENES : MAIN_IMAGE_SCENES;
      const scene = scenes.find(s => s.id === id);
      const promptText = customPrompts[id] || scene?.promptSuffix || "";

      setState(prev => ({
          ...prev,
          [isAplus ? 'aplusImages' : 'mainImages']: prev[isAplus ? 'aplusImages' : 'mainImages'].map(img => img.id === id ? { ...img, isLoading: true } : img)
      }));

      try {
          const res = await generateSceneImages(state.uploadedImage, state.mimeType, state.description, [scene!], isAplus, { [id]: promptText });
          setState(prev => ({
            ...prev,
            [isAplus ? 'aplusImages' : 'mainImages']: prev[isAplus ? 'aplusImages' : 'mainImages'].map(img => img.id === id ? { ...img, isLoading: false, imageUrl: res[0].imageUrl || img.imageUrl } : img)
          }));
      } catch (err) {
        alert("重新生成失败，请稍后再试。");
        setState(prev => ({
            ...prev,
            [isAplus ? 'aplusImages' : 'mainImages']: prev[isAplus ? 'aplusImages' : 'mainImages'].map(img => img.id === id ? { ...img, isLoading: false } : img)
        }));
      }
  };

  const bulkDownload = (images: { imageUrl: string | null; label: string }[], prefix: string) => {
      images.forEach((img, idx) => {
          if (img.imageUrl) {
              const link = document.createElement('a');
              link.href = img.imageUrl;
              link.download = `${prefix}-${img.label || idx}.png`;
              link.click();
          }
      });
  };

  return (
    <div className="flex gap-6 max-w-full">
      {/* Sidebar: Keyword Collector */}
      <div className="hidden xl:block w-72 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-20">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                  <ListFilter className="w-4 h-4 mr-2 text-amz-blue" />
                  已收集关键词 ({seedKeywords.length})
              </h3>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar text-xs">
                  {seedKeywords.length > 0 ? seedKeywords.map((kw, i) => (
                      <div key={i} className="group flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100 hover:border-amz-orange transition-colors">
                          <span className="truncate flex-1">{kw}</span>
                          <button onClick={() => navigator.clipboard.writeText(kw)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded shadow-sm">
                              <Copy className="w-3 h-3 text-gray-400" />
                          </button>
                      </div>
                  )) : (
                      <p className="text-gray-400 italic">尚未挖掘关键词</p>
                  )}
              </div>
          </div>
      </div>

      <div className="flex-1 min-w-0 space-y-8">
        {lightboxImage && (
            <div className="fixed inset-0 z-[100] bg-black bg-opacity-95 flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
                <img src={lightboxImage} className="max-w-full max-h-full object-contain shadow-2xl" />
                <button className="absolute top-4 right-4 text-white hover:scale-110 transition-transform"><X className="w-10 h-10" /></button>
            </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Sparkles className="w-5 h-5 text-amz-orange mr-2" />
                图片 & 文案 工作台
            </h2>

            {state.error && (
                <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm flex items-start">
                    <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                    <p>{state.error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">1. 上传参考主图</label>
                        {!state.uploadedImage ? (
                            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50 hover:border-amz-orange h-48 transition-all group">
                                <Upload className="w-8 h-8 text-gray-300 mb-2 group-hover:text-amz-orange" />
                                <p className="text-sm text-gray-400 group-hover:text-amz-orange">点击或拖拽上传</p>
                            </div>
                        ) : (
                            <div className="relative rounded-xl overflow-hidden border border-gray-200 h-48 bg-gray-50 flex items-center justify-center group">
                                <img src={`data:${state.mimeType};base64,${state.uploadedImage}`} className="max-h-full object-contain" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button onClick={() => setState(prev => ({...prev, uploadedImage: null}))} className="p-2 bg-white rounded-full shadow-md text-red-500 hover:scale-110 transition-transform"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            </div>
                        )}
                        <input ref={fileInputRef} type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">2. 产品核心描述</label>
                        <textarea
                            value={state.description}
                            onChange={(e) => setState(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full h-40 p-4 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amz-blue focus:border-amz-blue shadow-inner"
                            placeholder="输入核心卖点、材质、适用场景..."
                        />
                    </div>
                    <button 
                        onClick={handleGenerate} 
                        disabled={state.isGenerating || !state.uploadedImage || !state.description} 
                        className="w-full py-4 bg-amz-blue text-white rounded-xl font-bold shadow-lg flex items-center justify-center hover:bg-amz-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {state.isGenerating ? (
                            <div className="flex items-center">
                                <RefreshCw className="animate-spin w-5 h-5 mr-3" />
                                <span>正在排队渲染中 (约 1-2 分钟)...</span>
                            </div>
                        ) : (
                            <><Sparkles className="w-5 h-5 mr-2" /> 一键生成全套内容</>
                        )}
                    </button>
                    <p className="text-[10px] text-gray-400 text-center italic">由于 API 限制，多张图片将按顺序排队生成以确保质量。</p>
                </div>

                <div className="md:col-span-2 space-y-10">
                    {/* Listing Content */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center mb-4"><FileText className="w-4 h-4 text-amz-blue mr-2" /><h3 className="font-bold text-gray-800">SEO 优化文案</h3></div>
                        <div className="space-y-4">
                            <div className="bg-white p-3 rounded border border-gray-200 group relative">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">产品标题</label>
                                <p className="text-sm font-medium text-gray-900 mt-1">{listing?.title || "等待生成..."}</p>
                                {listing?.title && (
                                    <button onClick={() => navigator.clipboard.writeText(listing.title)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 rounded text-gray-400"><Copy className="w-3.5 h-3.5" /></button>
                                )}
                            </div>
                            <div className="space-y-2">
                                {Array.from({length: 5}).map((_, i) => (
                                    <div key={i} className="bg-white p-3 rounded border border-gray-200 group relative">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">卖点 {i+1}</label>
                                        <p className="text-xs text-gray-600 mt-1">{listing?.bullets[i] || "等待生成..."}</p>
                                        {listing?.bullets[i] && (
                                            <button onClick={() => navigator.clipboard.writeText(listing.bullets[i])} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 rounded text-gray-400"><Copy className="w-3.5 h-3.5" /></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Images Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center"><ImageIcon className="w-4 h-4 text-amz-blue mr-2" /><h3 className="font-bold text-gray-800">主图场景图 (2K 高清)</h3></div>
                            <button onClick={() => bulkDownload(state.mainImages, 'main')} className="text-xs flex items-center text-amz-blue hover:underline font-medium"><Download className="w-3 h-3 mr-1" /> 打包下载主图</button>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {state.mainImages.map(img => (
                                <ImageCard key={img.id} img={img} onEnlarge={setLightboxImage} onRegen={() => handleRegenSingle(img.id, false)} prompt={customPrompts[img.id] || ""} setPrompt={(val: string) => setCustomPrompts(p => ({...p, [img.id]: val}))} />
                            ))}
                        </div>
                    </div>

                    {/* A+ Images Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center"><ImageIcon className="w-4 h-4 text-purple-600 mr-2" /><h3 className="font-bold text-gray-800">高级 A+ 详情图 (2928*1200)</h3></div>
                            <button onClick={() => bulkDownload(state.aplusImages, 'aplus')} className="text-xs flex items-center text-purple-600 hover:underline font-medium"><Download className="w-3 h-3 mr-1" /> 打包下载 A+</button>
                        </div>
                        <div className="space-y-6">
                            {state.aplusImages.map(img => (
                                <div key={img.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-purple-200 transition-colors shadow-sm">
                                    <div className="aspect-[2.44/1] w-full bg-white rounded border border-gray-100 overflow-hidden relative group">
                                        {img.isLoading ? (
                                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                                <RefreshCw className="animate-spin text-purple-600 mb-2" />
                                                <span className="text-[10px] text-purple-600 font-bold uppercase animate-pulse">渲染中...</span>
                                            </div>
                                        ) : img.imageUrl ? (
                                            <img src={img.imageUrl} onClick={() => setLightboxImage(img.imageUrl)} className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-300">
                                                <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
                                                <span className="text-xs font-medium opacity-40">{img.label}</span>
                                            </div>
                                        )}
                                        {img.imageUrl && !img.isLoading && (
                                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => setLightboxImage(img.imageUrl)} className="p-2 bg-white rounded-full shadow-lg text-gray-700 hover:bg-purple-50"><Maximize2 className="w-4 h-4" /></button>
                                                <a href={img.imageUrl} download={`aplus-${img.id}.png`} className="p-2 bg-white rounded-full shadow-lg text-purple-600 hover:bg-purple-50"><Download className="w-4 h-4" /></a>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-3 flex gap-3">
                                        <div className="flex-1 relative">
                                            <input 
                                                value={customPrompts[img.id] || ""} 
                                                onChange={e => setCustomPrompts(p => ({...p, [img.id]: e.target.value}))} 
                                                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-1 focus:ring-purple-500 shadow-sm" 
                                                placeholder={img.label} 
                                            />
                                            {img.imageUrl && <div className="absolute right-3 top-2 text-green-500"><CheckCircle className="w-4 h-4" /></div>}
                                        </div>
                                        <button 
                                            onClick={() => handleRegenSingle(img.id, true)} 
                                            disabled={img.isLoading}
                                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all flex items-center gap-2"
                                        >
                                            <RefreshCw className={`w-3 h-3 ${img.isLoading ? 'animate-spin' : ''}`} /> 
                                            {img.imageUrl ? '重新生成' : '立即生成'}
                                        </button>
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

const ImageCard = ({ img, onEnlarge, onRegen, prompt, setPrompt }: any) => (
    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 hover:border-amz-blue transition-colors group">
        <div className="aspect-square bg-white rounded-lg border border-gray-100 overflow-hidden relative mb-3">
            {img.isLoading ? (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <RefreshCw className="animate-spin text-amz-orange mb-2" />
                    <span className="text-[9px] text-amz-orange font-bold uppercase animate-pulse">队列中...</span>
                </div>
            ) : img.imageUrl ? (
                <img src={img.imageUrl} onClick={() => onEnlarge(img.imageUrl)} className="w-full h-full object-cover cursor-zoom-in group-hover:scale-110 transition-transform duration-500" />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-200 p-4 text-center">
                    <ImageIcon className="w-6 h-6 mb-1 opacity-20" />
                    <span className="text-[9px] font-medium leading-tight">{img.label}</span>
                </div>
            )}
            {img.imageUrl && !img.isLoading && (
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={() => onEnlarge(img.imageUrl)} className="p-2 bg-white rounded-full shadow-lg text-gray-700 hover:scale-110 transition-transform"><Maximize2 className="w-3.5 h-3.5" /></button>
                    <a href={img.imageUrl} download={`main-${img.id}.png`} className="p-2 bg-white rounded-full shadow-lg text-amz-blue hover:scale-110 transition-transform"><Download className="w-3.5 h-3.5" /></a>
                </div>
            )}
        </div>
        <div className="space-y-2">
            <input 
                value={prompt} 
                onChange={e => setPrompt(e.target.value)} 
                className="w-full text-[10px] px-2 py-1.5 border rounded focus:ring-1 focus:ring-amz-blue bg-white" 
                placeholder={img.label} 
            />
            <button 
                onClick={onRegen} 
                disabled={img.isLoading}
                className="w-full py-1.5 text-[9px] font-bold bg-white border border-gray-200 rounded hover:bg-amz-blue hover:text-white hover:border-amz-blue transition-all uppercase tracking-wider disabled:opacity-50"
            >
                {img.imageUrl ? 'Regenerate' : 'Generate'}
            </button>
        </div>
    </div>
);

function AlertTriangle(props: any) {
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
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    )
}

export default ImageGenerator;
