
import React, { useState, useRef, useEffect } from 'react';
import { Video, PlayCircle, RefreshCw, AlertTriangle, Plus, Trash2, Download, Zap, Loader2, Info, ExternalLink } from 'lucide-react';
import { generateMarketingVideo } from '../services/geminiService';
import { ProductContext } from '../types';

interface VideoStudioProps {
    productContext: ProductContext;
}

interface RefImage {
    data: string;
    mimeType: string;
    id: string;
}

const VideoStudio: React.FC<VideoStudioProps> = ({ productContext }) => {
  const [refImages, setRefImages] = useState<RefImage[]>([]);
  const [productDescription, setProductDescription] = useState<string>('');
  const [videoState, setVideoState] = useState<{ isGenerating: boolean; videoUrl: string | null; error: string | null; prompt: string }>({
      isGenerating: false,
      videoUrl: null,
      error: null,
      prompt: "Cinematic product showcase with elegant slow camera motion, professional studio lighting, 4k detail."
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (productContext.uploadedImage && refImages.length === 0) {
        setRefImages([{
            data: productContext.uploadedImage,
            mimeType: productContext.mimeType,
            id: 'context-main'
        }]);
    }
    if (productContext.description && !productDescription) {
        setProductDescription(productContext.description);
    }
  }, [productContext]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && refImages.length < 3) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setRefImages(prev => [...prev, {
            data: base64String,
            mimeType: file.type,
            id: Math.random().toString(36).substr(2, 9)
        }]);
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const removeImage = (id: string) => {
    setRefImages(prev => prev.filter(img => img.id !== id));
  };

  const handleGenerateVideo = async () => {
      if (!productDescription.trim() && !videoState.prompt.trim()) {
          setVideoState(prev => ({ ...prev, error: "请输入描述或提示词" }));
          return;
      }
      
      setVideoState(prev => ({ ...prev, isGenerating: true, error: null, videoUrl: null }));
      
      try {
          if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
              const hasKey = await window.aistudio.hasSelectedApiKey();
              if (!hasKey) {
                  await window.aistudio.openSelectKey();
              }
          }

          const combinedPrompt = `${productDescription}. ${videoState.prompt}`;
          const imagesToUse = refImages.map(img => ({ data: img.data, mimeType: img.mimeType }));
          const videoUrl = await generateMarketingVideo(combinedPrompt, imagesToUse);
          setVideoState(prev => ({ ...prev, isGenerating: false, videoUrl }));
      } catch (err: any) {
          console.error("Video Gen Error:", err);
          let errorMsg = err.message || "视频生成失败";
          
          // 处理特定错误：Requested entity was not found.
          if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("404")) {
              errorMsg = "API Key 状态异常，正在重新引导选择...";
              if (window.aistudio) window.aistudio.openSelectKey();
          }

          setVideoState(prev => ({ ...prev, isGenerating: false, error: errorMsg }));
      }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up pb-10">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                    <div className="bg-purple-600 p-3 rounded-2xl mr-4 text-white">
                        <Video className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight">AI 视频工作室 Pro</h2>
                        <p className="text-gray-500 font-medium">由 Veo 3.1 驱动的电影级产品视频生成</p>
                    </div>
                </div>
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hidden md:flex items-center text-xs font-bold text-amz-blue hover:underline bg-blue-50 px-3 py-2 rounded-lg"
                >
                  <Info className="w-4 h-4 mr-2" />
                  检查计费配置
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-2">
                        <p className="text-xs text-orange-800 leading-relaxed font-medium">
                           <b>提示:</b> Veo 视频模型需要 API Key 关联一个已开启结算(Paid Project)的 Google Cloud 项目。如果生成一直失败，请确认您的密钥权限。
                        </p>
                    </div>

                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase mb-4 block">1. 参考图片 (建议 1-3 张)</label>
                        <div className="grid grid-cols-3 gap-4">
                            {refImages.map((img) => (
                                <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shadow-inner">
                                    <img src={`data:${img.mimeType};base64,${img.data}`} alt="Ref" className="w-full h-full object-cover" />
                                    <button onClick={() => removeImage(img.id)} className="absolute top-1 right-1 p-1.5 bg-white/90 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {refImages.length < 3 && (
                                <button onClick={() => fileInputRef.current?.click()} className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl hover:bg-purple-50 transition-colors">
                                    <Plus className="w-8 h-8 text-gray-300" />
                                    <span className="text-[10px] font-bold text-gray-400 mt-2">添加</span>
                                </button>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                    </div>

                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase mb-3 block">2. 创意描述</label>
                        <textarea 
                            value={videoState.prompt} 
                            onChange={(e) => setVideoState(prev => ({...prev, prompt: e.target.value}))} 
                            className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="描述视频中的动作，例如：'产品缓慢旋转，阳光穿过玻璃窗...'"
                        />
                    </div>

                    <button 
                        onClick={handleGenerateVideo} 
                        disabled={videoState.isGenerating} 
                        className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold text-lg hover:bg-purple-700 transition-all flex items-center justify-center shadow-lg shadow-purple-100"
                    >
                        {videoState.isGenerating ? (
                            <><Loader2 className="animate-spin w-5 h-5 mr-3" /> 云端渲染中 (约 2-5 分钟)...</>
                        ) : (
                            <><Zap className="w-5 h-5 mr-3" /> 开始生成视频</>
                        )}
                    </button>
                    
                    {videoState.error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-700 text-sm">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                            <div className="flex flex-col">
                                <p className="font-bold">生成异常</p>
                                <p className="opacity-80">{videoState.error}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 rounded-3xl border border-gray-200 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]">
                    {videoState.videoUrl ? (
                        <div className="w-full h-full relative group">
                            <video src={videoState.videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
                            <a href={videoState.videoUrl} download="product_video.mp4" className="absolute top-4 right-4 p-3 bg-white/90 rounded-2xl shadow-xl text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Download className="w-6 h-6" />
                            </a>
                        </div>
                    ) : (
                        <div className="text-center p-10 opacity-30">
                            <PlayCircle className="w-20 h-20 mx-auto mb-4" />
                            <p className="text-sm font-bold uppercase tracking-widest">视频生成监控</p>
                            <p className="text-[10px] mt-2">点击左侧生成按钮后，此区域将实时显示渲染结果</p>
                        </div>
                    )}
                    {videoState.isGenerating && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-sm font-black text-purple-600 animate-pulse">VEO 渲染引擎运行中...</p>
                            <p className="text-[10px] text-gray-500 mt-2 max-w-xs">正在进行复杂的物理模拟和光影追踪，请保持窗口开启。</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default VideoStudio;
