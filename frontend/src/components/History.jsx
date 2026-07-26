import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export default function History() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scans, setScans] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!supabase) {
        setLoading(false);
        setError('Supabase is not configured.');
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }

      const user = userData?.user;

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error: historyError } = await supabase
        .from('scan_history')
        .select('id, created_at, status, drugs_detected, fda_warning')
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
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 py-4 glass-card">
      <div className="rounded-[1.75rem] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-lg">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-indigo-500">Saved scans</p>
            <h2 className="mt-2 text-2xl font-black text-[#34214f]">My history</h2>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/')}
            className="rounded-full border border-[#dfd0ff] bg-[#f7f1ff] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#4c2c97]"
          >
            Scan
          </motion.button>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-2xl border border-[#f3d8a2] bg-[#fff7e3] p-4 text-sm text-[#ae6f00]">
            Supabase is not configured.
          </div>
        )}

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
          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
            {scans.map((scan) => (
              <article key={scan.id} className="rounded-[1.35rem] border border-[#efe6ff] bg-white/80 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8b6fd6]">{new Date(scan.created_at).toLocaleString()}</p>
                    <p className="mt-1 text-sm font-semibold text-[#34214f] capitalize">{scan.status || 'saved scan'}</p>
                  </div>
                  <span className="rounded-full border border-[#e8dcff] bg-[#f5edff] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#5b3bbb]">
                    #{scan.id}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b6fd6]">Medications</p>
                    <p className="text-sm text-slate-700">
                      {Array.isArray(scan.drugs_detected) && scan.drugs_detected.length > 0
                        ? scan.drugs_detected.join(', ')
                        : 'No medications saved.'}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b6fd6]">FDA Warning</p>
                    <p className="text-sm leading-relaxed text-slate-700">
                      {scan.fda_warning || 'No warning recorded.'}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <Link
          to="/auth"
          className="mt-5 block w-full rounded-2xl border border-[#dfd0ff] bg-[#f7f1ff] px-4 py-3 text-center text-sm font-semibold text-[#4c2c97]"
        >
          Manage account
        </Link>
      </div>
    </div>
  );
}