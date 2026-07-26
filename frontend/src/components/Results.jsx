import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const saveAttemptedRef = useRef(false);
  
  const result = location.state?.result;

  useEffect(() => {
    const saveResultToHistory = async () => {
      if (!result || saveAttemptedRef.current || !supabase) {
        return;
      }

      saveAttemptedRef.current = true;

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        return;
      }

      const payload = {
        user_id: user.id,
        status: result.status ?? 'success',
        drugs_detected: Array.isArray(result.drugs_detected) ? result.drugs_detected : [],
        fda_warning: result.fda_warning ?? '',
      };

      const { error } = await supabase.from('scan_history').insert([payload]);

      if (error) {
        console.error('[frontend/components/Results.jsx] Failed to save scan history:', error);
      }
    };

    saveResultToHistory();
  }, [result]);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20">
        <p className="text-gray-400 mb-4">No analysis data found.</p>
        <button onClick={() => navigate('/')} className="bg-blue-600 px-6 py-2 rounded-lg font-semibold">
          Scan Prescription
        </button>
      </div>
    );
  }

  const { status, drugs_detected = [], fda_summary = "", fda_raw_text = "", fda_warning = "" } = result;

  const getSeverityUI = (warning) => {
    if (!warning || warning.trim() === "") {
      return { label: 'SAFE / NO INTERACTION', bgColor: 'bg-severity-green', icon: '✅' };
    }
    
    const text = warning.toLowerCase();
    if (text.includes('contraindicated') || text.includes('severe')) {
      return { label: 'CONTRAINDICATED', bgColor: 'bg-severity-red', icon: '🛑' };
    }
    if (text.includes('major')) {
      return { label: 'MAJOR INTERACTION', bgColor: 'bg-severity-orange', icon: '⚠️' };
    }
    if (text.includes('moderate')) {
      return { label: 'MODERATE INTERACTION', bgColor: 'bg-severity-yellow', icon: '🟡' };
    }
    
    return { label: 'MINOR INTERACTION', bgColor: 'bg-severity-green', icon: 'ℹ️' };
  };

  const severityUI = getSeverityUI(fda_summary || fda_warning);

  const handleReadFullDetails = () => {
    navigate('/details', {
      state: {
        fda_raw_text,
      },
    });
  };

  return (
    <div className="flex flex-col h-full space-y-5 pb-8 mt-2">
      
      {/* 1. Primary Alert Card */}
      <div className={`${severityUI.bgColor} text-white p-5 rounded-xl shadow-lg flex items-center space-x-4`}>
        <span className="text-4xl drop-shadow-md">{severityUI.icon}</span>
        <div>
          <h2 className="text-lg font-bold tracking-wide">{severityUI.label}</h2>
          <p className="text-xs opacity-90 mt-1 font-medium">
            {status === "manual_entry_required" ? "Verification Required" : "Automated Safety Check Complete"}
          </p>
        </div>
      </div>

      {/* 2. Medication Breakdown */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-700 shadow-md">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
          Extracted Medications
        </h3>
        
        {drugs_detected.length > 0 ? (
          <ul className="space-y-3">
            {drugs_detected.map((drug, index) => (
              <li key={index} className="flex items-center space-x-3 bg-gray-800 p-3 rounded-lg border border-gray-700">
                <span className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300">
                  {index + 1}
                </span>
                <span className="text-lg font-semibold text-white capitalize">{drug}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400 italic">No valid medications detected.</p>
        )}
      </div>

      {/* 3. Interaction Details */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-700 shadow-md">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
          FDA Interaction Details
        </h3>
        
        {fda_summary ? (
          <>
            <p className="text-sm text-gray-300 leading-relaxed font-medium">
              {fda_summary}
            </p>

            {fda_raw_text ? (
              <button
                onClick={handleReadFullDetails}
                className="mt-4 inline-flex items-center justify-center rounded-full border border-gray-600 bg-gray-800 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-gray-700"
              >
                Read Full Official FDA Documentation
              </button>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-gray-400 italic">
            No known adverse interactions found between these medications based on current openFDA data.
          </p>
        )}
      </div>

      {/* 4. NEW: Source Citation Portal */}
      <div className="bg-gray-950 rounded-xl p-5 border border-gray-800 shadow-inner">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center space-x-2">
          <span>🔗</span>
          <span>Verified Sources</span>
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Data dynamically cross-referenced using official government regulatory databases:
        </p>
        <ul className="space-y-2">
          <li>
            <a 
              href="https://open.fda.gov/apis/drug/label/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center"
            >
              U.S. openFDA Structured Product Labeling (SPL) API
            </a>
          </li>
          {/* Dynamically create a DailyMed search link for each drug found */}
          {drugs_detected.map((drug, index) => (
            <li key={index}>
              <a 
                href={`https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=${encodeURIComponent(drug)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center capitalize"
              >
                NIH DailyMed Database: {drug}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Try Again Button */}
      <button 
        onClick={() => navigate('/')} 
        className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-xl border border-gray-600 transition-colors mt-2"
      >
        Scan Another Prescription
      </button>

      {/* 5. NEW: Legal Disclaimer */}
      <div className="text-center px-4 pt-2">
        <p className="text-[10px] leading-tight text-gray-500 uppercase tracking-wide">
          ⚠️ RxGuard is a safety companion, not a diagnostic tool. 
          <br className="my-1" />
          Always consult a healthcare professional before altering medication.
        </p>
      </div>

    </div>
  );
}