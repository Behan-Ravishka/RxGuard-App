import { motion, AnimatePresence } from 'framer-motion';
import splashImage from "../../../assets/Splash_design.png";

export default function SplashScreen() {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-50 flex flex-col items-center pt-24 bg-gradient-to-br from-[#fcebfe] via-[#eae6fb] to-[#d9dff9]"
      >
        
        {/* Text Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="flex flex-col items-center text-center px-6 z-10"
        >
          <h1 className="text-6xl font-bold tracking-tight font-sans">
            <span className="text-[#201c45]">Rx</span>
            <span className="text-[#8b5cf6]">Guard</span>
          </h1>
          
          <h2 className="mt-4 text-[1.6rem] font-medium text-[#111827] leading-tight tracking-tight">
            Medication Safety,<br />AI-Powered.
          </h2>
        </motion.div>

        {/* 3D Illustration Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="relative flex-1 flex items-center justify-center w-full mt-8 pb-16 px-4"
        >
          <motion.img
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            src={splashImage}
            alt="Medication Safety 3D"
            // CHANGED: Reduced width to w-3/4 and added a max-width of 260px
            className="w-3/4 max-w-[260px] h-auto object-contain drop-shadow-2xl"
          />
        </motion.div>

      </motion.div>
    </AnimatePresence>
  );
}