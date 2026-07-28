import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AgentStatus from './AgentStatus';

export default function Analyzing() {
  const location = useLocation();
  const navigate = useNavigate();
  const images = useMemo(
    () => location.state?.images ?? (location.state?.image ? [location.state.image] : []),
    [location.state],
  );

  useEffect(() => {
    if (images.length === 0) return;

    const triggerAI = async () => {
      try {
        // Send the queued Base64 images to the backend for concurrent OCR.
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${API_URL}/api/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ images })
        });
        
        const data = await response.json();
        console.log("Agent Final Output:", data);
        
        setTimeout(() => {
          if (data.status === "manual_entry_required") {
            navigate('/manual', { 
              state: { message: "Image too blurry or no drugs found. Please enter medications manually." } 
            });
          } else {
            navigate('/results', { state: { result: data } });
          }
        }, 1000);
        
      } catch (error) {
        console.error("Analysis failed:", error);
        // Fallback catch: force manual entry if the server completely crashes
        navigate('/manual', { 
          state: { message: "Server connection lost. Please enter medications manually." } 
        });
      }
    };

    triggerAI();
  }, [images, navigate]);

  if (images.length === 0) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-center px-4">
        <p className="text-lg font-bold text-[#201c45]">No image detected.</p>
        <button 
          onClick={() => navigate('/')} 
          className="mt-4 rounded-2xl bg-[#8b5cf6] px-6 py-3 font-semibold text-white shadow-md shadow-purple-500/25 transition-all hover:bg-[#7c3aed] active:scale-95"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center pt-8 space-y-6"
    >
      {/* Display captured images in sleek glass frames */}
      <div className="flex flex-wrap justify-center gap-4 px-4">
        {images.map((image, index) => (
          <motion.div
            key={`${index}-${image.slice(0, 24)}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="overflow-hidden rounded-[1.25rem] border border-white/60 bg-white/40 p-1.5 shadow-sm backdrop-blur-md"
          >
            <img 
              src={image} 
              alt={`Captured ${index + 1}`} 
              className="w-24 h-24 rounded-[1rem] object-cover opacity-80" 
            />
          </motion.div>
        ))}
      </div>
      
      {/* The workflow visualizer */}
      <AgentStatus />

    </motion.div>
  );
}