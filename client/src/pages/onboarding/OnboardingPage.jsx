import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineLightningBolt } from "react-icons/hi";
import GlassCard from "../../components/ui/GlassCard";
import StepIndicator from "../../components/ui/StepIndicator";
import FileUpload from "../../components/ui/FileUpload";
import api from "../../utils/api";

const steps = ["House Details", "Verification", "Solar Setup"];

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1: House details
  const [houseNumber, setHouseNumber] = useState("");
  const [address, setAddress] = useState("");
  const [residents, setResidents] = useState("");

  // Step 2: Verification
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [ownerProof, setOwnerProof] = useState(null);

  // Step 3: Solar
  const [hasSolar, setHasSolar] = useState(false);
  const [solarCapacity, setSolarCapacity] = useState(5);

  const goNext = () => {
    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goBack = () => {
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const formatAadhaar = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("houseNumber", houseNumber);
      formData.append("address", address);
      formData.append("residents", residents);
      formData.append("aadhaarNumber", aadhaarNumber.replace(/\s/g, ""));
      formData.append("hasSolar", hasSolar);
      if (hasSolar) {
        formData.append("solarCapacity", solarCapacity);
      }
      if (ownerProof) {
        formData.append("ownerProof", ownerProof);
      }

      await api.post("/user/onboard", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Onboarding failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--bg-primary)] p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-[var(--accent)]/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-[var(--accent-secondary)]/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <HiOutlineLightningBolt className="w-6 h-6 text-[var(--accent)]" />
            <span className="text-lg font-bold gradient-text">SmartEnergy</span>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Set up your profile
          </h2>
        </div>

        {/* Step Indicator */}
        <div className="mb-12">
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <GlassCard className="p-8 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 1: House Details */}
            {currentStep === 0 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="space-y-5"
              >
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                  House Details
                </h3>

                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">
                    House Number
                  </label>
                  <input
                    type="text"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder="e.g., A-101"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm placeholder:text-[var(--text-secondary)]/50 focus:border-[var(--accent)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">
                    Address
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full address"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm placeholder:text-[var(--text-secondary)]/50 focus:border-[var(--accent)] transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">
                    Number of Residents
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={residents}
                    onChange={(e) => setResidents(e.target.value)}
                    placeholder="e.g., 4"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm placeholder:text-[var(--text-secondary)]/50 focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Verification */}
            {currentStep === 1 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="space-y-5"
              >
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                  Verification
                </h3>

                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">
                    Aadhaar Number
                  </label>
                  <input
                    type="text"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(formatAadhaar(e.target.value))}
                    placeholder="XXXX XXXX XXXX"
                    maxLength={14}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm font-mono tracking-wider placeholder:text-[var(--text-secondary)]/50 focus:border-[var(--accent)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">
                    Owner Proof Document
                  </label>
                  <FileUpload
                    onFileSelect={(file) => setOwnerProof(file)}
                    accept={{ "image/*": [], "application/pdf": [] }}
                    label="Upload owner proof"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Solar Setup */}
            {currentStep === 2 && (
              <motion.div
                key="step-3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="space-y-5"
              >
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                  Solar Setup
                </h3>

                {/* Solar toggle */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-sm text-[var(--text-primary)]">
                    Do you have solar panels?
                  </span>
                  <motion.button
                    type="button"
                    onClick={() => setHasSolar(!hasSolar)}
                    className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                      hasSolar ? "bg-[var(--accent)]" : "bg-white/10"
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md"
                      animate={{ left: hasSolar ? "calc(100% - 26px)" : "2px" }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </div>

                {/* Solar capacity slider */}
                <AnimatePresence>
                  {hasSolar && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-[var(--text-secondary)]">
                            Solar Capacity
                          </label>
                          <span className="text-sm font-semibold text-[var(--accent)]">
                            {solarCapacity} kW
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={solarCapacity}
                          onChange={(e) => setSolarCapacity(Number(e.target.value))}
                          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:w-5
                            [&::-webkit-slider-thumb]:h-5
                            [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:bg-gradient-to-r
                            [&::-webkit-slider-thumb]:from-[var(--accent)]
                            [&::-webkit-slider-thumb]:to-[var(--accent-secondary)]
                            [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(99,102,241,0.4)]
                            [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                          <span>1 kW</span>
                          <span>50 kW</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Summary */}
                <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                    Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">House</span>
                      <span className="text-[var(--text-primary)]">
                        {houseNumber || "Not set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Residents</span>
                      <span className="text-[var(--text-primary)]">
                        {residents || "Not set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Aadhaar</span>
                      <span className="text-[var(--text-primary)]">
                        {aadhaarNumber || "Not set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Solar</span>
                      <span className="text-[var(--text-primary)]">
                        {hasSolar ? `${solarCapacity} kW` : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
            <motion.button
              type="button"
              onClick={goBack}
              disabled={currentStep === 0}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              whileHover={currentStep > 0 ? { scale: 1.02 } : {}}
              whileTap={currentStep > 0 ? { scale: 0.98 } : {}}
            >
              Back
            </motion.button>

            {currentStep < steps.length - 1 ? (
              <motion.button
                type="button"
                onClick={goNext}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white text-sm font-semibold"
                whileHover={{
                  boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)",
                }}
                whileTap={{ scale: 0.98 }}
              >
                Next
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white text-sm font-semibold disabled:opacity-50"
                whileHover={{
                  boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)",
                }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </motion.button>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
