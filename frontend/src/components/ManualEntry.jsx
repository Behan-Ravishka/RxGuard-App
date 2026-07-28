import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Keyboard, Pill, Search } from 'lucide-react';

export default function ManualEntry() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [drug1, setDrug1] = useState('');
  const [drug2, setDrug2] = useState('');
  const [suggestion1, setSuggestion1] = useState(null);
  const [suggestion2, setSuggestion2] = useState(null);

  // Display the friendly toast notification if redirected from a blurry image
  const toastMessage = location.state?.message;

  // Autocomplete fetcher linking to your Python FastAPI from Phase 1
  const fetchSuggestion = async (text, setSuggestion) => {
    if (text.length < 3) {
      setSuggestion(null);
      return;
    }
    try {
      // Assuming your Phase 1 Python NameNormalizer runs on port 8000 locally
      const PYTHON_URL = import.meta.env.VITE_PYTHON_URL || 'http://localhost:8000';
      const res = await fetch(`${PYTHON_URL}/normalize?drug_name=${encodeURIComponent(text)}`);
      if (res.ok) {
        const data = await res.json();
        // Adjust 'normalized_name' based on your exact Python JSON response key
        if (data.normalized_name && data.normalized_name.toLowerCase() !== text.toLowerCase()) {
          setSuggestion(data.normalized_name);
        }
      }
    } catch {
      // Fail silently if the Python server is offline, allowing standard typing
      setSuggestion(null);
    }
  };

  // Debounced effect for Input 1
  useEffect(() => {
    const timer = setTimeout(() => fetchSuggestion(drug1, setSuggestion1), 500);
    return () => clearTimeout(timer);
  }, [drug1]);

  // Debounced effect for Input 2
  useEffect(() => {
    const timer = setTimeout(() => fetchSuggestion(drug2, setSuggestion2), 500);
    return () => clearTimeout(timer);
  }, [drug2]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Construct a simulated payload to feed directly into the Results dashboard
    const manualPayload = {
      status: "success",
      drugs_detected: [drug1, drug2].filter(d => d.trim() !== ""),
      fda_warning: "Manual entry bypass. To run a full FDA check, this array must be passed back through the AgentExecutor FDA tool."
    };

    navigate('/results', { state: { result: manualPayload } });
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-2 py-4">
      
      {/* Toast Notification for Camera Failures */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-3 rounded-[1.25rem] border border-amber-200/60 bg-amber-50/80 p-4 text-amber-700 shadow-sm backdrop-blur-md"
          >
            <AlertCircle size={20} className="shrink-0 text-amber-500" />
            <p className="text-sm font-semibold leading-snug">{toastMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-grow rounded-[1.75rem] border border-white/60 bg-gradient-to-br from-[#f8f0ff] via-[#f1e6ff] to-[#eaddff] p-6 shadow-[0_8px_30px_-12px_rgba(139,92,246,0.15)] backdrop-blur-xl"
      >
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-lg shadow-purple-500/25">
            <Keyboard size={22} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#201c45]">Manual Entry</h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b6fd6] mt-1">
              Direct input mode
            </p>
          </div>
        </div>
        
        <p className="mb-6 text-sm leading-relaxed text-[#6a5a83]">
          Type the names of the medications. Our system will auto-suggest the generic normalized names.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Drug 1 Input */}
          <div className="relative">
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#7f6b9d]">
              Medication 1
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#a79bbd]">
                <Pill size={18} />
              </div>
              <input 
                type="text" 
                value={drug1}
                onChange={(e) => setDrug1(e.target.value)}
                className="w-full rounded-[1.25rem] border border-white/60 bg-white/60 py-3.5 pl-11 pr-4 text-[#201c45] outline-none backdrop-blur-md transition-all placeholder:text-[#a79bbd] focus:border-[#8b5cf6] focus:bg-white/90 focus:ring-2 focus:ring-[#8b5cf6]/20"
                placeholder="e.g., Aspirin"
                required
              />
            </div>
            
            <AnimatePresence>
              {suggestion1 && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  onClick={() => { setDrug1(suggestion1); setSuggestion1(null); }}
                  className="absolute z-20 mt-2 flex w-full cursor-pointer items-center gap-2 rounded-[1rem] border border-[#dfd0ff] bg-white/95 p-3.5 text-sm font-medium text-[#4c2c97] shadow-lg backdrop-blur-md transition-colors hover:bg-[#f4ebff]"
                >
                  <Search size={16} className="text-[#8b5cf6]" />
                  <span>Did you mean: <span className="font-bold capitalize">{suggestion1}</span>?</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Drug 2 Input */}
          <div className="relative">
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#7f6b9d]">
              Medication 2 <span className="opacity-60">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#a79bbd]">
                <Pill size={18} />
              </div>
              <input 
                type="text" 
                value={drug2}
                onChange={(e) => setDrug2(e.target.value)}
                className="w-full rounded-[1.25rem] border border-white/60 bg-white/60 py-3.5 pl-11 pr-4 text-[#201c45] outline-none backdrop-blur-md transition-all placeholder:text-[#a79bbd] focus:border-[#8b5cf6] focus:bg-white/90 focus:ring-2 focus:ring-[#8b5cf6]/20"
                placeholder="e.g., Warfarin"
              />
            </div>

            <AnimatePresence>
              {suggestion2 && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  onClick={() => { setDrug2(suggestion2); setSuggestion2(null); }}
                  className="absolute z-10 mt-2 flex w-full cursor-pointer items-center gap-2 rounded-[1rem] border border-[#dfd0ff] bg-white/95 p-3.5 text-sm font-medium text-[#4c2c97] shadow-lg backdrop-blur-md transition-colors hover:bg-[#f4ebff]"
                >
                  <Search size={16} className="text-[#8b5cf6]" />
                  <span>Did you mean: <span className="font-bold capitalize">{suggestion2}</span>?</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit" 
            className="mt-8 w-full rounded-2xl bg-[#8b5cf6] px-4 py-4 font-bold text-white shadow-md shadow-purple-500/25 transition-all hover:bg-[#7c3aed]"
          >
            Check Interactions
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}