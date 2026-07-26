import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const quickActions = [
  { title: 'Scan', subtitle: 'Camera capture', icon: '📷', to: '/capture' },
  { title: 'Safety alerts', subtitle: 'Recent findings', icon: '🧪', to: '/alerts' },
  { title: 'Drug history', subtitle: 'Past reviews', icon: '🧾', to: '/history' },
  { title: 'Med profile', subtitle: 'Care plan', icon: '🩺', to: '/profile' },
];

const upcomingDoses = [
  { name: 'Metformin', time: '08:00', dose: '500 mg' },
  { name: 'Lisinopril', time: '12:30', dose: '10 mg' },
  { name: 'Vitamin D', time: '19:00', dose: '1 tab' },
];

const interactionFeed = [
  { title: 'Warfarin + Aspirin', severity: 'Contraindicated', tone: 'bg-[#ffe2e2] text-[#b42318]' },
  { title: 'Omeprazole + Clopidogrel', severity: 'Major', tone: 'bg-[#ffe9d6] text-[#b54708]' },
  { title: 'Simvastatin + Amiodarone', severity: 'Moderate', tone: 'bg-[#fff6cc] text-[#93370d]' },
];

export default function Dashboard() {
  return (
    <div className="space-y-4">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden rounded-[1.75rem] border border-white/50 bg-gradient-to-br from-[#fef7ff] via-[#f7ecff] to-[#efe7ff] p-5 shadow-sm backdrop-blur-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#8b6fd6]">
              Today at a glance
            </p>
            <h1 className="mt-2 text-2xl font-black text-[#3f2a69]">Scan new prescription</h1>
            <p className="mt-2 text-sm leading-6 text-[#66558a]">
              Review interactions instantly and keep medication plans safe in one place.
            </p>
          </div>
          <div className="flex h-12 w-20 items-center justify-center rounded-3xl bg-[#5b3bbb] text-2xl text-white shadow-lg">
            📷
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/capture"
              className="inline-flex items-center gap-2 rounded-full bg-[#4c2c97] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_40px_-14px_rgba(88,43,174,0.8)]"
            >
              Start scan
              <ArrowRight size={16} />
            </Link>
          </motion.div>
          <span className="rounded-full border border-[#e8dcff] bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7f66b4]">
            AI safety review
          </span>
        </div>
      </motion.section>

      <section className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <motion.div
            key={action.title}
            whileHover={{ y: -2, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <Link to={action.to} className="glass-card flex items-start gap-3 p-3 text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4ebff] text-xl text-[#5b3bbb]">
                {action.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#34214f]">{action.title}</p>
                <p className="mt-1 text-xs text-[#7f6b9d]">{action.subtitle}</p>
              </div>
            </Link>
          </motion.div>
        ))}
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
          <span className="text-sm font-semibold text-[#7f6b9d]">3 alerts</span>
        </div>

        <div className="mt-4 space-y-3">
          {interactionFeed.map((item) => (
            <motion.div
              key={item.title}
              whileHover={{ y: -2, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              className="flex items-start justify-between rounded-[1.35rem] border border-[#efe6ff] bg-white/80 px-3 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-[#34214f]">{item.title}</p>
                <p className="mt-1 text-xs text-[#7f6b9d]">Cross-checked with FDA and DailyMed</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.tone}`}>
                {item.severity}
              </span>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
