import { motion } from 'framer-motion';
import { BellRing, ShieldAlert, ArrowRight } from 'lucide-react';

const alerts = [
  {
    title: 'Warfarin + Aspirin',
    detail: 'Potential interaction with increased bleeding risk. Consider an alternative or close monitoring.',
    severity: 'Critical',
    tone: 'text-red-600 bg-red-50',
    bar: 'bg-gradient-to-b from-red-500 to-rose-400',
  },
  {
    title: 'Omeprazole + Clopidogrel',
    detail: 'Possible reduced benefit of antiplatelet therapy. Review timing and dose strategy.',
    severity: 'Moderate',
    tone: 'text-amber-600 bg-amber-50',
    bar: 'bg-gradient-to-b from-amber-500 to-orange-400',
  },
  {
    title: 'Simvastatin + Amiodarone',
    detail: 'May elevate the risk of myopathy. A clinician check is advised.',
    severity: 'Moderate',
    tone: 'text-sky-600 bg-sky-50',
    bar: 'bg-gradient-to-b from-sky-500 to-cyan-400',
  },
];

export default function Alerts() {
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
        {alerts.map((item) => (
          <motion.div
            key={item.title}
            whileHover={{ y: -2, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            className="relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur-lg"
          >
            <div className={`absolute left-0 top-0 h-full w-1.5 ${item.bar}`} />
            <div className="flex items-start justify-between gap-3 pl-2">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.tone}`}>{item.severity}</span>
            </div>
            <motion.button
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              className="mt-4 inline-flex items-center gap-2 text-xs font-semibold rounded-full border border-[#dfd0ff] bg-[#f7f1ff] px-4 py-2 uppercase tracking-[0.16em] text-[#4c2c97]"
            >
              View guidance
              <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
