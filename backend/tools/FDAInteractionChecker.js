import { DynamicTool } from "@langchain/core/tools";

function normalizeDrugList(input) {
  if (Array.isArray(input)) {
    return input
      .map((drug) => (typeof drug === "string" ? drug.trim() : ""))
      .filter(Boolean);
  }

  if (typeof input !== "string") {
    return [];
  }

  return input
    .split(",")
    .map((drug) => drug.trim())
    .filter(Boolean);
}

function createDrugPairs(drugs) {
  const pairs = [];

  for (let index = 0; index < drugs.length; index += 1) {
    for (let innerIndex = index + 1; innerIndex < drugs.length; innerIndex += 1) {
      pairs.push([drugs[index], drugs[innerIndex]]);
    }
  }

  return pairs;
}

export const fdaInteractionTool = new DynamicTool({
  name: "check_fda_interactions",
  description:
    "Checks the official FDA database for interactions between two or more drugs.",
  func: async (input) => {
    try {
      const drugs = Array.from(new Set(normalizeDrugList(input)));

      if (drugs.length < 2) {
        return JSON.stringify({
          success: true,
          drugs,
          warning: "",
          message: "Not enough medications were detected to check for interactions.",
        });
      }

      const pairs = createDrugPairs(drugs);

      const pairResults = await Promise.all(
        pairs.map(async ([drug1, drug2]) => {
          const url = `https://api.fda.gov/drug/label.json?search=drug_interactions:"${drug1}"+AND+drug_interactions:"${drug2}"&limit=1`;

          try {
            const response = await fetch(url);

            if (!response.ok) {
              if (response.status === 404) {
                return {
                  drugs: [drug1, drug2],
                  warning: "",
                };
              }

              throw new Error(`API returned status ${response.status}`);
            }

            const data = await response.json();
            const warningText = data?.results?.[0]?.drug_interactions?.[0] ?? "";

            return {
              drugs: [drug1, drug2],
              raw_text: warningText,
            };
          } catch (error) {
            console.error(
              "[backend/tools/FDAInteractionChecker.js] FDA pair check failed:",
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
