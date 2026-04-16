import { motion } from "framer-motion";

export default function LoadingSpinner() {
  return (
    <div className="spinner-overlay">
      <motion.div
        className="spinner-circle"
        style={{
          borderTopColor: "var(--accent)",
          borderRightColor: "var(--accent-secondary)",
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.p
        className="spinner-text"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        Loading...
      </motion.p>
    </div>
  );
}
