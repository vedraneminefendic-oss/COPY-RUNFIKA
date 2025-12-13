import { GoogleGenAI, Type } from "@google/genai";
import { EnrichedDestination } from "../types";

// Increment cache version to v3 to clear old, weather-dependent cache
const CACHE_KEY = 'runner_guide_gemini_cache_v3';
const DIST_THRESHOLD = 250; // meters. If distance changes by more than this, regenerate text.

interface CachedItem {
  geminiTitle: string;
  geminiDescription: string;
  geminiTip: string;
  generatedAtDistance: number; // The distance when this was generated
}

export const curateDestinations = async (
  destinations: EnrichedDestination[]
): Promise<EnrichedDestination[]> => {
  let apiKey = "";
  
  try {
    // @ts-ignore
    const env = typeof process !== 'undefined' ? process.env : undefined;
    if (env) {
      apiKey = env.API_KEY || "";
    }
  } catch (e) {
    console.debug("Could not access process.env");
  }

  // 1. Retrieve and Parse Cache
  let cache: Record<string, CachedItem> = {};
  try {
    const cachedStr = localStorage.getItem(CACHE_KEY);
    if (cachedStr) {
      cache = JSON.parse(cachedStr);
    }
  } catch (e) {
    console.warn("Failed to parse Gemini cache", e);
  }

  // 2. Identify Data that needs Refreshing (Missing or Stale Distance)
  const placesToEnrich = destinations.filter(d => {
    const cached = cache[d.id];
    
    // If not in cache, we need to fetch
    if (!cached) return true;

    // If cached, check if the distance has changed significantly
    const currentDist = d.route?.distance || 0;
    const cachedDist = cached.generatedAtDistance || 0;
    
    // Invalidate if the run is significantly different (> 250m diff)
    // This ensures "5k Run" doesn't become "5k Run" when it's actually 10k.
    return Math.abs(currentDist - cachedDist) > DIST_THRESHOLD;
  });

  // 3. If no API key or no places need updating, return merged data
  if (!apiKey || placesToEnrich.length === 0) {
    return destinations.map(d => {
      const cachedInfo = cache[d.id];
      // Only use cache if it exists AND is valid for the distance (fallback check)
      if (cachedInfo) {
        return {
          ...d,
          geminiTitle: cachedInfo.geminiTitle,
          geminiDescription: cachedInfo.geminiDescription,
          geminiTip: cachedInfo.geminiTip
        };
      }
      return d;
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const placesInput = placesToEnrich.map(d => ({
      id: d.id,
      name: d.name,
      distanceMeters: Math.round(d.route?.distance || 0),
      category: d.category
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: JSON.stringify(placesInput),
      config: {
        systemInstruction: `You are a fitness and lifestyle coach. 
        You will receive a list of potential running destinations (cafes or bars) with their run distances.
        
        Your task is to generate a catchy "Run Name", a short motivating description (1 sentence), and a "Pro Tip" for runners.
        
        CRITICAL: The "Run Name" and description MUST reflect the distance.
        - Short (<2km): "Sprint", "Dash", "Warm-up".
        - Medium (3-8km): "Run", "Jog", "Loop".
        - Long (>10km): "Challenge", "Endurance", "Long Run".
        
        If it's a bar, make the tone fun/rewarding (Earn your beer). 
        If it's a cafe, make it energetic (Run for coffee).
        
        Example: 
        Input: 500m to Bar. Output: "The Thirsty Sprint" - "Barely a warm-up, but the beer is cold."
        Input: 15km to Cafe. Output: "The Caffeine Ultra" - "A serious endurance test ending with the city's best espresso."`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              geminiTitle: { type: Type.STRING },
              geminiDescription: { type: Type.STRING },
              geminiTip: { type: Type.STRING },
            },
            required: ["id", "geminiTitle", "geminiDescription", "geminiTip"]
          }
        }
      }
    });

    const enrichedData = JSON.parse(response.text || "[]");

    // 4. Update Cache with new data AND the distance it was generated for
    enrichedData.forEach((item: any) => {
      // Find the original input to get the distance used
      const inputRef = placesInput.find(p => p.id === item.id);
      
      cache[item.id] = {
        geminiTitle: item.geminiTitle,
        geminiDescription: item.geminiDescription,
        geminiTip: item.geminiTip,
        generatedAtDistance: inputRef ? inputRef.distanceMeters : 0
      };
    });
    
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.warn("Failed to save to localStorage (quota exceeded?)", e);
    }

    // 5. Return Merged List
    return destinations.map(dest => {
      const newInfo = enrichedData.find((e: any) => e.id === dest.id);
      const cachedInfo = cache[dest.id];
      const info = newInfo || cachedInfo;
      
      if (!info) return dest;

      return {
        ...dest,
        geminiTitle: info.geminiTitle,
        geminiDescription: info.geminiDescription,
        geminiTip: info.geminiTip
      };
    });

  } catch (error) {
    console.warn("Gemini curation skipped due to error:", error);
    // Fallback to cache if API fails
    return destinations.map(d => {
        const cachedInfo = cache[d.id];
        if (cachedInfo) {
          return { ...d, ...cachedInfo };
        }
        return d;
    });
  }
};