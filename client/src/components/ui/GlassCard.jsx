import { motion } from "framer-motion";

export default function GlassCard({ children, className = "", hover = false, ...props }) {
  if (hover) {
    return (
      <motion.div
        className={`glass-card ${className}`.trim()}
        whileHover={{
          y: -4,
          scale: 1.01,
          boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255,255,255,0.08)",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`glass-card ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
