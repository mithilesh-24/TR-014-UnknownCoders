import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineLightningBolt,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
} from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
import GlassCard from "../../components/ui/GlassCard";
import FileUpload from "../../components/ui/FileUpload";

function FloatingInput({ icon: Icon, label, type = "text", value, onChange, id }) {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value.length > 0;

  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] z-10">
        <Icon className="w-5 h-5" />
      </div>
      <motion.label
        htmlFor={id}
        className="absolute left-11 pointer-events-none text-[var(--text-secondary)] z-10"
        animate={{
          top: isActive ? "8px" : "50%",
          y: isActive ? 0 : "-50%",
          fontSize: isActive ? "11px" : "14px",
          color: isActive ? "var(--accent)" : "var(--text-secondary)",
        }}
        transition={{ duration: 0.2 }}
      >
        {label}
      </motion.label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full bg-white/5 border rounded-xl pl-11 pr-4 pt-6 pb-2 text-[var(--text-primary)] text-sm focus:border-[var(--accent)] focus:bg-white/8 transition-all duration-300 ${
          focused ? "border-[var(--accent)] shadow-[0_0_15px_rgba(99,102,241,0.15)]" : "border-white/10"
        }`}
      />
    </div>
  );
}

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [identityFile, setIdentityFile] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup, uploadFile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signup(name, email, password);

      if (identityFile) {
        try {
          await uploadFile(identityFile);
        } catch {
          // Non-blocking: file upload failure shouldn't prevent signup
        }
      }

      navigate("/onboarding");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Signup failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--bg-primary)]">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[var(--accent)]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[var(--accent-secondary)]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/3 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md px-4 relative z-10"
      >
        <GlassCard className="p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] mb-4 glow"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <HiOutlineLightningBolt className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold gradient-text glow-text">SmartEnergy</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Create your account
            </p>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: [0, -8, 8, -4, 4, 0] }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FloatingInput
              id="signup-name"
              icon={HiOutlineUser}
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <FloatingInput
              id="signup-email"
              icon={HiOutlineMail}
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FloatingInput
              id="signup-password"
              icon={HiOutlineLockClosed}
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                Identity Proof (optional)
              </p>
              <FileUpload
                onFileSelect={(file) => setIdentityFile(file)}
                accept={{ "image/*": [], "application/pdf": [] }}
                label="Upload identity document"
              />
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white font-semibold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{
                boxShadow: "0 0 25px rgba(99, 102, 241, 0.4), 0 0 50px rgba(139, 92, 246, 0.2)",
              }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? (
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  Creating account...
                </motion.span>
              ) : (
                "Create Account"
              )}
            </motion.button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
            Already have an account?{" "}
            <Link
              to="/"
              className="text-[var(--accent)] hover:text-[var(--accent-secondary)] font-medium transition-colors"
            >
              Login
            </Link>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
