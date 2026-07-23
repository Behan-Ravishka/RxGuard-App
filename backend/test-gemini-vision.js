import 'dotenv/config';
import fs from 'fs';
import { visionClient } from './models/vision.js';

async function run() {
  const imagePath = process.argv[2];

  if (!imagePath) {
    console.error('Usage: node test-gemini-vision.js <image-path>');
    process.exit(1);
  }

  const imageBytes = fs.readFileSync(imagePath);
  const base64Image = imageBytes.toString('base64');

  try {
    const response = await visionClient.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'Return only JSON with the key drugs and do not guess.'
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }
      ]
    });

    const output = typeof response?.text === 'string'
      ? response.text
      : typeof response?.text === 'function'
        ? await response.text()
        : JSON.stringify(response, null, 2);

    console.log(output);
  } catch (error) {
    console.error('[backend/test-gemini-vision.js] Gemini vision test failed:', error);
    process.exit(1);
  }
}

run();