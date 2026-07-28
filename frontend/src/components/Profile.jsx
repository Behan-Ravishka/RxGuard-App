import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Calendar, RefreshCw, Download } from 'lucide-react';
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
      const { data, error } = await supabase
        .from('scan_history')
        .select('id, created_at, drugs_detected, fda_warning, severity_level')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(5);

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
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-lg shadow-purple-500/25">
              <User size={28} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#8b6fd6]">Caretaker Profile</p>
              <h1 className="mt-1 text-2xl font-black text-[#201c45]">Sign in required</h1>
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

  // Helper for the calendar to highlight today (e.g., Wednesday)
  const currentDayIndex = 2; 

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
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-lg shadow-purple-500/25">
            <User size={28} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#8b6fd6]">
              Caretaker Profile
            </p>
            <h1 className="mt-1 text-2xl font-black text-[#201c45]">{session.user.email}</h1>
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

      {/* Weekly Calendar */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-[1.75rem] border border-white/60 bg-white/70 p-5 shadow-[0_4px_20px_-4px_rgba(139,92,246,0.08)] backdrop-blur-md"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[#8b5cf6]" />
            <h2 className="text-base font-bold text-[#201c45]">Weekly Schedule</h2>
          </div>
          <span className="rounded-full bg-[#f2ebff] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#5b3bbb]">
            Mon–Sun
          </span>
        </div>
        
        <div className="mt-5 flex justify-between gap-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
            const isToday = index === currentDayIndex;
            return (
              <div 
                key={day + index} 
                className={`flex w-11 flex-col items-center justify-center rounded-[1rem] py-2.5 transition-all ${
                  isToday 
                    ? 'bg-[#8b5cf6] text-white shadow-md shadow-purple-500/25' 
                    : 'bg-[#f8f5ff] text-[#5b3bbb] border border-[#f0e8ff]'
                }`}
              >
                <div className="text-[13px] font-bold">{day}</div>
                <div className={`mt-0.5 text-[10px] ${isToday ? 'opacity-90' : 'opacity-60'}`}>
                  {14 + index}
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Action Buttons */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }} 
        className="flex gap-3"
      >
        <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#8b5cf6] hover:bg-[#7c3aed] px-2 py-3.5 text-sm font-semibold text-white shadow-md shadow-purple-500/20 transition-all active:scale-95">
          <RefreshCw size={16} />
          Sync Data
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#dfd0ff] bg-white/80 hover:bg-white px-2 py-3.5 text-sm font-semibold text-[#34214f] transition-all active:scale-95 shadow-sm">
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
        transition={{ duration: 0.3, delay: 0.3 }} 
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