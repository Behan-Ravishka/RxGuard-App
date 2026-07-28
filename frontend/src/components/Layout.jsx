import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Bell, LogIn, UserRound } from 'lucide-react';
import { useSupabaseClient } from '../supabaseClient.jsx';
import BottomNav from './BottomNav';

export default function Layout() {
  const location = useLocation();
  const { supabase, session, loading, error } = useSupabaseClient();
  const [alertCount, setAlertCount] = useState(0);
  const sessionReady = Boolean(session);

  const isCaptureRoute = location.pathname === '/capture';

  useEffect(() => {
    const loadAlertCount = async () => {
      if (!supabase || !session?.user) {
        setAlertCount(0);
        return;
      }

      const { count } = await supabase
        .from('scan_history')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .neq('severity_level', 'none');

      setAlertCount(count ?? 0);
    };

    loadAlertCount();
  }, [session, supabase]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#f5f2fb] to-[#f8fafc] text-[#34214f]">
      <header className="px-5 py-4 pt-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-[22px] font-bold tracking-tight font-sans">
            <span className="text-[#0f0c29]">Rx</span>
            <span className="text-[#8b5cf6]">Guard</span>
          </Link>

          <div className="flex items-center gap-2">
            {loading ? (
              <span className="rounded-full border border-[#e4d9ff] bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#7f6b9d]">
                Connecting
              </span>
            ) : sessionReady ? (
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full border border-[#e4d9ff] bg-white/80 px-3 py-2 text-sm font-semibold text-[#34214f] shadow-sm backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
              >
                <UserRound size={16} className="text-[#8b5cf6]" />
                Profile
              </Link>
            ) : (
              <Link
                to="/auth"
                state={{ from: location.pathname }}
                className="flex items-center gap-2 rounded-full border border-[#e4d9ff] bg-white/80 px-3 py-2 text-sm font-semibold text-[#34214f] shadow-sm backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
              >
                <LogIn size={16} className="text-[#8b5cf6]" />
                Sign in
              </Link>
            )}

            <Link
              to="/alerts"
              className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#ebe7f5]/60 shadow-sm backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
            >
              <Bell size={20} className="text-[#201c45]" />
              {alertCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#8b5cf6] px-1 text-[10px] font-bold text-white ring-2 ring-[#f5f2fb]">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mt-3 flex justify-center">
            <span className="inline-flex rounded-full border border-[#f3d8a2] bg-[#fff7e3] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ae6f00]">
              Auth backend unavailable
            </span>
          </div>
        ) : null}
      </header>

      <main className={`flex-1 ${isCaptureRoute ? 'overflow-hidden px-0 py-0 pb-0' : 'overflow-y-auto px-4 py-2 pb-24'}`}>
        <Outlet />
      </main>

      <BottomNav hideScanFab={isCaptureRoute} />
    </div>
  );
}
