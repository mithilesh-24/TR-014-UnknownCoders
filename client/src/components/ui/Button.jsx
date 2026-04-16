import { motion } from "framer-motion";

export default function Button({ children, type = "button", disabled = false, isSubmitting = false, onClick, className = "" }) {
  return (
    <motion.button
      type={type}
      disabled={disabled || isSubmitting}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className={`btn-primary ${className}`.trim()}
    >
      {isSubmitting ? (
         <>
           <span className="btn-spinner" />
           {typeof children === "string" ? `${children.replace(/e$/, "")}ing...` : "Loading..."}
         </>
      ) : children}
    </motion.button>
  );
}
