import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSupabaseClient } from '../supabaseClient.jsx';
import { motion } from 'framer-motion';
import { AlertOctagon, AlertTriangle, Info, CheckCircle2, Link as LinkIcon, ExternalLink, HeartPulse, ShieldCheck } from 'lucide-react';

// Healthcare Loading Overlay Component
function HealthcareLoader() {
  return (
    <div className="flex h-[75vh] flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative flex flex-col items-center justify-center rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-[0_10px_40px_-15px_rgba(139,92,246,0.2)] backdrop-blur-xl max-w-xs w-full"
      >
        {/* Glowing Heartbeat Centerpiece */}
        <div className="relative flex h-20 w-20 items-center justify-center mb-6">
          <motion.span
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-full w-full rounded-full bg-[#8b5cf6]/20"
          />
          <motion.span
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            className="absolute h-full w-full rounded-full bg-[#8b5cf6]/30"
          />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-xl shadow-purple-500/30">
            <HeartPulse size={32} className="animate-pulse" />
          </div>
        </div>

        <h3 className="text-lg font-black text-[#201c45]">Analyzing Prescription</h3>
        <p className="mt-1 text-xs font-semibold text-[#8b6fd6] uppercase tracking-wider">
          Safety & Interaction Check
        </p>

        {/* Dynamic ECG Line Pulse */}
        <div className="mt-6 w-full overflow-hidden rounded-full bg-[#f1e6ff] p-1">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className="h-2 w-1/2 rounded-full bg-gradient-to-r from-transparent via-[#8b5cf6] to-transparent shadow-[0_0_12px_#8b5cf6]"
          />
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-bold text-[#7f6b9d]">
          <ShieldCheck size={14} className="text-[#10b981]" />
          <span>Cross-referencing openFDA SPL</span>
        </div>
      </motion.div>
    </div>
  );
}

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const saveAttemptedRef = useRef(false);
  const { supabase, session } = useSupabaseClient();
  const [isPreparing, setIsPreparing] = useState(true);

  const result = location.state?.result;

  // Short delay to allow smooth transition animation when page loads
  useEffect(() => {
    const timer = setTimeout(() => setIsPreparing(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const normalizedDrugKey = Array.isArray(result?.drugs_detected)
    ? [...new Set(
      result.drugs_detected
        .map((drug) => (typeof drug === 'string' ? drug.trim() : ''))
        .filter(Boolean)
        .map((drug) => drug.toLowerCase()),
    )].sort().join('|')
    : '';

  const severityValue = (result?.severity_level ?? result?.fda_warning ?? '').trim();
  const shortSummaryText = (result?.fda_summary ?? '').trim();
  const officialDetailsText = (result?.fda_raw_text ?? result?.fda_warning ?? result?.fda_summary ?? '').trim();
  const saveSignature = [session?.user?.id ?? 'guest', normalizedDrugKey, officialDetailsText.toLowerCase()].join('::');

  const getSeverityLevel = (severity) => {
    const text = (severity || '').toLowerCase();
    if (!text || text === 'none' || text === 'safe' || text.includes('no interaction') || text.includes('manual entry') || text.includes('unable to retrieve')) return 'none';
    if (text.includes('contraindicated') || text.includes('severe')) return 'critical';
    if (text.includes('major')) return 'major';
    if (text.includes('moderate')) return 'moderate';
    return 'minor';
  };

  useEffect(() => {
    const saveResultToHistory = async () => {
      if (!result || saveAttemptedRef.current || !supabase || !session?.user) return;

      const storageKey = `rxguard.saved-result.${saveSignature}`;

      if (window.sessionStorage.getItem(storageKey) === 'saved') {
        saveAttemptedRef.current = true;
        return;
      }

      saveAttemptedRef.current = true;
      const normalizedDrugs = normalizedDrugKey ? normalizedDrugKey.split('|') : [];
      const persistedWarningText = officialDetailsText || shortSummaryText || severityValue;

      const { data: existingRows, error: existingError } = await supabase
        .from('scan_history')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('fda_warning', persistedWarningText)
        .contains('drugs_detected', normalizedDrugs)
        .limit(1);

      if (!existingError && Array.isArray(existingRows) && existingRows.length > 0) {
        window.sessionStorage.setItem(storageKey, 'saved');
        return;
      }

      const payload = {
        user_id: session.user.id,
        drugs_detected: normalizedDrugs,
        fda_warning: persistedWarningText,
        severity_level: getSeverityLevel(severityValue),
      };

      const { error } = await supabase.from('scan_history').insert([payload]);

      if (error) {
        console.error('[frontend/components/Results.jsx] Failed to save scan history:', error);
      } else {
        window.sessionStorage.setItem(storageKey, 'saved');
      }
    };

    saveResultToHistory();
  }, [result, session, supabase, saveSignature, normalizedDrugKey, officialDetailsText, shortSummaryText, severityValue]);

  // Render Healthcare Loader during preparation
  if (isPreparing) {
    return <HealthcareLoader />;
  }

  if (!result) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-center px-4">
        <p className="mb-4 text-lg font-bold text-[#201c45]">No analysis data found.</p>
        <button 
          onClick={() => navigate('/')} 
          className="rounded-2xl bg-[#8b5cf6] px-6 py-3 font-semibold text-white shadow-md shadow-purple-500/25 transition-all hover:bg-[#7c3aed] active:scale-95"
        >
          Scan Prescription
        </button>
      </div>
    );
  }

  const { status, drugs_detected = [], fda_summary = "", fda_raw_text = "", fda_warning = "", severity_level = "" } = result;

  const summaryLines = shortSummaryText
    ? shortSummaryText
      .split(/\n+/)
      .map((line) => line.replace(/^[•\-\s]+/, '').trim())
      .filter(Boolean)
    : [];

  const getSeverityUI = (severity) => {
    const level = getSeverityLevel(severity);

    if (level === 'none') {
      return { label: 'SAFE / NO INTERACTION', bg: 'from-emerald-400 to-emerald-500 shadow-emerald-500/30', Icon: CheckCircle2 };
    }

    if (level === 'critical') {
      return { label: 'CONTRAINDICATED', bg: 'from-rose-500 to-rose-600 shadow-rose-500/30', Icon: AlertOctagon };
    }
    if (level === 'major') {
      return { label: 'MAJOR INTERACTION', bg: 'from-orange-500 to-orange-600 shadow-orange-500/30', Icon: AlertTriangle };
    }
    if (level === 'moderate') {
      return { label: 'MODERATE INTERACTION', bg: 'from-amber-400 to-amber-500 shadow-amber-500/30', Icon: AlertTriangle };
    }
    
    return { label: 'MINOR INTERACTION', bg: 'from-emerald-400 to-emerald-500 shadow-emerald-500/30', Icon: Info };
  };

  const severityUI = getSeverityUI(severity_level || severityValue);
  const StatusIcon = severityUI.Icon;

  const handleReadFullDetails = () => {
    navigate('/details', {
      state: { fda_raw_text: officialDetailsText || fda_raw_text },
    });
  };

  return (
    <div className="flex flex-col h-full space-y-4 pb-8 mt-2 px-1">
      
      {/* 1. Primary Alert Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`bg-gradient-to-br ${severityUI.bg} text-white p-5 rounded-[1.75rem] shadow-lg flex items-center space-x-4`}
      >
        <div className="flex-shrink-0 bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
          <StatusIcon size={32} strokeWidth={2} className="drop-shadow-md" />
        </div>
        <div>
          <h2 className="text-lg font-black tracking-wide drop-shadow-sm">{severityUI.label}</h2>
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-90 mt-1 drop-shadow-sm">
            {status === "manual_entry_required" ? "Verification Required" : "Safety Check Complete"}
          </p>
        </div>
      </motion.div>

      {/* 2. Medication Breakdown */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-[1.75rem] border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md"
      >
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b6fd6] mb-4">
          Extracted Medications
        </h3>
        
        {drugs_detected.length > 0 ? (
          <ul className="space-y-3">
            {drugs_detected.map((drug, index) => (
              <li key={index} className="flex items-center space-x-4 bg-white/60 p-3 rounded-[1.25rem] border border-white/40 shadow-sm">
                <span className="w-8 h-8 rounded-full bg-[#f5edff] flex items-center justify-center text-[13px] font-black text-[#5b3bbb]">
                  {index + 1}
                </span>
                <span className="text-base font-bold text-[#201c45] capitalize">{drug}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#7f6b9d] italic">No valid medications detected.</p>
        )}
      </motion.div>

      {/* 3. Interaction Details */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-[1.75rem] border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md"
      >
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b6fd6] mb-3">
          FDA Interaction Details
        </h3>
        
        {summaryLines.length > 0 ? (
          <>
            <div className="space-y-2 text-sm text-[#4b5563] leading-relaxed font-medium">
              {summaryLines.map((line) => (
                <p key={line} className="rounded-2xl bg-white/55 px-3 py-2 shadow-sm">
                  {line}
                </p>
              ))}
            </div>

            {officialDetailsText ? (
              <button
                onClick={handleReadFullDetails}
                className="mt-5 w-full flex items-center justify-center gap-2 rounded-2xl border border-[#dfd0ff] bg-white/80 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[#4c2c97] transition-all hover:bg-white active:scale-95 shadow-sm"
              >
                Read Full Official Document
              </button>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-[#7f6b9d] italic">
            {severityValue === 'none'
              ? 'No known adverse interactions found between these medications based on current openFDA data.'
              : 'FDA details are available, but a short summary could not be generated.'}
          </p>
        )}
      </motion.div>

      {/* 4. Verified Sources */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="rounded-[1.75rem] border border-white/50 bg-gradient-to-br from-[#f8f0ff] via-[#f1e6ff] to-[#eaddff] p-5 shadow-sm backdrop-blur-md"
      >
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b6fd6] mb-3 flex items-center gap-2">
          <LinkIcon size={14} />
          Verified Sources
        </h3>
        <p className="text-xs text-[#6a5a83] mb-4">
          Data dynamically cross-referenced using official government regulatory databases:
        </p>
        <ul className="space-y-3">
          <li>
            <a 
              href="https://open.fda.gov/apis/drug/label/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-[#8b5cf6] hover:text-[#7c3aed] flex items-center gap-1.5"
            >
              U.S. openFDA Structured Product Labeling (SPL)
              <ExternalLink size={12} />
            </a>
          </li>
          {drugs_detected.map((drug, index) => (
            <li key={index}>
              <a 
                href={`https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=${encodeURIComponent(drug)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-[#8b5cf6] hover:text-[#7c3aed] flex items-center gap-1.5 capitalize"
              >
                NIH DailyMed Database: {drug}
                <ExternalLink size={12} />
              </a>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Try Again Button */}
      <motion.button 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        onClick={() => navigate('/')} 
        className="w-full mt-2 rounded-2xl bg-[#8b5cf6] px-4 py-4 font-bold text-white shadow-md shadow-purple-500/25 transition-all hover:bg-[#7c3aed] active:scale-95"
      >
        Scan Another Prescription
      </motion.button>

      {/* Legal Disclaimer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="text-center px-4 pt-3"
      >
        <p className="text-[9px] leading-relaxed text-[#a79bbd] uppercase tracking-[0.1em] font-bold">
          ⚠️ RxGuard is a safety companion, not a diagnostic tool. 
          <br className="my-1" />
          Always consult a healthcare professional before altering medication.
        </p>
      </motion.div>

    </div>
  );
}