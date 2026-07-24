import { useState, useEffect } from 'react';

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
    <div className="w-full max-w-sm mt-6 p-5 bg-gray-900 rounded-xl shadow-lg border border-gray-700">
      <h3 className="text-sm font-bold mb-4 text-gray-300 uppercase tracking-widest border-b border-gray-700 pb-2">
        Live Agent Workflow
      </h3>
      
      <ul className="space-y-4">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isPast = index < currentStep;

          return (
            <li key={index} className="flex items-center space-x-3">
              {/* Status Indicator Icon */}
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                {isPast ? (
                  <span className="text-severity-green text-lg font-bold">✓</span>
                ) : isActive ? (
                  <span className="w-4 h-4 border-2 border-severity-orange border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
                )}
              </div>
              
              {/* Text Formatting */}
              <span className={`text-sm font-medium transition-all duration-300 ${
                isActive ? 'text-severity-orange animate-pulse' : 
                isPast ? 'text-gray-500 line-through' : 
                'text-gray-600'
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