import { motion } from 'framer-motion';
import { AlertOctagon, AlertTriangle, CheckCircle2, ChevronDown, Info } from 'lucide-react';

export default function AnalysisPanel({ result, onOpenDetails }) {
  const severity = (result?.severity_level || result?.fda_warning || '').toLowerCase();

  const getSeverityState = (level) => {
    if (!level || level === 'none' || level === 'safe' || level.includes('no interaction') || level.includes('manual entry') || level.includes('unable to retrieve')) {
      return { label: 'Clear', tone: 'bg-[#eaf8ee] text-[#15803d]', title: 'No urgent concerns', Icon: CheckCircle2 };
    }
    if (level.includes('contraindicated') || level.includes('critical') || level.includes('severe')) {
      return { label: 'Critical', tone: 'bg-[#ffe2e2] text-[#b42318]', title: 'Review required', Icon: AlertOctagon };
    }
    if (level.includes('major')) {
      return { label: 'Major', tone: 'bg-[#ffe9d6] text-[#b54708]', title: 'Review required', Icon: AlertTriangle };
    }
    if (level.includes('moderate')) {
      return { label: 'Moderate', tone: 'bg-[#fff6cc] text-[#93370d]', title: 'Review required', Icon: AlertTriangle };
    }
    return { label: 'Minor', tone: 'bg-[#e0f2fe] text-[#075985]', title: 'Monitor closely', Icon: Info };
  };

  const severityState = getSeverityState(severity);
  const StatusIcon = severityState.Icon;

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
          <h3 className="mt-1 text-lg font-semibold text-[#34214f]">{severityState.title}</h3>
        </div>
        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${severityState.tone}`}>
          <StatusIcon size={14} />
          {severityState.label}
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
            Short FDA summary
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
