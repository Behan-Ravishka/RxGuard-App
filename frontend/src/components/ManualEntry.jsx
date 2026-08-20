import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, Pill, Search, Plus, Trash2, Loader2 } from "lucide-react";
import { useSupabaseClient } from "../supabaseClient.jsx";

export default function ManualEntry() {
  const navigate = useNavigate();
  const { session } = useSupabaseClient();

  const [drugs, setDrugs] = useState([
    { id: 1, name: "", suggestion: null },
    { id: 2, name: "", suggestion: null },
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const updateDrug = useCallback((id, updates) => {
    setDrugs((prev) =>
      prev.map((drug) => (drug.id === id ? { ...drug, ...updates } : drug)),
    );
  }, []);

  const fetchSuggestion = useCallback(
    async (text, id) => {
      if (text.trim().length < 2) {
        updateDrug(id, { suggestion: null });
        return;
      }
      try {
        const PYTHON_URL =
          import.meta.env.VITE_PYTHON_URL || "http://localhost:8000";
        const token = session?.access_token;

        const res = await fetch(
          `${PYTHON_URL}/normalize?drug_name=${encodeURIComponent(text.trim())}`,
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        );

        if (res.ok) {
          const data = await res.json();
          if (
            data.normalized_name &&
            data.normalized_name.toLowerCase() !== text.toLowerCase()
          ) {
            updateDrug(id, { suggestion: data.normalized_name });
          } else {
            updateDrug(id, { suggestion: null });
          }
        }
      } catch {
        updateDrug(id, { suggestion: null });
      }
    },
    [updateDrug, session],
  );

  // Serialize only the data we care about (ID and Name) to prevent infinite loops
  const drugNamesStr = JSON.stringify(
    drugs.map((d) => ({ id: d.id, name: d.name })),
  );

  useEffect(() => {
    // Parse it inside the effect so ESLint doesn't demand the full 'drugs' array
    const currentDrugs = JSON.parse(drugNamesStr);

    const timers = currentDrugs.map((drug) =>
      setTimeout(() => fetchSuggestion(drug.name, drug.id), 400),
    );

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [drugNamesStr, fetchSuggestion]);

  const handleAddDrug = () => {
    if (drugs.length >= 8) return;
    setDrugs((prev) => [
      ...prev,
      { id: Date.now(), name: "", suggestion: null },
    ]);
  };

  const handleRemoveDrug = (id) => {
    setDrugs((prev) => prev.filter((d) => d.id !== id));
  };

  const acceptSuggestion = (id, suggestionText) => {
  setDrugs((prev) =>
    prev.map((drug) =>
      drug.id === id
        ? {
            ...drug,
            name: suggestionText,
            suggestion: null,
          }
        : drug
    )
  );
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validDrugs = drugs.map((d) => d.name.trim()).filter((d) => d !== "");
    if (validDrugs.length === 0) return;

    setIsAnalyzing(true);

    try {
      const RAW_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const CLEAN_URL = RAW_URL.replace(/\/$/, "");

      const response = await fetch(`${CLEAN_URL}/api/analyze-manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: session?.access_token
            ? `Bearer ${session.access_token}`
            : "",
        },
        body: JSON.stringify({ drugs: validDrugs }),
      });

      const data = await response.json();

      if (response.ok && !data.error) {
        navigate("/results", { state: { result: data } });
      } else {
        alert("Failed to analyze medications. Please check entries.");
      }
    } catch (error) {
      console.error("Manual analysis error:", error);
      alert("Server connection failed. Ensure backend services are running.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-grow rounded-[1.75rem] border border-white/60 bg-gradient-to-br from-[#f8f0ff] via-[#f1e6ff] to-[#eaddff] p-6 shadow-xl backdrop-blur-xl"
      >
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] bg-purple-600 text-white shadow-lg">
            <Keyboard size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#201c45]">Manual Entry</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b6fd6] mt-1">
              Dynamic verification mode
            </p>
          </div>
        </div>

        <p className="mb-6 text-sm text-[#6a5a83]">
          Type medications to fetch auto-suggestions from your past scans or
          medical databases. Entries are verified with openFDA.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence>
            {drugs.map((drug, index) => (
              <motion.div key={drug.id} className="relative">
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#7f6b9d]">
                    Medication {index + 1}
                  </label>

                  {drugs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDrug(drug.id)}
                      className="text-rose-400 hover:text-rose-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Input */}
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#a79bbd]">
                    <Pill size={18} />
                  </div>

                  <input
                    type="text"
                    value={drug.name}
                    onChange={(e) =>
                      updateDrug(drug.id, {
                        name: e.target.value,
                        // Hide old suggestion while typing
                        suggestion: null,
                      })
                    }
                    className="w-full rounded-[1.25rem] border border-white/60 bg-white/60 py-3.5 pl-11 pr-4 text-[#201c45] outline-none backdrop-blur-md focus:border-purple-600 focus:bg-white"
                    placeholder="e.g., Aspirin"
                    required={index === 0}
                    disabled={isAnalyzing}
                    autoComplete="off"
                  />
                </div>

                {/* Suggestion */}
                <AnimatePresence>
                  {drug.suggestion && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute left-0 right-0 z-50 mt-2"
                    >
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          // Prevent input blur from happening before selection
                          e.preventDefault();
                        }}
                        onClick={() => {
                          acceptSuggestion(drug.id, drug.suggestion);
                        }}
                        className="flex w-full items-center gap-2 rounded-[1rem] border border-purple-200 bg-white p-3 text-left text-sm font-medium text-purple-900 shadow-lg transition hover:bg-purple-50 active:bg-purple-100"
                      >
                        <Search
                          size={16}
                          className="shrink-0 text-purple-600"
                        />

                        <span className="truncate">
                          Did you mean:{" "}
                          <span className="font-bold capitalize">
                            {drug.suggestion}
                          </span>
                          ?
                        </span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>

          <button
            type="button"
            onClick={handleAddDrug}
            disabled={drugs.length >= 8 || isAnalyzing}
            className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] border-2 border-dashed border-purple-200 py-3 text-sm font-bold text-purple-600 hover:bg-white/50"
          >
            <Plus size={16} /> Add another medication
          </button>

          <button
            type="submit"
            disabled={isAnalyzing}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-4 py-4 font-bold text-white shadow-lg hover:bg-purple-700 disabled:opacity-70"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Verifying & Analyzing with FDA...
              </>
            ) : (
              "Check Interactions"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
