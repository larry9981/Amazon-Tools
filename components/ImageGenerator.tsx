import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Sparkles, Download, RefreshCw, X, Maximize2, Edit2, Copy, FileText, Check, Video, PlayCircle } from 'lucide-react';
import { generateAplusImages, regenerateSingleImage, generateListingContent, generateMarketingVideo } from '../services/geminiService';
import { ImageGeneratorState, Language, ListingContent } from '../types';

// Translated labels for UI display only
const SCENE_LABELS_CN = [
  "主图 (Hero Shot)",
  "家居生活场景",
  "户外/运动场景",
  "极简/现代风格",
  "桌面展示场景",
  "细节特写 (Macro)",
  "礼品/开箱场景"
];

interface ImageGeneratorProps {
    language: Language;
    seedKeywords: string[];
    onListingGenerated: (title: string, description: string) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ language, seedKeywords, onListingGenerated }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for Images
  const [state, setState] = useState<ImageGeneratorState>({
    isGenerating: false,
    error: null,
    description: '',
    uploadedImage: null,
    mimeType: 'image/png',
    generatedImages: SCENE_LABELS_CN.map((label, idx) => ({ 
      id: idx + 1, 
      label, 
      imageUrl: null, 
      isLoading: false 
    }))
  });

  // State for Listing
  const [listing, setListing] = useState<ListingContent | null>(null);

  // State for Image Prompts (Individual)
  const [customPrompts, setCustomPrompts] = useState<{ [key: number]: string }>({});

  // Lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Video Generation State
  const [videoState, setVideoState] = useState<{ isGenerating: boolean; videoUrl: string | null; error: string | null; prompt: string }>({
      isGenerating: false,
      videoUrl: null,
      error: null,
      prompt: "Cinematic product showcase, high quality, professional lighting, slow motion movement."
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
         setState(prev => ({ ...prev, error: "图片大小超过限制，请上传 5MB 以内的图片。" }));
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setState(prev => ({
          ...prev,
          uploadedImage: base64String,
          mimeType: file.type,
          error: null
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!state.uploadedImage || !state.description.trim()) return;

    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
      generatedImages: prev.generatedImages.map(img => ({ ...img, isLoading: true, imageUrl: null }))
    }));
    setListing(null);

    try {
      // Run both tasks in parallel
      const [imageResults, listingResult] = await Promise.all([
        generateAplusImages(state.uploadedImage, state.mimeType, state.description),
        generateListingContent(state.description, seedKeywords.slice(0, 8), language)
      ]);
      
      // Update Image State
      setState(prev => ({
        ...prev,
        isGenerating: false,
        generatedImages: prev.generatedImages.map(img => {
            const found = imageResults.find(r => r.id === img.id);
            return { ...img, isLoading: false, imageUrl: found?.imageUrl || null };
        })
      }));

      // Update Listing State
      setListing(listingResult);
      
      // Share data with App (for Launch Plan)
      onListingGenerated(listingResult.title, state.description);

      // Initialize prompts if empty
      const initialPrompts: {[key:number]: string} = {};
      SCENE_LABELS_CN.forEach((label, idx) => {
          initialPrompts[idx + 1] = label;
      });
      setCustomPrompts(initialPrompts);

    } catch (err: any) {
      console.error(err);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: "生成内容失败，请重试。",
        generatedImages: prev.generatedImages.map(img => ({ ...img, isLoading: false }))
      }));
    }
  };

  const handleRegenerateSingle = async (id: number) => {
      if (!state.uploadedImage) return;
      // If user hasn't typed a custom prompt, default to the label. 
      // Note: For real effect, the backend uses English prompts mapped by ID. 
      // Here we just pass the custom text if provided.
      const promptToUse = customPrompts[id] || SCENE_LABELS_CN[id-1];
      
      setState(prev => ({
          ...prev,
          generatedImages: prev.generatedImages.map(img => img.id === id ? { ...img, isLoading: true } : img)
      }));

      try {
          const newUrl = await regenerateSingleImage(id, state.uploadedImage, state.mimeType, state.description, promptToUse);
          setState(prev => ({
            ...prev,
            generatedImages: prev.generatedImages.map(img => img.id === id ? { ...img, isLoading: false, imageUrl: newUrl } : img)
        }));
      } catch (err) {
        alert("重新生成图片失败。");
        setState(prev => ({
            ...prev,
            generatedImages: prev.generatedImages.map(img => img.id === id ? { ...img, isLoading: false } : img)
        }));
      }
  };

  const handleGenerateVideo = async () => {
      if (!state.uploadedImage) return;
      
      setVideoState(prev => ({ ...prev, isGenerating: true, error: null, videoUrl: null }));
      
      try {
          // Check for API key access for Veo
          if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
              // Proceed
          } else if (window.aistudio) {
              await window.aistudio.openSelectKey();
          }

          const uri = await generateMarketingVideo(videoState.prompt, state.uploadedImage, state.mimeType);
          setVideoState(prev => ({ ...prev, isGenerating: false, videoUrl: uri }));
      } catch (err: any) {
          console.error(err);
          setVideoState(prev => ({ ...prev, isGenerating: false, error: "视频生成失败。请确保您使用了付费 API Key。" }));
      }
  };

  // Listing Edit Handlers
  const handleTitleChange = (val: string) => setListing(prev => prev ? { ...prev, title: val } : null);
  const handleBulletChange = (index: number, val: string) => {
      setListing(prev => {
          if (!prev) return null;
          const newBullets = [...prev.bullets];
          newBullets[index] = val;
          return { ...prev, bullets: newBullets };
      });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Lightbox Modal */}
      {lightboxImage && (
          <div className="fixed inset-0 z-[100] bg-black bg-opacity-90 flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
              <button className="absolute top-4 right-4 text-white hover:text-gray-300">
                  <X className="w-8 h-8" />
              </button>
              <img src={lightboxImage} alt="Full Resolution" className="max-w-full max-h-screen object-contain" />
              <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm bg-black bg-opacity-50 py-2">
                  2K 超清预览
              </div>
          </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <Sparkles className="w-5 h-5 text-amz-orange mr-2" />
          亚马逊内容生成器
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left: Inputs */}
            <div className="md:col-span-1 space-y-6">
                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">1. 上传产品图片 (白底图最佳)</label>
                    {!state.uploadedImage ? (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-amz-orange hover:bg-orange-50 transition-colors h-48"
                        >
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500 font-medium">点击上传图片</p>
                            <p className="text-xs text-gray-400 mt-1">支持 PNG, JPG (最大 5MB)</p>
                        </div>
                    ) : (
                        <div className="relative rounded-lg overflow-hidden border border-gray-200 h-48 bg-gray-50 flex items-center justify-center">
                            <img 
                                src={`data:${state.mimeType};base64,${state.uploadedImage}`} 
                                alt="Uploaded Product" 
                                className="max-h-full max-w-full object-contain"
                            />
                            <button 
                                onClick={() => {
                                    setState(prev => ({...prev, uploadedImage: null}));
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                            >
                                <X className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    )}
                    <input ref={fileInputRef} type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>

                {/* Description Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">2. 产品描述 ({language})</label>
                    <textarea
                        value={state.description}
                        onChange={(e) => setState(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amz-orange focus:border-amz-orange sm:text-sm"
                        placeholder="输入产品详细信息，材质，尺寸，核心卖点..."
                    />
                    <p className="text-xs text-gray-400 mt-1">
                        我们将利用这些信息生成 Listing 文案，策划推广方案，并生成场景图。
                    </p>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={state.isGenerating || !state.uploadedImage || !state.description}
                    className="w-full py-4 px-4 bg-amz-blue hover:bg-opacity-90 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                    {state.isGenerating ? (
                        <>
                           <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                           内容生成中...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            一键生成 文案 & 图片
                        </>
                    )}
                </button>
                {state.error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{state.error}</p>}
            </div>

            {/* Right: Results Grid */}
            <div className="md:col-span-2 space-y-8">
                 
                 {/* Listing Section (Always visible placeholders if no data) */}
                 <div className="animate-fade-in-up">
                         <div className="flex items-center mb-4">
                            <FileText className="w-5 h-5 text-amz-blue mr-2" />
                            <h3 className="font-bold text-gray-800">SEO 优化 Listing 文案 ({language})</h3>
                         </div>
                         
                         {/* Title */}
                         <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 group relative">
                             <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">产品标题 (Title)</label>
                             <textarea 
                                value={listing?.title || ""}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-gray-900 resize-none placeholder-gray-300"
                                rows={2}
                                placeholder="生成的标题将显示在这里..."
                             />
                             {listing && (
                                <button onClick={() => navigator.clipboard.writeText(listing.title)} className="absolute top-2 right-2 p-1.5 bg-white border rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100">
                                    <Copy className="w-3 h-3 text-gray-500" />
                                </button>
                             )}
                         </div>

                         {/* Bullets */}
                         <div className="space-y-3">
                             {Array.from({ length: 5 }).map((_, idx) => (
                                 <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 group relative">
                                    <div className="absolute left-0 top-3 w-6 flex justify-center text-gray-400 font-bold text-xs">{idx + 1}</div>
                                    <textarea 
                                        value={listing?.bullets[idx] || ""}
                                        onChange={(e) => handleBulletChange(idx, e.target.value)}
                                        className="w-full pl-6 bg-transparent border-none focus:ring-0 p-0 text-sm text-gray-700 resize-none placeholder-gray-300 min-h-[80px]"
                                        rows={4}
                                        placeholder={`卖点 ${idx + 1} 将显示在这里 (约 150+ 字符)...`}
                                    />
                                    {listing?.bullets[idx] && (
                                        <button onClick={() => navigator.clipboard.writeText(listing.bullets[idx])} className="absolute top-2 right-2 p-1.5 bg-white border rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100">
                                            <Copy className="w-3 h-3 text-gray-500" />
                                        </button>
                                    )}
                                 </div>
                             ))}
                         </div>
                 </div>

                 {/* Images Section */}
                 <div>
                    <div className="flex justify-between items-center mb-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center">
                            <ImageIcon className="w-5 h-5 text-amz-blue mr-2" />
                            <h3 className="font-bold text-gray-800">A+ 场景图 (2K 高清)</h3>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {state.generatedImages.map((img) => (
                            <div key={img.id} className="flex flex-col gap-2">
                                <div className="relative group bg-gray-50 border border-gray-200 rounded-lg overflow-hidden aspect-square">
                                    {/* Loading State */}
                                    {img.isLoading && (
                                        <div className="absolute inset-0 z-20 bg-white bg-opacity-90 flex flex-col items-center justify-center text-gray-400">
                                            <RefreshCw className="w-6 h-6 animate-spin mb-2 text-amz-orange" />
                                            <span className="text-xs">处理中...</span>
                                        </div>
                                    )}

                                    {/* Image Display */}
                                    {img.imageUrl ? (
                                        <>
                                            <img 
                                                src={img.imageUrl} 
                                                alt={img.label} 
                                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                                                onClick={() => setLightboxImage(img.imageUrl)}
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                                                <button onClick={() => setLightboxImage(img.imageUrl)} className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100" title="Enlarge">
                                                    <Maximize2 className="w-4 h-4 text-amz-dark" />
                                                </button>
                                                <a href={img.imageUrl} download={`amazon-aplus-${img.id}.png`} className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100" title="Download">
                                                    <Download className="w-4 h-4 text-amz-dark" />
                                                </a>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                                            <ImageIcon className="w-8 h-8 mb-2" />
                                            <span className="text-xs text-center px-4">等待生成</span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Prompt Input & Regenerate Button */}
                                <div className="space-y-1">
                                    <textarea
                                        value={customPrompts[img.id] || img.label}
                                        onChange={(e) => setCustomPrompts(prev => ({...prev, [img.id]: e.target.value}))}
                                        className="w-full text-xs p-2 border border-gray-200 rounded resize-none focus:border-amz-orange focus:ring-1 focus:ring-amz-orange"
                                        rows={2}
                                        placeholder="输入修改提示词..."
                                    />
                                    <button 
                                        onClick={() => handleRegenerateSingle(img.id)}
                                        disabled={img.isLoading || !state.uploadedImage}
                                        className="w-full text-xs py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded font-medium flex items-center justify-center disabled:opacity-50"
                                    >
                                        <RefreshCw className="w-3 h-3 mr-1" /> 重新生成
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>

                 {/* Video Studio Section */}
                 <div className="pt-6 border-t border-gray-200">
                    <div className="flex items-center mb-4">
                        <Video className="w-5 h-5 text-purple-600 mr-2" />
                        <h3 className="font-bold text-gray-800">视频工作室 (Beta)</h3>
                    </div>
                    
                    <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">视频提示词 (Video Prompt)</label>
                                    <textarea
                                        value={videoState.prompt}
                                        onChange={(e) => setVideoState(prev => ({...prev, prompt: e.target.value}))}
                                        className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                                        rows={3}
                                    />
                                </div>
                                <button
                                    onClick={handleGenerateVideo}
                                    disabled={videoState.isGenerating || !state.uploadedImage}
                                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {videoState.isGenerating ? <RefreshCw className="animate-spin w-4 h-4 mr-2" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                                    生成营销视频
                                </button>
                                {videoState.error && <p className="text-sm text-red-600">{videoState.error}</p>}
                                <p className="text-xs text-gray-500">需要先上传主图。生成 720p 16:9 视频 (Veo Model)。</p>
                            </div>
                            
                            <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center relative shadow-lg">
                                {videoState.isGenerating ? (
                                    <div className="text-white flex flex-col items-center">
                                        <RefreshCw className="animate-spin w-8 h-8 mb-2" />
                                        <span className="text-sm">视频生成中...</span>
                                    </div>
                                ) : videoState.videoUrl ? (
                                    <video 
                                        src={`${videoState.videoUrl}&key=${process.env.API_KEY}`} 
                                        controls 
                                        autoPlay 
                                        loop
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="text-gray-500 flex flex-col items-center">
                                        <Video className="w-12 h-12 mb-2 opacity-30" />
                                        <span className="text-sm">暂无视频</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                 </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;