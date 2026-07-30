import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const DEFAULT_AGENT_MODEL = process.env.GEMINI_AGENT_MODEL || "gemini-3.1-flash-lite";

function safeJsonParse(value) {
  if (typeof value !== "string") return null;
  const sanitizedOutput = value.replace(/```json/g, "").replace(/```/g, "").trim();
  if (!sanitizedOutput) return null;
  try {
    return JSON.parse(sanitizedOutput);
  } catch {
    return null;
  }
}

// More robust JSON extraction: find the first { ... } block
function extractJsonFromText(text) {
  if (typeof text !== "string") return null;
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
  const jsonStr = text.slice(firstBrace, lastBrace + 1);
  return safeJsonParse(jsonStr);
}

// Patch to fix "author: undefined" error
function createPatchedLLM() {
  const llm = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: DEFAULT_AGENT_MODEL,
    temperature: 0.7,
    maxRetries: 2,
  });

  const originalGenerate = llm._generate.bind(llm);
  llm._generate = async function (messages, options, runManager) {
    const flattenMessages = (arr) => {
      const result = [];
      for (const item of arr) {
        if (Array.isArray(item)) {
          result.push(...flattenMessages(item));
        } else {
          result.push(item);
        }
      }
      return result;
    };
    const allMessages = flattenMessages(messages);
    for (const msg of allMessages) {
      if (msg.author === undefined) {
        let author = 'human';
        if (typeof msg._getType === 'function') {
          const type = msg._getType();
          if (type === 'human') author = 'human';
          else if (type === 'ai') author = 'ai';
          else if (type === 'system') author = 'system';
        }
        msg.author = author;
      }
    }
    return await originalGenerate(messages, options, runManager);
  };

  return llm;
}

export async function generateHealthInsights(medications) {
  console.log(`[Insight Generator] Called with medications:`, medications);

  // If no medications, return a friendly placeholder
  if (!medications || medications.length === 0) {
    console.log("[Insight Generator] No medications provided, returning default.");
    return {
      status: "success",
      insights: [
        {
          title: "No Medications Detected",
          description: "Upload a prescription scan to receive personalized health insights.",
          icon: "ShieldAlert",
          color: "blue"
        }
      ]
    };
  }

  const llm = createPatchedLLM();

  const prompt = `You are a preventative wellness assistant. Review the provided list of medications the user is taking. 
Generate 2-3 general, safe, preventative health tips or potential long-term trend warnings (e.g., 'Since you are on a statin, remember to monitor for muscle aches' or 'Ensure adequate hydration'). 

CRITICAL: Do not provide medical diagnoses. Keep it general and educational.

Output requirements:
- Return ONLY valid JSON. 
- DO NOT wrap the JSON in markdown formatting, backticks, or code blocks.
- Do not include conversational text before or after the JSON.
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
    console.log("[Insight Generator] Sending prompt to LLM...");
    const response = await llm.invoke(prompt);
    const content = typeof response.content === "string" ? response.content : "";
    console.log("[Insight Generator] Raw LLM response:", content);

    // Try multiple parsing strategies
    let parsedData = safeJsonParse(content) || extractJsonFromText(content);

    if (parsedData && parsedData.status === "success" && Array.isArray(parsedData.insights) && parsedData.insights.length > 0) {
      console.log(`[Insight Generator] Successfully generated ${parsedData.insights.length} insights.`);
      return parsedData;
    }

    // If we got an object but insights is empty, try to create a default insight from the response
    if (parsedData && typeof parsedData === "object") {
      // Maybe the LLM returned a different structure? Attempt to adapt.
      // For safety, we'll fall back to a generic insight.
    }

    // Fallback: generate a simple insight based on the medications
    const fallbackInsights = [
      {
        title: "Medication Routine Reminder",
        description: `You are taking ${medications.join(", ")}. Always follow your healthcare provider's instructions and report any side effects.`,
        icon: "ShieldAlert",
        color: "blue"
      }
    ];

    console.warn("[Insight Generator] No valid insights from LLM, using fallback.");
    return {
      status: "success",
      insights: fallbackInsights
    };
  } catch (error) {
    console.error("[Insight Generator] Error generating insights:", error);
    return {
      status: "success",
      insights: [
        {
          title: "Insights Unavailable",
          description: "We're temporarily unable to generate insights. Please try again later.",
          icon: "ShieldAlert",
          color: "amber"
        }
      ]
    };
  }
}