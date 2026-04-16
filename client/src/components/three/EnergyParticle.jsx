import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const STATUS_COLORS = {
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
};

export default function EnergyParticle({
  start,
  end,
  controlPoint,
  status = "green",
  energyLevel = 1,
  offset = 0,
}) {
  const meshRef = useRef();
  const progressRef = useRef(offset);

  const color = STATUS_COLORS[status] || STATUS_COLORS.green;

  const curve = useMemo(() => {
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(...controlPoint),
      new THREE.Vector3(...end)
    );
  }, [start, end, controlPoint]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const speed = 0.15 + energyLevel * 0.55;
    progressRef.current += delta * speed;

    if (progressRef.current > 1) {
      progressRef.current = progressRef.current % 1;
    }

    const point = curve.getPoint(progressRef.current);
    meshRef.current.position.copy(point);

    const glowIntensity = 0.6 + Math.sin(progressRef.current * Math.PI) * 0.4;
    meshRef.current.scale.setScalar(glowIntensity);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2.5}
        toneMapped={false}
      />
    </mesh>
  );
}
