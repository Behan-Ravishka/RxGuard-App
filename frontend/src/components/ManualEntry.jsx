import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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
    <div className="flex flex-col h-full space-y-6 pt-6">
      
      {/* Toast Notification for Camera Failures */}
      {toastMessage && (
        <div className="bg-severity-orange text-white p-4 rounded-xl shadow-lg flex items-center space-x-3 animate-bounce">
          <span className="text-2xl">⚠️</span>
          <p className="text-sm font-semibold">{toastMessage}</p>
        </div>
      )}

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 shadow-md flex-grow">
        <h2 className="text-xl font-bold mb-2">Manual Entry</h2>
        <p className="text-sm text-gray-400 mb-6">
          Type the names of the medications. Our system will auto-suggest the generic normalized names.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Drug 1 Input */}
          <div className="relative">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Medication 1
            </label>
            <input 
              type="text" 
              value={drug1}
              onChange={(e) => setDrug1(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg p-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="e.g., Aspirin"
              required
            />
            {suggestion1 && (
              <div 
                onClick={() => { setDrug1(suggestion1); setSuggestion1(null); }}
                className="absolute z-10 w-full mt-1 bg-blue-900 border border-blue-500 text-blue-100 p-3 rounded-lg text-sm cursor-pointer shadow-lg hover:bg-blue-800"
              >
                Did you mean: <span className="font-bold capitalize">{suggestion1}</span>?
              </div>
            )}
          </div>

          {/* Drug 2 Input */}
          <div className="relative">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Medication 2 (Optional)
            </label>
            <input 
              type="text" 
              value={drug2}
              onChange={(e) => setDrug2(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg p-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="e.g., Warfarin"
            />
            {suggestion2 && (
              <div 
                onClick={() => { setDrug2(suggestion2); setSuggestion2(null); }}
                className="absolute z-10 w-full mt-1 bg-blue-900 border border-blue-500 text-blue-100 p-3 rounded-lg text-sm cursor-pointer shadow-lg hover:bg-blue-800"
              >
                Did you mean: <span className="font-bold capitalize">{suggestion2}</span>?
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition-colors mt-8"
          >
            Check Interactions
          </button>
        </form>
      </div>
    </div>
  );
}