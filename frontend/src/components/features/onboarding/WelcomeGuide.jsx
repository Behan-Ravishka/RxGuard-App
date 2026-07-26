import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ShieldCheck, HeartPulse } from 'lucide-react';
import Button from '../../common/Button';

const slides = [
  {
    title: 'Scan instantly',
    description: 'Capture a prescription photo and let the system read it securely in seconds.',
    icon: Camera,
  },
  {
    title: 'AI-powered safety',
    description: 'Cross-check the medication list against FDA insights and official references.',
    icon: ShieldCheck,
  },
  {
    title: 'Protect your health',
    description: 'Get clear guidance and keep follow-up care simple and confidence-building.',
    icon: HeartPulse,
  },
];

export default function WelcomeGuide({ onComplete }) {
  const [active, setActive] = useState(0);

  const current = slides[active];
  const Icon = current.icon;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,_#f8f3ff_0%,_#f3ebff_45%,_#e8ddff_100%)] px-4 py-10">
      <div className="w-full max-w-[420px] rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-[0_30px_80px_-35px_rgba(88,43,174,0.45)] backdrop-blur-xl">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8b6fd6]">
          <span>RxGuard</span>
          <span>{active + 1} / {slides.length}</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.title}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.24 }}
            className="mt-6 rounded-[1.6rem] bg-gradient-to-br from-[#ffffff] via-[#f8f3ff] to-[#efe6ff] p-6"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4f2fa4] to-[#6b42d9] text-white shadow-lg">
              <Icon size={28} />
            </div>
            <h2 className="mt-6 text-2xl font-black text-[#34214f]">{current.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[#6a5a83]">{current.description}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex justify-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => setActive(index)}
              className={`h-2.5 rounded-full transition-all ${active === index ? 'w-8 bg-[#4f2fa4]' : 'w-2.5 bg-[#d9ccf4]'}`}
            />
          ))}
        </div>

        <div className="mt-7 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setActive((prev) => Math.max(0, prev - 1))}>
            Back
          </Button>
          {active < slides.length - 1 ? (
            <Button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600" whileTap={{ scale: 0.95 }} onClick={() => setActive((prev) => prev + 1)}>
              Next
            </Button>
          ) : (
            <Button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600" whileTap={{ scale: 0.95 }} onClick={onComplete}>
              Get started
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
