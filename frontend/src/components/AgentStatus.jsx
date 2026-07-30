import { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Circle, HeartPulse, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AgentStatus() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "Extracting handwritten text via Vision OCR...",
    "Normalizing medication names...",
    "Querying openFDA regulatory database...",
    "Structuring final safety report..."
  ];

  useEffect(() => {
    const timers = [
      setTimeout(() => setCurrentStep(1), 2000), // OCR phase
      setTimeout(() => setCurrentStep(2), 4000), // Normalizing phase
      setTimeout(() => setCurrentStep(3), 6500), // FDA fetch phase
      setTimeout(() => setCurrentStep(4), 8500)  // Finalizing phase
    ];

    return () => timers.forEach(clearTimeout); 
  }, []);

  return (
    <div className="w-full max-w-sm mt-4 rounded-[1.75rem] border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_-12px_rgba(139,92,246,0.15)] backdrop-blur-xl">
      
      {/* Modern Healthcare Pulse Banner */}
      <div className="relative mb-5 flex items-center justify-between border-b border-[#dfd0ff] pb-4">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8b6fd6]">
            Live AI Analysis
          </h3>
          <p className="text-xs font-semibold text-[#201c45]">Cross-referencing FDA Databases</p>
        </div>

        {/* Pulsing Medical Radar Indicator */}
        <div className="relative flex h-10 w-10 items-center justify-center">
          <motion.span
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-full w-full rounded-full bg-[#8b5cf6]/30"
          />
          <motion.span
            animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.2, 0.8] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            className="absolute h-3/4 w-3/4 rounded-full bg-[#8b5cf6]/40"
          />
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-md shadow-purple-500/30">
            <HeartPulse size={16} className="animate-pulse" />
          </div>
        </div>
      </div>

      {/* ECG Animated Wave Bar */}
      <div className="mb-5 overflow-hidden rounded-full bg-[#f1e6ff] p-1">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="h-1.5 w-1/3 rounded-full bg-gradient-to-r from-transparent via-[#8b5cf6] to-transparent shadow-[0_0_12px_#8b5cf6]"
        />
      </div>
      
      {/* Steps List */}
      <ul className="space-y-4">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isPast = index < currentStep;

          return (
            <li key={index} className="flex items-center space-x-3.5">
              {/* Status Indicator Icon */}
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                {isPast ? (
                  <CheckCircle2 size={20} className="text-[#10b981]" />
                ) : isActive ? (
                  <div className="relative flex items-center justify-center">
                    <Loader2 size={20} className="text-[#8b5cf6] animate-spin" />
                    <Activity size={10} className="absolute text-[#8b5cf6]" />
                  </div>
                ) : (
                  <Circle size={16} className="text-[#dfd0ff]" />
                )}
              </div>
              
              {/* Text Formatting */}
              <span className={`text-xs transition-all duration-300 ${
                isActive ? 'text-[#201c45] font-bold scale-[1.01] origin-left' : 
                isPast ? 'text-[#7f6b9d] opacity-60 font-medium' : 
                'text-[#a79bbd] font-medium'
              }`}>
                {step}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}