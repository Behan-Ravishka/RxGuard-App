import { useState } from 'react';
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
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-6">
      <div className="rounded-3xl border border-gray-800 bg-gray-950 p-6 shadow-2xl shadow-black/30">
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Secure Access</p>
          <h2 className="mt-2 text-2xl font-black text-white">{mode === 'sign-in' ? 'Sign In' : 'Create Account'}</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">
            Use a guest scan anytime, or sign in to save your history for future predictive modeling.
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-2xl border border-amber-700/50 bg-amber-950/40 p-4 text-sm text-amber-200">
            Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the frontend environment.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none transition-colors focus:border-severity-green"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none transition-colors focus:border-severity-green"
              placeholder="Minimum 6 characters"
              required
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-800 bg-red-950/60 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-2xl border border-green-800 bg-green-950/60 px-4 py-3 text-sm text-green-200">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-white px-4 py-3 font-bold text-gray-950 transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Working...' : mode === 'sign-in' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
          className="mt-4 w-full rounded-2xl border border-gray-700 px-4 py-3 text-sm font-semibold text-gray-200 transition-colors hover:bg-gray-900"
        >
          {mode === 'sign-in' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-3 w-full text-sm font-semibold text-gray-500 underline underline-offset-4"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}