import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useSupabaseClient } from '../supabaseClient.jsx';

export default function Profile() {
  const navigate = useNavigate();
  const { supabase, session, loading: authLoading } = useSupabaseClient();
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }
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
      
      // Removed .limit(5) so the frontend can accurately calculate all-time totals
      const { data, error } = await supabase
        .from('scan_history')
        .select('id, created_at, drugs_detected, fda_warning, severity_level')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!error) {
        setHistory(data ?? []);
      }

      setHistoryLoading(false);
    };

    loadProfileHistory();
  }, [session, supabase]);

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
    (count, scan) => count + (Array.isArray(scan.drugs_detected) ? scan.drugs_detected.length : 0),
    0,
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

      {/* Action Buttons */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }} 
      >
        <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#dfd0ff] bg-white/80 hover:bg-white px-4 py-3.5 text-sm font-semibold text-[#34214f] transition-all active:scale-95 shadow-sm">
          <Download size={16} />
          Export Report
        </button>
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