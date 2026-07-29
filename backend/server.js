import "dotenv/config";
import express from "express";
import cors from "cors";
import { runRxGuardAgent } from "./agents/rxGuardAnalyzer.js";
import { generateHealthInsights } from "./agents/insightGenerator.js";
import { createClient } from "@supabase/supabase-js";
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
      "[backend/server.js] CRITICAL ERROR ENCOUNTERED.",
      error,
    );
    res.json({
      status: "manual_entry_required",
      drugs_detected: [],
      fda_summary: "",
      fda_raw_text: "",
      fda_warning: "",
      error: error.message || "An unknown error occurred during analysis."
    });
  }
});

app.get("/api/insights", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }
    const token = authHeader.split(" ")[1];
    
    const supabaseUrl = process.env.SUPABASE_URL ?? "";
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(503).json({ error: "Supabase is not configured on the backend." });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized or invalid token" });
    }

    const { data: scans, error: dbError } = await supabase
      .from("scan_history")
      .select("drugs_detected")
      .eq("user_id", user.id);

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!scans || scans.length === 0) {
      return res.json({
        status: "success",
        insights: [
          {
            title: "No Scans Yet",
            description: "Scan your first prescription to start receiving personalized health insights and preventative care tips.",
            icon: "Sparkles",
            color: "purple"
          }
        ]
      });
    }

    const allDrugs = scans.reduce((acc, scan) => {
      if (Array.isArray(scan.drugs_detected)) {
        return acc.concat(scan.drugs_detected);
      }
      return acc;
    }, []);

    const uniqueDrugs = [...new Set(allDrugs)].filter(Boolean);

    if (uniqueDrugs.length === 0) {
      return res.json({
        status: "success",
        insights: [
          {
            title: "Insights Processing",
            description: "We are still analyzing your scanned medications. Check back soon for your personalized preventative health tips.",
            icon: "Brain",
            color: "indigo"
          }
        ]
      });
    }

    const insightsResult = await generateHealthInsights(uniqueDrugs);
    res.json(insightsResult);
  } catch (error) {
    console.error("[backend/server.js] Error in /api/insights:", error);
    res.status(500).json({ error: "Internal server error" });
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
