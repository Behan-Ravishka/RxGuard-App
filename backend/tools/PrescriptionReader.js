import { DynamicTool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";

const visionModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash", // or 2.5-flash
  temperature: 0,
});

export const prescriptionReaderTool = new DynamicTool({
  name: "read_prescription_image",
  description: "Use this tool to extract drug names from the uploaded prescription image. You do not need to provide any input arguments to this tool.",
  func: async () => {
    try {
      // Grab the image from the server's temporary memory
      const base64Image = global.currentImageData; 
      
      if (!base64Image) return '{"drugs": []}';

      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
      
      const message = new HumanMessage({
        content: [
          { 
            type: "text", 
            text: "You are a deterministic OCR reader. Extract the drug names from the image. Output only valid JSON with the key 'drugs' containing an array of strings. Do not invent names. If unreadable, output an empty array." 
          },
          { 
            type: "image_url", 
            image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } 
          }
        ]
      });

      const response = await visionModel.invoke([message]);
      return response.content;
    } catch (error) {
      console.error("OCR Error:", error);
      return '{"drugs": []}';
    }
  }
});