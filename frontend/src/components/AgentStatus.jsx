import { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

export default function AgentStatus() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "Extracting handwritten text via Vision OCR...",
    "Normalizing medication names...",
    "Querying openFDA regulatory database...",
    "Structuring final safety report..."
  ];

  useEffect(() => {
    // We set varying timeouts to match the rough speed of your LangChain tools
    const timers = [
      setTimeout(() => setCurrentStep(1), 2000), // OCR phase
      setTimeout(() => setCurrentStep(2), 4000), // Normalizing phase
      setTimeout(() => setCurrentStep(3), 6500), // FDA fetch phase
      setTimeout(() => setCurrentStep(4), 8500)  // Finalizing phase
    ];

    // Cleanup timers if the user navigates away early
    return () => timers.forEach(clearTimeout); 
  }, []);

  return (
    <div className="w-full max-w-sm mt-4 rounded-[1.75rem] border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_-12px_rgba(139,92,246,0.15)] backdrop-blur-xl">
      <h3 className="mb-5 border-b border-[#dfd0ff] pb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#8b6fd6]">
        Live AI Analysis
      </h3>
      
      <ul className="space-y-5">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isPast = index < currentStep;

          return (
            <li key={index} className="flex items-center space-x-4">
              {/* Status Indicator Icon */}
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                {isPast ? (
                  <CheckCircle2 size={20} className="text-[#10b981]" /> // Emerald Green
                ) : isActive ? (
                  <Loader2 size={20} className="text-[#8b5cf6] animate-spin" /> // Theme Purple
                ) : (
                  <Circle size={16} className="text-[#dfd0ff]" /> // Light Pastel Gray/Purple
                )}
              </div>
              
              {/* Text Formatting with NO strikethrough, just soft opacity */}
              <span className={`text-sm transition-all duration-500 ${
                isActive ? 'text-[#201c45] font-bold scale-[1.02] origin-left' : 
                isPast ? 'text-[#7f6b9d] opacity-50 font-medium' : 
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