import { DynamicTool } from "@langchain/core/tools";

export const fdaInteractionTool = new DynamicTool({
  name: "check_fda_interactions",
  description:
    "Checks the official FDA database for interactions between TWO drugs. Input MUST be exactly two drug names separated by a comma (e.g., 'Aspirin, Warfarin').",
  func: async (input) => {
    try {
      const rawInput = typeof input === "string" ? input : "";
      const drugs = rawInput
        .split(",")
        .map((drug) => drug.trim())
        .filter(Boolean);

      if (drugs.length !== 2) {
        return JSON.stringify({
          success: false,
          drugs,
          warning: "You must provide exactly two drug names.",
        });
      }

      const drug1 = drugs[0];
      const drug2 = drugs[1];

      const url = `https://api.fda.gov/drug/label.json?search=drug_interactions:"${drug1}"+AND+drug_interactions:"${drug2}"&limit=1`;

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          return JSON.stringify({
            success: true,
            drugs: [drug1, drug2],
            warning: "",
            message: `No specific FDA interaction warnings found between ${drug1} and ${drug2}.`,
          });
        }
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      const warningText = data?.results?.[0]?.drug_interactions?.[0] ?? "";

      return JSON.stringify({
        success: true,
        drugs: [drug1, drug2],
        warning: warningText,
        message: warningText
          ? `FDA Warning: ${warningText}`
          : "No interaction warning text was returned.",
      });
    } catch (error) {
      console.error(
        "[backend/tools/FDAInteractionChecker.js] FDA API Error:",
        error,
      );
      return JSON.stringify({
        success: false,
        warning: "",
        error: error?.message ?? "Unknown FDA API error",
      });
    }
  },
});
