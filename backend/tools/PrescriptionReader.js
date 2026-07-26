import { DynamicTool } from "@langchain/core/tools";
import { visionClient } from "../models/vision.js";

function extractDrugs(value) {
  if (typeof value !== "string") {
    return [];
  }

  const sanitizedOutput = value
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  if (!sanitizedOutput) {
    return [];
  }

  try {
    const parsed = JSON.parse(sanitizedOutput);
    const drugs = Array.isArray(parsed.drugs) ? parsed.drugs : [];

    return drugs
      .map((drug) => (typeof drug === "string" ? drug.trim() : ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}

export const prescriptionReaderTool = new DynamicTool({
  name: "read_prescription_image",

  description: "Extract medicine names from uploaded prescription image.",

  func: async () => {
    try {
      const base64Image = global.currentImageData;

      if (!base64Image) {
        return JSON.stringify({
          drugs: [],
        });
      }

      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

      const response = await visionClient.models.generateContent({
        model: "gemini-3.1-flash-lite",

        contents: [
          {
            role: "user",

            parts: [
              {
                text: `
Extract medicine names.

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
                  mimeType: global.currentImageMimeType || "image/jpeg",

                  data: cleanBase64,
                },
              },
            ],
          },
        ],
      });

      console.log("===== DETECTED DRUGS =====");
      console.log(response.text);
      console.log("=============================");

      global.currentDetectedDrugs = extractDrugs(response.text);

      return response.text;
    } catch (error) {
      console.error("Vision Error:", error);

      global.currentDetectedDrugs = [];

      return JSON.stringify({
        drugs: [],
      });
    }
  },
});
