import { motion } from "framer-motion";

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[var(--bg-primary)] z-50">
      <motion.div
        className="w-16 h-16 rounded-full border-[3px] border-transparent"
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
        className="mt-6 text-[var(--text-secondary)] text-sm tracking-widest uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        Loading...
      </motion.p>
    </div>
  );
}
