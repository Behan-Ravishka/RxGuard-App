import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const DEFAULT_AGENT_MODEL = process.env.GEMINI_AGENT_MODEL || "gemini-3.1-flash-lite";

function safeJsonParse(value) {
  if (typeof value !== "string") {
    return null;
  }

  const sanitizedOutput = value.replace(/```json/g, "").replace(/```/g, "").trim();

  if (!sanitizedOutput) {
    return null;
  }

  try {
    return JSON.parse(sanitizedOutput);
  } catch {
    return null;
  }
}

export async function generateHealthInsights(medications) {
  const llm = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: DEFAULT_AGENT_MODEL,
    temperature: 0.7,
    maxRetries: 2,
  });

  const prompt = `You are a preventative wellness assistant. Review the provided list of medications the user is taking. 
Generate 2-3 general, safe, preventative health tips or potential long-term trend warnings (e.g., 'Since you are on a statin, remember to monitor for muscle aches' or 'Ensure adequate hydration'). 

CRITICAL: Do not provide medical diagnoses. Keep it general and educational.

Output requirements:
- Return only strict JSON.
- Do not include conversational text or markdown formatting outside of the JSON.
- Use this exact schema for your response:
{
  "status": "success",
  "insights": [
    {
      "title": "<Short string, e.g., 'Rising Cholesterol Alert'>",
      "description": "<String, detailed description of the trend or tip>",
      "icon": "<String, strictly one of: 'TrendingUp', 'ShieldAlert', 'Sparkles', 'Brain', 'Activity', 'Heart'>",
      "color": "<String, strictly one of: 'rose', 'amber', 'indigo', 'emerald', 'blue', 'purple'>"
    }
  ]
}

Medications:
${medications.join(", ")}
`;

  try {
    const response = await llm.invoke(prompt);
    const parsedData = safeJsonParse(response.content) || {};
    
    if (parsedData.status === "success" && Array.isArray(parsedData.insights)) {
      return parsedData;
    }

    return {
      status: "success",
      insights: [
        {
          title: "General Wellness Reminder",
          description: "Always remember to consult your healthcare provider before making any changes to your medication routine.",
          icon: "ShieldAlert",
          color: "blue"
        }
      ]
    };
  } catch (error) {
    console.error("[Insight Generator] Error generating insights:", error);
    return {
      status: "error",
      insights: []
    };
  }
}
