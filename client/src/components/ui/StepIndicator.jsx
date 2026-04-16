import { motion } from "framer-motion";
import { HiCheck } from "react-icons/hi";

export default function StepIndicator({ steps = [], currentStep = 0 }) {
  return (
    <div className="step-container">
      {steps.map((label, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div key={index} className="step-wrapper">
            {/* Step circle + label */}
            <div className="step-circle-container">
              <motion.div
                className={`step-circle ${isCompleted ? "completed" : isActive ? "active" : "pending"}`}
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  boxShadow: isActive
                    ? "0 0 20px rgba(99, 102, 241, 0.4)"
                    : "0 0 0px rgba(99, 102, 241, 0)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <HiCheck style={{ width: "1.25rem", height: "1.25rem" }} />
                  </motion.div>
                ) : (
                  index + 1
                )}
              </motion.div>
              <span className={`step-label ${isActive || isCompleted ? "active" : "pending"}`}>
                {label}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="step-connector-wrapper">
                <motion.div
                  style={{ height: "100%", background: "linear-gradient(to right, var(--accent), var(--accent-secondary))" }}
                  initial={{ width: "0%" }}
                  animate={{ width: isCompleted ? "100%" : "0%" }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
