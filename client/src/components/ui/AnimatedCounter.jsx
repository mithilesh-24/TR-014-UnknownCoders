import { useEffect, useRef } from "react";
import { useSpring, useMotionValue, motion, animate } from "framer-motion";

export default function AnimatedCounter({
  value,
  duration = 1,
  prefix = "",
  suffix = "",
  className = "",
}) {
  const nodeRef = useRef(null);
  const motionValue = useMotionValue(0);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => {
        if (nodeRef.current) {
          nodeRef.current.textContent =
            prefix + Math.round(latest).toLocaleString() + suffix;
        }
      },
    });

    return () => controls.stop();
  }, [value, duration, prefix, suffix, motionValue]);

  return (
    <motion.span
      ref={nodeRef}
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {prefix}0{suffix}
    </motion.span>
  );
}
