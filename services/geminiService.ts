import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { KeywordData, GroundingSource, ListingContent, LaunchDayPlan, AdStrategyNode, Language } from "../types";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getApiKey = (customKey?: string) => {
  if (typeof customKey === 'string' && customKey.trim().length > 5) return customKey.trim();
  return process.env.API_KEY || "";
};

const getSafeText = (response: GenerateContentResponse): string => {
  try {
    const candidates = response?.candidates;
    if (!candidates || candidates.length === 0) return "";
    const firstCandidate = candidates[0];
    if (!firstCandidate?.content?.parts) return "";
    const textPart = firstCandidate.content.parts.find(part => typeof part.text === 'string');
    return textPart?.text || "";
  } catch (error) {
    return "";
  }
};

/**
 * Robust JSON extraction from AI responses.
 * Finds the actual JSON block even if there is trailing commentary or markdown.
 */
const extractJson = (text: string): any => {
  try {
    const t = text.trim();
    // Use regex to find the outermost matching braces/brackets
    const jsonObjectMatch = t.match(/\{[\s\S]*\}/);
    const jsonArrayMatch = t.match(/\[[\s\S]*\]/);
    
    let jsonStr = "";
    if (jsonObjectMatch && jsonArrayMatch) {
      // Pick the one that starts earlier
      jsonStr = jsonObjectMatch.index! < jsonArrayMatch.index! ? jsonObjectMatch[0] : jsonArrayMatch[0];
    } else if (jsonObjectMatch) {
      jsonStr = jsonObjectMatch[0];
    } else if (jsonArrayMatch) {
      jsonStr = jsonArrayMatch[0];
    } else {
      jsonStr = t;
    }

    // Clean up potential trailing backticks or garbage
    // This often happens with Markdown code blocks
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
    
    return JSON.parse(jsonStr.trim());
  } catch (e) {
    console.error("JSON Extraction Error:", e, "Source text snippet:", text.substring(0, 200));
    throw new Error("AI 返回数据解析失败。建议检查 API Key 或稍后重试。");
  }
};

export const generateKeywords = async (seedKeyword: string, language: Language, apiKey?: string): Promise<{keywords: KeywordData[], sources: GroundingSource[]}> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey(apiKey) });
    const prompt = `Act as an expert Amazon SEO analyst for the ${language} market. Analyze "${seedKeyword}". Return STRICT JSON array of 20 keywords with searchVolume (0-100), competition (Low, Medium, High), cpc, intent, tier.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { tools: [{ googleSearch: {} }], temperature: 0.3 },
    });
    const text = getSafeText(response);
    const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = chunks.map((c: any) => c.web ? { title: c.web.title, url: c.web.uri } : null).filter(Boolean);
    
    const keywords = extractJson(text);
    return { keywords, sources };
  } catch (error) { throw error; }
};

export const generateSingleImage = async (
  base64Image: string, 
  mimeType: string, 
  prompt: string, 
  isWide: boolean = false, 
  apiKey?: string
): Promise<string> => {
    const finalKey = getApiKey(apiKey);
    const ai = new GoogleGenAI({ apiKey: finalKey });
    
    const compositionPrompt = isWide 
        ? "Cinematic wide panoramic composition, professional Amazon A+ Content banner, 2928x1200 resolution aesthetic, sharp focus on product features."
        : "Square high-end commercial product shot, professional studio lighting, 2K resolution quality.";

    const enhancedPrompt = `${prompt}. ${compositionPrompt}. High-end commercial photography, 8K resolution, sharp focus, professional lighting.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
            parts: [
                { inlineData: { data: base64Image, mimeType } },
                { text: enhancedPrompt }
            ]
        },
        config: {
            imageConfig: {
                aspectRatio: isWide ? "16:9" : "1:1",
                imageSize: "2K"
            }
        }
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData);
    if (!imagePart) throw new Error("No image data returned");
    return `data:image/png;base64,${imagePart.inlineData.data}`;
};

export const generateSceneImages = async (
  base64Image: string,
  mimeType: string,
  productDescription: string,
  scenes: { id: number; promptSuffix: string }[],
  isWide: boolean = false,
  apiKey?: string,
  customPromptOverrides: { [key: number]: string } = {}
): Promise<{ id: number; imageUrl: string }[]> => {
  const results: { id: number; imageUrl: string }[] = [];
  for (const scene of scenes) {
    const prompt = `Product: ${productDescription}. Scene: ${customPromptOverrides[scene.id] || scene.promptSuffix}`;
    try {
      const imageUrl = await generateSingleImage(base64Image, mimeType, prompt, isWide, apiKey);
      results.push({ id: scene.id, imageUrl });
      await delay(1200); 
    } catch (error) {
      console.error(`Error generating image for scene ${scene.id}:`, error);
      results.push({ id: scene.id, imageUrl: "" });
    }
  }
  return results;
};

export const generateListingContent = async (description: string, keywords: string[], language: Language, apiKey?: string): Promise<ListingContent> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey(apiKey) });
    const prompt = `Amazon SEO Expert. Language: ${language}. Optimize for: ${keywords.join(',')}. Product: ${description}. Output JSON: {title: string, bullets: string[]}`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });
    return extractJson(getSafeText(response));
};

export const generateLaunchPlan = async (title: string, description: string, keywords: string[], language: Language, apiKey?: string): Promise<{ plan: LaunchDayPlan[], adStrategy: AdStrategyNode }> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey(apiKey) });
    const prompt = `Act as an Amazon Advertising Master for the ${language} market.
    Goal: Create a 60-day omnichannel product launch roadmap to push 5-10 core keywords to Page 1 organic ranking.

    Product Details:
    - Title: ${title}
    - Description: ${description}
    - Target Keywords: ${keywords.join(', ')}

    Requirements:
    1. Roadmap must span 60 days, divided into clear phases.
    2. Detailed PPC Strategy for EACH Phase:
       - Auto Ads: Define daily budget ($), specific target CPC ($), and Bidding Strategy (Fixed, Dynamic-down, Dynamic-up/down).
       - Manual Exact: List 3-5 keywords from the targets above for this phase, specific CPC ($), and Bidding Strategy (Fixed, Dynamic-down).
       - Manual Phrase: Targeted keyword clusters, specific CPC ($), and Bidding strategy.
       - Brand Ads (SB/SDV): Target keywords and specific Creative Asset requirements (e.g. "15s Lifestyle Video", "Logo + 3 Products Lifestyle").
    3. Mindmap: Provide an 'adStrategy' tree for visual architecture.

    Output STRICT JSON with this schema:
    {
      "plan": [
        {
          "dayRange": "string",
          "focus": "string",
          "actions": ["string"],
          "budget": "string",
          "metrics": ["string"],
          "ppcDetail": {
             "autoAds": { "budget": "string", "cpc": "string", "strategy": "string" },
             "manualExact": { "targets": ["string"], "cpc": "string", "strategy": "string", "biddingMethod": "string" },
             "manualPhrase": { "targets": ["string"], "cpc": "string", "strategy": "string" },
             "brandAds": { "targets": ["string"], "creative": "string", "assetsRequired": "string" }
          }
        }
      ],
      "adStrategy": {
        "name": "string",
        "budget": "string",
        "children": [
           { "name": "string", "budget": "string", "cpc": "string", "strategy": "string", "targets": ["string"] }
        ]
      }
    }`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });
    return extractJson(getSafeText(response));
};

export const generateMarketingVideo = async (prompt: string, refImages: { data: string; mimeType: string }[] = [], apiKey?: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey(apiKey) });
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image: refImages[0] ? { imageBytes: refImages[0].data, mimeType: refImages[0].mimeType } : undefined,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });
    while (!operation.done) {
        await delay(10000);
        operation = await ai.operations.getVideosOperation({ operation });
    }
    return operation.response?.generatedVideos?.[0]?.video?.uri || "";
};
