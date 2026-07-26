import "dotenv/config";
import express from "express";
import cors from "cors";
import { visionClient } from "./models/vision.js";

import { nameNormalizerTool } from "./tools/NameNormalizer.js";
import { fdaInteractionTool } from "./tools/FDAInteractionChecker.js";
import { fallbackData } from "./fallbackData.js";

function safeJsonParse(value) {
  if (typeof value !== "string") {
    return null;
  }

  const sanitizedOutput = value
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  if (!sanitizedOutput) {
    return null;
  }

  try {
    return JSON.parse(sanitizedOutput);
  } catch (error) {
    console.error(
      "[backend/server.js] Failed to parse agent JSON output:",
      error,
    );
    console.error("[backend/server.js] Raw agent output:", sanitizedOutput);
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

async function readPrescriptionImage(image) {
  const parsedImage = parseImageInput(image);

  if (!parsedImage) {
    return [];
  }

  const response = await visionClient.models.generateContent({
    model: "gemini-3.1-flash-lite",
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

Format:

{
 "drugs":[]
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

  return extractDrugList(parsedResponse);
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

async function summarizeFdaInteraction({ rawText, drugs }) {
  if (!rawText.trim()) {
    return {
      fda_summary:
        "No known adverse interactions were returned by the openFDA data for these medications.",
      fda_raw_text: "",
    };
  }

  const response = await visionClient.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
You are RxGuard's medication safety explainer.

Write a short, patient-friendly FDA interaction summary in JSON.

Rules:
- Use plain language.
- Write exactly 2 to 3 sentences.
- Keep the meaning medically accurate.
- Do not mention that you are an AI.
- Return ONLY JSON.
- Include both fields below.
- The fda_raw_text field must be copied exactly from the source text provided.

Drugs involved: ${drugs.join(", ")}

Source text:
${rawText}

Format:
{
  "fda_summary": "",
  "fda_raw_text": ""
}
`,
          },
        ],
      },
    ],
  });

  const parsedSummary = safeJsonParse(response.text) || {};

  return {
    fda_summary:
      typeof parsedSummary.fda_summary === "string" && parsedSummary.fda_summary.trim()
        ? parsedSummary.fda_summary.trim()
        : "No known adverse interactions were returned by the openFDA data for these medications.",
    fda_raw_text: rawText,
  };
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.post("/api/analyze", async (req, res) => {
  try {
    const imagesFromBody = Array.isArray(req.body?.images)
      ? req.body.images
      : req.body?.image
        ? [req.body.image]
        : [];

    if (imagesFromBody.length === 0) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    console.log(`Image batch received. Processing ${imagesFromBody.length} image(s)...`);

    const imageDrugGroups = await Promise.all(
      imagesFromBody.map(async (image) => {
        try {
          return await readPrescriptionImage(image);
        } catch (error) {
          console.error("[backend/server.js] Vision OCR failed for one image:", error);
          return [];
        }
      }),
    );

    const masterRawDrugs = dedupeDrugList(imageDrugGroups.flat());

    if (masterRawDrugs.length === 0) {
      return res.json({
        status: "manual_entry_required",
        drugs_detected: [],
        fda_warning: "",
      });
    }

    const normalizedDrugResults = await Promise.all(
      masterRawDrugs.map(async (drugName) => {
        try {
          const normalizedResponse = await nameNormalizerTool.func(drugName);
          const normalizedData = safeJsonParse(normalizedResponse);
          const normalizedName = normalizedData?.normalized_name;

          return typeof normalizedName === "string" && normalizedName.trim()
            ? normalizedName.trim()
            : drugName;
        } catch (error) {
          console.error("[backend/server.js] Drug normalization failed:", error);
          return drugName;
        }
      }),
    );

    const masterNormalizedDrugs = dedupeDrugList(normalizedDrugResults);

    const fdaResponse = await fdaInteractionTool.func(masterNormalizedDrugs);
    const fdaData = safeJsonParse(fdaResponse) || {};
    const fdaRawText = collectFdaRawText(fdaData);
    const summarizedFda = await summarizeFdaInteraction({
      rawText: fdaRawText,
      drugs: masterNormalizedDrugs,
    });

    res.json({
      status: "success",
      drugs_detected: masterNormalizedDrugs,
      fda_summary: summarizedFda.fda_summary,
      fda_raw_text: summarizedFda.fda_raw_text,
      fda_warning: summarizedFda.fda_summary,
      fda_report: fdaData,
    });
  } catch (error) {
    console.error(
      "[backend/server.js] CRITICAL ERROR ENCOUNTERED. Triggering Fallback Data.",
      error,
    );
    res.json(fallbackData);
  }
});


// module.exports = app;

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
console.log(`RxGuard Orchestrator is running on port ${PORT}`),
);
