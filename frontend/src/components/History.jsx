import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabaseClient } from '../supabaseClient.jsx';
import { X, Pill, AlertTriangle, Clock, ChevronRight, FileText } from 'lucide-react';

export default function History() {
  const navigate = useNavigate();
  const { supabase, session, loading: authLoading } = useSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scans, setScans] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      if (!supabase) {
        return;
      }

      const user = session?.user;

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error: historyError } = await supabase
        .from('scan_history')
        .select('id, created_at, drugs_detected, fda_warning, severity_level')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (historyError) {
        setError(historyError.message);
      } else {
        setScans(data ?? []);
      }

      setLoading(false);
    };

    loadHistory();
  }, [session, supabase]);

  const getSeverityBadge = (level) => {
    const text = (level || '').toLowerCase();
    if (text.includes('contraindicated') || text.includes('critical') || text.includes('severe')) {
      return { label: level || 'CONTRAINDICATED', style: 'bg-rose-100 text-rose-700 border-rose-200' };
    }
    if (text.includes('major')) {
      return { label: level || 'MAJOR INTERACTION', style: 'bg-orange-100 text-orange-700 border-orange-200' };
    }
    if (text.includes('moderate')) {
      return { label: level || 'MODERATE INTERACTION', style: 'bg-amber-100 text-amber-700 border-amber-200' };
    }
    return { label: level || 'SAFE / NO INTERACTION', style: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  };

  if (authLoading) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 py-4 glass-card">
        <div className="rounded-[1.75rem] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-lg">
          <div className="rounded-2xl border border-[#efe6ff] bg-[#faf7ff] p-4 text-sm text-slate-600">
            Loading account details...
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto flex h-[calc(100dvh-6.5rem)] w-full max-w-md flex-col px-2 py-4 relative">
        <div className="flex h-full flex-col rounded-[1.75rem] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-lg">
          <p className="text-[10px] uppercase tracking-[0.3em] text-indigo-500 font-bold">Saved scans</p>
          <h2 className="mt-2 text-2xl font-black text-[#34214f]">My history</h2>
          <div className="mt-4 rounded-2xl border border-[#efe6ff] bg-[#faf7ff] p-4 text-sm text-slate-600">
            Sign in to sync your medication timeline and view your saved scan details.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-6.5rem)] w-full max-w-md flex-col px-2 py-4 relative">
      <div className="flex h-full flex-col rounded-[1.75rem] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-lg">
        
        {/* Fixed Header */}
        <div className="mb-4 flex flex-shrink-0 items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-indigo-500 font-bold">Saved scans</p>
            <h2 className="mt-1 text-2xl font-black text-[#34214f]">My history</h2>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/')}
            className="rounded-full border border-[#dfd0ff] bg-[#f7f1ff] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#4c2c97] hover:bg-[#efe5ff] transition-colors"
          >
            Scan
          </motion.button>
        </div>

        {/* Scrollable List Container */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-2 space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-[#efe6ff] bg-[#faf7ff] p-4 text-sm text-slate-600">
              Loading history...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : scans.length === 0 ? (
            <div className="rounded-2xl border border-[#efe6ff] bg-[#faf7ff] p-4 text-sm text-slate-600">
              No saved scans yet. Sign in and run a scan to start building your timeline.
            </div>
          ) : (
            scans.map((scan) => {
              const badge = getSeverityBadge(scan.severity_level);
              return (
                <motion.article 
                  key={scan.id} 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedScan(scan)}
                  className="cursor-pointer rounded-[1.35rem] border border-[#efe6ff] bg-white/90 p-4 shadow-sm backdrop-blur-md transition-all hover:border-[#8b5cf6]/40 hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#8b6fd6]">
                      <Clock size={12} />
                      <span>{new Date(scan.created_at).toLocaleDateString()} • {new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span className="rounded-full border border-[#e8dcff] bg-[#f5edff] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-[#5b3bbb] truncate max-w-[80px]">
                      #{typeof scan.id === 'string' && scan.id.length > 8 ? `${scan.id.slice(0, 8)}...` : scan.id}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Severity Badge */}
                    <div>
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.style}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Medications */}
                    <div>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b6fd6] flex items-center gap-1">
                        <Pill size={11} /> Medications
                      </p>
                      <p className="text-xs font-bold text-[#34214f] capitalize">
                        {Array.isArray(scan.drugs_detected) && scan.drugs_detected.length > 0
                          ? scan.drugs_detected.join(', ')
                          : 'No medications saved.'}
                      </p>
                    </div>

                    {/* Truncated FDA Warning */}
                    <div>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b6fd6] flex items-center gap-1">
                        <AlertTriangle size={11} /> FDA Warning
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                        {scan.fda_warning || 'No warning recorded.'}
                      </p>
                    </div>

                    {/* View Details Trigger */}
                    <div className="pt-1 flex items-center justify-end text-[11px] font-bold text-[#8b5cf6] hover:text-[#7c3aed]">
                      <span>View details</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </motion.article>
              );
            })
          )}
        </div>
      </div>

      {/* Detail Popup Modal */}
      <AnimatePresence>
        {selectedScan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative flex flex-col w-full max-w-sm max-h-[78vh] rounded-[1.75rem] border border-white/80 bg-white/95 p-5 shadow-2xl backdrop-blur-xl overflow-hidden"
            >
              {/* Fixed Header */}
              <div className="flex-shrink-0 pb-3 pr-8 border-b border-[#f0e8ff]">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8b6fd6]">Scan Details</p>
                <h3 className="text-lg font-black text-[#34214f] mt-0.5 truncate">
                  Scan #{typeof selectedScan.id === 'string' && selectedScan.id.length > 8 ? `${selectedScan.id.slice(0, 8)}...` : selectedScan.id}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {new Date(selectedScan.created_at).toLocaleString()}
                </p>

                {/* Close Button Top Right */}
                <button
                  onClick={() => setSelectedScan(null)}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#f5edff] text-[#5b3bbb] hover:bg-[#e8dcff] transition-colors"
                  aria-label="Close modal"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1 my-1">
                {/* Severity Badge */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b6fd6] mb-1">Severity Status</p>
                  <span className={`inline-block rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${getSeverityBadge(selectedScan.severity_level).style}`}>
                    {getSeverityBadge(selectedScan.severity_level).label}
                  </span>
                </div>

                {/* Detected Medications */}
                <div className="rounded-2xl border border-[#efe6ff] bg-[#faf7ff] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b6fd6] mb-1.5 flex items-center gap-1.5">
                    <Pill size={13} /> Detected Medications
                  </p>
                  {Array.isArray(selectedScan.drugs_detected) && selectedScan.drugs_detected.length > 0 ? (
                    <ul className="space-y-1">
                      {selectedScan.drugs_detected.map((drug, index) => (
                        <li key={index} className="text-xs font-bold text-[#34214f] capitalize flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#8b5cf6]"></span>
                          {drug}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs italic text-slate-500">No medications detected.</p>
                  )}
                </div>

                {/* Full FDA Warning */}
                <div className="rounded-2xl border border-[#efe6ff] bg-[#faf7ff] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b6fd6] mb-1.5 flex items-center gap-1.5">
                    <FileText size={13} /> Full FDA Interaction Details
                  </p>
                  <p className="text-xs leading-relaxed text-slate-700 font-medium whitespace-pre-wrap">
                    {selectedScan.fda_warning || 'No specific interaction warning recorded for this scan.'}
                  </p>
                </div>
              </div>

              {/* Fixed Footer Close Button */}
              <div className="flex-shrink-0 pt-2 border-t border-[#f0e8ff]">
                <button
                  onClick={() => setSelectedScan(null)}
                  className="w-full rounded-2xl bg-[#8b5cf6] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-md shadow-purple-500/20 hover:bg-[#7c3aed] transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}