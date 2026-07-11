import { DynamicTool } from "@langchain/core/tools";

export const nameNormalizerTool = new DynamicTool({
  name: "normalize_drug_name",
  description: "Always use this to correct the spelling of a drug name. Input should be a single drug name string.",
  func: async (drugName) => {
    try {
      // We use fetch to send an HTTP request to our Python server
      const response = await fetch("http://127.0.0.1:8000/normalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: drugName })
      });
      
      const data = await response.json();
      
      if (data.normalized_name) {
        return `Success. The correct spelling is: ${data.normalized_name}`;
      } else {
        return `Failed. Could not find a confident match for ${drugName}.`;
      }
    } catch (error) {
      return "Error: Python normalizer service is unreachable.";
    }
  }
});