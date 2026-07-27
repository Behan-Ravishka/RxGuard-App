import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import BottomNav from './BottomNav';

export default function Layout() {
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

  const isCaptureRoute = location.pathname === '/capture';

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#f5f2fb] to-[#f8fafc] text-[#34214f]">
      
      <header className="px-5 py-4 pt-6">
        <div className="flex items-center justify-between">
          


          <Link to="/" className="text-[22px] font-bold tracking-tight font-sans">
            <span className="text-[#0f0c29]">Rx</span>
            <span className="text-[#8b5cf6]">Guard</span>
          </Link>

          {/* Changed button to Link and routed to /alerts */}
          <Link to="/alerts" className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#ebe7f5]/60 shadow-sm backdrop-blur-md transition-transform hover:scale-105 active:scale-95">
            <Bell size={20} className="text-[#201c45]" />
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#8b5cf6] px-1 text-[10px] font-bold text-white ring-2 ring-[#f5f2fb]">
              3
            </span>
          </Link>

        </div>

        {!isSupabaseConfigured && (
          <div className="mt-3 flex justify-center">
            <span className="inline-flex rounded-full border border-[#f3d8a2] bg-[#fff7e3] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ae6f00]">
              Demo mode active
            </span>
          </div>
        )}
      </header>

      <main className={`flex-1 ${isCaptureRoute ? 'overflow-hidden px-0 py-0 pb-0' : 'overflow-y-auto px-4 py-2 pb-24'}`}>
        <Outlet />
      </main>

      <BottomNav hideScanFab={isCaptureRoute} />
    </div>
  );
}