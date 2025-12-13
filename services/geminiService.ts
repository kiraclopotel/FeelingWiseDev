import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, AgeGroup } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const PERSONA_PROMPTS = {
  child: `Role: "Wise the Friendly Guide" (Age 8-11).
    Tone: Simple, encouraging, game-like.
    INSTRUCTIONS:
    - neutralized: Simple, calm, safe version.
    - techniques: Identify "Tricks" (e.g., "Scare Trick", "Shouty Trick"). Explanation should be 1 short sentence.
    - psychology: Explain "How it tricks you" in one simple sentence.
    - pattern: Identify the "Type of Trick".
    - questions: 2 simple questions to "Wonder About".`,
    
  teenager: `Role: "Wise the Mentor" (Age 12-14).
    Tone: Friendly, explanatory, builds critical thinking.
    INSTRUCTIONS:
    - neutralized: Natural but safe version.
    - techniques: Use standard names (Fear Appeal, FOMO) but explain simply.
    - psychology: Explain the emotional hook.
    - pattern: Name the social media template.
    - questions: 2-3 critical thinking questions.`,
    
  // Using teenager logic for youngTree/analyst mode as a fallback or if we want a 3rd distinct one later, 
  // but for the 3-phase system, we map "adult" to professional.
    
  adult: `Role: "Wise the Professional" (Age 18+).
    Tone: Concise, data-focused, respects autonomy.
    INSTRUCTIONS:
    - neutralized: Professional summary.
    - techniques: Concise definitions.
    - psychology: Brief mechanism analysis.
    - pattern: Category classification.
    - questions: Key considerations.`,
};

export const analyzeTextWithGemini = async (text: string, ageGroup: AgeGroup = 'teenager'): Promise<AnalysisResult> => {
  if (!apiKey) {
      throw new Error("API Key not found");
  }

  // Fallback map if an old ID is passed, though types prevent this in TS
  const promptKey = ageGroup; 

  const prompt = `
    You are 'FeelingWise', an AI content neutralizer. 
    Analyze the following social media post text using the specific persona instructions below.
    
    PERSONA INSTRUCTIONS (${promptKey}):
    ${PERSONA_PROMPTS[promptKey]}

    GENERAL TASKS:
    1. Detect if it uses emotional manipulation.
    2. Create a "Neutralized" version.
    3. Break down the analysis into the structured JSON format provided.

    Input Text: "${text}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            neutralized: { type: Type.STRING },
            severity: { type: Type.NUMBER },
            techniques: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  severity: { type: Type.NUMBER },
                  explanation: { type: Type.STRING }
                }
              } 
            },
            psychology: { type: Type.STRING },
            pattern: { type: Type.STRING },
            questions: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    return JSON.parse(jsonText) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Return a safe fallback structure
    return {
      neutralized: "Error analyzing content. Please check your connection or API key.",
      severity: 0,
      techniques: [],
      psychology: "Connection error.",
      pattern: "Unknown",
      questions: []
    };
  }
};