import { useState, useEffect, useCallback, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../../components/ui/GlassCard";
import EnergyGrid from "../../components/three/EnergyGrid";
import useApi from "../../hooks/useApi";

const GRID_COLS = 4;
const GRID_ROWS = 3;
const SPACING_X = 2.4;
const SPACING_Z = 2.4;

function generateMockHouses() {
  const statuses = ["green", "green", "green", "yellow", "yellow", "red"];
  const houses = [];

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const index = row * GRID_COLS + col;
      const x = (col - (GRID_COLS - 1) / 2) * SPACING_X;
      const z = (row - (GRID_ROWS - 1) / 2) * SPACING_Z;
      const status = statuses[index % statuses.length];
      const energyLevel =
        status === "green"
          ? 0.7 + Math.random() * 0.3
          : status === "yellow"
          ? 0.35 + Math.random() * 0.3
          : 0.05 + Math.random() * 0.2;

      houses.push({
        id: index + 1,
        houseNumber: index + 1,
        x,
        z,
        status,
        energyLevel: Math.round(energyLevel * 100) / 100,
      });
    }
  }

  return houses;
}

function mapApiHousesToGrid(apiHouses) {
  return apiHouses.map((house, index) => {
    const row = Math.floor(index / GRID_COLS);
    const col = index % GRID_COLS;
    const x = (col - (GRID_COLS - 1) / 2) * SPACING_X;
    const z = (row - (GRID_ROWS - 1) / 2) * SPACING_Z;

    const consumption = house.currentConsumption || 0;
    const allocation = house.energyAllocation || house.allocation || 1;
    const ratio = allocation > 0 ? consumption / allocation : 0;

    let status;
    if (ratio <= 0.85) {
      status = "green";
    } else if (ratio <= 1.0) {
      status = "yellow";
    } else {
      status = "red";
    }

    const energyLevel = Math.min(1, Math.max(0, allocation > 0 ? 1 - (ratio - 0.5) / 1.0 : 0));

    return {
      id: house._id || house.id || index + 1,
      houseNumber: house.houseNumber || index + 1,
      x,
      z,
      status,
      energyLevel: Math.round(energyLevel * 100) / 100,
    };
  });
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 8px ${color}80`,
        }}
      />
      <span style={{ fontSize: "12px", color: "#cbd5e1" }}>{label}</span>
    </div>
  );
}

function StatsDisplay({ houses }) {
  const stats = useMemo(() => {
    const total = houses.length;
    const green = houses.filter((h) => h.status === "green").length;
    const yellow = houses.filter((h) => h.status === "yellow").length;
    const red = houses.filter((h) => h.status === "red").length;
    const avgEnergy =
      total > 0
        ? houses.reduce((sum, h) => sum + h.energyLevel, 0) / total
        : 0;

    return { total, green, yellow, red, avgEnergy };
  }, [houses]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "12px",
        marginTop: "12px",
      }}
    >
      <StatBox label="Total Houses" value={stats.total} color="#a78bfa" />
      <StatBox label="Optimal" value={stats.green} color="#22c55e" />
      <StatBox label="Moderate" value={stats.yellow} color="#eab308" />
      <StatBox label="Critical" value={stats.red} color="#ef4444" />
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "8px",
        borderRadius: "8px",
        background: `${color}10`,
        border: `1px solid ${color}30`,
      }}
    >
      <div
        style={{
          fontSize: "20px",
          fontWeight: 700,
          color,
          fontFamily: "monospace",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "10px",
          color: "#94a3b8",
          marginTop: "2px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function EnergyVisualizationPage() {
  const [houses, setHouses] = useState([]);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const api = useApi();

  const fetchHouses = useCallback(async () => {
    try {
      const data = await api.get("/admin/houses");
      const houseList = Array.isArray(data) ? data : data?.houses || data?.data || [];

      if (houseList.length > 0) {
        setHouses(mapApiHousesToGrid(houseList));
      } else {
        setHouses(generateMockHouses());
      }
    } catch {
      setHouses(generateMockHouses());
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchHouses();
  }, [fetchHouses]);

  const handleHouseClick = useCallback((house) => {
    setSelectedHouse((prev) => (prev?.id === house.id ? null : house));
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        background: "#050510",
        overflow: "hidden",
      }}
    >
      {/* 3D Canvas */}
      <Canvas
        camera={{
          position: [6, 7, 8],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          toneMapping: 3,
          toneMappingExposure: 1.2,
        }}
        style={{ position: "absolute", inset: 0 }}
      >
        <EnergyGrid houses={houses} onHouseClick={handleHouseClick} />
      </Canvas>

      {/* Top-left overlay: Title + Legend */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <GlassCard style={{ padding: "1rem", maxWidth: "320px" }}>
          <h1
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#e2e8f0",
              margin: 0,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Energy Flow Visualization
          </h1>
          <p
            style={{
              fontSize: "12px",
              color: "#64748b",
              margin: "4px 0 12px 0",
            }}
          >
            Real-time colony power distribution
          </p>

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <LegendItem color="#22c55e" label="Optimal Supply" />
            <LegendItem color="#eab308" label="Moderate Load" />
            <LegendItem color="#ef4444" label="Critical Shortage" />
          </div>

          <StatsDisplay houses={houses} />
        </GlassCard>
      </motion.div>

      {/* Top-right overlay: Controls */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 10,
        }}
      >
        <GlassCard style={{ padding: "0.75rem" }}>
          <div
            style={{
              fontSize: "10px",
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "8px",
            }}
          >
            Camera Controls
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div
              style={{
                fontSize: "11px",
                color: "#94a3b8",
                padding: "4px 0",
              }}
            >
              Left click + drag to rotate
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#94a3b8",
                padding: "4px 0",
              }}
            >
              Scroll to zoom
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#94a3b8",
                padding: "4px 0",
              }}
            >
              Right click + drag to pan
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Selected house detail panel */}
      <AnimatePresence>
        {selectedHouse && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "absolute",
              bottom: "20px",
              right: "20px",
              zIndex: 10,
            }}
          >
            <GlassCard style={{ padding: "1rem", minWidth: "220px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#e2e8f0",
                    margin: 0,
                  }}
                >
                  House #{selectedHouse.houseNumber}
                </h3>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background:
                      selectedHouse.status === "green"
                        ? "#22c55e"
                        : selectedHouse.status === "yellow"
                        ? "#eab308"
                        : "#ef4444",
                    boxShadow: `0 0 8px ${
                      selectedHouse.status === "green"
                        ? "#22c55e"
                        : selectedHouse.status === "yellow"
                        ? "#eab308"
                        : "#ef4444"
                    }80`,
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <DetailRow
                  label="Status"
                  value={
                    selectedHouse.status === "green"
                      ? "Optimal"
                      : selectedHouse.status === "yellow"
                      ? "Moderate"
                      : "Critical"
                  }
                  color={
                    selectedHouse.status === "green"
                      ? "#22c55e"
                      : selectedHouse.status === "yellow"
                      ? "#eab308"
                      : "#ef4444"
                  }
                />
                <DetailRow
                  label="Energy Level"
                  value={`${Math.round(selectedHouse.energyLevel * 100)}%`}
                  color="#a78bfa"
                />
                <DetailRow
                  label="Grid Position"
                  value={`(${selectedHouse.x.toFixed(1)}, ${selectedHouse.z.toFixed(1)})`}
                  color="#94a3b8"
                />

                {/* Energy bar */}
                <div style={{ marginTop: "4px" }}>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#64748b",
                      marginBottom: "4px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Power Draw
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${selectedHouse.energyLevel * 100}%`,
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      style={{
                        height: "100%",
                        borderRadius: "3px",
                        background:
                          selectedHouse.status === "green"
                            ? "linear-gradient(90deg, #22c55e, #4ade80)"
                            : selectedHouse.status === "yellow"
                            ? "linear-gradient(90deg, #eab308, #facc15)"
                            : "linear-gradient(90deg, #ef4444, #f87171)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#050510",
              zIndex: 50,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  width: "40px",
                  height: "40px",
                  border: "2px solid rgba(99, 102, 241, 0.2)",
                  borderTopColor: "#6366f1",
                  borderRadius: "50%",
                  margin: "0 auto 16px",
                }}
              />
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "14px",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                Initializing Energy Grid...
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailRow({ label, value, color }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ fontSize: "11px", color: "#64748b" }}>{label}</span>
      <span style={{ fontSize: "12px", fontWeight: 600, color }}>{value}</span>
    </div>
  );
}
