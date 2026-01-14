
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const getCognitiveDiagnostic = async (projectInfo: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following business acquisition project and provide a strategic diagnostic: "${projectInfo}". 
    Format your response as JSON with the following schema:
    {
      "maturity": number (0-100),
      "risks": string[],
      "strategicPaths": string[],
      "executiveSummary": string
    }`,
    config: {
      responseMimeType: "application/json"
    }
  });
  
  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { maturity: 0, risks: [], strategicPaths: [], executiveSummary: "Error processing diagnostic." };
  }
};

export const getStrategicRecommendations = async (campaignData: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Based on this campaign data: "${campaignData}", provide 3 actionable strategic recommendations. 
    Explain "O que fazer agora", "Onde investir", "Onde cortar".
    Format as JSON:
    [
      {
        "id": "1",
        "title": "Title",
        "description": "What to do",
        "justification": "Why this decision",
        "action": "Call to action text",
        "priority": "High" | "Medium" | "Low",
        "category": "Invest" | "Cut" | "Scale" | "Pause"
      }
    ]`,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 4096 }
    }
  });
  
  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [];
  }
};

export const analyzeLeadIntent = async (leadSignals: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze these behavioral signals for a lead: "${leadSignals}". 
    Categorize as COLD, WARM, or HOT. Provide a score (0-100) and an intent summary.
    Format as JSON:
    {
      "temperature": "COLD" | "WARM" | "HOT",
      "score": number,
      "intentSummary": "Short explanation of the user's real intention"
    }`,
    config: {
      responseMimeType: "application/json"
    }
  });
  
  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { temperature: "COLD", score: 0, intentSummary: "Unavailable" };
  }
};

export const processSDRInteraction = async (chatHistory: { role: 'user' | 'model', text: string }[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: chatHistory.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
    config: {
      systemInstruction: `You are a Virtual Cognitive SDR for Stitch, a high-performance acquisition intelligence platform. 
      Your goal is to conduct a guided diagnostic dialogue. 
      Analyze the sentiment of the lead, provide a professional and helpful response, and justify your cognitive path.
      Always respond in JSON format:
      {
        "reply": "The SDR response text",
        "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "SKEPTICAL" | "URGENT",
        "cognitivePath": "Explanation of why you chose this question/answer",
        "recommendedNextStep": "E.g., Schedule demo, send technical doc, human handoff",
        "scoreUpdate": number (relative change to lead score -5 to +10)
      }`,
      responseMimeType: "application/json"
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { 
      reply: "Sinto muito, tive um erro no processamento cognitivo. Pode repetir?", 
      sentiment: "NEUTRAL", 
      cognitivePath: "Error in LLM output", 
      recommendedNextStep: "Retry", 
      scoreUpdate: 0 
    };
  }
};
