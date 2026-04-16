import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineMail, HiOutlineLockClosed } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
import AuthCard from "../../components/ui/AuthCard";
import InputField from "../../components/ui/InputField";
import Button from "../../components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const userData = await login(email, password);
      if (userData.role === "admin") {
        navigate("/admin");
      } else if (userData.onboarded) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard title="Welcome Back" subtitle="Log in to your SmartEnergy platform">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="alert-error"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="auth-form">
        <InputField
          id="login-email"
          icon={HiOutlineMail}
          placeholder="Email Address"
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <InputField
          id="login-password"
          icon={HiOutlineLockClosed}
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="auth-form-footer">
          <label className="checkbox-label">
            <input type="checkbox" className="checkbox-input" />
            <span>Remember me</span>
          </label>
          <Link to="/" className="auth-link">Forgot Password?</Link>
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <Button type="submit" isSubmitting={isSubmitting}>
            Sign In
          </Button>
        </div>
      </form>

      <p className="auth-redirect">
        Don't have an account?{" "}
        <Link to="/signup">
          Create Account
        </Link>
      </p>
    </AuthCard>
  );
}
