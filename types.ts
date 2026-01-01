export type Language = 'English' | 'Japanese' | 'German' | 'French' | 'Spanish' | 'Italian';

export interface KeywordData {
  keyword: string;
  searchVolume: number; // 0-100 scale estimate
  competition: 'Low' | 'Medium' | 'High';
  cpc: number; // Estimated cost per click
  intent: 'Commercial' | 'Informational' | 'Transactional';
  tier: 'Tier 1 (Head)' | 'Tier 2 (Middle)' | 'Tier 3 (Long-tail)';
}

export interface SearchState {
  isLoading: boolean;
  error: string | null;
  data: KeywordData[];
  seedKeyword: string;
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface GeneratedImage {
  id: number;
  label: string;
  imageUrl: string | null;
  isLoading: boolean;
}

export interface ImageGeneratorState {
  isGenerating: boolean;
  error: string | null;
  description: string;
  uploadedImage: string | null; // Base64
  mimeType: string;
  mainImages: GeneratedImage[];
  aplusImages: GeneratedImage[];
}

export interface ListingContent {
  title: string;
  bullets: string[]; // Array of 5 strings
}

export interface LaunchDayPlan {
  dayRange: string;
  focus: string;
  actions: string[];
  budget: string;
  metrics: string[];
  ppcDetail?: {
    autoAds: { 
      budget: string; 
      cpc: string; 
      strategy: string; // e.g. "Dynamic - down only"
    };
    manualExact: { 
      targets: string[]; 
      cpc: string; 
      strategy: string; 
      biddingMethod: string; // e.g. "Fixed", "Up & Down"
    };
    manualPhrase: { 
      targets: string[]; 
      cpc: string; 
      strategy: string; 
    };
    brandAds: { 
      targets: string[]; 
      creative: string; // Description of assets (Video, Lifestyle etc)
      assetsRequired: string; 
    };
  };
}

export interface AdStrategyNode {
  name: string;
  budget?: string;
  cpc?: string;
  strategy?: string;
  targets?: string[];
  children?: AdStrategyNode[];
}

export interface LaunchPlanState {
  isLoading: boolean;
  plan: LaunchDayPlan[];
  adStrategy: AdStrategyNode | null;
  error: string | null;
}

export interface ProductContext {
    title: string;
    description: string;
    keywords: string[];
    hasGeneratedContent: boolean;
    uploadedImage: string | null;
    mimeType: string;
}

export interface ApiKeys {
  gemini: string;
  veo: string;
}
