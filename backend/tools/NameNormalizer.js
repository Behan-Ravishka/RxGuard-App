import { DynamicTool } from "@langchain/core/tools";

export const nameNormalizerTool = new DynamicTool({
  name: "normalize_drug_name",
  description:
    "Always use this to correct the spelling of a drug name. Input should be a single drug name string.",
  func: async (drugName) => {
    try {
      const inputName = typeof drugName === "string" ? drugName.trim() : "";

      if (!inputName) {
        return JSON.stringify({
          normalized_name: null,
          score: 0,
          error: "Empty drug name",
        });
      }

      const response = await fetch("http://127.0.0.1:8000/normalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: inputName }),
      });

      const data = await response.json();

      return JSON.stringify({
        normalized_name: data.normalized_name ?? null,
        score: typeof data.score === "number" ? data.score : null,
        input: inputName,
        success: Boolean(data.normalized_name),
      });
    } catch (error) {
      console.error(
        "[backend/tools/NameNormalizer.js] Normalizer Error:",
        error,
      );
      return JSON.stringify({
        normalized_name: null,
        score: null,
        error: "Python normalizer service is unreachable",
      });
    }
  },
});
