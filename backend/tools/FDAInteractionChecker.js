import { DynamicTool } from "@langchain/core/tools";

export const fdaInteractionTool = new DynamicTool({
  name: "check_fda_interactions",
  description: "Checks the official FDA database for interactions between TWO drugs. Input MUST be exactly two drug names separated by a comma (e.g., 'Aspirin, Warfarin').",
  func: async (input) => {
    try {
      // 1. Split the string into two separate drug names
      const drugs = input.split(',').map(drug => drug.trim());
      if (drugs.length !== 2) {
        return "Error: You must provide exactly two drug names.";
      }
      
      const drug1 = drugs[0];
      const drug2 = drugs[1];
      
      // 2. Structure the exact URL the government API requires
      const url = `https://api.fda.gov/drug/label.json?search=drug_interactions:"${drug1}"+AND+drug_interactions:"${drug2}"&limit=1`;
      
      // 3. Fetch the data from the openFDA database
      const response = await fetch(url);
      
      // 4. Handle the specific "No Results" scenario
      if (!response.ok) {
        // openFDA uniquely returns a 404 Not Found if there is no interaction warning, 
        // rather than returning an empty list. We must catch this so the app doesn't crash.
        if (response.status === 404) {
          return `No specific FDA interaction warnings found between ${drug1} and ${drug2}.`;
        }
        throw new Error(`API returned status ${response.status}`);
      }
      
      // 5. Parse the JSON and return the exact warning text
      const data = await response.json();
      const warningText = data.results[0].drug_interactions[0];
      
      return `FDA Warning: ${warningText}`;

    } catch (error) {
      console.error("FDA API Error:", error);
      return `Failed to fetch FDA data: ${error.message}`;
    }
  }
});