import { motion, AnimatePresence } from 'framer-motion';
import logo from '/assets/logo.png';

export default function SplashScreen() {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_top_left,_#f9f7ff,_#eef4ff_45%,_#e7e0ff_100%)]"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col items-center text-center"
        >
          <motion.div
            animate={{ y: [0, -8, 0], scale: [1, 1.03, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="flex items-center justify-center"
          >
            <img src={logo} alt="RxGuard logo" className="h-24 w-auto object-contain drop-shadow-[0_12px_30px_rgba(79,47,164,0.25)] rounded-xl" />
          </motion.div>
          <h1 className="mt-6 text-3xl font-black tracking-[0.24em] text-slate-800">RXGUARD</h1>
          <p className="mt-3 max-w-[250px] text-sm leading-6 text-slate-600">
            Medication safety, reviewed with care and clarity.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
