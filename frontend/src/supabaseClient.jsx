/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const fallbackSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const fallbackSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const apiBaseCandidates = [import.meta.env.VITE_API_URL, 'http://localhost:5000', ''];

const SupabaseContext = createContext({
  supabase: null,
  session: null,
  loading: true,
  error: '',
});

function normalizeBaseUrl(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/\/+$/, '');
}

async function fetchSupabaseConfig() {
  for (const candidate of apiBaseCandidates) {
    const baseUrl = normalizeBaseUrl(candidate);
    const endpoint = baseUrl ? `${baseUrl}/api/config` : '/api/config';

    try {
      const response = await fetch(endpoint, { cache: 'no-store' });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();

      if (data?.supabaseUrl && data?.supabaseAnonKey) {
        return {
          supabaseUrl: data.supabaseUrl,
          supabaseAnonKey: data.supabaseAnonKey,
        };
      }
    } catch {
      // Try the next candidate.
    }
  }

  if (fallbackSupabaseUrl && fallbackSupabaseAnonKey) {
    return {
      supabaseUrl: fallbackSupabaseUrl,
      supabaseAnonKey: fallbackSupabaseAnonKey,
    };
  }

  return null;
}

function createSupabaseInstance({ supabaseUrl, supabaseAnonKey }) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });
}

export function SupabaseProvider({ children }) {
  const [supabase, setSupabase] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;
    let subscription;

    const initialize = async () => {
      const config = await fetchSupabaseConfig();

      if (!isActive) {
        return;
      }

      if (!config) {
        setError('Supabase config could not be loaded from the backend.');
        setLoading(false);
        return;
      }

      const client = createSupabaseInstance(config);
      setSupabase(client);

      const { data } = await client.auth.getSession();

      if (!isActive) {
        return;
      }

      setSession(data.session ?? null);

      const authState = client.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
      });

      subscription = authState.data.subscription;
      setLoading(false);
    };

    initialize().catch((configError) => {
      if (!isActive) {
        return;
      }

      setError(configError?.message ?? 'Failed to initialize Supabase.');
      setLoading(false);
    });

    return () => {
      isActive = false;
      subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ supabase, session, loading, error }),
    [supabase, session, loading, error],
  );

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

export function useSupabaseClient() {
  return useContext(SupabaseContext);
}
