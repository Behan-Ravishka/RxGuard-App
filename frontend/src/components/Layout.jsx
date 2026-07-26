import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import BottomNav from './BottomNav';
import logo from '/assets/logo.png';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
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

  const isCaptureRoute = location.pathname === '/capture';

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#34214f]">
      <header className="border-b border-indigo-100/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-lg">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 leading-none">
            <img src={logo} alt="RxGuard logo" className="h-12 w-auto object-contain rounded-lg" />
          </Link>

          <div className="flex items-center gap-2">
            {!isSupabaseConfigured && (
              <span className="hidden rounded-full border border-[#f3d8a2] bg-[#fff7e3] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ae6f00] sm:inline-flex">
                Demo mode
              </span>
            )}

            {!session ? (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/auth"
                  className="rounded-full border border-[#dfd0ff] bg-[#f7f1ff] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#4c2c97]"
                >
                  Sign In
                </Link>
              </motion.div>
            ) : (
              <motion.button
                type="button"
                onClick={handleSignOut}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-full bg-[#4c2c97] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white"
              >
                Sign Out
              </motion.button>
            )}
          </div>
        </div>
      </header>

      <main className={`flex-1 ${isCaptureRoute ? 'overflow-hidden px-0 py-0 pb-0' : 'overflow-y-auto px-4 py-4 pb-24'}`}>
        <Outlet />
      </main>

      <BottomNav hideScanFab={isCaptureRoute} />
    </div>
  );
}