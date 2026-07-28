import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Scan, AlertTriangle, FileText, UserPlus } from 'lucide-react';
import scanCardImage from "../assets/scan_card.png";
import { useSupabaseClient } from '../supabaseClient.jsx';

// Updated quickActions array with Lucide icons and exact titles from the image
const quickActions = [
  { title: 'Scan', icon: Scan, to: '/capture' },
  { title: 'Safety Alerts', icon: AlertTriangle, to: '/alerts' },
  { title: 'Drug History', icon: FileText, to: '/history' },
  { title: 'Med Profile', icon: UserPlus, to: '/profile' },
];

const upcomingDoses = [
  { name: 'Metformin', time: '08:00', dose: '500 mg' },
  { name: 'Lisinopril', time: '12:30', dose: '10 mg' },
  { name: 'Vitamin D', time: '19:00', dose: '1 tab' },
];

function getSeverityTone(severityLevel) {
  switch (severityLevel) {
    case 'critical':
      return 'bg-[#ffe2e2] text-[#b42318]';
    case 'major':
      return 'bg-[#ffe9d6] text-[#b54708]';
    case 'moderate':
      return 'bg-[#fff6cc] text-[#93370d]';
    default:
      return 'bg-[#eaf8ee] text-[#15803d]';
  }
}

export default function Dashboard() {
  const { supabase, session } = useSupabaseClient();
  const [latestChecks, setLatestChecks] = useState([]);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!supabase || !session?.user) {
        setLatestChecks([]);
        setAlertCount(0);
        return;
      }

      const { data, count } = await supabase
        .from('scan_history')
        .select('id, created_at, drugs_detected, fda_warning, severity_level', { count: 'exact' })
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      setLatestChecks(data ?? []);
      setAlertCount(count ?? 0);
    };

    loadDashboardData();
  }, [session, supabase]);

  return (
    <div className="space-y-4">
      {/* New Hero Scan Card */}
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

      {/* Quick Actions Section */}
      <section className="grid grid-cols-4 gap-2.5">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.title}
              whileHover={{ y: -2, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <Link 
                to={action.to} 
                className="flex aspect-square flex-col items-center justify-center gap-2.5 rounded-[1.25rem] bg-white/80 p-2 text-center shadow-[0_4px_20px_-4px_rgba(139,92,246,0.12)] border border-white/60 backdrop-blur-md"
              >
                <div className="text-[#8b5cf6]">
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                <p className="text-[10px] font-bold text-[#34214f] leading-tight w-full break-words">
                  {action.title}
                </p>
              </Link>
            </motion.div>
          );
        })}
      </section>

      <section className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#8b6fd6]">Upcoming dose</p>
            <h2 className="mt-1 text-lg font-semibold text-[#34214f]">Medication plan</h2>
          </div>
          <span className="rounded-full bg-[#f2ebff] px-3 py-1 text-xs font-semibold text-[#5b3bbb]">3 scheduled</span>
        </div>

        <div className="mt-4 space-y-3">
          {upcomingDoses.map((dose) => (
            <motion.div
              key={dose.name}
              whileHover={{ y: -2, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              className="flex items-center justify-between rounded-[1.35rem] border border-[#efe6ff] bg-white/80 px-3 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-[#34214f]">{dose.name}</p>
                <p className="mt-1 text-xs text-[#7f6b9d]">{dose.dose}</p>
              </div>
              <span className="rounded-full bg-[#f5edff] px-3 py-1 text-sm font-semibold text-[#5b3bbb]">
                {dose.time}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#8b6fd6]">Interaction history</p>
            <h2 className="mt-1 text-lg font-semibold text-[#34214f]">Latest safety checks</h2>
          </div>
          <span className="text-sm font-semibold text-[#7f6b9d]">{alertCount} alerts</span>
        </div>

        <div className="mt-4 space-y-3">
          {latestChecks.length > 0 ? latestChecks.map((item) => {
            const warningText = item.fda_warning || 'No warning recorded.';
            const severityLabel = item.severity_level || 'none';

            return (
            <motion.div
              key={item.id}
              whileHover={{ y: -2, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              className="flex items-start justify-between rounded-[1.35rem] border border-[#efe6ff] bg-white/80 px-3 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-[#34214f]">
                  {Array.isArray(item.drugs_detected) && item.drugs_detected.length > 0
                    ? item.drugs_detected.join(' + ')
                    : 'Saved scan'}
                </p>
                <p className="mt-1 text-xs text-[#7f6b9d]">
                  {new Date(item.created_at).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-[#7f6b9d] line-clamp-2">
                  {warningText}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getSeverityTone(severityLabel)}`}>
                {severityLabel}
              </span>
            </motion.div>
            );
          }) : (
            <div className="rounded-[1.35rem] border border-[#efe6ff] bg-white/80 px-3 py-4 text-sm text-[#7f6b9d]">
              Sign in and run a scan to see real interaction history here.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}