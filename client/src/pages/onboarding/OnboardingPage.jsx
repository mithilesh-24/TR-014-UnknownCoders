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
    <div className="onboarding-container">
      {/* Background effects */}
      <div style={{ position: "absolute", top: "-10rem", left: "25%", width: "24rem", height: "24rem", background: "rgba(139, 92, 246, 0.08)", borderRadius: "50%", filter: "blur(64px)" }} />
      <div style={{ position: "absolute", bottom: "-10rem", right: "25%", width: "24rem", height: "24rem", background: "rgba(59, 130, 246, 0.08)", borderRadius: "50%", filter: "blur(64px)" }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="onboarding-wrapper"
      >
        {/* Header */}
        <div className="onboarding-header">
          <div className="onboarding-header-logo">
            <HiOutlineLightningBolt />
            <span className="gradient-text" style={{ fontSize: "1.125rem", fontWeight: "700" }}>SmartEnergy</span>
          </div>
          <h2 className="onboarding-title">
            Set up your profile
          </h2>
        </div>

        {/* Step Indicator */}
        <div className="onboarding-step-wrapper">
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="alert-error"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <GlassCard style={{ padding: "2rem", overflow: "hidden" }}>
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
                className="onboarding-step-view"
              >
                <h3 className="onboarding-step-title">House Details</h3>

                <div className="onboarding-field">
                  <label className="onboarding-label">House Number</label>
                  <input
                    type="text"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder="e.g., A-101"
                    className="onboarding-input"
                  />
                </div>

                <div className="onboarding-field">
                  <label className="onboarding-label">Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full address"
                    className="onboarding-input onboarding-textarea"
                  />
                </div>

                <div className="onboarding-field">
                  <label className="onboarding-label">Number of Residents</label>
                  <input
                    type="number"
                    min="1"
                    value={residents}
                    onChange={(e) => setResidents(e.target.value)}
                    placeholder="e.g., 4"
                    className="onboarding-input"
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
                className="onboarding-step-view"
              >
                <h3 className="onboarding-step-title">Verification</h3>

                <div className="onboarding-field">
                  <label className="onboarding-label">Aadhaar Number</label>
                  <input
                    type="text"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(formatAadhaar(e.target.value))}
                    placeholder="XXXX XXXX XXXX"
                    maxLength={14}
                    className="onboarding-input"
                    style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}
                  />
                </div>

                <div className="onboarding-field">
                  <label className="onboarding-label">Owner Proof Document</label>
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
                className="onboarding-step-view"
              >
                <h3 className="onboarding-step-title">Solar Setup</h3>

                {/* Solar toggle */}
                <div className="onboarding-solar-toggle">
                  <span style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>Do you have solar panels?</span>
                  <motion.button
                    type="button"
                    onClick={() => setHasSolar(!hasSolar)}
                    className={`onboarding-solar-track ${hasSolar ? "active" : "inactive"}`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      style={{ position: "absolute", top: "2px", width: "1.5rem", height: "1.5rem", borderRadius: "50%", background: "white", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
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
                      style={{ overflow: "hidden" }}
                    >
                      <div className="onboarding-slider-wrapper">
                        <div className="onboarding-slider-header">
                          <span>Solar Capacity</span>
                          <span>{solarCapacity} kW</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={solarCapacity}
                          onChange={(e) => setSolarCapacity(Number(e.target.value))}
                          className="onboarding-slider"
                        />
                        <div className="onboarding-slider-labels">
                          <span>1 kW</span>
                          <span>50 kW</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Summary */}
                <div className="onboarding-summary">
                  <h4 className="onboarding-summary-title">Summary</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div className="onboarding-summary-row">
                      <span>House</span>
                      <span>{houseNumber || "Not set"}</span>
                    </div>
                    <div className="onboarding-summary-row">
                      <span>Residents</span>
                      <span>{residents || "Not set"}</span>
                    </div>
                    <div className="onboarding-summary-row">
                      <span>Aadhaar</span>
                      <span>{aadhaarNumber || "Not set"}</span>
                    </div>
                    <div className="onboarding-summary-row">
                      <span>Solar</span>
                      <span>{hasSolar ? `${solarCapacity} kW` : "No"}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="onboarding-nav">
            <motion.button
              type="button"
              onClick={goBack}
              disabled={currentStep === 0}
              className="onboarding-btn-back"
              whileHover={currentStep > 0 ? { scale: 1.02 } : {}}
              whileTap={currentStep > 0 ? { scale: 0.98 } : {}}
            >
              Back
            </motion.button>

            {currentStep < steps.length - 1 ? (
              <motion.button
                type="button"
                onClick={goNext}
                className="onboarding-btn-next"
                whileHover={{ boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)" }}
                whileTap={{ scale: 0.98 }}
              >
                Next
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="onboarding-btn-next"
                whileHover={{ boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)" }}
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
