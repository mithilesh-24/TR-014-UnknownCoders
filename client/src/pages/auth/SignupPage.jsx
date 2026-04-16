import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
} from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
import AuthCard from "../../components/ui/AuthCard";
import InputField from "../../components/ui/InputField";
import Button from "../../components/ui/Button";
import FileUpload from "../../components/ui/FileUpload";

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
    <AuthCard title="Create Account" subtitle="Join us and start optimizing energy">
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
          id="signup-name"
          icon={HiOutlineUser}
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <InputField
          id="signup-email"
          icon={HiOutlineMail}
          placeholder="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <InputField
          id="signup-password"
          icon={HiOutlineLockClosed}
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="file-upload-wrapper">
          <p className="file-upload-label">
            Identity Proof <span>(optional)</span>
          </p>
          <FileUpload
            onFileSelect={(file) => setIdentityFile(file)}
            accept={{ "image/*": [], "application/pdf": [] }}
            label="Drop your document here"
          />
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <Button type="submit" isSubmitting={isSubmitting}>
            Create Account
          </Button>
        </div>
      </form>

      <p className="auth-redirect">
        Already have an account?{" "}
        <Link to="/">
          Login
        </Link>
      </p>
    </AuthCard>
  );
}
