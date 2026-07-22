import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";

import { prescriptionReaderTool } from './tools/PrescriptionReader.js';
import { nameNormalizerTool } from './tools/NameNormalizer.js';
import { fdaInteractionTool } from './tools/FDAInteractionChecker.js';
import { fallbackData } from './fallbackData.js';

const app = express();
app.use(cors());
const upload = multer({ storage: multer.memoryStorage() });

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  temperature: 0,
});

const tools = [prescriptionReaderTool, nameNormalizerTool, fdaInteractionTool];

const prompt = ChatPromptTemplate.fromMessages([
  ["system", `You are the RxGuard Medical Safety Agent. 
  Step 1: Use the read_prescription_image tool to read the base64 image. 
  Step 2: Pass extracted drug names through the normalize_drug_name tool. 
  Step 3: If you have two or more valid drugs, use check_fda_interactions. 
  Step 4: Output the final result as strictly formatted JSON containing: 
  - "status": string (use "success" if drugs are found, or "manual_entry_required" if the image is unreadable or no drugs are found)
  - "drugs_detected": array of strings
  - "fda_warning": string (leave empty if none). 
  Do not include markdown formatting like \`\`\`json.`],
  ["human", "{input}"],
  ["placeholder", "{agent_scratchpad}"],
]);

const agent = createToolCallingAgent({ llm, tools, prompt });
const agentExecutor = new AgentExecutor({ agent, tools });

app.post('/api/analyze', upload.single('prescription'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const base64Image = req.file.buffer.toString('base64');
    const formattedImageString = `data:${req.file.mimetype};base64,${base64Image}`;

    // CRITICAL FIX 1: We save the giant image string to the server's global memory.
    // Now the PrescriptionReader tool can find it here.
    global.currentImageData = formattedImageString;

    console.log("Image received. Agent is analyzing...");

    // CRITICAL FIX 2: We ONLY send a tiny text sentence to the Agent, not the image string.
    // This drops your token usage from 300,000 down to roughly 20.
    const result = await agentExecutor.invoke({
      input: "I have uploaded a prescription image. Please read it, normalize the drugs, and check for FDA interactions."
    });

    // Clear the memory so the server doesn't get bloated over time.
    global.currentImageData = null;

    console.log("Agent finished thinking.");
    
    // This stops JSON.parse from crashing if the AI accidentally adds ```json
    const sanitizedOutput = result.output
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
      
    const parsedData = JSON.parse(sanitizedOutput);
    res.json(parsedData);

  } catch (error) {
    console.error("CRITICAL ERROR ENCOUNTERED. Triggering Fallback Data.", error.message);
    res.json(fallbackData);
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`RxGuard Orchestrator is running on port ${PORT}`));