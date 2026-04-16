import { motion } from "framer-motion";
import { HiOutlineLightningBolt } from "react-icons/hi";

export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="auth-container">
      <motion.div
        initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="auth-wrapper"
      >
        <div className="auth-card">
          <div className="auth-header">
            <motion.div
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               className="auth-logo"
            >
              <HiOutlineLightningBolt className="w-8 h-8" />
            </motion.div>
            <h1 className="auth-title">{title}</h1>
            <p className="auth-subtitle">{subtitle}</p>
          </div>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
