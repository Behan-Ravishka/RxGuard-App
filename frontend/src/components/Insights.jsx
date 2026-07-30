import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, ShieldAlert, Sparkles, Lock, Activity, Heart } from 'lucide-react';
import { useSupabaseClient } from '../supabaseClient.jsx';

const IconMap = {
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Brain,
  Activity,
  Heart
};

export default function Insights() {
  const { session } = useSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInsights = async () => {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await fetch('http://127.0.0.1:5000/api/insights', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        const responseText = await response.text();
        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          // Extract text from HTML tag preview
          const cleanText = responseText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
          throw new Error(`Server returned non-JSON response: "${cleanText}"`);
        }

        const data = JSON.parse(responseText);

        if (!response.ok) {
          throw new Error(data.error || `Server error: ${response.status}`);
        }

        if (data.status === 'success' && Array.isArray(data.insights)) {
          setInsights(data.insights);
        } else {
          throw new Error('Invalid response format received from server.');
        }
      } catch (err) {
        console.error('[Insights] Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [session]);

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden rounded-[1.75rem] border border-white/60 bg-gradient-to-br from-[#f8f0ff] via-[#f1e6ff] to-[#eaddff] p-6 shadow-sm backdrop-blur-lg"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-lg shadow-purple-500/25">
            <Brain size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#201c45]">Health Insights</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b6fd6]">
              Powered by AI
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-[#4b5563]">
          AI-powered predictions that analyze your medication history and health trends to identify potential risks early. Receive personalized insights that help you take preventive action before health issues become more serious.
        </p>
      </motion.section>

      {/* Predictive AI Section */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative overflow-hidden rounded-[1.75rem] border border-[#dfd0ff] bg-white/70 p-5 shadow-[0_4px_20px_-4px_rgba(139,92,246,0.08)] backdrop-blur-md"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#8b5cf6]" />
            <h2 className="text-base font-bold text-[#201c45]">Predictive Analysis</h2>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-[#f2ebff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5b3bbb]">
            <Lock size={10} /> Active
          </span>
        </div>
        
        <p className="text-sm leading-relaxed text-[#6a5a83] mb-5">
          Integrated Machine Learning models are actively analyzing your scan history to flag early health risk patterns before symptoms emerge.
        </p>

        {error && (
          <div className="p-3 mb-4 text-sm text-rose-500 bg-rose-50 rounded-xl border border-rose-100">
            Error loading insights: {error}
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <>
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-[1.25rem] border border-dashed border-[#dfd0ff] bg-white/40 p-3 animate-pulse">
                  <div className="h-10 w-10 rounded-xl bg-[#dfd0ff]/50"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-1/2 rounded bg-[#dfd0ff]/50"></div>
                    <div className="h-2.5 w-3/4 rounded bg-[#dfd0ff]/30"></div>
                  </div>
                </div>
              ))}
            </>
          ) : insights.length === 0 ? (
            <div className="p-4 text-center text-sm text-[#6a5a83] bg-white/50 rounded-2xl border border-[#dfd0ff]">
              No insights available yet. Scan a prescription while signed in to generate health predictions.
            </div>
          ) : (
            insights.map((insight, index) => {
              const IconComponent = IconMap[insight.icon] || Sparkles;
              const colorClasses = {
                rose: "bg-rose-50 text-rose-500",
                amber: "bg-amber-50 text-amber-500",
                indigo: "bg-indigo-50 text-indigo-500",
                emerald: "bg-emerald-50 text-emerald-500",
                blue: "bg-blue-50 text-blue-500",
                purple: "bg-purple-50 text-purple-500"
              }[insight.color] || "bg-indigo-50 text-indigo-500";

              return (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  key={index} 
                  className="flex items-center gap-3 rounded-[1.25rem] border border-solid border-[#dfd0ff] bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClasses}`}>
                    <IconComponent size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#34214f]">{insight.title}</h3>
                    <p className="text-xs text-[#7f6b9d] leading-snug mt-0.5">{insight.description}</p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.section>
    </div>
  );
}