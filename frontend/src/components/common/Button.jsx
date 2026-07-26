import { motion } from 'framer-motion';

export default function Button({ children, className = '', variant = 'primary', whileTap, whileHover, ...props }) {
  const base = 'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8a69d0] focus:ring-offset-2';
  const variants = {
    primary: 'bg-gradient-to-r from-[#4f2fa4] to-[#6b42d9] text-white shadow-[0_16px_45px_-16px_rgba(88,43,174,0.75)]',
    secondary: 'border border-[#dfd0ff] bg-white/80 text-[#34214f]',
    ghost: 'bg-transparent text-[#4f2fa4]',
  };

  return (
    <motion.button
      whileTap={whileTap ?? { scale: 0.97 }}
      whileHover={whileHover ?? { scale: 1.02, y: -1 }}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
