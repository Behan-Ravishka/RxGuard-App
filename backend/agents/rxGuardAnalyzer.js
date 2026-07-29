import { DynamicTool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { visionClient } from "../models/vision.js";

const DEFAULT_AGENT_MODEL = process.env.GEMINI_AGENT_MODEL || "gemini-2.5-flash";
const DEFAULT_VISION_MODEL = process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash";
const PYTHON_NORMALIZER_URL =
  process.env.PYTHON_NORMALIZER_URL ||
  process.env.PYTHON_URL ||
  "http://127.0.0.1:8000";
const FDA_API_BASE_URL = process.env.FDA_API_BASE_URL || "https://api.fda.gov";

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
  const dataUrlMatch = trimmedImage.match(/^data:([^;]+);base64,(.*)$/s);

  if (dataUrlMatch) {
    return {
      mimeType: dataUrlMatch[1] || "image/jpeg",
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

export const visionOcrTool = new DynamicTool({
  name: "vision_ocr_tool",
  description:
    "Use this first. Input must be a single base64 prescription image string. Extract handwritten or printed medication names from the image.",
  func: async (input) => {
    try {
      const parsedImage = parseImageInput(input);

      if (!parsedImage) {
        return JSON.stringify({
          success: false,
          drugs_detected: [],
          manual_entry_required: true,
          raw_text: "",
          error: "No valid image provided",
        });
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
      const drugsDetected = dedupeDrugList(extractDrugList(parsedResponse));

      return JSON.stringify({
        success: true,
        drugs_detected: drugsDetected,
        manual_entry_required: drugsDetected.length === 0,
        raw_text: typeof response.text === "string" ? response.text : "",
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

let agentExecutorPromise;

async function getAgentExecutor() {
  if (!agentExecutorPromise) {
    const llm = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: DEFAULT_AGENT_MODEL,
      temperature: 0,
      maxRetries: 2,
    });

    const tools = [visionOcrTool, nameNormalizerTool, fdaDatabaseTool];

    agentExecutorPromise = initializeAgentExecutorWithOptions(tools, llm, {
      agentType: "zero-shot-react-description",
      verbose: true,
      returnIntermediateSteps: true,
      maxIterations: 6,
      handleParsingErrors: true,
    });
  }

  return agentExecutorPromise;
}

function buildAgentInput(images) {
  return `You are the RxGuard Medical Safety Autonomous Agent.
Your job is to analyze prescription images, normalize the extracted drug names, and check them against FDA databases for dangerous interactions.

You must use your tools in a logical sequence.
Thought Process:
1. First, use the vision_ocr_tool to read the image.
2. Second, use the name_normalizer_tool to correct the spelling of the extracted drugs. Do not skip this step.
3. Third, use the fda_database_tool to check the normalized drugs for interactions.
4. Finally, synthesize the results into a final report.

Output requirements:
- Do not output conversational text.
- Return only strict JSON.
- Use this exact schema:
{
  "status": "success",
  "drugs_detected": ["Aspirin", "Warfarin"],
  "fda_summary": "Major interaction found. Increased risk of bleeding...",
  "fda_raw_text": "[Full text from openFDA API]",
  "fda_warning": "CONTRAINDICATED"
}
- If nothing readable is found, return:
{
  "status": "manual_entry_required",
  "drugs_detected": [],
  "fda_summary": "",
  "fda_raw_text": "",
  "fda_warning": ""
}

Prescription images JSON array:
${JSON.stringify(images)}
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

  const executor = await getAgentExecutor();
  const agentInput = buildAgentInput(imageList);
  const result = await executor.invoke({ input: agentInput });

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
