import "dotenv/config";
import express from "express";
import cors from "cors";
import { runRxGuardAgent } from "./agents/rxGuardAnalyzer.js";
import { generateHealthInsights } from "./agents/insightGenerator.js";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Helper function to validate and normalize a drug against RxNorm / openFDA
async function validateAndNormalizeDrug(drugName) {
  const trimmed = drugName.trim();
  if (!trimmed) return null;

  try {
    // Check openFDA first
    const fdaUrl = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(trimmed)}"+openfda.generic_name:"${encodeURIComponent(trimmed)}"+"${encodeURIComponent(trimmed)}"&limit=1`;
    const fdaRes = await fetch(fdaUrl);

    if (fdaRes.ok) {
      const fdaData = await fdaRes.json();
      const openfda = fdaData.results?.[0]?.openfda;
      const verifiedName = openfda?.brand_name?.[0] || openfda?.generic_name?.[0] || trimmed;
      const warnings = fdaData.results?.[0]?.warnings?.[0] || fdaData.results?.[0]?.boxed_warning?.[0] || "";
      return { original: trimmed, normalized: verifiedName, warnings, isValid: true };
    }

    // Fallback to NIH RxNorm spellings double-check
    const rxNormUrl = `https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${encodeURIComponent(trimmed)}`;
    const rxRes = await fetch(rxNormUrl);
    if (rxRes.ok) {
      const rxData = await rxRes.json();
      const suggestions = rxData.suggestionGroup?.suggestionList?.suggestion || [];
      if (suggestions.length > 0) {
        return { original: trimmed, normalized: suggestions[0], warnings: "", isValid: true };
      }
    }
  } catch (err) {
    console.error(`[backend] Validation error for ${trimmed}:`, err.message);
  }

  // Return formatted original if APIs are unreachable
  return { original: trimmed, normalized: trimmed.charAt(0).toUpperCase() + trimmed.slice(1), warnings: "", isValid: true };
}

// Config Endpoint
app.get("/api/config", (_req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(503).json({ error: "Supabase is not configured on the backend." });
  }
  return res.json({ supabaseUrl, supabaseAnonKey });
});

// Prescription Scanning Endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const imagesFromBody = Array.isArray(req.body?.images) ? req.body.images : req.body?.image ? [req.body.image] : [];
    if (imagesFromBody.length === 0) return res.status(400).json({ error: "No image uploaded" });

    const agentResult = await runRxGuardAgent(imagesFromBody);

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ") && agentResult.status === "success") {
      const token = authHeader.split(" ")[1];
      const supabaseUrl = process.env.SUPABASE_URL ?? "";
      const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";

      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        });
        
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          await supabase.from("scan_history").insert({
            user_id: authData.user.id,
            drugs_detected: agentResult.drugs_detected || [],
            fda_warning: agentResult.fda_raw_text || agentResult.fda_warning || "",
            severity_level: agentResult.severity_level || "none"
          });
        }
      }
    }

    res.json(agentResult);
  } catch (error) {
    console.error("[backend] Error in /api/analyze:", error);
    res.status(500).json({ status: "manual_entry_required", error: error.message });
  }
});

// Dynamic Manual Entry Analysis & Database Sync Endpoint
app.post("/api/analyze-manual", async (req, res) => {
  try {
    const { drugs } = req.body;
    if (!drugs || !Array.isArray(drugs) || drugs.length === 0) {
      return res.status(400).json({ error: "Invalid payload. Array of drug names required." });
    }

    console.log(`[backend] Validating manual drugs against openFDA/RxNorm:`, drugs);

    // 1. Double-check and normalize all user inputs against FDA / RxNorm APIs
    const validatedResults = await Promise.all(drugs.map(drug => validateAndNormalizeDrug(drug)));
    const cleanValidated = validatedResults.filter(Boolean);

    const normalizedDrugNames = [...new Set(cleanValidated.map(item => item.normalized))];
    const warningsList = cleanValidated.filter(item => item.warnings).map(w => `${w.normalized.toUpperCase()}: ${w.warnings}`);

    const combinedWarningText = warningsList.join("\n\n");

    const agentResult = {
      status: "success",
      drugs_detected: normalizedDrugNames,
      severity_level: warningsList.length > 0 ? "moderate" : "low",
      fda_summary: `Validated ${normalizedDrugNames.length} drug(s) with openFDA & RxNorm repositories.`,
      fda_raw_text: combinedWarningText || "No critical boxed warnings recorded for these verified medications.",
      fda_warning: combinedWarningText ? "FDA Warnings detected. Please review." : "No immediate drug contraindications recorded."
    };

    // 2. Save ONLY verified/normalized drug names to Supabase
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const supabaseUrl = process.env.SUPABASE_URL ?? "";
      const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";

      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        });
        
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          await supabase.from("scan_history").insert({
            user_id: authData.user.id,
            drugs_detected: normalizedDrugNames, // Store clean normalized names
            fda_warning: agentResult.fda_warning,
            severity_level: agentResult.severity_level
          });
        }
      }
    }

    return res.json(agentResult);
  } catch (error) {
    console.error("[backend] Error in /api/analyze-manual:", error);
    res.status(500).json({ error: "Failed to perform dynamic drug analysis." });
  }
});

// Health Insights Endpoint
app.get("/api/insights", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization header" });
    }
    const token = authHeader.split(" ")[1];
    const supabaseUrl = process.env.SUPABASE_URL ?? "";
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(503).json({ error: "Supabase missing on backend." });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    const { data: scans, error: dbError } = await supabase
      .from("scan_history")
      .select("drugs_detected")
      .eq("user_id", user.id);

    if (dbError) throw new Error(dbError.message);

    const allDrugs = scans.reduce((acc, scan) => acc.concat(Array.isArray(scan.drugs_detected) ? scan.drugs_detected : []), []);
    const uniqueDrugs = [...new Set(allDrugs)].filter(Boolean);

    if (uniqueDrugs.length === 0) {
      return res.json({
        status: "success",
        insights: [{ title: "No Scans Yet", description: "Scan or enter medications to generate insights.", icon: "Sparkles", color: "purple" }]
      });
    }

    const insightsResult = await generateHealthInsights(uniqueDrugs);
    res.json(insightsResult);
  } catch (error) {
    console.error("[backend] Error in /api/insights:", error);
    res.status(500).json({ error: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
});

const PORT = process.env.PORT || 5000;
if (process.env.VERCEL !== "1") {
  app.listen(PORT, "0.0.0.0", () =>
    console.log(`RxGuard Backend running on http://127.0.0.1:${PORT}`)
  );
}

export default app;