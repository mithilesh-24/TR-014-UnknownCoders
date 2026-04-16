import { useMemo } from "react";
import { QuadraticBezierLine } from "@react-three/drei";
import EnergyParticle from "./EnergyParticle";

const STATUS_COLORS = {
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
};

export default function EnergyLine({
  start = [0, 0, 0],
  end = [0, 0, 0],
  status = "green",
  energyLevel = 1,
}) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.green;

  const controlPoint = useMemo(() => {
    const midX = (start[0] + end[0]) / 2;
    const midZ = (start[2] + end[2]) / 2;
    const dist = Math.sqrt(
      (end[0] - start[0]) ** 2 + (end[2] - start[2]) ** 2
    );
    const arcHeight = 0.8 + dist * 0.25;
    return [midX, arcHeight, midZ];
  }, [start, end]);

  const particleCount = Math.max(2, Math.round(energyLevel * 5));

  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      offset: i / particleCount,
    }));
  }, [particleCount]);

  return (
    <group>
      {/* Main energy line */}
      <QuadraticBezierLine
        start={start}
        end={end}
        mid={controlPoint}
        color={color}
        lineWidth={1.5}
        transparent
        opacity={0.3 + energyLevel * 0.3}
      />

      {/* Brighter inner line for glow effect */}
      <QuadraticBezierLine
        start={start}
        end={end}
        mid={controlPoint}
        color={color}
        lineWidth={0.8}
        transparent
        opacity={0.5 + energyLevel * 0.4}
      />

      {/* Energy particles flowing along the line */}
      {particles.map((particle) => (
        <EnergyParticle
          key={particle.id}
          start={start}
          end={end}
          controlPoint={controlPoint}
          status={status}
          energyLevel={energyLevel}
          offset={particle.offset}
        />
      ))}
    </group>
  );
}
