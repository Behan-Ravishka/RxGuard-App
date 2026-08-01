import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Activity, ShieldAlert, Pill } from 'lucide-react';
import scanCardImage from "../assets/scan_card.png";
import { useSupabaseClient } from '../supabaseClient.jsx';

function getSeverityTone(severityLevel) {
  const level = (severityLevel || '').toLowerCase();
  if (level.includes('critical') || level.includes('contraindicated')) {
    return 'bg-[#ffe2e2] text-[#b42318]';
  }
  if (level.includes('major')) {
    return 'bg-[#ffe9d6] text-[#b54708]';
  }
  if (level.includes('moderate')) {
    return 'bg-[#fff6cc] text-[#93370d]';
  }
  return 'bg-[#eaf8ee] text-[#15803d]';
}

export default function Dashboard() {
  const { supabase, session } = useSupabaseClient();
  const [latestChecks, setLatestChecks] = useState([]);
  
  // Quick Stats State
  const [totalScans, setTotalScans] = useState(0);
  const [threatsFound, setThreatsFound] = useState(0);
  const [medsChecked, setMedsChecked] = useState(0);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!supabase || !session?.user) {
        setLatestChecks([]);
        setTotalScans(0);
        setThreatsFound(0);
        setMedsChecked(0);
        return;
      }

      // Fetch user's full scan history to calculate stats
      const { data } = await supabase
        .from('scan_history')
        .select('id, created_at, drugs_detected, fda_warning, severity_level')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      const allScans = data ?? [];
      
      // Keep only the latest 3 for the history list below
      setLatestChecks(allScans.slice(0, 3));
      
      // Calculate Quick Stats
      setTotalScans(allScans.length);
      
      const totalMeds = allScans.reduce((acc, scan) => 
        acc + (Array.isArray(scan.drugs_detected) ? scan.drugs_detected.length : 0), 0
      );
      setMedsChecked(totalMeds);

      const totalThreats = allScans.filter((scan) => {
        const level = (scan.severity_level || '').toLowerCase();
        return level && level !== 'none' && level !== 'safe';
      }).length;
      setThreatsFound(totalThreats);
    };

    loadDashboardData();
  }, [session, supabase]);

  return (
    <div className="space-y-5">
      {/* Hero Scan Card */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-gradient-to-br from-[#f8f0ff] via-[#f1e6ff] to-[#eaddff] p-6 shadow-sm backdrop-blur-lg"
      >
        <div className="relative z-10 w-[60%]">
          <h1 className="text-[24px] font-bold leading-[1.15] text-[#111827]">
            Scan New<br />Prescription
          </h1>
          <p className="mt-2 text-[14px] leading-snug text-[#4b5563]">
            Analyze your new<br />meds instantly.
          </p>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="mt-5 inline-block">
            <Link
              to="/capture"
              className="rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-6 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(139,92,246,0.5)]"
            >
              Scan Now
            </Link>
          </motion.div>
        </div>
        
        {/* Right side 3D Image */}
        <div className="absolute -right-3 top-1/2 w-[50%] max-w-[170px] -translate-y-1/2">
          <img 
            src={scanCardImage} 
            alt="Scan prescription illustration" 
            className="h-auto w-full object-contain drop-shadow-2xl"
          />
        </div>
      </motion.section>

      {/* Live Agent Status Banner - Minimalist Update */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex items-center gap-3 rounded-[1.25rem] border border-[#efe6ff] bg-white/70 px-4 py-3 shadow-[0_2px_10px_-4px_rgba(139,92,246,0.05)] backdrop-blur-md"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </span>
        <p className="text-[11px] font-medium leading-snug text-[#7f6b9d]">
          <span className="font-bold text-[#34214f]">RxGuard Autonomous Agent is Online. </span> 
          Connected to FDA Database & Gemini Vision.
        </p>
      </motion.section>

      {/* Quick Stats Summary Section */}
      <motion.section 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        <div className="flex flex-col items-center justify-center rounded-[1.35rem] border border-[#efe6ff] bg-white/80 p-4 shadow-sm backdrop-blur-md">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#f2ebff] text-[#8b5cf6]">
            <Activity size={16} strokeWidth={2} />
          </div>
          <p className="w-full text-center text-xl font-black text-[#34214f]">{totalScans}</p>
          <p className="mt-0.5 w-full text-center text-[9px] font-bold uppercase tracking-wider text-[#7f6b9d]">Total Scans</p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-[1.35rem] border border-[#efe6ff] bg-white/80 p-4 shadow-sm backdrop-blur-md">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <ShieldAlert size={16} strokeWidth={2} />
          </div>
          <p className="w-full text-center text-xl font-black text-[#34214f]">{threatsFound}</p>
          <p className="mt-0.5 w-full text-center text-[9px] font-bold uppercase tracking-wider text-[#7f6b9d]">Alerts Found</p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-[1.35rem] border border-[#efe6ff] bg-white/80 p-4 shadow-sm backdrop-blur-md">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
            <Pill size={16} strokeWidth={2} />
          </div>
          <p className="w-full text-center text-xl font-black text-[#34214f]">{medsChecked}</p>
          <p className="mt-0.5 w-full text-center text-[9px] font-bold uppercase tracking-wider text-[#7f6b9d]">Meds Checked</p>
        </div>
      </motion.section>

      {/* Interaction History Section */}
      <section className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#8b6fd6]">Interaction history</p>
            <h2 className="mt-1 text-lg font-semibold text-[#34214f]">Latest safety checks</h2>
          </div>
          <Link to="/history" className="text-[11px] font-bold text-[#8b5cf6] hover:text-[#7c3aed]">
            View all
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {latestChecks.length > 0 ? latestChecks.map((item) => {
            const warningText = item.fda_warning || 'No warning recorded.';
            const severityLabel = item.severity_level || 'none';

            return (
            <motion.div
              key={item.id}
              whileHover={{ y: -2, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              className="flex items-start justify-between rounded-[1.35rem] border border-[#efe6ff] bg-white/80 px-3 py-3 shadow-sm backdrop-blur-md"
            >
              <div className="flex-1 pr-3">
                <p className="text-sm font-semibold text-[#34214f] capitalize">
                  {Array.isArray(item.drugs_detected) && item.drugs_detected.length > 0
                    ? item.drugs_detected.join(' + ')
                    : 'Saved scan'}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#8b6fd6]">
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#7f6b9d]">
                  {warningText}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getSeverityTone(severityLabel)}`}>
                {severityLabel}
              </span>
            </motion.div>
            );
          }) : (
            <div className="rounded-[1.35rem] border border-[#efe6ff] bg-white/80 px-4 py-5 text-center text-sm font-medium text-[#7f6b9d]">
              Sign in and run a scan to see your latest safety checks here.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}