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
    // Background updated to match the Splash Screen gradient
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fcebfe] via-[#eae6fb] to-[#d9dff9] px-4 py-10">
      
      {/* Soft glassmorphism card */}
      <div className="w-full max-w-[420px] rounded-[2rem] border border-white/60 bg-white/70 p-5 shadow-[0_20px_60px_-20px_rgba(139,92,246,0.25)] backdrop-blur-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.3em] text-[#8b5cf6]">
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
            className="mt-6 rounded-[1.6rem] bg-white/80 p-6 shadow-sm border border-white"
          >
            {/* Icon Container using the splash screen purple */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-lg shadow-purple-500/30">
              <Icon size={28} />
            </div>
            
            {/* Typography matching splash screen */}
            <h2 className="mt-6 text-2xl font-bold tracking-tight text-[#201c45]">{current.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[#4b5563]">{current.description}</p>
          </motion.div>
        </AnimatePresence>

        {/* Pagination Dots */}
        <div className="mt-6 flex justify-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => setActive(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${active === index ? 'w-8 bg-[#8b5cf6]' : 'w-2.5 bg-[#d1cceb]'}`}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-7 flex gap-3">
          <Button 
            variant="secondary" 
            className="flex-1 border-[#d1cceb] text-[#201c45] hover:bg-white" 
            onClick={() => setActive((prev) => Math.max(0, prev - 1))}
          >
            Back
          </Button>
          
          {active < slides.length - 1 ? (
            <Button 
              className="flex-1 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white border-none shadow-md" 
              whileTap={{ scale: 0.95 }} 
              onClick={() => setActive((prev) => prev + 1)}
            >
              Next
            </Button>
          ) : (
            <Button 
              className="flex-1 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white border-none shadow-md shadow-purple-500/25" 
              whileTap={{ scale: 0.95 }} 
              onClick={onComplete}
            >
              Get started
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}