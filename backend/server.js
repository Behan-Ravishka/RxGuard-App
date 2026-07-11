import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';

// 1. Load the secret variables from the .env file
dotenv.config();

// 2. Initialize the Express web server
const app = express();

// 3. Configure CORS (Cross-Origin Resource Sharing)
app.use(cors());

// 4. Configure Multer to hold uploaded files in memory (RAM)
const upload = multer({ storage: multer.memoryStorage() });

// 5. Create a route to accept the image
app.post('/api/analyze', upload.single('prescription'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }
    
    // For now, we just acknowledge we received the file.
    // We will connect the LangChain tool here later.
    console.log("Image received! Size:", req.file.size);
    res.json({ message: "File received successfully" });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// 6. Turn the server on
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});