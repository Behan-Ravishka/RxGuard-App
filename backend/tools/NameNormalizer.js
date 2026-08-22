import { DynamicTool } from "@langchain/core/tools";

export const nameNormalizerTool = new DynamicTool({
  name: "normalize_drug_name",
  description:
    "Always use this to check the spelling and validity of a drug name. Input should be a single drug name string.",
  func: async (drugName) => {
    try {
      const inputName = typeof drugName === "string" ? drugName.trim() : "";

      if (!inputName) {
        return JSON.stringify({
          normalized_name: null,
          score: 0,
          error: "Empty drug name provided",
        });
      }

      // Read from environment variables, fallback to localhost
      const PYTHON_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8000";
      
      // Prevent Langchain from hanging infinitely if Python server stalls
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6-second timeout

      const response = await fetch(`${PYTHON_URL}/normalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: inputName }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return JSON.stringify({
        normalized_name: data.normalized_name ?? inputName,
        score: typeof data.score === "number" ? data.score : null,
        source: data.source || "none",
        is_correction: data.is_correction ?? false,
        input: inputName,
        success: Boolean(data.normalized_name),
      });

    } catch (error) {
      console.error("[NameNormalizer.js] Tool Error:", error.message);
      
      // Return a graceful failure so the LLM doesn't completely crash
      return JSON.stringify({
        normalized_name: typeof drugName === "string" ? drugName.trim() : null,
        score: null,
        error: error.name === 'AbortError' ? "Request timed out" : "Python normalizer service is unreachable",
      });
    }
  },
});