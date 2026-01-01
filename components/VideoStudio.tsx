
import React, { useState, useRef, useEffect } from 'react';
import { Video, PlayCircle, RefreshCw, AlertTriangle, Image as ImageIcon, Plus, Trash2, Info, FileText, Sparkles, CheckCircle, Download, ShieldCheck } from 'lucide-react';
import { generateMarketingVideo } from '../services/geminiService';
import { ProductContext } from '../types';

interface VideoStudioProps {
    productContext: ProductContext;
    apiKey?: string;
}

interface RefImage {
    data: string;
    mimeType: string;
    id: string;
}

const VideoStudio: React.FC<VideoStudioProps> = ({ productContext, apiKey }) => {
  const [refImages, setRefImages] = useState<RefImage[]>([]);
  const [productDescription, setProductDescription] = useState<string>('');
  const [videoState, setVideoState] = useState<{ isGenerating: boolean; videoUrl: string | null; error: string | null; prompt: string }>({
      isGenerating: false,
      videoUrl: null,
      error: null,
      prompt: "Cinematic product showcase, slow motion zoom-in, professional studio lighting, detailed texture focus."
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
          setVideoState(prev => ({ ...prev, error: "请输入产品描述或创意提示词。" }));
          return;
      }
      setVideoState(prev => ({ ...prev, isGenerating: true, error: null, videoUrl: null }));
      try {
          const combinedPrompt = `Product Info: ${productDescription}. Script: ${videoState.prompt}`;
          const imagesToUse = refImages.map(img => ({ data: img.data, mimeType: img.mimeType }));
          const uri = await generateMarketingVideo(combinedPrompt, imagesToUse, apiKey);
          setVideoState(prev => ({ ...prev, isGenerating: false, videoUrl: uri }));
      } catch (err: any) {
          console.error(err);
          const errorMsg = err.message || "视频生成失败。";
          setVideoState(prev => ({ 
            ...prev, 
            isGenerating: false, 
            error: errorMsg.includes("401") ? "API Key 无效或额度不足，请在设置中配置自定义 Key。" : errorMsg
          }));
      }
  };

  const handleDownload = async () => {
    if (!videoState.videoUrl) return;
    try {
        const res = await fetch(`${videoState.videoUrl}&key=${apiKey || process.env.API_KEY}`);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'AI_Product_Video.mp4';
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (e) {
        alert("下载失败，请尝试刷新页面。");
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-lg mr-4">
                        <Video className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">AI 视频工作室 Pro (Veo 3.1)</h2>
                        <p className="text-sm text-gray-500">超高清电影级营销视频，支持 16:9 比例渲染。</p>
                    </div>
                </div>
                {apiKey ? (
                    <div className="flex items-center bg-green-50 px-4 py-2 rounded-lg border border-green-100">
                        <ShieldCheck className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-xs text-green-800 font-bold">已使用自定义 Key</span>
                    </div>
                ) : (
                    <div className="flex items-center bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                        <Info className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-xs text-blue-800 font-bold">正在使用系统默认 Key</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
                                <ImageIcon className="w-3.5 h-3.5 mr-1.5" /> 参考图片 ({refImages.length}/3)
                            </label>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {refImages.map((img, idx) => (
                                <div key={img.id} className="relative group aspect-square bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                    <img src={`data:${img.mimeType};base64,${img.data}`} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                                    <button onClick={() => removeImage(img.id)} className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            {refImages.length < 3 && (
                                <button onClick={() => fileInputRef.current?.click()} className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl hover:bg-purple-50 group">
                                    <Plus className="w-6 h-6 text-gray-300 group-hover:text-purple-500 mb-1" />
                                    <span className="text-[10px] text-gray-400 font-bold">添加参考</span>
                                </button>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">产品核心描述</label>
                        <textarea value={productDescription} onChange={(e) => setProductDescription(e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 bg-gray-50 focus:bg-white" rows={3} placeholder="输入产品核心卖点..." />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">创意提示词 (Veo Prompt)</label>
                        <textarea value={videoState.prompt} onChange={(e) => setVideoState(prev => ({...prev, prompt: e.target.value}))} className="w-full p-4 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 bg-gray-50 focus:bg-white" rows={3} placeholder="描述视频的运镜、灯光、氛围..." />
                    </div>

                    <button 
                        onClick={handleGenerateVideo} 
                        disabled={videoState.isGenerating} 
                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                        {videoState.isGenerating ? <><RefreshCw className="animate-spin w-5 h-5 mr-3" /> 正在渲染 720p 视频...</> : <><PlayCircle className="w-5 h-5 mr-3" /> 启动高画质生成</>}
                    </button>
                    
                    {videoState.error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 animate-shake">
                            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <p className="text-xs text-red-700 leading-relaxed">{videoState.error}</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col h-full">
                    <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">预览监视器</label>
                    <div className="flex-1 min-h-[400px] bg-black rounded-2xl overflow-hidden flex items-center justify-center relative shadow-2xl">
                        {videoState.isGenerating ? (
                            <div className="text-white flex flex-col items-center text-center animate-pulse">
                                <div className="relative w-20 h-20 mb-6">
                                    <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full animate-ping"></div>
                                    <Video className="absolute inset-0 m-auto w-8 h-8 text-purple-400" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">Veo 正在构图...</h3>
                                <p className="text-xs text-gray-400">大约需要 2-3 分钟</p>
                            </div>
                        ) : videoState.videoUrl ? (
                            <div className="w-full h-full relative group">
                                <video src={`${videoState.videoUrl}&key=${apiKey || process.env.API_KEY}`} controls className="w-full h-full object-contain" />
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={handleDownload} className="p-2 bg-purple-600 text-white rounded-full shadow-xl hover:scale-110 transition-transform"><Download className="w-5 h-5" /></button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-600 flex flex-col items-center">
                                <Video className="w-10 h-10 opacity-10 mb-4" />
                                <span className="text-sm">就绪</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default VideoStudio;
