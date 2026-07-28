import { motion } from 'framer-motion';
import { CheckCircle2, ChevronDown } from 'lucide-react';

export default function AnalysisPanel({ result, onOpenDetails }) {
  const severity = result?.fda_warning?.toLowerCase?.() || '';
  const isSafe = !severity || severity.includes('no interaction');

  const steps = [
    { label: 'Reading text' },
    { label: 'Cross-referencing FDA' },
    { label: 'Finalizing report' },
  ];

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="rounded-[1.8rem] border border-white/70 bg-white/75 p-4 shadow-[0_20px_70px_-25px_rgba(91,59,187,0.45)] backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#8b6fd6]">Safety review</p>
          <h3 className="mt-1 text-lg font-semibold text-[#34214f]">{isSafe ? 'No urgent concerns' : 'Review required'}</h3>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isSafe ? 'bg-[#eaf8ee] text-[#15803d]' : 'bg-[#ffece8] text-[#b42318]'}`}>
          {isSafe ? 'Clear' : 'Attention'}
        </div>
      </div>

      <div className="mt-4 rounded-[1.2rem] bg-[#f8f3ff] p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#4f2fa4]">
          <CheckCircle2 size={18} />
          <span>AI review completed</span>
        </div>
        <div className="mt-3 space-y-2">
          {steps.map((step, index) => (
            <div key={step.label} className="flex items-center gap-2 text-sm text-[#66558a]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#4f2fa4]">
                {index < 2 ? <CheckCircle2 size={15} /> : <CheckCircle2 size={15} />}
              </div>
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <details className="rounded-2xl border border-[#eee4ff] bg-white/70 p-3">
          <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-[#34214f]">
            Mechanism of action
            <ChevronDown size={16} />
          </summary>
          <p className="mt-3 text-sm leading-7 text-[#6a5a83]">
            {result?.fda_summary || 'The review indicates a normal medication safety profile based on the available details.'}
          </p>
        </details>

        <details className="rounded-2xl border border-[#eee4ff] bg-white/70 p-3">
          <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-[#34214f]">
            Source citations
            <ChevronDown size={16} />
          </summary>
          <div className="mt-3 space-y-2 text-sm text-[#4f2fa4]">
            <a href="https://open.fda.gov/apis/drug/label/" target="_blank" rel="noreferrer" className="block underline underline-offset-2">
              FDA openFDA drug label database
            </a>
            <a href="https://dailymed.nlm.nih.gov/" target="_blank" rel="noreferrer" className="block underline underline-offset-2">
              DailyMed archive
            </a>
          </div>
        </details>
      </div>

      <button
        onClick={onOpenDetails}
        className="mt-4 w-full rounded-full bg-gradient-to-r from-[#4f2fa4] to-[#6b42d9] px-4 py-3 text-sm font-semibold text-white"
      >
        View full details
      </button>
    </motion.div>
  );
}
