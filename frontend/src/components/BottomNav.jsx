import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
// Swapped Bell for Activity for the new Insights tab
import { Clock, Home, UserRound, ScanLine, Activity } from 'lucide-react';

const tabs = [
  { to: '/', label: 'Home', icon: Home, hasNotification: false },
  { to: '/insights', label: 'Insights', icon: Activity, hasNotification: true }, // Updated Tab
  { to: '/history', label: 'History', icon: Clock, hasNotification: false },
  { to: '/profile', label: 'Profile', icon: UserRound, hasNotification: false },
];

export default function BottomNav({ hideScanFab = false }) {
  return (
    <nav className="sticky bottom-0 z-30 px-2 pb-3 pt-1">
      <div className="relative mx-auto flex max-w-[420px] items-center justify-between overflow-visible rounded-full border border-[#4c2c97]/15 bg-gradient-to-r from-white/95 via-[#f7f1ff]/95 to-white/95 px-2 py-2 shadow-[0_-8px_30px_-12px_rgba(76,44,151,0.45),0_18px_45px_-24px_rgba(76,44,151,0.65)] backdrop-blur-xl">
        
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          return (
            <div 
              key={tab.to} 
              className={`flex-1 flex justify-center ${index === 1 && !hideScanFab ? 'pr-5' : ''} ${index === 2 && !hideScanFab ? 'pl-5' : ''}`}
            >
              <NavLink
                to={tab.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center rounded-full px-2 py-1 text-[11px] font-semibold transition-all ${
                    isActive ? 'text-indigo-600' : 'text-gray-400'
                  }`
                }
              >
                {({ isActive }) => (
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative mb-1">
                      <Icon size={20} className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
                      {tab.hasNotification && (
                        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                      )}
                    </div>
                    
                    <span className={isActive ? 'text-indigo-600' : 'text-gray-400'}>
                      {tab.label}
                    </span>
                  </div>
                )}
              </NavLink>
            </div>
          );
        })}

        {!hideScanFab && (
          <div className="absolute left-1/2 -top-5 -translate-x-1/2">
            <motion.div
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.96 }}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#4c2c97] to-[#7e58cf] shadow-[0_16px_40px_-10px_rgba(76,44,151,0.65)]"
            >
              <NavLink to="/capture" className="flex h-full w-full items-center justify-center rounded-full text-white">
                <ScanLine size={24} />
              </NavLink>
            </motion.div>
          </div>
        )}
      </div>
    </nav>
  );
}