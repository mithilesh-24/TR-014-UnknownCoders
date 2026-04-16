import { motion } from "framer-motion";

const statusConfig = {
  ok: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    pulse: false,
  },
  warning: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.3)]",
    pulse: true,
  },
  critical: {
    bg: "bg-red-500/15",
    text: "text-red-400",
    border: "border-red-500/30",
    dot: "bg-red-400",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.4)]",
    pulse: true,
  },
};

const sizeStyles = {
  sm: "px-3 py-1 text-xs",
  md: "px-4 py-1.5 text-sm",
  lg: "px-6 py-3 text-base font-semibold",
};

export default function StatusBadge({ status = "ok", label, size = "md", className = "" }) {
  const config = statusConfig[status] || statusConfig.ok;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`inline-flex items-center gap-2 rounded-full border
        ${config.bg} ${config.text} ${config.border} ${config.glow}
        ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      <span className="relative flex h-2.5 w-2.5">
        {config.pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.dot}`}
        />
      </span>
      {label}
    </motion.span>
  );
}
