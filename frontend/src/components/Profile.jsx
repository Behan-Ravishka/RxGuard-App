import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Download, Loader2, Activity, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useSupabaseClient } from '../supabaseClient.jsx';
import { generatePDFReport } from '../utils/reportGenerator.js';

export default function Profile() {
  const navigate = useNavigate();
  const { supabase, session, loading: authLoading } = useSupabaseClient();
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  
  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportText, setExportText] = useState("Initializing...");

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    navigate('/');
  };

  useEffect(() => {
    const loadProfileHistory = async () => {
      if (!supabase || !session?.user) {
        setHistory([]);
        setHistoryLoading(false);
        return;
      }

      setHistoryLoading(true);
      const { data, error } = await supabase
        .from('scan_history')
        .select('id, created_at, drugs_detected, fda_warning, severity_level')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!error) setHistory(data ?? []);
      setHistoryLoading(false);
    };

    loadProfileHistory();
  }, [session, supabase]);

  const handleExportReport = async () => {
    if (!session?.access_token || !history.length) return;
    
    setIsExporting(true);
    setExportText("Structuring patient information...");
    
    try {
      // 1. Artificial delay for UX - let the user see the analysis starting
      await new Promise(r => setTimeout(r, 800));
      setExportText("Evaluating interaction mechanisms (PK/PD)...");

      let latestInsights = [];
      try {
        const rawApiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
        const apiUrl = rawApiUrl.replace(/\/$/, ''); 
        
        const response = await fetch(`${apiUrl}/api/insights`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        const contentType = response.headers.get("content-type") || "";
        if (response.ok && contentType.includes("application/json")) {
          const data = await response.json();
          if (data.status === 'success' && Array.isArray(data.insights)) {
            latestInsights = data.insights;
          }
        }
      } catch {
        console.warn("[Profile Export] Insights fetch skipped/failed.");
      }

      setExportText("Compiling management recommendations...");
      await new Promise(r => setTimeout(r, 900)); // Pacing the animation

      setExportText("Finalizing clinical document...");
      generatePDFReport(session.user.email, history, latestInsights);

      // Brief success state
      setExportText("Report Generated!");
      await new Promise(r => setTimeout(r, 600));

    } catch (error) {
      console.error('[Profile Export] CRITICAL - Failed to generate PDF:', error);
      alert('Unable to generate the PDF report. Please check the browser console for details.');
    } finally {
      setIsExporting(false);
      setExportText("Initializing...");
    }
  };

  if (authLoading) {
    return (
      <div className="space-y-5">
        <div className="rounded-[1.75rem] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-lg">
          <div className="rounded-2xl border border-[#efe6ff] bg-[#faf7ff] p-4 text-sm text-slate-600">
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-5">
        <div className="rounded-[1.75rem] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-lg">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-lg shadow-purple-500/25">
              <User size={28} strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#8b6fd6]">Caretaker Profile</p>
              <h1 className="mt-1 text-2xl font-black text-[#201c45] truncate">Sign in required</h1>
            </div>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-slate-600">
            Log in to see your profile details, saved medications, and scan timeline.
          </p>
          <Link
            to="/auth"
            state={{ from: '/profile' }}
            className="mt-5 block w-full rounded-2xl bg-[#8b5cf6] px-4 py-3 text-center text-sm font-semibold text-white shadow-md shadow-purple-500/20"
          >
            Sign in or register
          </Link>
        </div>
      </div>
    );
  }

  const totalScans = history.length;
  const totalMedications = history.reduce(
    (count, scan) => count + (Array.isArray(scan.drugs_detected) ? scan.drugs_detected.length : 0), 0
  );
  const latestScan = history[0];

  return (
    <div className="space-y-5">
      {/* Profile Summary Card */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden rounded-[1.75rem] border border-white/50 bg-gradient-to-br from-[#fef7ff] via-[#f7ecff] to-[#efe7ff] p-5 shadow-sm backdrop-blur-lg"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-lg shadow-purple-500/25">
            <User size={28} strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#8b6fd6]">
              Caretaker Profile
            </p>
            <h1 className="mt-1 text-2xl font-black text-[#201c45] truncate">{session.user.email}</h1>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-[1.25rem] border border-white/60 bg-white/60 p-4 backdrop-blur-md">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7f6b9d]">Saved scans</p>
            <p className="mt-1 text-xl font-bold text-[#34214f]">{totalScans}</p>
          </div>
          <div className="rounded-[1.25rem] border border-white/60 bg-white/60 p-4 backdrop-blur-md">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7f6b9d]">Medications</p>
            <p className="mt-1 text-xl font-bold text-[#34214f]">{totalMedications}</p>
          </div>
        </div>

        <div className="mt-4 rounded-[1.25rem] border border-white/60 bg-white/60 p-4 backdrop-blur-md">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7f6b9d]">Latest scan</p>
          <p className="mt-1 text-sm font-semibold text-[#34214f]">
            {latestScan ? new Date(latestScan.created_at).toLocaleString() : 'No scans saved yet'}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {latestScan && Array.isArray(latestScan.drugs_detected) && latestScan.drugs_detected.length > 0
              ? latestScan.drugs_detected.join(', ')
              : 'Save a scan to populate this summary.'}
          </p>
        </div>
      </motion.section>

      {/* Dynamic Action Button Area */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }} 
        className="relative h-[52px]" 
      >
        <AnimatePresence mode="wait">
          {!isExporting ? (
            <motion.button 
              key="export-btn"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={handleExportReport}
              disabled={totalScans === 0}
              className="absolute inset-0 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#dfd0ff] bg-white/80 hover:bg-white px-4 text-sm font-semibold text-[#34214f] transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} className="text-[#8b5cf6]" />
              Generate Clinical DDI Report
            </motion.button>
          ) : (
            <motion.div
              key="loading-btn"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 flex w-full items-center justify-between rounded-2xl border border-[#8b5cf6]/40 bg-[#fbf9ff] px-4 shadow-inner overflow-hidden"
            >
              <div className="absolute top-0 left-0 h-full w-[200%] animate-pulse bg-gradient-to-r from-transparent via-[#8b5cf6]/5 to-transparent pointer-events-none" />
              
              <div className="flex items-center gap-3 relative z-10">
                {exportText === "Report Generated!" ? (
                  <ShieldCheck className="text-emerald-500" size={18} />
                ) : (
                  <Activity className="animate-pulse text-[#8b5cf6]" size={18} />
                )}
                <span className="text-sm font-bold text-[#6a5a83]">{exportText}</span>
              </div>
              <Loader2 className="animate-spin text-[#8b5cf6]/60 relative z-10" size={16} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {historyLoading ? (
        <div className="rounded-[1.75rem] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-lg text-sm text-slate-600">
          Loading recent medication history...
        </div>
      ) : null}

      {/* Sign Out Section */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }} 
        className="pt-4 pb-2"
      >
        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-white/70 px-4 py-3.5 text-sm font-semibold text-rose-600 shadow-sm backdrop-blur-md transition-all hover:bg-rose-50 active:scale-95"
        >
          <LogOut size={18} />
          Sign out securely
        </button>
      </motion.section>
    </div>
  );
}