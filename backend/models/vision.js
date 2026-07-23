import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error("[backend/models/vision.js] Missing GOOGLE_API_KEY in environment.");
}

export const visionClient = new GoogleGenAI({
        apiKey
});