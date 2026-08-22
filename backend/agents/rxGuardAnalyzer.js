import { DynamicTool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { visionClient } from "../models/vision.js";

const DEFAULT_AGENT_MODEL = process.env.GEMINI_AGENT_MODEL || "gemini-3.1-flash-lite";
const DEFAULT_VISION_MODEL = process.env.GEMINI_VISION_MODEL || "gemini-3.1-flash-lite";
const PYTHON_NORMALIZER_URL =
  process.env.PYTHON_NORMALIZER_URL ||
  process.env.PYTHON_URL ||
  "http://127.0.0.1:8000";
const FDA_API_BASE_URL = process.env.FDA_API_BASE_URL || "https://api.fda.gov";

const IMAGE_STORE = new Map();
let nextImageId = 0;

// --- Helper Functions ---
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

function extractDrugList(payload) {
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload)) {
    return payload.map((drug) => (typeof drug === "string" ? drug.trim() : "")).filter(Boolean);
  }
  const drugs = Array.isArray(payload.drugs_detected)
    ? payload.drugs_detected
    : Array.isArray(payload.drugs)
      ? payload.drugs
      : [];
  return drugs.map((drug) => (typeof drug === "string" ? drug.trim() : "")).filter(Boolean);
}

function dedupeDrugList(drugs) {
  const deduped = [];
  const seen = new Set();
  for (const drug of drugs) {
    const cleanDrug = typeof drug === "string" ? drug.trim() : "";
    if (!cleanDrug) continue;
    const key = cleanDrug.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(cleanDrug);
  }
  return deduped;
}

function normalizeDrugInput(input) {
  if (Array.isArray(input)) {
    return input.map((drug) => (typeof drug === "string" ? drug.trim() : "")).filter(Boolean);
  }
  if (typeof input !== "string") return [];
  const trimmedInput = input.trim();
  if (!trimmedInput) return [];
  try {
    const parsed = JSON.parse(trimmedInput);
    if (Array.isArray(parsed)) return normalizeDrugInput(parsed);
  } catch {
    // fall through
  }
  return trimmedInput.split(",").map((drug) => drug.trim()).filter(Boolean);
}

function parseImageInput(image) {
  if (typeof image !== "string" || !image.trim()) return null;
  const trimmedImage = image.trim();
  const dataUrlMatch = trimmedImage.match(/^data:(.*?);base64,(.*)$/s);
  if (dataUrlMatch) {
    let mimeType = dataUrlMatch[1].split(';')[0];
    if (!mimeType) mimeType = "image/jpeg";
    return { mimeType, data: dataUrlMatch[2] };
  }
  return { mimeType: "image/jpeg", data: trimmedImage };
}

function collectFdaRawText(fdaData) {
  if (!fdaData || typeof fdaData !== "object") return "";
  if (Array.isArray(fdaData.raw_texts)) {
    return fdaData.raw_texts
      .map((text) => (typeof text === "string" ? text.trim() : ""))
      .filter(Boolean)
      .join("\n\n");
  }
  if (typeof fdaData.warning === "string") return fdaData.warning.trim();
  return "";
}

function getWorstSeverityLabel(text) {
  const warningText = typeof text === "string" ? text.toLowerCase() : "";
  if (!warningText) return "none";
  if (warningText.includes("contraindicated") || warningText.includes("severe")) return "CONTRAINDICATED";
  if (warningText.includes("major")) return "MAJOR INTERACTION";
  if (warningText.includes("moderate")) return "MODERATE INTERACTION";
  return "MINOR INTERACTION";
}

function buildShortSummary(fdaData) {
  if (!fdaData || !fdaData.success) return "⚠️ Unable to retrieve interaction data.";

  const pairResults = fdaData.pair_results || [];
  const warnings = pairResults.filter(p => p.raw_text && p.raw_text.trim().length > 0);

  if (warnings.length === 0) {
    return "✅ No drug-drug interactions detected.";
  }

  const bullets = warnings.map((p) => {
    const [drug1, drug2] = p.drugs;
    let shortText = p.raw_text.trim();
    if (shortText.length > 120) {
      const firstSentence = shortText.match(/^[^.!?]*[.!?]/);
      shortText = firstSentence ? firstSentence[0] : shortText.slice(0, 120) + '...';
    }
    return `• ${drug1} + ${drug2}: ${shortText}`;
  });

  return bullets.join('\n');
}

// --- Tool Definitions ---

export const createVisionOcrTool = () => new DynamicTool({
  name: "vision_ocr_tool",
  description: "Use this first. Extract handwritten or printed medication names from the images. Input should be a comma-separated list of Image IDs to analyze.",
  func: async (toolInput) => {
    try {
      const ids = toolInput.split(',').map(id => id.trim()).map(Number).filter(id => !isNaN(id));
      if (ids.length === 0) {
        return JSON.stringify({ success: false, error: "No valid image IDs provided." });
      }

      let allDrugs = [];
      let allText = [];

      for (const id of ids) {
        const img = IMAGE_STORE.get(id);
        if (!img) {
          console.warn(`[vision_ocr_tool] Image ID ${id} not found.`);
          continue;
        }
        const parsedImage = parseImageInput(img);
        if (!parsedImage) {
          console.warn(`[vision_ocr_tool] Failed to parse Image ID ${id}.`);
          continue;
        }

        const response = await visionClient.models.generateContent({
          model: DEFAULT_VISION_MODEL,
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `
Extract medicine names from this prescription image.
Rules:
- Return ONLY JSON.
- No explanations.
- Do not guess or hallucinate.
- If nothing readable is found, return an empty array.
Format:
{
  "drugs": []
}
`,
                },
                { inlineData: { mimeType: parsedImage.mimeType, data: parsedImage.data } },
              ],
            },
          ],
        });

        const parsedResponse = safeJsonParse(response.text);
        const drugsDetected = extractDrugList(parsedResponse);
        allDrugs.push(...drugsDetected);
        allText.push(typeof response.text === "string" ? response.text : "");
      }

      const finalDrugs = dedupeDrugList(allDrugs);
      return JSON.stringify({
        success: true,
        drugs_detected: finalDrugs,
        manual_entry_required: finalDrugs.length === 0,
        raw_text: allText.join("\n"),
      });
    } catch (error) {
      console.error("[vision_ocr_tool] error:", error);
      return JSON.stringify({ success: false, drugs_detected: [], manual_entry_required: true, raw_text: "" });
    }
  },
});

export const nameNormalizerTool = new DynamicTool({
  name: "name_normalizer_tool",
  description: "Use after OCR. Input should be an array of raw drug names or a JSON stringified array. Normalize the medication spellings using the Python FastAPI normalizer service.",
  func: async (input) => {
    try {
      const rawDrugs = normalizeDrugInput(input);
      if (rawDrugs.length === 0) {
        return JSON.stringify({ success: true, normalized_drugs: [], raw_drugs: [] });
      }

      const normalizedResults = await Promise.all(
        rawDrugs.map(async (drugName) => {
          // Implement 6-second timeout so the agent doesn't hang if Python API is slow/down
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000); 

          try {
            // Using POST instead of GET is safer for medical names containing special characters
            const response = await fetch(`${PYTHON_NORMALIZER_URL}/normalize`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: drugName }),
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            return {
              input: drugName,
              normalized_name: data?.normalized_name?.trim() || drugName,
              score: data?.score ?? null,
              source: data?.source || "none",
              is_correction: data?.is_correction ?? false,
              success: true,
            };
          } catch (err) {
            clearTimeout(timeoutId);
            console.warn(`[name_normalizer_tool] API failed for '${drugName}':`, err.message);
            
            // Graceful fallback: return original name so agent flow doesn't break entirely
            return { 
              input: drugName, 
              normalized_name: drugName, 
              score: null, 
              source: "fallback",
              is_correction: false,
              success: false 
            };
          }
        }),
      );

      const normalizedDrugs = dedupeDrugList(normalizedResults.map(item => item.normalized_name));
      return JSON.stringify({
        success: true,
        raw_drugs: rawDrugs,
        normalized_drugs: normalizedDrugs,
        results: normalizedResults,
      });
    } catch (error) {
      console.error("[name_normalizer_tool] error:", error);
      return JSON.stringify({ success: false, raw_drugs: [], normalized_drugs: [] });
    }
  },
});

export const fdaDatabaseTool = new DynamicTool({
  name: "fda_database_tool",
  description: "Use after normalization. Input should be an array of normalized drug names or a JSON stringified array. Check the FDA database for interactions, contraindications, and severe warnings.",
  func: async (input) => {
    try {
      const drugs = dedupeDrugList(normalizeDrugInput(input));
      if (drugs.length < 2) {
        return JSON.stringify({
          success: true,
          drugs,
          warning: "",
          raw_texts: [],
          message: "Not enough medications to check interactions.",
          pair_results: [],
        });
      }

      const pairs = [];
      for (let i = 0; i < drugs.length; i++) {
        for (let j = i + 1; j < drugs.length; j++) {
          pairs.push([drugs[i], drugs[j]]);
        }
      }

      const pairResults = await Promise.all(
        pairs.map(async ([drug1, drug2]) => {
          const url = `${FDA_API_BASE_URL}/drug/label.json?search=drug_interactions:"${encodeURIComponent(drug1)}"+AND+drug_interactions:"${encodeURIComponent(drug2)}"&limit=1`;
          try {
            // Also applying a timeout to FDA API for stability
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!response.ok) return { drugs: [drug1, drug2], raw_text: "" };
            const data = await response.json();
            const warningText = data?.results?.[0]?.drug_interactions?.[0] ?? "";
            return { drugs: [drug1, drug2], raw_text: warningText };
          } catch {
            return { drugs: [drug1, drug2], raw_text: "" };
          }
        }),
      );

      const rawTexts = pairResults.filter(r => r.raw_text).map(r => r.raw_text);
      const warnings = pairResults
        .filter(r => r.raw_text)
        .map(r => `${r.drugs[0]} + ${r.drugs[1]}: ${r.raw_text}`);
      const warningText = warnings.join("\n\n");

      return JSON.stringify({
        success: true,
        drugs,
        warning: warningText,
        raw_texts: rawTexts,
        message: warningText ? `FDA Warning:\n\n${warningText}` : "No explicit interaction warning found in FDA database.",
        pairs_checked: pairResults.length,
        pair_results: pairResults, 
      });
    } catch (error) {
      console.error("[fda_database_tool] error:", error);
      return JSON.stringify({ success: false, drugs: [], warning: "", raw_texts: [], pair_results: [] });
    }
  },
});

// --- Custom Agent Loop ---
async function runAgentLoop(question, maxIterations = 6) {
  const llm = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: DEFAULT_AGENT_MODEL,
    temperature: 0,
    maxRetries: 2,
  });

  const toolMap = {
    vision_ocr_tool: createVisionOcrTool(),
    name_normalizer_tool: nameNormalizerTool,
    fda_database_tool: fdaDatabaseTool,
  };

  let scratchpad = "";
  let iteration = 0;

  while (iteration < maxIterations) {
    const prompt = `
You are an AI assistant that uses tools to answer questions. You have access to the following tools:

- vision_ocr_tool: Use this first. Extract handwritten or printed medication names from the images. Input should be a comma-separated list of Image IDs to analyze.
- name_normalizer_tool: Use after OCR. Input should be an array of raw drug names or a JSON stringified array. Normalize the medication spellings using the Python FastAPI normalizer service.
- fda_database_tool: Use after normalization. Input should be an array of normalized drug names or a JSON stringified array. Check the FDA database for interactions, contraindications, and severe warnings.

Use the following format, and ONLY this format:

Thought: you should always think about what to do
Action: the action to take, should be one of [vision_ocr_tool, name_normalizer_tool, fda_database_tool]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

You MUST output exactly one Thought/Action/Action Input per turn. Do NOT output Observation yourself – it will be provided by the system.
When you have all the information, output a Final Answer with a JSON object following the required schema.

Question: ${question}

${scratchpad}
`;

    const response = await llm.invoke(prompt);
    const output = response.content;

    console.log(`[Agent Loop] Iteration ${iteration + 1}:\n${output}`);

    if (output.includes("Final Answer:")) {
      const finalAnswerMatch = output.match(/Final Answer:\s*([\s\S]*)$/);
      if (finalAnswerMatch) {
        const answerText = finalAnswerMatch[1].trim();
        const json = safeJsonParse(answerText) || extractJsonFromText(answerText);
        if (json) return json;
        return { status: "manual_entry_required", drugs_detected: [], fda_summary: "", fda_raw_text: "", fda_warning: "", severity_level: "none" };
      }
    }

    const actionMatch = output.match(/Action:\s*(\w+)/);
    const actionInputMatch = output.match(/Action Input:\s*(.+)/);
    if (!actionMatch || !actionInputMatch) {
      console.warn("[Agent Loop] No Action found, breaking.");
      break;
    }

    const toolName = actionMatch[1].trim();
    const toolInput = actionInputMatch[1].trim();

    console.log(`[Agent Loop] Calling tool: ${toolName} with input: ${toolInput}`);

    let observation = "";
    if (toolMap[toolName]) {
      try {
        const result = await toolMap[toolName].func(toolInput);
        observation = result;
      } catch (error) {
        observation = `Error executing tool ${toolName}: ${error.message}`;
      }
    } else {
      observation = `Unknown tool: ${toolName}`;
    }

    scratchpad += output + `\nObservation: ${observation}\n`;
    iteration++;
  }

  return { status: "manual_entry_required", drugs_detected: [], fda_summary: "", fda_raw_text: "", fda_warning: "", severity_level: "none" };
}

function extractJsonFromText(value) {
  if (typeof value !== "string") return null;
  const firstBrace = value.indexOf("{");
  const lastBrace = value.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
  return safeJsonParse(value.slice(firstBrace, lastBrace + 1));
}

// --- Main Exported Function ---
export async function runRxGuardAgent(images) {
  const imageList = Array.isArray(images) ? images.filter(img => typeof img === "string" && img.trim()) : [];
  if (imageList.length === 0) {
    return { status: "manual_entry_required", drugs_detected: [], fda_summary: "", fda_raw_text: "", fda_warning: "", severity_level: "none" };
  }

  const imageIds = [];
  for (const img of imageList) {
    const id = nextImageId++;
    IMAGE_STORE.set(id, img);
    imageIds.push(id);
  }

  try {
    const question = `You are the RxGuard Medical Safety Autonomous Agent.
Your job is to analyze prescription images, normalize the extracted drug names, and check them against FDA databases for dangerous interactions.

You must use your tools in a logical sequence.
1. First, use the vision_ocr_tool to read the images. Input should be this exact comma-separated list of Image IDs: ${imageIds.join(', ')}
2. Second, use the name_normalizer_tool to correct the spelling of the extracted drugs. Do not skip this step.
3. Third, use the fda_database_tool to check the normalized drugs for interactions.
4. Finally, synthesize the results into a final report.

Output requirements:
- Do not output conversational text.
- Return only strict JSON.
- Use this exact schema:
{
  "status": "success",
  "drugs_detected": ["<DRUG_1>", "<DRUG_2>"],
  "fda_summary": "<summary text from fda_database_tool>",
  "fda_raw_text": "<raw text from fda_database_tool>",
  "fda_warning": "<warning text from fda_database_tool>"
}
- If nothing readable is found, return:
{
  "status": "manual_entry_required",
  "drugs_detected": [],
  "fda_summary": "",
  "fda_raw_text": "",
  "fda_warning": ""
}`;

    const result = await runAgentLoop(question, 6);

    // Clean up stored images
    for (const id of imageIds) IMAGE_STORE.delete(id);

    // Determine final drugs list
    let drugs = [];
    if (result.status !== "manual_entry_required" && Array.isArray(result.drugs_detected) && result.drugs_detected.length > 0) {
      drugs = result.drugs_detected;
    } else {
      return { status: "manual_entry_required", drugs_detected: [], fda_summary: "", fda_raw_text: "", fda_warning: "", severity_level: "none" };
    }

    // --- Override summary with real FDA data and build bullet-point summary ---
    let fdaShortSummary = "";
    let fdaFullRaw = "";
    let severity = "none";

    if (drugs.length === 1) {
      fdaShortSummary = "ℹ️ Single medication detected. No drug-drug interactions to check.";
      fdaFullRaw = "";
      severity = "none";
    } else {
      try {
        const fdaResponse = await fdaDatabaseTool.func(JSON.stringify(drugs));
        const fdaData = safeJsonParse(fdaResponse);
        if (fdaData && fdaData.success) {
          fdaShortSummary = buildShortSummary(fdaData);
          fdaFullRaw = fdaData.warning || fdaData.message || "";
          severity = getWorstSeverityLabel(fdaData.warning) || "none";
        } else {
          fdaShortSummary = result.fda_summary || "Unable to retrieve interaction data.";
          fdaFullRaw = result.fda_raw_text || "";
          severity = result.fda_warning || "none";
        }
      } catch (err) {
        console.warn("[RxGuard] FDA override failed, using agent result.");
        fdaShortSummary = result.fda_summary || "Unable to retrieve interaction data.";
        fdaFullRaw = result.fda_raw_text || "";
        severity = result.fda_warning || "none";
      }
    }

    return {
      status: "success",
      drugs_detected: drugs,
      fda_summary: fdaShortSummary,
      fda_raw_text: fdaFullRaw,
      fda_warning: severity,
      severity_level: severity,
    };
  } catch (error) {
    console.error("[RxGuard Agent Failure]:", error);
    for (const id of imageIds) IMAGE_STORE.delete(id);
    return { status: "manual_entry_required", drugs_detected: [], fda_summary: "", fda_raw_text: "", fda_warning: "", severity_level: "none" };
  }
}