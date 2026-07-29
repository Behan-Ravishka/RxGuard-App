import "dotenv/config";
import express from "express";
import cors from "cors";
import { runRxGuardAgent } from "./agents/rxGuardAnalyzer.js";
import { fallbackData } from "./fallbackData.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.get("/api/config", (_req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(503).json({
      error: "Supabase is not configured on the backend.",
    });
  }

  return res.json({
    supabaseUrl,
    supabaseAnonKey,
  });
});

app.post("/api/analyze", async (req, res) => {
  try {
    const imagesFromBody = Array.isArray(req.body?.images)
      ? req.body.images
      : req.body?.image
        ? [req.body.image]
        : [];

    if (imagesFromBody.length === 0) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    console.log(`Image batch received. Processing ${imagesFromBody.length} image(s) with RxGuard Agent...`);

    const agentResult = await runRxGuardAgent(imagesFromBody);

    res.json({
      ...agentResult,
    });
  } catch (error) {
    console.error(
      "[backend/server.js] CRITICAL ERROR ENCOUNTERED. Triggering Fallback Data.",
      error,
    );
    res.json(fallbackData);
  }
});


// module.exports = app;

const PORT = process.env.PORT || 3000;

if (process.env.VERCEL !== "1") {
  app.listen(PORT, () =>
    console.log(`RxGuard Orchestrator is running on port ${PORT}`),
  );
}

export default app;
