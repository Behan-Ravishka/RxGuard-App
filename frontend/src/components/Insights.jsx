import { motion } from 'framer-motion';
import { Brain, TrendingUp, ShieldAlert, Sparkles, Lock } from 'lucide-react';

export default function Insights() {
  return (
    <div className="space-y-4">
      
      {/* Header Section */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden rounded-[1.75rem] border border-white/60 bg-gradient-to-br from-[#f8f0ff] via-[#f1e6ff] to-[#eaddff] p-6 shadow-sm backdrop-blur-lg"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-lg shadow-purple-500/25">
            <Brain size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#201c45]">Health Insights</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b6fd6]">
              Powered by AI
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-[#4b5563]">
          AI-powered predictions that analyze your medication history and health trends to identify potential risks early. Receive personalized insights that help you take preventive action before health issues become more serious.
        </p>
      </motion.section>

      {/* Phase 2: Predictive AI Section */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative overflow-hidden rounded-[1.75rem] border border-[#dfd0ff] bg-white/70 p-5 shadow-[0_4px_20px_-4px_rgba(139,92,246,0.08)] backdrop-blur-md"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#8b5cf6]" />
            <h2 className="text-base font-bold text-[#201c45]">Predictive Analysis</h2>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-[#f2ebff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5b3bbb]">
            <Lock size={10} /> Phase 2
          </span>
        </div>
        
        <p className="text-sm leading-relaxed text-[#6a5a83] mb-5">
          Integrated Machine Learning models will analyze 3-6 months of user timeline data to flag early health risk patterns before symptoms emerge.
        </p>

        {/* Mocked Upcoming ML Features */}
        <div className="space-y-3 opacity-60">
          <div className="flex items-center gap-3 rounded-[1.25rem] border border-dashed border-[#dfd0ff] bg-white/40 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#34214f]">Rising Cholesterol Alert</h3>
              <p className="text-xs text-[#7f6b9d]">Based on statin efficacy trends</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 rounded-[1.25rem] border border-dashed border-[#dfd0ff] bg-white/40 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#34214f]">Vitamin Deficiency Risk</h3>
              <p className="text-xs text-[#7f6b9d]">Correlated with recent prescriptions</p>
            </div>
          </div>
        </div>
      </motion.section>
      
    </div>
  );
}