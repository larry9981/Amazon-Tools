
import React, { useState, useEffect } from 'react';
import { generateKeywords } from './services/geminiService';
import { SearchState, GroundingSource, Language, ProductContext, ApiKeys } from './types';
import SearchBar from './components/SearchBar';
import KeywordTable from './components/KeywordTable';
import DashboardStats from './components/DashboardStats';
import ImageGenerator from './components/ImageGenerator';
import VideoStudio from './components/VideoStudio';
import LaunchPlanner from './components/LaunchPlanner';
import CustomServices from './components/CustomServices';
import SettingsModal from './components/SettingsModal';
import { ShoppingCart, AlertCircle, Search, Wand2, Rocket, Globe, Briefcase, PlaySquare, Settings } from 'lucide-react';

type ActiveTab = 'keywords' | 'content' | 'video' | 'launch' | 'custom';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('keywords');
  const [language, setLanguage] = useState<Language>('English');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    gemini: localStorage.getItem('gemini_key') || '',
    veo: localStorage.getItem('veo_key') || ''
  });
  
  const [state, setState] = useState<SearchState>({
    isLoading: false,
    error: null,
    data: [],
    seedKeyword: '',
  });
  const [sources, setSources] = useState<GroundingSource[]>([]);

  const [productContext, setProductContext] = useState<ProductContext>({
      title: '',
      description: '',
      keywords: [],
      hasGeneratedContent: false,
      uploadedImage: null,
      mimeType: 'image/png'
  });

  const saveKeys = (keys: ApiKeys) => {
    setApiKeys(keys);
    localStorage.setItem('gemini_key', keys.gemini);
    localStorage.setItem('veo_key', keys.veo);
  };

  const handleSearch = async (term: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null, seedKeyword: term }));
    try {
      const result = await generateKeywords(term, language, apiKeys.gemini);
      setState(prev => ({ ...prev, isLoading: false, data: result.keywords }));
      setSources(result.sources);
      setProductContext(prev => ({ ...prev, keywords: result.keywords.map(k => k.keyword) }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message || "获取数据时发生意外错误。" }));
    }
  };

  const handleContentUpdate = (title: string, description: string, uploadedImage: string | null, mimeType: string) => {
      setProductContext(prev => ({ ...prev, title, description, uploadedImage, mimeType, hasGeneratedContent: true }));
  };

  const TabButton = ({ id, icon: Icon, label }: { id: ActiveTab, icon: any, label: string }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${activeTab === id ? 'bg-amz-light text-white' : 'text-gray-300 hover:text-white hover:bg-amz-light'}`}
    >
        <Icon className="w-4 h-4 mr-2" />
        <span className="hidden lg:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 pb-20">
      <header className="bg-amz-dark text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-amz-orange p-1.5 rounded-md">
                <ShoppingCart className="h-6 w-6 text-amz-dark" />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden md:block">AmzKeyword <span className="text-amz-orange font-light">AI</span></h1>
          </div>
          
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            <TabButton id="keywords" icon={Search} label="关键词挖掘" />
            <TabButton id="content" icon={Wand2} label="图片/文案" />
            <TabButton id="video" icon={PlaySquare} label="视频生成" />
            <TabButton id="launch" icon={Rocket} label="推广计划" />
            <TabButton id="custom" icon={Briefcase} label="定制服务" />
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center">
                <Globe className="w-4 h-4 text-gray-400 mr-1" />
                <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="bg-amz-light text-white text-xs border-none rounded focus:ring-1 focus:ring-amz-orange py-1 px-2"
                >
                    <option value="English">English</option>
                    <option value="Japanese">Japanese</option>
                    <option value="German">German</option>
                    <option value="French">French</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Italian">Italian</option>
                </select>
             </div>
             <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white">
                <Settings className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className={activeTab === 'keywords' ? 'block' : 'hidden'}>
            {!state.data.length && !state.isLoading && !state.error && (
            <div className="text-center mb-12 animate-fade-in-up">
                <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">
                挖掘 <span className="text-amz-orange">亚马逊</span> 爆款潜力
                </h2>
                <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
                目标市场: <span className="font-bold text-amz-blue">{language}</span>。 
                深度关键词调研、2K 高清主图渲染、SEO 文案优化。
                </p>
            </div>
            )}
            <SearchBar onSearch={handleSearch} isLoading={state.isLoading} />
            {state.error && (
            <div className="max-w-3xl mx-auto mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
                <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                    <p className="text-sm text-red-700">{state.error}</p>
                </div>
            </div>
            )}
            {state.data.length > 0 && !state.isLoading && (
            <div className="space-y-6">
                <DashboardStats data={state.data} sources={sources} />
                <KeywordTable data={state.data} />
            </div>
            )}
        </div>

        <div className={activeTab === 'content' ? 'block' : 'hidden'}>
            <ImageGenerator 
                language={language} 
                seedKeywords={productContext.keywords}
                onListingGenerated={handleContentUpdate}
                apiKey={apiKeys.gemini}
            />
        </div>

        <div className={activeTab === 'video' ? 'block' : 'hidden'}>
            <VideoStudio productContext={productContext} apiKey={apiKeys.veo} />
        </div>

        <div className={activeTab === 'launch' ? 'block' : 'hidden'}>
            <LaunchPlanner 
                language={language} 
                productContext={productContext}
                setActiveTab={setActiveTab}
                apiKey={apiKeys.gemini}
            />
        </div>

        <div className={activeTab === 'custom' ? 'block' : 'hidden'}>
            <CustomServices />
        </div>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        keys={apiKeys} 
        onSave={saveKeys} 
      />
    </div>
  );
};

export default App;
