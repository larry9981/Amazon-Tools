
import { GoogleGenAI, VideoGenerationReferenceType } from "@google/genai";
import { KeywordData, GroundingSource, ListingContent, LaunchDayPlan, AdStrategyNode, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface AnalysisResult {
  keywords: KeywordData[];
  sources: GroundingSource[];
}

export const generateKeywords = async (seedKeyword: string, language: Language): Promise<AnalysisResult> => {
  try {
    const model = 'gemini-3-flash-preview';
    
    const prompt = `
      Act as an expert Amazon SEO analyst for the ${language} market. 
      Conduct a keyword research analysis for the seed term: "${seedKeyword}".
      
      Use Google Search to identify trending terms.
      
      Return a STRICT JSON array of exactly 20 keyword objects.
      
      CRITICAL LANGUAGE REQUIREMENT:
      - The "keyword" field MUST be in ${language} language.
      - If the target language is NOT English, ensure keywords are native terms used by locals in that region.

      Categorize them into 3 Tiers:
      - Tier 1 (Head): High traffic, broad, expensive.
      - Tier 2 (Middle): Specific, medium traffic, good conversion.
      - Tier 3 (Long-tail): Very specific, lower traffic, high conversion, easy to rank.

      Structure:
      {
        "keyword": "string (in ${language})",
        "searchVolume": number (0-100 estimate),
        "competition": "string (Low, Medium, High)",
        "cpc": number (USD estimate),
        "intent": "string (Commercial, Informational, Transactional)",
        "tier": "string (Tier 1 (Head) | Tier 2 (Middle) | Tier 3 (Long-tail))"
      }
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3,
      },
    });

    const text = response.text || "[]";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = chunks
      .map((chunk: any) => {
        if (chunk.web) {
          return { title: chunk.web.title, url: chunk.web.uri };
        }
        return null;
      })
      .filter((item: any): item is GroundingSource => item !== null);

    let parsedKeywords: KeywordData[] = [];
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedKeywords = JSON.parse(jsonMatch[0]);
      } else {
        parsedKeywords = JSON.parse(text);
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response", text);
      throw new Error("Failed to process keyword data.");
    }

    return {
      keywords: parsedKeywords,
      sources: sources
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// --- Image Generation Services ---

async function generateImageWithRetry(base64Image: string, mimeType: string, prompt: string, isWide: boolean = false, retries = 2): Promise<string> {
    const enhancedPrompt = `
        ${prompt}
        CRITICAL VISUAL REQUIREMENTS:
        - Image MUST be ultra-high quality, commercial grade photography.
        - Razor-sharp focus on the main product.
        - Professional studio lighting.
        - Color grading: Vibrant and high contrast.
        ${isWide ? "- Format: Wide panoramic cinematic shot, 2.5:1 ratio feel." : "- Format: Standard product shot."}
    `;

    const runCall = async (modelName: string, config: any) => {
        const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
        return await genAI.models.generateContent({
            model: modelName,
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType } },
                    { text: enhancedPrompt },
                ],
            },
            config
        });
    };

    for (let i = 0; i <= retries; i++) {
        try {
            // Priority: Gemini 3 Pro
            try {
                const response = await runCall('gemini-3-pro-image-preview', {
                    imageConfig: { aspectRatio: isWide ? "16:9" : "1:1", imageSize: "2K" }
                });
                const imageUrl = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
                if (imageUrl) return `data:image/png;base64,${imageUrl}`;
            } catch (error: any) {
                if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
                    throw error; // Let the outer retry loop handle 429s
                }
                // If other error, try fallback immediately
                const fallbackResponse = await runCall('gemini-2.5-flash-image', {
                    imageConfig: { aspectRatio: isWide ? "16:9" : "1:1" }
                });
                const imageUrl = fallbackResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
                if (imageUrl) return `data:image/png;base64,${imageUrl}`;
            }
        } catch (error: any) {
            if (i === retries) throw error;
            const waitTime = Math.pow(2, i) * 2000; // Exponential backoff
            console.warn(`Rate limited. Retrying in ${waitTime}ms...`);
            await delay(waitTime);
        }
    }
    throw new Error("Failed to generate image after retries.");
}

export const generateSceneImages = async (
  base64Image: string,
  mimeType: string,
  productDescription: string,
  scenes: { id: number; promptSuffix: string }[],
  isWide: boolean = false,
  customPromptOverrides: { [key: number]: string } = {}
): Promise<{ id: number; imageUrl: string }[]> => {
  const results: { id: number; imageUrl: string }[] = [];

  // Sequential execution to avoid hitting rate limits with Promise.all
  for (const scene of scenes) {
    const isSpecificRegen = Object.keys(customPromptOverrides).length > 0;
    if (isSpecificRegen && !customPromptOverrides[scene.id]) {
        results.push({ id: scene.id, imageUrl: "" });
        continue;
    }

    const specificInstruction = customPromptOverrides[scene.id] || scene.promptSuffix;
    const prompt = `
        Product: ${productDescription}
        Scene Requirement: ${specificInstruction}
        The image MUST feature the product visually consistent with the input image.
    `;

    try {
      const imageUrl = await generateImageWithRetry(base64Image, mimeType, prompt, isWide);
      results.push({ id: scene.id, imageUrl });
      // Small pause between images in a batch to respect quota
      if (scenes.length > 1) await delay(1000);
    } catch (error) {
      console.error(`Error generating scene ${scene.id}:`, error);
      results.push({ id: scene.id, imageUrl: "" });
    }
  }

  return results;
};

// --- Listing Optimization Service ---

export const generateListingContent = async (description: string, keywords: string[], language: Language): Promise<ListingContent> => {
    const model = 'gemini-3-flash-preview';
    const prompt = `
        Act as a professional Amazon Copywriter for the ${language} market.
        Write an optimized Product Title and 5 Bullet Points.
        Product Description: ${description}
        Target Keywords: ${keywords.join(', ')}
        CRITICAL LANGUAGE: Output MUST be in ${language}.
        Bullets MUST be at least 150 characters long each.
        Return STRICT JSON:
        {
            "title": "string",
            "bullets": ["string", "string", "string", "string", "string"]
        }
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text);
};

// --- Launch Plan & Ad Strategy Service ---

export const generateLaunchPlan = async (title: string, description: string, language: Language): Promise<{ plan: LaunchDayPlan[], adStrategy: AdStrategyNode }> => {
    const model = 'gemini-3-pro-preview'; 
    const prompt = `
        Expert Amazon Brand Manager. Create a STRICT 60-Day Launch Plan for ${language} market.
        Title: "${title}"
        Description: "${description}"
        Return STRICT JSON format:
        {
            "plan": [ { "dayRange": "...", "focus": "...", "actions": ["..."], "budget": "...", "metrics": ["..."] } ],
            "adStrategy": { "name": "...", "budget": "...", "children": [ ... ] }
        }
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text);
};

// --- Video Generation Service (Veo) ---

export const generateMarketingVideo = async (
    prompt: string,
    refImages: { data: string; mimeType: string }[] = []
): Promise<string> => {
    let model = 'veo-3.1-fast-generate-preview';
    if (refImages.length > 1) {
        model = 'veo-3.1-generate-preview';
    }
    
    try {
        const payload: any = {
            model,
            prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        };

        if (refImages.length === 1) {
            payload.image = {
                imageBytes: refImages[0].data,
                mimeType: refImages[0].mimeType
            };
        } else if (refImages.length > 1) {
            payload.config.referenceImages = refImages.map(img => ({
                image: {
                    imageBytes: img.data,
                    mimeType: img.mimeType
                },
                referenceType: VideoGenerationReferenceType.ASSET
            }));
        }

        const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let operation = await genAI.models.generateVideos(payload);
        
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await genAI.operations.getVideosOperation({ operation: operation });
        }
        
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Video generation failed.");
        return downloadLink;
    } catch (error: any) {
        console.error("Veo Video Gen Failed:", error);
        throw error;
    }
};
