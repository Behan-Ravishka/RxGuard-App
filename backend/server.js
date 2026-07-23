import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";

import { ChatMistralAI } from "@langchain/mistralai";

import { createAgent } from "langchain";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";

import { prescriptionReaderTool } from "./tools/PrescriptionReader.js";
import { nameNormalizerTool } from "./tools/NameNormalizer.js";
import { fdaInteractionTool } from "./tools/FDAInteractionChecker.js";
import { fallbackData } from "./fallbackData.js";

function safeJsonParse(value) {
  if (typeof value !== "string") {
    return null;
  }

  const sanitizedOutput = value
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  if (!sanitizedOutput) {
    return null;
  }

  try {
    return JSON.parse(sanitizedOutput);
  } catch (error) {
    console.error(
      "[backend/server.js] Failed to parse agent JSON output:",
      error,
    );
    console.error("[backend/server.js] Raw agent output:", sanitizedOutput);
    return null;
  }
}

const llm = new ChatMistralAI({
  model: "mistral-small-latest",
  apiKey: process.env.MISTRAL_API_KEY,
  temperature: 0,
});

const app = express();
app.use(cors());
const upload = multer({ storage: multer.memoryStorage() });

const tools = [prescriptionReaderTool, nameNormalizerTool, fdaInteractionTool];

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",

    `
You are RxGuard Medical Safety Agent.

Follow these steps:

1. Call read_prescription_image.
2. Normalize every detected drug.
3. If two or more drugs exist call check_fda_interactions.
4. Return ONLY JSON.

Format:

{
"status":"",
"drugs_detected":[],
"fda_warning":""
}

No markdown.
`,
  ],

  ["human", "{input}"],

  new MessagesPlaceholder("agent_scratchpad"),
]);

const agent = createAgent({
  model: llm,
  tools,
  systemPrompt: `
You are RxGuard Medical Safety Agent.

Follow these steps:

1. Call read_prescription_image. (Read the ENTIRE prescription carefully.)
2. Normalize every detected drug.
3. If two or more drugs exist call check_fda_interactions.
4. Return ONLY JSON.

Requirements:

- Read every handwritten medicine and give all of them as output.
- Read from top to bottom.
- Include medicines even if handwriting is difficult.
- If confidence is low, include your best reading.
- Ignore dosage, frequency and instructions.
- Return ONLY medicine names.

Format:

{
"status":"",
"drugs_detected":[],
"fda_warning":""
}

No markdown.
`,
});

app.post("/api/analyze", upload.single("prescription"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const base64Image = req.file.buffer.toString("base64");
    const formattedImageString = `data:${req.file.mimetype};base64,${base64Image}`;

    // CRITICAL FIX 1: We save the giant image string to the server's global memory.
    // Now the PrescriptionReader tool can find it here.
    global.currentImageData = formattedImageString;
    global.currentImageMimeType = req.file.mimetype || "image/jpeg";

    console.log("Image received. Agent is analyzing...");

    const result = await agent.invoke({
      messages: [
        {
          role: "user",
          content:
            "I have uploaded a prescription image. Please read it, normalize the drugs, and check for FDA interactions.",
        },
      ],
    });

    // Clear the memory so the server doesn't get bloated over time.
    global.currentImageData = null;
    global.currentImageMimeType = null;

    console.log("Agent finished thinking.");

    const lastMessage = result.messages[result.messages.length - 1];

    const parsedData = safeJsonParse(lastMessage.content);

    if (!parsedData) {
      console.error(
        "[backend/server.js] Falling back because agent output was not valid JSON.",
      );
      return res.json(fallbackData);
    }

    res.json(parsedData);
  } catch (error) {
    global.currentImageData = null;
    global.currentImageMimeType = null;
    console.error(
      "[backend/server.js] CRITICAL ERROR ENCOUNTERED. Triggering Fallback Data.",
      error,
    );
    res.json(fallbackData);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`RxGuard Orchestrator is running on port ${PORT}`),
);
