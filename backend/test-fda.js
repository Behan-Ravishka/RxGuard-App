import { fdaInteractionTool } from './tools/FDAInteractionChecker.js';

async function runTest() {
  console.log("Checking openFDA for Warfarin and Aspirin...");
  
  try {
    // LangChain tools use the .invoke() method to run their internal logic
    const result = await fdaInteractionTool.invoke("Warfarin, Aspirin");
    
    console.log("\n--- FDA RESPONSE ---");
    console.log(result);
    console.log("--------------------\n");
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

runTest();