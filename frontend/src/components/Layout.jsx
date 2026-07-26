import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export default function Layout() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-gray-800 bg-gray-950/95 px-4 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex flex-col leading-none">
            <span className="text-xl font-black tracking-wide text-white">RxGuard</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Medication Safety</span>
          </Link>

          <div className="flex items-center gap-2">
            {!isSupabaseConfigured && (
              <span className="rounded-full border border-amber-700/60 bg-amber-950/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300">
                Supabase not configured
              </span>
            )}

            {!session ? (
              <Link
                to="/auth"
                className="rounded-full border border-gray-700 bg-gray-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-gray-800"
              >
                Sign In / Sign Up
              </Link>
            ) : (
              <>
                <Link
                  to="/history"
                  className="rounded-full border border-gray-700 bg-gray-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-gray-800"
                >
                  My History
                </Link>
                <button
                  onClick={handleSignOut}
                  className="rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-gray-950 transition-transform active:scale-95"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-grow p-4">
        <Outlet />
      </main>
    </div>
  );
}