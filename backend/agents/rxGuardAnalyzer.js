import { DynamicTool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
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

function extractDrugList(payload) {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload
      .map((drug) => (typeof drug === "string" ? drug.trim() : ""))
      .filter(Boolean);
  }

  const drugs = Array.isArray(payload.drugs_detected)
    ? payload.drugs_detected
    : Array.isArray(payload.drugs)
      ? payload.drugs
      : [];

  return drugs
    .map((drug) => (typeof drug === "string" ? drug.trim() : ""))
    .filter(Boolean);
}

function dedupeDrugList(drugs) {
  const deduped = [];
  const seen = new Set();

  for (const drug of drugs) {
    const cleanDrug = typeof drug === "string" ? drug.trim() : "";

    if (!cleanDrug) {
      continue;
    }

    const key = cleanDrug.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(cleanDrug);
  }

  return deduped;
}

function normalizeDrugInput(input) {
  if (Array.isArray(input)) {
    return input
      .map((drug) => (typeof drug === "string" ? drug.trim() : ""))
      .filter(Boolean);
  }

  if (typeof input !== "string") {
    return [];
  }

  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmedInput);
    if (Array.isArray(parsed)) {
      return normalizeDrugInput(parsed);
    }
  } catch {
    // Fall through to comma separated parsing.
  }

  return trimmedInput
    .split(",")
    .map((drug) => drug.trim())
    .filter(Boolean);
}

function parseImageInput(image) {
  if (typeof image !== "string" || !image.trim()) {
    return null;
  }

  const trimmedImage = image.trim();
  const dataUrlMatch = trimmedImage.match(/^data:(.*?);base64,(.*)$/s);

  if (dataUrlMatch) {
    let mimeType = dataUrlMatch[1].split(';')[0];
    if (!mimeType) mimeType = "image/jpeg";
    return {
      mimeType,
      data: dataUrlMatch[2],
    };
  }

  return {
    mimeType: "image/jpeg",
    data: trimmedImage,
  };
}

function collectFdaRawText(fdaData) {
  if (!fdaData || typeof fdaData !== "object") {
    return "";
  }

  if (Array.isArray(fdaData.raw_texts)) {
    return fdaData.raw_texts
      .map((text) => (typeof text === "string" ? text.trim() : ""))
      .filter(Boolean)
      .join("\n\n");
  }

  if (typeof fdaData.warning === "string") {
    return fdaData.warning.trim();
  }

  return "";
}

function getWorstSeverityLabel(text) {
  const warningText = typeof text === "string" ? text.toLowerCase() : "";

  if (!warningText) {
    return "none";
  }

  if (warningText.includes("contraindicated") || warningText.includes("severe")) {
    return "CONTRAINDICATED";
  }

  if (warningText.includes("major")) {
    return "MAJOR INTERACTION";
  }

  if (warningText.includes("moderate")) {
    return "MODERATE INTERACTION";
  }

  return "MINOR INTERACTION";
}

export const createVisionOcrTool = () => new DynamicTool({
  name: "vision_ocr_tool",
  description:
    "Use this first. Extract handwritten or printed medication names from the images. Input should be a comma-separated list of Image IDs to analyze.",
  func: async (toolInput) => {
    try {
      const ids = toolInput.split(',').map(id => id.trim()).map(Number).filter(id => !isNaN(id));

      if (ids.length === 0) {
        return JSON.stringify({
          success: false,
          error: "No valid image IDs provided in tool input.",
        });
      }

      let allDrugs = [];
      let allText = [];

      for (const id of ids) {
        const img = IMAGE_STORE.get(id);
        if (!img) {
          console.warn(`[RxGuard Agent] vision_ocr_tool: Image ID ${id} not found in store.`);
          continue;
        }

        const parsedImage = parseImageInput(img);
        if (!parsedImage) {
          console.warn(`[RxGuard Agent] vision_ocr_tool: Failed to parse Image ID ${id}.`);
          continue;
        }

        console.log(`[RxGuard Agent] vision_ocr_tool: Sending Image ID ${id} to Gemini.`);
        console.log(`[RxGuard Agent] vision_ocr_tool: MimeType: ${parsedImage.mimeType}, Base64 Length: ${parsedImage.data.length}`);

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
- Do not guess.
- If nothing readable is found, return an empty array.

Format:
{
  "drugs": []
}
`,
                },
                {
                  inlineData: {
                    mimeType: parsedImage.mimeType,
                    data: parsedImage.data,
                  },
                },
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
      console.error("[backend/agents/rxGuardAnalyzer.js] vision_ocr_tool failed:", error);
      return JSON.stringify({
        success: false,
        drugs_detected: [],
        manual_entry_required: true,
        raw_text: "",
        error: error?.message ?? "Vision OCR failed",
      });
    }
  },
});

export const nameNormalizerTool = new DynamicTool({
  name: "name_normalizer_tool",
  description:
    "Use after OCR. Input should be an array of raw drug names or a JSON stringified array. Normalize the medication spellings using the Python FastAPI normalizer service.",
  func: async (input) => {
    try {
      const rawDrugs = normalizeDrugInput(input);

      if (rawDrugs.length === 0) {
        return JSON.stringify({
          success: true,
          normalized_drugs: [],
          raw_drugs: [],
          message: "No drugs were provided for normalization.",
        });
      }

      const normalizedResults = await Promise.all(
        rawDrugs.map(async (drugName) => {
          const url = `${PYTHON_NORMALIZER_URL}/normalize?drug_name=${encodeURIComponent(drugName)}`;

          try {
            const response = await fetch(url, { method: "GET" });
            const data = await response.json();

            return {
              input: drugName,
              normalized_name:
                typeof data?.normalized_name === "string" && data.normalized_name.trim()
                  ? data.normalized_name.trim()
                  : drugName,
              score: typeof data?.score === "number" ? data.score : null,
              success: true,
            };
          } catch (error) {
            console.error(
              "[backend/agents/rxGuardAnalyzer.js] name_normalizer_tool item failed:",
              error,
            );

            return {
              input: drugName,
              normalized_name: drugName,
              score: null,
              success: false,
              error: error?.message ?? "Normalizer request failed",
            };
          }
        }),
      );

      const normalizedDrugs = dedupeDrugList(
        normalizedResults.map((item) => item.normalized_name),
      );

      return JSON.stringify({
        success: true,
        raw_drugs: rawDrugs,
        normalized_drugs: normalizedDrugs,
        results: normalizedResults,
      });
    } catch (error) {
      console.error("[backend/agents/rxGuardAnalyzer.js] name_normalizer_tool failed:", error);
      return JSON.stringify({
        success: false,
        raw_drugs: [],
        normalized_drugs: [],
        error: error?.message ?? "Drug normalization failed",
      });
    }
  },
});

export const fdaDatabaseTool = new DynamicTool({
  name: "fda_database_tool",
  description:
    "Use after normalization. Input should be an array of normalized drug names or a JSON stringified array. Check the FDA database for interactions, contraindications, and severe warnings.",
  func: async (input) => {
    try {
      const drugs = dedupeDrugList(normalizeDrugInput(input));

      if (drugs.length < 2) {
        return JSON.stringify({
          success: true,
          drugs,
          warning: "",
          raw_texts: [],
          pair_results: [],
          message: "Not enough medications were detected to check for interactions.",
        });
      }

      const pairs = [];

      for (let index = 0; index < drugs.length; index += 1) {
        for (let innerIndex = index + 1; innerIndex < drugs.length; innerIndex += 1) {
          pairs.push([drugs[index], drugs[innerIndex]]);
        }
      }

      const pairResults = await Promise.all(
        pairs.map(async ([drug1, drug2]) => {
          const url = `${FDA_API_BASE_URL}/drug/label.json?search=drug_interactions:"${encodeURIComponent(drug1)}"+AND+drug_interactions:"${encodeURIComponent(drug2)}"&limit=1`;

          try {
            const response = await fetch(url);

            if (!response.ok) {
              if (response.status === 404) {
                return {
                  drugs: [drug1, drug2],
                  raw_text: "",
                };
              }

              throw new Error(`FDA API returned status ${response.status}`);
            }

            const data = await response.json();
            const warningText = data?.results?.[0]?.drug_interactions?.[0] ?? "";

            return {
              drugs: [drug1, drug2],
              raw_text: warningText,
            };
          } catch (error) {
            console.error(
              "[backend/agents/rxGuardAnalyzer.js] fda_database_tool pair failed:",
              error,
            );

            return {
              drugs: [drug1, drug2],
              raw_text: "",
              error: error?.message ?? "Unknown FDA API error",
            };
          }
        }),
      );

      const rawTexts = pairResults
        .filter((pairResult) => pairResult.raw_text)
        .map((pairResult) => pairResult.raw_text);

      const warnings = pairResults
        .filter((pairResult) => pairResult.raw_text)
        .map((pairResult) => {
          const [drug1, drug2] = pairResult.drugs;
          return `${drug1} + ${drug2}: ${pairResult.raw_text}`;
        });

      const warningText = warnings.join("\n\n");

      return JSON.stringify({
        success: true,
        drugs,
        warning: warningText,
        raw_texts: rawTexts,
        pair_results: pairResults,
        message: warningText
          ? `FDA Warning:\n\n${warningText}`
          : "No interaction warning text was returned.",
        pairs_checked: pairResults.length,
      });
    } catch (error) {
      console.error("[backend/agents/rxGuardAnalyzer.js] fda_database_tool failed:", error);
      return JSON.stringify({
        success: false,
        drugs: [],
        warning: "",
        raw_texts: [],
        error: error?.message ?? "FDA check failed",
      });
    }
  },
});

async function getAgentExecutor() {
  const llm = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: DEFAULT_AGENT_MODEL,
    temperature: 0,
    maxRetries: 2,
  });

  const originalGenerate = llm._generate.bind(llm);
  llm._generate = async function(messages, options, runManager) {
    for (const msg of messages) {
      if (msg.type === undefined && typeof msg._getType === 'function') {
        Object.defineProperty(msg, 'type', {
          get() { return this._getType(); },
          enumerable: true,
          configurable: true
        });
      }
    }
    return await originalGenerate(messages, options, runManager);
  };

  const tools = [createVisionOcrTool(), nameNormalizerTool, fdaDatabaseTool];

  return initializeAgentExecutorWithOptions(tools, llm, {
    agentType: "zero-shot-react-description",
    verbose: true,
    returnIntermediateSteps: true,
    maxIterations: 6,
    handleParsingErrors: true,
  });
}

function buildAgentInput(imageIds) {
  return `You are the RxGuard Medical Safety Autonomous Agent.
Your job is to analyze prescription images, normalize the extracted drug names, and check them against FDA databases for dangerous interactions.

You must use your tools in a logical sequence.
Thought Process:
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
}
`;
}

function extractJsonFromText(value) {
  if (typeof value !== "string") {
    return null;
  }

  const firstBrace = value.indexOf("{");
  const lastBrace = value.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  return safeJsonParse(value.slice(firstBrace, lastBrace + 1));
}

function normalizeFinalPayload(payload) {
  const status = payload?.status === "manual_entry_required" ? "manual_entry_required" : "success";
  const drugsDetected = Array.isArray(payload?.drugs_detected)
    ? dedupeDrugList(payload.drugs_detected)
    : [];
  const fdaSummary = typeof payload?.fda_summary === "string" ? payload.fda_summary.trim() : "";
  const fdaRawText = typeof payload?.fda_raw_text === "string" ? payload.fda_raw_text.trim() : "";
  const fdaWarning = typeof payload?.fda_warning === "string" ? payload.fda_warning.trim() : "";

  if (status === "manual_entry_required" || drugsDetected.length === 0) {
    return {
      status: "manual_entry_required",
      drugs_detected: [],
      fda_summary: "",
      fda_raw_text: "",
      fda_warning: "",
    };
  }

  return {
    status: "success",
    drugs_detected: drugsDetected,
    fda_summary: fdaSummary || (fdaWarning ? `Safety check completed with ${fdaWarning.toLowerCase()}.` : "Safety check completed."),
    fda_raw_text: fdaRawText,
    fda_warning: fdaWarning || getWorstSeverityLabel(fdaSummary),
  };
}

function logIntermediateSteps(intermediateSteps) {
  if (!Array.isArray(intermediateSteps) || intermediateSteps.length === 0) {
    console.log("[RxGuard Agent] No intermediate steps returned.");
    return;
  }

  intermediateSteps.forEach((step, index) => {
    const action = step?.action ?? {};
    console.log(`\n[RxGuard Agent][Step ${index + 1}] Thought:`, action.log || "(not exposed)");
    console.log(`[RxGuard Agent][Step ${index + 1}] Action:`, {
      tool: action.tool,
      toolInput: action.toolInput,
    });
    console.log(`[RxGuard Agent][Step ${index + 1}] Observation:`, step?.observation ?? "(no observation)");
  });
}

export async function runRxGuardAgent(images) {
  const imageList = Array.isArray(images) ? images.filter((image) => typeof image === "string" && image.trim()) : [];

  if (imageList.length === 0) {
    return {
      status: "manual_entry_required",
      drugs_detected: [],
      fda_summary: "",
      fda_raw_text: "",
      fda_warning: "",
    };
  }

  const imageIds = [];
  for (const img of imageList) {
    const id = nextImageId++;
    IMAGE_STORE.set(id, img);
    imageIds.push(id);
  }

  const executor = await getAgentExecutor();
  const agentInput = buildAgentInput(imageIds);
  const result = await executor.invoke({ input: agentInput });

  // Clean up IMAGE_STORE to prevent memory leaks
  for (const id of imageIds) {
    IMAGE_STORE.delete(id);
  }

  logIntermediateSteps(result?.intermediateSteps);

  const parsedOutput = extractJsonFromText(result?.output) ?? safeJsonParse(result?.output) ?? {};
  const normalizedOutput = normalizeFinalPayload(parsedOutput);

  if (normalizedOutput.status === "manual_entry_required") {
    return normalizedOutput;
  }

  const rawDrugs = normalizedOutput.drugs_detected;
  const fdaDataFromText = collectFdaRawText({ raw_texts: [], warning: normalizedOutput.fda_raw_text || normalizedOutput.fda_warning });

  return {
    status: "success",
    drugs_detected: rawDrugs,
    fda_summary: normalizedOutput.fda_summary,
    fda_raw_text: normalizedOutput.fda_raw_text || fdaDataFromText || "",
    fda_warning: normalizedOutput.fda_warning,
  };
}
