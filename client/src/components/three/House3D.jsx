import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

const STATUS_COLORS = {
  green: { base: "#22c55e", emissive: "#16a34a" },
  yellow: { base: "#eab308", emissive: "#ca8a04" },
  red: { base: "#ef4444", emissive: "#dc2626" },
};

export default function House3D({
  position = [0, 0, 0],
  houseNumber = 1,
  status = "green",
  energyLevel = 1,
  onClick,
}) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);

  const colors = STATUS_COLORS[status] || STATUS_COLORS.green;

  useFrame(() => {
    if (!groupRef.current) return;

    const targetScale = hovered ? 1.1 : 1;
    groupRef.current.scale.lerp(
      { x: targetScale, y: targetScale, z: targetScale },
      0.1
    );
  });

  const emissiveIntensity = hovered ? 1.2 : 0.4 + energyLevel * 0.4;

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* House base */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.5]} />
        <meshStandardMaterial
          color={colors.base}
          emissive={colors.emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={0.6}
          metalness={0.3}
        />
      </mesh>

      {/* Roof - pyramid shape */}
      <mesh position={[0, 0.75, 0]}>
        <coneGeometry args={[0.5, 0.35, 4]} />
        <meshStandardMaterial
          color={hovered ? "#e2e8f0" : "#94a3b8"}
          emissive={colors.emissive}
          emissiveIntensity={emissiveIntensity * 0.5}
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>

      {/* Door */}
      <mesh position={[0, 0.15, 0.26]}>
        <boxGeometry args={[0.12, 0.2, 0.02]} />
        <meshStandardMaterial
          color="#1e293b"
          emissive={colors.emissive}
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Window left */}
      <mesh position={[-0.15, 0.38, 0.26]}>
        <boxGeometry args={[0.1, 0.1, 0.02]} />
        <meshStandardMaterial
          color="#fef9c3"
          emissive="#fde047"
          emissiveIntensity={energyLevel * 1.5}
          toneMapped={false}
        />
      </mesh>

      {/* Window right */}
      <mesh position={[0.15, 0.38, 0.26]}>
        <boxGeometry args={[0.1, 0.1, 0.02]} />
        <meshStandardMaterial
          color="#fef9c3"
          emissive="#fde047"
          emissiveIntensity={energyLevel * 1.5}
          toneMapped={false}
        />
      </mesh>

      {/* Small glow underneath when hovered */}
      {hovered && (
        <pointLight
          position={[0, 0.1, 0]}
          color={colors.base}
          intensity={2}
          distance={3}
          decay={2}
        />
      )}

      {/* Floating house number label */}
      <Html
        position={[0, 1.15, 0]}
        center
        distanceFactor={10}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            background: hovered
              ? "rgba(30, 41, 59, 0.9)"
              : "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            border: `1px solid ${colors.base}50`,
            borderRadius: "6px",
            padding: "2px 8px",
            color: colors.base,
            fontSize: "10px",
            fontWeight: 700,
            fontFamily: "system-ui, sans-serif",
            whiteSpace: "nowrap",
            transition: "all 0.2s ease",
          }}
        >
          #{houseNumber}
        </div>
      </Html>
    </group>
  );
}
