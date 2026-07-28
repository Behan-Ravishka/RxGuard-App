import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function FullDetails() {
  const location = useLocation();
  const navigate = useNavigate();

  const fdaRawText = location.state?.fda_raw_text ?? '';

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-1 py-4 mt-2">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-[1.75rem] border border-white/60 bg-gradient-to-br from-[#f8f0ff] via-[#f1e6ff] to-[#eaddff] p-5 shadow-sm backdrop-blur-xl"
      >
        
        {/* Header Section */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-lg shadow-purple-500/25">
              <BookOpen size={22} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8b6fd6]">
                Official Source
              </p>
              <h2 className="mt-1 text-xl font-black text-[#201c45]">
                Full FDA Details
              </h2>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/60 text-[#4c2c97] shadow-sm backdrop-blur-md transition-colors hover:bg-white"
            aria-label="Go back"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </motion.button>
        </div>

        {/* Scrollable Text Container */}
        <div className="max-h-[68vh] overflow-y-auto rounded-[1.25rem] border border-white/50 bg-white/60 p-5 shadow-inner backdrop-blur-sm">
          {fdaRawText ? (
            <p className="whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-[#4b5563]">
              {fdaRawText}
            </p>
          ) : (
            <p className="py-10 text-center text-sm font-medium italic text-[#7f6b9d]">
              No official FDA text was provided for this scan.
            </p>
          )}
        </div>
        
      </motion.div>
    </div>
  );
}