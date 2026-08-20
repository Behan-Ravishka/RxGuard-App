import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Camera, Keyboard } from 'lucide-react';
import AgentStatus from './AgentStatus';
import { useSupabaseClient } from '../supabaseClient.jsx';

export default function Analyzing() {
  const { session } = useSupabaseClient();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const images = useMemo(
    () => location.state?.images ?? (location.state?.image ? [location.state.image] : []),
    [location.state],
  );

  useEffect(() => {
    if (images.length === 0) return;

    const triggerAI = async () => {
      try {
        const RAW_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const CLEAN_URL = RAW_URL.replace(/\/$/, ""); 
        
        const response = await fetch(`${CLEAN_URL}/api/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
          },
          body: JSON.stringify({ images })
        });
        
        const data = await response.json();
        console.log("Agent Final Output:", data);
        
        setTimeout(() => {
          if (data.status === "manual_entry_required" || data.error) {
            setErrorMessage("Image too blurry or no identifiable medications were found. Please try again or enter them manually.");
            setHasError(true);
          } else {
            navigate('/results', { state: { result: data } });
          }
        }, 1000);
        
      } catch (error) {
        console.error("Analysis failed:", error);
        setErrorMessage("Server connection lost or analysis failed. Please verify your connection.");
        setHasError(true);
      }
    };

    // Only trigger AI if we haven't hit an error yet
    if (!hasError) {
      triggerAI();
    }
  }, [images, navigate, session, hasError]);

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
    <div className="flex flex-col items-center justify-center pt-8 space-y-6 px-4">
      
      {/* Display captured images */}
      <div className="flex flex-wrap justify-center gap-4">
        {images.map((image, index) => (
          <motion.div
            key={`${index}-${image.slice(0, 24)}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`overflow-hidden rounded-[1.25rem] border ${hasError ? 'border-rose-300' : 'border-white/60'} bg-white/40 p-1.5 shadow-sm backdrop-blur-md transition-colors`}
          >
            <img 
              src={image} 
              alt={`Captured ${index + 1}`} 
              className={`w-24 h-24 rounded-[1rem] object-cover transition-opacity ${hasError ? 'opacity-50 grayscale' : 'opacity-80'}`} 
            />
          </motion.div>
        ))}
      </div>
      
      <AnimatePresence mode="wait">
        {!hasError ? (
          <motion.div key="status-visualizer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} className="w-full">
            <AgentStatus />
          </motion.div>
        ) : (
          <motion.div 
            key="error-dialog"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-md rounded-[1.75rem] border border-rose-200/60 bg-gradient-to-br from-rose-50 to-white p-6 shadow-xl shadow-rose-500/10 backdrop-blur-xl text-center"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-500 mb-4">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-xl font-black text-[#201c45]">Analysis Interrupted</h3>
            <p className="mt-2 text-sm text-slate-600 font-medium leading-relaxed">
              {errorMessage}
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button 
                onClick={() => navigate('/capture')}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8b5cf6] px-4 py-3.5 font-bold text-white shadow-md shadow-purple-500/25 transition-all hover:bg-[#7c3aed] active:scale-95"
              >
                <Camera size={18} />
                Retake Photo
              </button>
              <button 
                onClick={() => navigate('/manual')}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#dfd0ff] bg-white/80 px-4 py-3.5 font-bold text-[#4c2c97] shadow-sm transition-all hover:bg-[#f4ebff] active:scale-95"
              >
                <Keyboard size={18} />
                Enter Manually
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}