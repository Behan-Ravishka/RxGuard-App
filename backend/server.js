import "dotenv/config";
import express from "express";
import cors from "cors";
import { runRxGuardAgent } from "./agents/rxGuardAnalyzer.js";
import { generateHealthInsights } from "./agents/insightGenerator.js";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Request logger to track incoming backend requests
app.use((req, _res, next) => {
  console.log(`[backend] ${req.method} ${req.url}`);
  next();
});

// Config Endpoint
app.get("/api/config", (_req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(503).json({
      error: "Supabase is not configured on the backend.",
    });
  }

  return res.json({ supabaseUrl, supabaseAnonKey });
});

// Prescription Scanning Agent Endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const imagesFromBody = Array.isArray(req.body?.images) ? req.body.images : req.body?.image ? [req.body.image] : [];
    if (imagesFromBody.length === 0) return res.status(400).json({ error: "No image uploaded" });

    console.log(`Processing ${imagesFromBody.length} image(s) with RxGuard Agent...`);
    const agentResult = await runRxGuardAgent(imagesFromBody);

    // Save scan results to scan_history if user is authenticated
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ") && agentResult.status === "success") {
      const token = authHeader.split(" ")[1];
      const supabaseUrl = process.env.SUPABASE_URL ?? "";
      const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";

      if (supabaseUrl && supabaseAnonKey) {
        // CRITICAL FIX: Pass the user's token in the global headers to bypass RLS
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        });
        
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (!authError && authData?.user) {
          const { error: dbError } = await supabase
            .from("scan_history")
            .insert({
              user_id: authData.user.id,
              drugs_detected: agentResult.drugs_detected || [],
              fda_warning: agentResult.fda_raw_text || agentResult.fda_warning || "",
              severity_level: agentResult.severity_level || "none"
            });

          if (dbError) {
            console.error("[backend] Error saving scan history:", dbError.message);
          } else {
            console.log(`[backend] Scan saved successfully for user: ${authData.user.id}`);
          }
        }
      }
    }

    res.json(agentResult);
  } catch (error) {
    console.error("[backend] Error in /api/analyze:", error);
    res.status(500).json({ status: "manual_entry_required", error: error.message });
  }
});

// Health Insights Agent Endpoint
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

    // CRITICAL FIX: Pass the user's token in the global headers
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized or invalid token" });
    }

    const { data: scans, error: dbError } = await supabase
      .from("scan_history")
      .select("drugs_detected")
      .eq("user_id", user.id);

    if (dbError) throw new Error(`Database error: ${dbError.message}`);

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

    const allDrugs = scans.reduce((acc, scan) => acc.concat(Array.isArray(scan.drugs_detected) ? scan.drugs_detected : []), []);
    const uniqueDrugs = [...new Set(allDrugs)].filter(Boolean);

    if (uniqueDrugs.length === 0) {
      return res.json({ status: "success", insights: [{ title: "Insights Processing", description: "Still analyzing...", icon: "Brain", color: "indigo" }] });
    }

    const insightsResult = await generateHealthInsights(uniqueDrugs);
    res.json(insightsResult);
  } catch (error) {
    console.error("[backend] Error in /api/insights:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// JSON 404 Fallback - Ensures Express NEVER sends HTML for missing routes
app.use((req, res) => {
  res.status(404).json({ error: `Route not found on backend: ${req.method} ${req.url}` });
});

// Global Error Handler - Ensures internal errors return JSON instead of HTML
app.use((err, _req, res, _next) => {
  console.error("[backend] Global error caught:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;

if (process.env.VERCEL !== "1") {
  app.listen(PORT, "0.0.0.0", () =>
    console.log(`RxGuard Orchestrator is running on http://127.0.0.1:${PORT}`),
  );
}

export default app;