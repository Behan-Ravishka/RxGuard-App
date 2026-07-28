import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BellRing, ShieldAlert, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSupabaseClient } from '../supabaseClient.jsx';

function getAlertTone(severityLevel) {
  switch (severityLevel) {
    case 'critical':
      return {
        tone: 'text-red-600 bg-red-50',
        bar: 'bg-gradient-to-b from-red-500 to-rose-400',
        label: 'Critical',
      };
    case 'major':
      return {
        tone: 'text-amber-600 bg-amber-50',
        bar: 'bg-gradient-to-b from-amber-500 to-orange-400',
        label: 'Major',
      };
    case 'moderate':
      return {
        tone: 'text-sky-600 bg-sky-50',
        bar: 'bg-gradient-to-b from-sky-500 to-cyan-400',
        label: 'Moderate',
      };
    default:
      return {
        tone: 'text-emerald-600 bg-emerald-50',
        bar: 'bg-gradient-to-b from-emerald-500 to-lime-400',
        label: 'Safe',
      };
  }
}

export default function Alerts() {
  const { supabase, session } = useSupabaseClient();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const loadAlerts = async () => {
      if (!supabase || !session?.user) {
        setAlerts([]);
        return;
      }

      const { data } = await supabase
        .from('scan_history')
        .select('id, created_at, drugs_detected, fda_warning, severity_level')
        .eq('user_id', session.user.id)
        .neq('severity_level', 'none')
        .order('created_at', { ascending: false })
        .limit(10);

      setAlerts(data ?? []);
    };

    loadAlerts();
  }, [session, supabase]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="rounded-[1.75rem] border border-indigo-100/70 bg-white/80 p-4 shadow-sm backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-indigo-500/30">
            <BellRing size={20} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-indigo-500">Safety alerts</p>
            <h2 className="text-lg font-semibold text-slate-800">Medication watchlist</h2>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.length > 0 ? alerts.map((item) => {
          const title = Array.isArray(item.drugs_detected) && item.drugs_detected.length > 0
            ? item.drugs_detected.join(' + ')
            : 'Saved scan';
          const warningText = item.fda_warning || 'No warning recorded.';
          const tone = getAlertTone(item.severity_level);

          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -2, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              className="relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur-lg"
            >
              <div className={`absolute left-0 top-0 h-full w-1.5 ${tone.bar}`} />
              <div className="flex items-start justify-between gap-3 pl-2">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <ShieldAlert size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{title}</p>
                    <p className="mt-1 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{warningText}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone.tone}`}>{tone.label}</span>
              </div>
              <Link
                to="/history"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#dfd0ff] bg-[#f7f1ff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#4c2c97]"
              >
                View guidance
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          );
        }) : (
          <div className="rounded-[1.5rem] border border-white/60 bg-white/80 p-4 text-sm text-slate-600 shadow-sm backdrop-blur-lg">
            No active safety alerts yet. Run and save a scan to populate this watchlist.
          </div>
        )}
      </div>
    </motion.div>
  );
}
