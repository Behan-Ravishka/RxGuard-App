import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
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
          navigate('/');
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

        navigate('/');
      }
    } catch (authError) {
      setError(authError?.message ?? 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-4 glass-card">
      <div className="rounded-[1.75rem] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-lg">
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-indigo-500">Secure access</p>
          <h2 className="mt-2 text-2xl font-black text-[#34214f]">{mode === 'sign-in' ? 'Sign in' : 'Create account'}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Use a guest scan anytime, or sign in to save your history for future predictive modeling.
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-2xl border border-[#f3d8a2] bg-[#fff7e3] p-4 text-sm text-[#ae6f00]">
            Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the frontend environment.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#8b6fd6]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-[#e8dcff] bg-[#f9f7ff] px-4 py-3 text-slate-800 outline-none transition-colors focus:border-[#8a69d0]"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#8b6fd6]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-[#e8dcff] bg-[#f9f7ff] px-4 py-3 text-slate-800 outline-none transition-colors focus:border-[#8a69d0]"
              placeholder="Minimum 6 characters"
              required
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-bold text-white transition-transform disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Working...' : mode === 'sign-in' ? 'Sign In' : 'Sign Up'}
          </motion.button>
        </form>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
          className="mt-4 w-full rounded-2xl border border-[#dfd0ff] bg-[#f7f1ff] px-4 py-3 text-sm font-semibold text-[#4c2c97]"
        >
          {mode === 'sign-in' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </motion.button>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-3 w-full text-sm font-semibold text-slate-500 underline underline-offset-4"
        >
          Continue as guest
        </button>
      </div>
    </div>
  );
}