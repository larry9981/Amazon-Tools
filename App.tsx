import React, { useState } from 'react';
import { generateKeywords } from './services/geminiService';
import { SearchState, GroundingSource, Language, ProductContext } from './types';
import SearchBar from './components/SearchBar';
import KeywordTable from './components/KeywordTable';
import DashboardStats from './components/DashboardStats';
import ImageGenerator from './components/ImageGenerator';
import LaunchPlanner from './components/LaunchPlanner';
import CustomServices from './components/CustomServices';
import { ShoppingCart, AlertCircle, Search, Wand2, Rocket, Globe, Briefcase } from 'lucide-react';

type ActiveTab = 'keywords' | 'content' | 'launch' | 'custom';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('keywords');
  const [language, setLanguage] = useState<Language>('English');
  
  const [state, setState] = useState<SearchState>({
    isLoading: false,
    error: null,
    data: [],
    seedKeyword: '',
  });
  const [sources, setSources] = useState<GroundingSource[]>([]);

  // Shared context for Launch Plan
  const [productContext, setProductContext] = useState<ProductContext>({
      title: '',
      description: '',
      keywords: [],
      hasGeneratedContent: false
  });

  const handleSearch = async (term: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null, seedKeyword: term }));
    
    try {
      const result = await generateKeywords(term, language);
      setState(prev => ({
        ...prev,
        isLoading: false,
        data: result.keywords
      }));
      setSources(result.sources);
      // Update keywords in context
      setProductContext(prev => ({ ...prev, keywords: result.keywords.map(k => k.keyword) }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || "获取数据时发生意外错误。"
      }));
    }
  };

  const handleContentUpdate = (title: string, description: string) => {
      setProductContext(prev => ({
          ...prev,
          title,
          description,
          hasGeneratedContent: true
      }));
  };

  const TabButton = ({ id, icon: Icon, label }: { id: ActiveTab, icon: any, label: string }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${activeTab === id ? 'bg-amz-light text-white' : 'text-gray-300 hover:text-white hover:bg-amz-light'}`}
    >
        <Icon className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 pb-20">
      {/* Header */}
      <header className="bg-amz-dark text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-amz-orange p-1.5 rounded-md">
                <ShoppingCart className="h-6 w-6 text-amz-dark" />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden md:block">AmzKeyword <span className="text-amz-orange font-light">AI</span></h1>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            <TabButton id="keywords" icon={Search} label="关键词挖掘" />
            <TabButton id="content" icon={Wand2} label="文案/图片生成" />
            <TabButton id="launch" icon={Rocket} label="推广计划" />
            <TabButton id="custom" icon={Briefcase} label="定制服务" />
          </div>

          <div className="flex items-center ml-2">
             <Globe className="w-4 h-4 text-gray-400 mr-1" />
             <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-amz-light text-white text-xs border-none rounded focus:ring-1 focus:ring-amz-orange py-1 px-2"
             >
                 <option value="English">English (英语)</option>
                 <option value="Japanese">Japanese (日语)</option>
                 <option value="German">German (德语)</option>
                 <option value="French">French (法语)</option>
                 <option value="Spanish">Spanish (西语)</option>
                 <option value="Italian">Italian (意语)</option>
             </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Keywords Tab Container */}
        <div className={activeTab === 'keywords' ? 'block' : 'hidden'}>
            {/* Intro */}
            {!state.data.length && !state.isLoading && !state.error && (
            <div className="text-center mb-12 animate-fade-in-up">
                <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">
                挖掘 <span className="text-amz-orange">亚马逊</span> 爆款潜力
                </h2>
                <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
                目标市场: <span className="font-bold text-amz-blue">{language}</span>。 
                挖掘高流量关键词，生成 2K 高清主图，优化 Listing 文案，并制定完美的推品计划。
                </p>
            </div>
            )}

            <SearchBar onSearch={handleSearch} isLoading={state.isLoading} />

            {/* Error State */}
            {state.error && (
            <div className="max-w-3xl mx-auto mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
                <div className="flex">
                <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <p className="text-sm text-red-700">
                    {state.error}
                    </p>
                </div>
                </div>
            </div>
            )}

            {/* Results */}
            {state.data.length > 0 && !state.isLoading && (
            <div className="space-y-6">
                <DashboardStats data={state.data} sources={sources} />
                <KeywordTable data={state.data} />
            </div>
            )}
        </div>

        {/* Content Generator Container */}
        <div className={activeTab === 'content' ? 'block' : 'hidden'}>
            <ImageGenerator 
                language={language} 
                seedKeywords={state.data.map(k => k.keyword)}
                onListingGenerated={handleContentUpdate}
            />
        </div>

        {/* Launch Planner Container */}
        <div className={activeTab === 'launch' ? 'block' : 'hidden'}>
            <LaunchPlanner 
                language={language} 
                productContext={productContext}
                setActiveTab={setActiveTab}
            />
        </div>

        {/* Custom Services Container */}
        <div className={activeTab === 'custom' ? 'block' : 'hidden'}>
            <CustomServices />
        </div>

      </main>
    </div>
  );
};

export default App;