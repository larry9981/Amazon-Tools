
import React, { useState, useRef, useEffect } from 'react';
import { Video, PlayCircle, RefreshCw, AlertTriangle, Image as ImageIcon, Plus, Trash2, Info, FileText, Sparkles } from 'lucide-react';
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
      prompt: "Cinematic product showcase, slow motion zoom-in, professional studio lighting, detailed texture focus."
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize from context
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
          if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
              await window.aistudio.openSelectKey();
          }

          const combinedPrompt = `
Product Info: ${productDescription}
Video Creative Script: ${videoState.prompt}
Visual Goal: Ensure the video accurately reflects the product features and aesthetic based on the description and any reference images provided.
          `.trim();

          const imagesToUse = refImages.map(img => ({ data: img.data, mimeType: img.mimeType }));
          const uri = await generateMarketingVideo(combinedPrompt, imagesToUse);
          setVideoState(prev => ({ ...prev, isGenerating: false, videoUrl: uri }));
      } catch (err: any) {
          console.error(err);
          setVideoState(prev => ({ ...prev, isGenerating: false, error: "视频生成失败。请确保您使用了付费 API Key (Veo 3.1)。" }));
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
                        <h2 className="text-2xl font-bold text-gray-800">AI 视频工作室 Pro</h2>
                        <p className="text-sm text-gray-500">支持描述、提示词及多图参考 (Multi-Asset)，生成风格统一的营销大片。</p>
                    </div>
                </div>
                <div className="hidden md:flex items-center bg-purple-50 px-4 py-2 rounded-full">
                    <Info className="w-4 h-4 text-purple-600 mr-2" />
                    <span className="text-xs text-purple-800 font-medium">混合输入模式</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                    {/* Multi-Image Upload Grid */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
                                <ImageIcon className="w-3.5 h-3.5 mr-1.5" /> 参考图片 ({refImages.length}/3)
                            </label>
                            <span className="text-[10px] text-gray-400">可选，提供视觉引导</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {refImages.map((img, idx) => (
                                <div key={img.id} className="relative group aspect-square bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:border-purple-300 transition-all">
                                    <img src={`data:${img.mimeType};base64,${img.data}`} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                                    <button 
                                        onClick={() => removeImage(img.id)}
                                        className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            {refImages.length < 3 && (
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all group"
                                >
                                    <Plus className="w-6 h-6 text-gray-300 group-hover:text-purple-500 mb-1" />
                                    <span className="text-[10px] text-gray-400 font-bold group-hover:text-purple-600">添加图片</span>
                                </button>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                    </div>

                    {/* Product Description */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider flex items-center">
                            <FileText className="w-3.5 h-3.5 mr-1.5" /> 产品核心描述 (必填)
                        </label>
                        <textarea
                            value={productDescription}
                            onChange={(e) => setProductDescription(e.target.value)}
                            className="w-full p-4 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-inner bg-gray-50 focus:bg-white transition-all"
                            rows={3}
                            placeholder="例如：一款高性能无线降噪耳机，哑光黑配色，高保真音质，适合通勤和办公。"
                        />
                    </div>

                    {/* Creative Prompt */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider flex items-center">
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> 创意剧本/提示词 (必填)
                        </label>
                        <textarea
                            value={videoState.prompt}
                            onChange={(e) => setVideoState(prev => ({...prev, prompt: e.target.value}))}
                            className="w-full p-4 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-inner bg-gray-50 focus:bg-white transition-all"
                            rows={3}
                            placeholder="例如：镜头缓慢旋转，展示耳机的金属质感，背景是现代都市的虚化灯光。"
                        />
                    </div>

                    <button
                        onClick={handleGenerateVideo}
                        disabled={videoState.isGenerating}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                        {videoState.isGenerating ? (
                            <><RefreshCw className="animate-spin w-5 h-5 mr-3" /> 视频生成中 (约 1-3 分钟)...</>
                        ) : (
                            <><PlayCircle className="w-5 h-5 mr-3" /> 启动 AI 视频生成</>
                        )}
                    </button>
                    {videoState.error && <p className="text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{videoState.error}</span>
                    </p>}
                </div>

                <div className="flex flex-col h-full">
                    <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">渲染监视器</label>
                    <div className="flex-1 min-h-[400px] bg-amz-dark rounded-2xl overflow-hidden flex items-center justify-center relative shadow-2xl border-4 border-gray-100">
                        {videoState.isGenerating ? (
                            <div className="text-white flex flex-col items-center p-6 text-center animate-pulse">
                                <div className="relative w-20 h-20 mb-6">
                                    <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                    <Video className="absolute inset-0 m-auto w-8 h-8 text-purple-400" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">深度学习推理中...</h3>
                                <p className="text-xs text-gray-400 max-w-[200px]">Veo 正在将文本描述转化为电影级的画面帧</p>
                            </div>
                        ) : videoState.videoUrl ? (
                            <div className="w-full h-full relative">
                                <video 
                                    src={`${videoState.videoUrl}&key=${process.env.API_KEY}`} 
                                    controls 
                                    autoPlay 
                                    loop
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute bottom-4 right-4 bg-purple-600/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white font-bold flex items-center">
                                    <CheckCircle className="w-3 h-3 mr-1" /> 渲染完成
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-500 flex flex-col items-center">
                                <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mb-6 border border-gray-700">
                                    <Video className="w-10 h-10 opacity-10" />
                                </div>
                                <span className="text-sm font-medium tracking-wide opacity-40">配置参数后点击“启动”</span>
                            </div>
                        )}
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <h4 className="text-[10px] font-bold text-blue-700 uppercase mb-2">文本驱动 (Text-to-Video)</h4>
                            <p className="text-[11px] text-blue-600 leading-relaxed">
                                即便没有图片，仅靠详尽的产品描述和创意剧本，AI 也能生成震撼的 720p 视频。
                            </p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                            <h4 className="text-[10px] font-bold text-purple-700 uppercase mb-2">混合参考 (Hybrid)</h4>
                            <p className="text-[11px] text-purple-600 leading-relaxed">
                                同时使用文字和参考图片，可以让 AI 生成更加精准且符合您品牌风格的内容。
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

function CheckCircle(props: any) {
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
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    )
}

export default VideoStudio;
