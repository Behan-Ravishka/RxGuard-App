import { DynamicTool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// 1. Initialize the AI Model
const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-1.5-flash",
  temperature: 0, // 0 means be strictly factual, no creativity
});

// 2. Define the exact instructions for the AI
const SYSTEM_PROMPT = `
  You are a deterministic OCR reader. Extract the drug names from the image. 
  Output only valid JSON with the key 'drugs' containing an array of strings. 
  Do not invent names. If unreadable, output an empty array.
`;

// 3. Create the Tool for the Agent to use
export const prescriptionReaderTool = new DynamicTool({
  name: "read_prescription_image",
  description: "Use this tool to extract drug names from an uploaded prescription image.",
  func: async (base64Image) => {
    // This is where we will eventually send the image and prompt to the model.
    // For today, we are just setting up the structure.
    console.log("AI Tool triggered!");
    return "Tool is ready to be connected.";
  },
});