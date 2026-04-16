import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

export default function PowerSource() {
  const groupRef = useRef();
  const coreRef = useRef();
  const glowRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.3;
      coreRef.current.rotation.x = t * 0.15;

      const breathe = 1 + Math.sin(t * 1.5) * 0.08;
      coreRef.current.scale.setScalar(breathe);
    }

    if (glowRef.current) {
      const glowBreath = 1 + Math.sin(t * 1.2) * 0.12;
      glowRef.current.scale.setScalar(glowBreath);

      glowRef.current.material.opacity = 0.12 + Math.sin(t * 2) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.8, 0]}>
      {/* Core geometry */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.6, 1]} />
        <meshStandardMaterial
          color="#6366f1"
          emissive="#7c3aed"
          emissiveIntensity={3}
          roughness={0.2}
          metalness={0.8}
          toneMapped={false}
        />
      </mesh>

      {/* Outer glow shell */}
      <mesh ref={glowRef}>
        <icosahedronGeometry args={[0.9, 2]} />
        <meshStandardMaterial
          color="#a78bfa"
          emissive="#7c3aed"
          emissiveIntensity={1.5}
          transparent
          opacity={0.12}
          side={2}
          toneMapped={false}
        />
      </mesh>

      {/* Inner ring accent */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.75, 0.02, 16, 64]} />
        <meshStandardMaterial
          color="#a78bfa"
          emissive="#7c3aed"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>

      {/* Point light */}
      <pointLight color="#7c3aed" intensity={8} distance={15} decay={2} />
      <pointLight color="#6366f1" intensity={3} distance={25} decay={2} />

      {/* Floating label */}
      <Html
        position={[0, 1.2, 0]}
        center
        distanceFactor={10}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            background: "rgba(99, 102, 241, 0.2)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(139, 92, 246, 0.4)",
            borderRadius: "8px",
            padding: "4px 12px",
            color: "#c4b5fd",
            fontSize: "12px",
            fontWeight: 600,
            fontFamily: "system-ui, sans-serif",
            whiteSpace: "nowrap",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Power Grid
        </div>
      </Html>
    </group>
  );
}
