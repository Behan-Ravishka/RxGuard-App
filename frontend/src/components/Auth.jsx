import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSupabaseClient } from '../supabaseClient.jsx';
import { Lock } from 'lucide-react'; // Added decorative icon to match other pages

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { supabase, loading: supabaseLoading, error: configError } = useSupabaseClient();
  const [mode, setMode] = useState('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!supabase) {
      setError('Supabase is not ready yet.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'sign-up') {
        const { error: signUpError, data } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          throw signUpError;
        }

        if (data.session) {
          const redirectTo = typeof location.state?.from === 'string' ? location.state.from : '/profile';
          navigate(redirectTo, { replace: true });
          return;
        }

        setMessage('Account created. Check your email if confirmation is enabled, then sign in.');
        setMode('sign-in');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        const redirectTo = typeof location.state?.from === 'string' ? location.state.from : '/profile';
        navigate(redirectTo, { replace: true });
      }
    } catch (authError) {
      setError(authError?.message ?? 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-2 py-6">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="overflow-hidden rounded-[1.75rem] border border-white/60 bg-gradient-to-br from-[#f8f0ff] via-[#f1e6ff] to-[#eaddff] p-6 shadow-[0_8px_30px_-12px_rgba(139,92,246,0.15)] backdrop-blur-xl"
      >
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-lg shadow-purple-500/25">
            <Lock size={22} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#8b6fd6]">Secure access</p>
            <h2 className="mt-1 text-2xl font-black text-[#201c45]">
              {mode === 'sign-in' ? 'Welcome back' : 'Create account'}
            </h2>
          </div>
        </div>
        
        <p className="mb-6 text-sm leading-relaxed text-[#6a5a83]">
          Use a guest scan anytime, or sign in to save your history for future predictive modeling.
        </p>

        {supabaseLoading && (
          <div className="mb-5 rounded-[1.25rem] border border-blue-100/50 bg-blue-50/50 p-4 text-sm font-medium text-blue-600 backdrop-blur-md">
            Loading secure auth settings...
          </div>
        )}

        {configError ? (
          <div className="mb-5 rounded-[1.25rem] border border-amber-100/50 bg-amber-50/50 p-4 text-sm font-medium text-amber-600 backdrop-blur-md">
            {configError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#7f6b9d]">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-[1.25rem] border border-white/60 bg-white/60 px-4 py-3.5 text-[#201c45] outline-none backdrop-blur-md transition-all placeholder:text-[#a79bbd] focus:border-[#8b5cf6] focus:bg-white/90 focus:ring-2 focus:ring-[#8b5cf6]/20"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#7f6b9d]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-[1.25rem] border border-white/60 bg-white/60 px-4 py-3.5 text-[#201c45] outline-none backdrop-blur-md transition-all placeholder:text-[#a79bbd] focus:border-[#8b5cf6] focus:bg-white/90 focus:ring-2 focus:ring-[#8b5cf6]/20"
              placeholder="Minimum 6 characters"
              required
            />
          </div>

          {error && (
            <div className="rounded-[1.25rem] border border-rose-100/80 bg-rose-50/80 px-4 py-3.5 text-sm font-medium text-rose-600 backdrop-blur-md">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-[1.25rem] border border-emerald-100/80 bg-emerald-50/80 px-4 py-3.5 text-sm font-medium text-emerald-600 backdrop-blur-md">
              {message}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-2xl bg-[#8b5cf6] px-4 py-3.5 font-bold text-white shadow-md shadow-purple-500/25 transition-all hover:bg-[#7c3aed] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Working...' : mode === 'sign-in' ? 'Sign In' : 'Sign Up'}
          </motion.button>
        </form>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
          className="mt-3 w-full rounded-2xl border border-[#dfd0ff] bg-white/70 px-4 py-3.5 text-sm font-semibold text-[#34214f] shadow-sm transition-all hover:bg-white"
        >
          {mode === 'sign-in' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </motion.button>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-5 flex w-full justify-center text-sm font-semibold text-[#7f6b9d] underline underline-offset-4 transition-colors hover:text-[#34214f]"
        >
          Continue as guest
        </button>

      </motion.div>
    </div>
  );
}