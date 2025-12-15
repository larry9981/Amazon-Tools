import { GoogleGenAI } from "@google/genai";
import { KeywordData, GroundingSource, ListingContent, LaunchDayPlan, AdStrategyNode, Language } from "../types";

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface AnalysisResult {
  keywords: KeywordData[];
  sources: GroundingSource[];
}

export const generateKeywords = async (seedKeyword: string, language: Language): Promise<AnalysisResult> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const prompt = `
      Act as an expert Amazon SEO analyst for the ${language} market. 
      Conduct a keyword research analysis for the seed term: "${seedKeyword}".
      
      Use Google Search to identify trending terms.
      
      Return a STRICT JSON array of exactly 20 keyword objects.
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

// --- A+ Image Generation Service (Auto Fallback) ---

const SCENES = [
  { id: 1, label: "Hero Shot (Studio)", promptSuffix: "A high-end, clean studio hero shot of the product on a white podium. Professional lighting, f/8 aperture for full sharpness." },
  { id: 2, label: "Cozy Home Lifestyle", promptSuffix: "A warm, inviting lifestyle shot in a modern living room. Sharp product focus with soft bokeh background." },
  { id: 3, label: "Outdoor / Action", promptSuffix: "Energetic outdoor shot, natural sunlight. High shutter speed to freeze motion, razor-sharp details." },
  { id: 4, label: "Minimalist / Modern", promptSuffix: "Minimalist aesthetic, pastel geometric background. High fashion style, ultra-clean edges." },
  { id: 5, label: "Tabletop Context", promptSuffix: "Wooden table or kitchen counter setting. Props in background, product in sharp focus with detailed texture." },
  { id: 6, label: "Detailed Close-up", promptSuffix: "Macro close-up shot highlighting material quality and texture. Micro-details visible, professional product photography." },
  { id: 7, label: "Gift / Unboxing", promptSuffix: "Product presented as a gift with ribbon/packaging. Warm lighting, sharp focus on the brand logo/product." },
];

// Helper to handle model fallback
async function generateImageWithFallback(base64Image: string, mimeType: string, prompt: string): Promise<string> {
    
    // ENHANCED PROMPT FOR SHARPNESS
    const enhancedPrompt = `
        ${prompt}
        
        CRITICAL VISUAL REQUIREMENTS:
        - Image MUST be 8k resolution, Ultra HD quality.
        - Razor-sharp focus on the product (no blur on the main item).
        - Use professional studio lighting (hard rim lighting to define edges).
        - Emphasize texture and material details (micro-texture visibility).
        - Color grading: Commercial, vibrant, and high contrast.
        - Look like a photograph taken with a 100mm Macro lens at f/8.
    `;

    // 1. Try High Quality Model (Gemini 3 Pro - 2K)
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType } },
                    { text: enhancedPrompt },
                ],
            },
            config: {
                imageConfig: { aspectRatio: "1:1", imageSize: "2K" }
            }
        });
        
        const imageUrl = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        if (imageUrl) return `data:image/png;base64,${imageUrl}`;
    } catch (error: any) {
        console.warn("Gemini 3 Pro failed (likely permission/quota), falling back to Flash Image.", error);
    }

    // 2. Fallback to Standard Model (Gemini 2.5 Flash Image)
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType } },
                    { text: enhancedPrompt },
                ],
            },
            config: {
                imageConfig: { aspectRatio: "1:1" }
            }
        });

        const imageUrl = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        if (imageUrl) return `data:image/png;base64,${imageUrl}`;
    } catch (fallbackError) {
        console.error("All image generation models failed.", fallbackError);
        throw fallbackError;
    }

    throw new Error("No image generated.");
}

export const generateAplusImages = async (
  base64Image: string,
  mimeType: string,
  productDescription: string,
  customPromptOverrides: { [key: number]: string } = {}
): Promise<{ id: number; imageUrl: string }[]> => {
  
  const promises = SCENES.map(async (scene) => {
    // Skip if we are regenerating specific IDs and this one isn't included
    const isSpecificRegen = Object.keys(customPromptOverrides).length > 0;
    if (isSpecificRegen && !customPromptOverrides[scene.id]) {
        return { id: scene.id, imageUrl: "" };
    }

    const specificInstruction = customPromptOverrides[scene.id] || scene.promptSuffix;
    const prompt = `
        Generate a photorealistic, high-quality Amazon A+ content image.
        Product Description: ${productDescription}
        Scene Requirement: ${specificInstruction}
        The image MUST feature the product visually similar to the input image provided. 
    `;

    try {
      const imageUrl = await generateImageWithFallback(base64Image, mimeType, prompt);
      return { id: scene.id, imageUrl };
    } catch (error) {
      console.error(`Error generating scene ${scene.id}:`, error);
      return { id: scene.id, imageUrl: "" };
    }
  });

  return Promise.all(promises);
};

export const regenerateSingleImage = async (
    id: number,
    base64Image: string, 
    mimeType: string, 
    productDescription: string, 
    customPrompt: string
): Promise<string> => {
    const results = await generateAplusImages(base64Image, mimeType, productDescription, { [id]: customPrompt });
    const found = results.find(r => r.id === id);
    if (found && found.imageUrl) return found.imageUrl;
    throw new Error("Failed to regenerate image");
};


// --- Listing Optimization Service ---

export const generateListingContent = async (description: string, keywords: string[], language: Language): Promise<ListingContent> => {
    const model = 'gemini-2.5-flash';
    const prompt = `
        Act as a professional Amazon Copywriter for the ${language} market.
        Write an optimized Product Title and 5 Bullet Points based on the description below.
        
        Product Description: ${description}
        Target Keywords to Include: ${keywords.join(', ')}

        Rules:
        1. Title: 150-200 chars, include brand (generic if none), main function, key features.
        2. Bullets: 5 points. Each starts with a CAPITALIZED HEADER in brackets [LIKE THIS]. 
           - Insert keywords naturally.
           - Focus on benefits, not just features.
           - IMPORTANT: Each bullet point MUST be at least 150 characters long. Provide detailed, persuasive explanations for each point.
        
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
        You are an expert Amazon Brand Manager. Create a STRICT, ACTIONABLE 60-Day Product Launch Plan for the following product in the ${language} market.

        Product Title: "${title}"
        Key Features: "${description}"
        
        GOAL: Achieve 30-40 organic/ad sales per day by Day 60.

        Requirements for the Plan:
        1.  **NO THEORY.** Give specific, executable tasks.
        2.  **Breakdown by phases:** Days 1-7, 8-14, 15-30, 31-45, 46-60.
        3.  **Metrics:** You MUST calculate specific targets for Traffic (Impressions), Click-Through Rate (CTR), and Conversion Rate (CVR) to hit the sales goal. 
            (Example logic: 40 sales / 10% CVR = 400 clicks. 400 clicks / 0.5% CTR = 80,000 Impressions).
        4.  **Cover:** 
            - Vine Voice / Reviews acquisition.
            - PPC Strategy (Auto -> Broad -> Exact).
            - Coupon / Price Strategy.
            - External Traffic (if needed).

        Part 2: 3-Month PPC Ad Architecture (Mind Map Structure)
        Create a hierarchical structure for Amazon PPC Campaigns (Sponsored Products, Brands, Display).
        
        Return STRICT JSON format:
        {
            "plan": [
                {
                    "dayRange": "Days 1-7 (Launch Phase)",
                    "focus": "Indexing & Vine Reviews",
                    "actions": ["Enroll in Vine (30 units)", "Setup Auto Campaign ($30/day, Fixed Bids)", "Price: $19.99 (Break-even)"],
                    "budget": "$30-50/day",
                    "metrics": ["Target: 1000 Impressions/day", "Goal: 2-3 sales/day"]
                },
                ... (continue until Day 60)
            ],
            "adStrategy": {
                "name": "Total PPC Account Strategy",
                "budget": "Total Monthly Budget Est.",
                "children": [
                    {
                        "name": "SP - Automatic",
                        "budget": "30%",
                        "children": [ ... ]
                    },
                    ...
                ]
            }
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
    base64Image: string,
    mimeType: string
): Promise<string> => {
    const model = 'veo-3.1-fast-generate-preview';
    
    try {
        let operation = await ai.models.generateVideos({
            model,
            prompt,
            image: {
                imageBytes: base64Image,
                mimeType: mimeType
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        // Poll for completion
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Video generation failed: No download link returned.");

        return downloadLink;
    } catch (error: any) {
        console.error("Veo Video Gen Failed:", error);
        if (error.message.includes('permission') || error.message.includes('403')) {
             throw new Error("Permission Denied: Veo Video generation requires a paid billing account enabled for this API Key.");
        }
        throw error;
    }
};