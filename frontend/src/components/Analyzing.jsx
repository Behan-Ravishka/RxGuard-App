import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AgentStatus from './AgentStatus';

export default function Analyzing() {
  const location = useLocation();
  const navigate = useNavigate();
  const image = location.state?.image;
  
  const [agentResult, setAgentResult] = useState(null);

  useEffect(() => {
    if (!image) return;

    const triggerAI = async () => {
      try {
        // 1. Convert the Base64 image back into a File object for Multer
        const res = await fetch(image);
        const blob = await res.blob();
        const formData = new FormData();
        formData.append('prescription', blob, 'prescription.jpg');

        // 2. Send it to your live backend (or local if in development)
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${API_URL}/api/analyze`, {
          method: 'POST',
          body: formData
        });
        
        // 3. Capture the final JSON from Gemini
        const data = await response.json();
        console.log("Agent Final Output:", data);
        
        // Save it to state so we know it finished
        setAgentResult(data);
        
        // 4. Check the AI status flag and route accordingly
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
      } // <--- FIX: Closes the catch block
    }; // <--- FIX: Closes the triggerAI function

    triggerAI();
  }, [image, navigate]);

  if (!image) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20">
        <p>No image detected.</p>
        <button onClick={() => navigate('/')} className="mt-4 bg-blue-600 px-4 py-2 rounded-lg font-semibold">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full pt-6 space-y-6">
      
      {/* A small thumbnail of what they captured */}
      <img 
        src={image} 
        alt="Captured" 
        className="w-32 h-32 object-cover border-2 border-gray-700 rounded-lg shadow-lg opacity-50" 
      />
      
      {/* The workflow visualizer */}
      <AgentStatus />

    </div>
  );
}