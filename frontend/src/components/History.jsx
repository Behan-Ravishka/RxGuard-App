import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 py-6">
      <div className="rounded-3xl border border-gray-800 bg-gray-950 p-5 shadow-2xl shadow-black/30">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Saved Scans</p>
            <h2 className="mt-2 text-2xl font-black text-white">My History</h2>
          </div>

          <button
            onClick={() => navigate('/')}
            className="rounded-full border border-gray-700 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-gray-200"
          >
            Scan
          </button>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-2xl border border-amber-700/50 bg-amber-950/40 p-4 text-sm text-amber-200">
            Supabase is not configured.
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">
            Loading history...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-800 bg-red-950/60 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : scans.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">
            No saved scans yet. Sign in and run a scan to start building your timeline.
          </div>
        ) : (
          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
            {scans.map((scan) => (
              <article key={scan.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">{new Date(scan.created_at).toLocaleString()}</p>
                    <p className="mt-1 text-sm font-semibold text-white capitalize">{scan.status || 'saved scan'}</p>
                  </div>
                  <span className="rounded-full border border-gray-700 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">
                    #{scan.id}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Medications</p>
                    <p className="text-sm text-gray-200">
                      {Array.isArray(scan.drugs_detected) && scan.drugs_detected.length > 0
                        ? scan.drugs_detected.join(', ')
                        : 'No medications saved.'}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">FDA Warning</p>
                    <p className="text-sm leading-relaxed text-gray-300">
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
          className="mt-5 block w-full rounded-2xl border border-gray-700 px-4 py-3 text-center text-sm font-semibold text-gray-200"
        >
          Manage Account
        </Link>
      </div>
    </div>
  );
}