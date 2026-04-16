import { motion } from "framer-motion";

export default function StatusBadge({ status = "ok", label, size = "md", className = "" }) {
  // status: 'ok', 'warning', 'critical'
  // size: 'sm', 'md', 'lg'
  const isPulsing = status === "warning" || status === "critical";

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`status-badge ${status} ${size} ${className}`.trim()}
    >
      <span className="status-badge-dot-container">
        {isPulsing && (
          <span className="status-badge-ping" />
        )}
        <span className="status-badge-dot" />
      </span>
      {label}
    </motion.span>
  );
}
