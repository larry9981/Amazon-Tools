
import { GoogleGenAI } from "@google/genai";
import { KeywordData, GroundingSource, ListingContent, LaunchDayPlan, AdStrategyNode, Language } from "../types";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 健壮的 JSON 提取工具：寻找最外层匹配的 { } 或 [ ]
 */
const extractJson = (text: string): any => {
  try {
    const t = text.trim();
    const firstBrace = t.indexOf('{');
    const firstBracket = t.indexOf('[');
    
    let start = -1;
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      start = firstBrace;
    } else if (firstBracket !== -1) {
      start = firstBracket;
    }

    if (start === -1) throw new Error("No JSON structure found in response");

    const lastBrace = t.lastIndexOf('}');
    const lastBracket = t.lastIndexOf(']');
    const end = Math.max(lastBrace, lastBracket);

    const jsonStr = t.substring(start, end + 1);
    const cleanJson = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("JSON parse failed. Original text:", text);
    throw new Error("AI 数据格式化失败，请稍后重试。");
  }
};

/**
 * Generate keywords with Search Grounding using gemini-3-flash-preview
 */
export const generateKeywords = async (seedKeyword: string, language: Language): Promise<{keywords: KeywordData[], sources: GroundingSource[]}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `你是一位亚马逊 SEO 专家。分析关键词 "${seedKeyword}"。使用 Google Search 获取最新数据。
  返回一个 JSON 数组，包含 20 个关键词，字段包括: keyword, searchVolume (0-100), competition (Low, Medium, High), cpc (数字), intent, tier (Tier 1/2/3)。
  市场语言: ${language}。`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { tools: [{ googleSearch: {} }], temperature: 0.3 },
  });

  const text = response.text || "";
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources: GroundingSource[] = chunks.map((c: any) => c.web ? { title: c.web.title, url: c.web.uri } : null).filter(Boolean);
  
  return { keywords: extractJson(text), sources };
};

/**
 * Generate a single high-quality image using gemini-3-pro-image-preview
 */
export const generateSingleImage = async (base64Image: string, mimeType: string, prompt: string, isWide: boolean = false): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
            parts: [
                { inlineData: { data: base64Image, mimeType } },
                { text: `${prompt}. Cinematic commercial style, high-end studio lighting, 2K resolution.` }
            ]
        },
        config: {
            imageConfig: {
                aspectRatio: isWide ? "16:9" : "1:1",
                imageSize: "2K"
            }
        }
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!imagePart || !imagePart.inlineData) throw new Error("No image returned");
    return `data:image/png;base64,${imagePart.inlineData.data}`;
};

/**
 * Generate multiple scene images
 */
export const generateSceneImages = async (
  base64Image: string, 
  mimeType: string, 
  productDescription: string, 
  scenes: { id: number; promptSuffix: string }[], 
  isWide: boolean = false, 
  apiKey?: string,
  customPrompts: { [key: number]: string } = {}
): Promise<{ id: number; imageUrl: string }[]> => {
  const results = [];
  for (const scene of scenes) {
    try {
      const scenePrompt = customPrompts[scene.id] || scene.promptSuffix;
      const url = await generateSingleImage(base64Image, mimeType, `Product: ${productDescription}. Scene: ${scenePrompt}`, isWide);
      results.push({ id: scene.id, imageUrl: url });
      await delay(1000);
    } catch (e) {
      results.push({ id: scene.id, imageUrl: "" });
    }
  }
  return results;
};

/**
 * Generate SEO listing content
 */
export const generateListingContent = async (description: string, keywords: string[], language: Language): Promise<ListingContent> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `亚马逊文案专家。语言: ${language}。根据以下描述和关键词 [${keywords.join(',')}]，生成产品标题和 5 个 Bullet Points。
    返回 JSON: { "title": "...", "bullets": ["...", "...", "...", "...", "..."] }。内容: ${description}`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });
    return extractJson(response.text || "");
};

/**
 * Generate a 60-day launch plan using gemini-3-pro-preview with specific structure requirements
 */
export const generateLaunchPlan = async (title: string, description: string, keywords: string[], language: Language): Promise<{ plan: LaunchDayPlan[], adStrategy: AdStrategyNode }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `你是一位亚马逊全渠道广告大师。请为 ${language} 市场的以下新品制定为期 60 天的爆发式推广路线图。
    产品标题: ${title}
    核心描述: ${description}
    关键词池: ${keywords.join(', ')}

    请严格按以下 JSON 结构返回（确保 plan 数组包含 4 个阶段，adStrategy 是树形结构）：
    {
      "plan": [
        {
          "dayRange": "1-7",
          "focus": "...",
          "actions": ["..."],
          "budget": "$...",
          "metrics": ["..."],
          "ppcDetail": {
            "autoAds": { "budget": "$...", "cpc": "$...", "strategy": "..." },
            "manualExact": { "targets": ["...", "..."], "cpc": "$...", "strategy": "..." },
            "manualPhrase": { "targets": ["..."], "cpc": "$...", "strategy": "..." },
            "brandAds": { "targets": ["..."], "creative": "...", "roadmap60": "..." }
          }
        }
      ],
      "adStrategy": {
        "name": "Campaign Portfolio",
        "budget": "$...",
        "children": [
          { "name": "Auto Research", "budget": "$...", "strategy": "..." },
          { "name": "Manual Ranking", "children": [...] }
        ]
      }
    }`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { 
            responseMimeType: "application/json",
            temperature: 0.7 
        }
    });
    
    const text = response.text || "";
    if (!text) throw new Error("AI 未返回有效计划数据");
    
    return extractJson(text);
};

/**
 * Generate product video using Veo 3.1 with enhanced error tracking
 */
export const generateMarketingVideo = async (prompt: string, refImages: { data: string; mimeType: string }[] = []): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: `Cinematic commercial product video: ${prompt}. Professional slow motion, sharp focus, vibrant colors, 4k texture detail.`,
            image: refImages[0] ? { imageBytes: refImages[0].data, mimeType: refImages[0].mimeType } : undefined,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        let attempts = 0;
        const maxAttempts = 60; // 10 minutes

        while (!operation.done && attempts < maxAttempts) {
            await delay(10000);
            operation = await ai.operations.getVideosOperation({ operation: operation });
            attempts++;
            
            if (operation.error) {
                throw new Error(`Veo 生成器返回错误: ${operation.error.message || '未知服务器错误'}`);
            }
        }

        if (!operation.done) {
            throw new Error("视频生成超时（超过 10 分钟），请稍后再试。");
        }

        if (operation.error) {
            throw new Error(`生成失败: ${operation.error.message}`);
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("视频生成任务已完成，但未返回下载链接。");
        }
        
        return `${downloadLink}&key=${process.env.API_KEY}`;
    } catch (e: any) {
        if (e.message?.includes("403") || e.message?.includes("permission")) {
            throw new Error("权限不足：请确保您的 API Key 来自一个已开启计费(Billing)的项目。");
        }
        throw e;
    }
};
