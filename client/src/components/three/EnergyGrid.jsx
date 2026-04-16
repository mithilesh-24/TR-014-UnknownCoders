import { useMemo } from "react";
import { OrbitControls } from "@react-three/drei";
import PowerSource from "./PowerSource";
import House3D from "./House3D";
import EnergyLine from "./EnergyLine";

function Ground() {
  return (
    <group>
      {/* Main ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial
          color="#0a0a1a"
          transparent
          opacity={0.8}
          roughness={0.9}
        />
      </mesh>

      {/* Grid lines */}
      <gridHelper
        args={[20, 40, "#1e1b4b", "#1e1b4b"]}
        position={[0, 0, 0]}
      />
      <gridHelper
        args={[20, 8, "#312e81", "#312e81"]}
        position={[0, 0.005, 0]}
      />
    </group>
  );
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.15} color="#c4b5fd" />
      <directionalLight
        position={[8, 12, 5]}
        intensity={0.3}
        color="#e0e7ff"
      />
      <pointLight
        position={[-6, 4, -6]}
        intensity={0.8}
        color="#6366f1"
        distance={20}
        decay={2}
      />
      <pointLight
        position={[6, 3, 6]}
        intensity={0.5}
        color="#8b5cf6"
        distance={15}
        decay={2}
      />
    </>
  );
}

export default function EnergyGrid({ houses = [], onHouseClick }) {
  const houseData = useMemo(() => {
    return houses.map((house) => ({
      ...house,
      position: [house.x, 0, house.z],
      lineStart: [0, 0.8, 0],
      lineEnd: [house.x, 0.35, house.z],
    }));
  }, [houses]);

  return (
    <>
      <color attach="background" args={["#050510"]} />
      <fog attach="fog" args={["#050510", 12, 25]} />

      <SceneLighting />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={18}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={0.2}
        target={[0, 0.3, 0]}
      />

      <Ground />

      <PowerSource />

      {houseData.map((house) => (
        <House3D
          key={house.id}
          position={house.position}
          houseNumber={house.houseNumber}
          status={house.status}
          energyLevel={house.energyLevel}
          onClick={() => onHouseClick?.(house)}
        />
      ))}

      {houseData.map((house) => (
        <EnergyLine
          key={`line-${house.id}`}
          start={house.lineStart}
          end={house.lineEnd}
          status={house.status}
          energyLevel={house.energyLevel}
        />
      ))}
    </>
  );
}
