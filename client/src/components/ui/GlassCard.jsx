import { motion } from "framer-motion";

export default function GlassCard({ children, className = "", hover = false, ...props }) {
  const baseClasses =
    "backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-lg";

  if (hover) {
    return (
      <motion.div
        className={`${baseClasses} ${className}`}
        whileHover={{
          scale: 1.02,
          boxShadow: "0 0 25px rgba(99, 102, 241, 0.2), 0 0 50px rgba(139, 92, 246, 0.1)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseClasses} ${className}`} {...props}>
      {children}
    </div>
  );
}
