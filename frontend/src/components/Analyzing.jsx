import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
      
      <div className="flex flex-wrap justify-center gap-3 px-4">
        {images.map((image, index) => (
          <img 
            key={`${index}-${image.slice(0, 24)}`}
            src={image} 
            alt={`Captured ${index + 1}`} 
            className="w-24 h-24 object-cover border-2 border-gray-700 rounded-lg shadow-lg opacity-50" 
          />
        ))}
      </div>
      
      {/* The workflow visualizer */}
      <AgentStatus />

    </div>
  );
}