
export type Language = 'English' | 'Japanese' | 'German' | 'French' | 'Spanish' | 'Italian';

export interface KeywordData {
  keyword: string;
  searchVolume: number; // 0-100 比例估算
  competition: 'Low' | 'Medium' | 'High';
  cpc: number; // 预估点击成本
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

export interface ListingContent {
  title: string;
  bullets: string[];
}

export interface LaunchDayPlan {
  dayRange: string;
  focus: string;
  actions: string[];
  budget: string;
  metrics: string[];
  ppcDetail: {
    autoAds: {
      budget: string;
      cpc: string;
      strategy: string; // "Fixed", "Dynamic Up/Down", "Dynamic Down Only"
    };
    manualExact: {
      targets: string[];
      cpc: string;
      strategy: string;
    };
    manualPhrase: {
      targets: string[];
      cpc: string;
      strategy: string;
    };
    brandAds: {
      targets: string[];
      creative: string; // 素材定义
      roadmap60: string; // 60天规划描述
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

/**
 * Image item for generator state
 */
export interface ImageItem {
  id: number;
  label: string;
  imageUrl: string | null;
  isLoading: boolean;
}

/**
 * State for the Image Generator component
 */
export interface ImageGeneratorState {
  isGenerating: boolean;
  error: string | null;
  description: string;
  uploadedImage: string | null;
  mimeType: string;
  mainImages: ImageItem[];
  aplusImages: ImageItem[];
}
