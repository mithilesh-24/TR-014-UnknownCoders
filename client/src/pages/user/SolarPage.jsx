import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HiSun,
  HiBolt,
  HiArrowUpTray,
  HiCalendarDays,
  HiExclamationTriangle,
} from "react-icons/hi2";
import { RiSunFoggyLine } from "react-icons/ri";
import GlassCard from "../../components/ui/GlassCard";
import AnimatedCounter from "../../components/ui/AnimatedCounter";
import AnimatedAreaChart from "../../components/charts/AnimatedAreaChart";
import useApi from "../../hooks/useApi";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function LoadingSkeleton() {
  return (
    <div className="page-container">
      <div className="skeleton-pulse skeleton-title" />
      <div className="grid-metrics" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton-pulse skeleton-metric" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
      <div className="skeleton-pulse skeleton-chart-full" />
    </div>
  );
}

function CircularProgress({ percentage, size = 140, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(Math.max(percentage, 0), 100);

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#solarGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (clampedPct / 100) * circumference }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
        />
        <defs>
          <linearGradient id="solarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex-col-center h-full w-full" style={{ position: "absolute", inset: 0 }}>
        <span style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}>{Math.round(clampedPct)}%</span>
        <span style={{ fontSize: "0.625rem", color: "var(--text-secondary)" }}>to grid</span>
      </div>
    </div>
  );
}

function NoSolarMessage() {
  return (
    <div className="page-container flex-col-center h-full">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <GlassCard className="p-6 text-center" style={{ maxWidth: '32rem' }}>
          <motion.div
            className="flex-center mx-auto"
            style={{ width: "5rem", height: "5rem", borderRadius: "50%", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)", marginBottom: "1.5rem" }}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <HiSun style={{ fontSize: "2.25rem", color: "#fbbf24" }} />
          </motion.div>
          <h2 className="page-title mb-4">No Solar Panels Detected</h2>
          <p className="page-subtitle mb-6" style={{ lineHeight: "1.625" }}>
            Your home doesn't currently have solar panels configured.
            Solar panels can help reduce your energy costs and contribute
            clean energy to the grid.
          </p>
          <div className="p-4" style={{ borderRadius: "0.75rem", background: "rgba(99, 102, 241, 0.05)", border: "1px solid rgba(99, 102, 241, 0.1)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
              <HiExclamationTriangle style={{ fontSize: "1.125rem", color: "#818cf8", marginTop: "0.125rem", flexShrink: 0 }} />
              <div style={{ textAlign: "left" }}>
                <p style={{ color: "#cbd5e1", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.25rem" }}>Interested in solar?</p>
                <p style={{ color: "#94a3b8", fontSize: "0.75rem", lineHeight: "1.625" }}>
                  Contact your energy administrator to learn about solar panel installation
                  options and how they can be integrated with the smart grid system.
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

export default function SolarPage() {
  const { get } = useApi();
  const [data, setData] = useState(null);
  const [hasSolar, setHasSolar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchSolar() {
      try {
        setLoading(true);
        const dashboard = await get("/user/dashboard");
        if (!mounted) return;

        if (!dashboard.house?.hasSolar) {
          setHasSolar(false);
          setLoading(false);
          return;
        }

        setHasSolar(true);
        const solarData = await get("/user/solar");
        if (mounted) setData(solarData);
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchSolar();
    return () => { mounted = false; };
  }, []);

  if (loading) return <LoadingSkeleton />;

  if (hasSolar === false) return <NoSolarMessage />;

  if (error) {
    return (
      <div className="page-container flex-col-center h-full">
        <GlassCard className="p-6 text-center" style={{ maxWidth: '28rem' }}>
          <HiSun style={{ fontSize: "2.25rem", color: "#f87171", margin: '0 auto 1rem' }} />
          <h2 className="page-title mb-2">Failed to load solar data</h2>
          <p className="page-subtitle">{error}</p>
        </GlassCard>
      </div>
    );
  }

  const {
    currentGeneration = 0,
    todayTotal = 0,
    monthlyTotal = 0,
    gridContribution = 0,
    hourlyGeneration = [],
    prediction = [],
  } = data || {};

  // Merge hourly generation with predictions for the chart
  const generationMap = new Map();
  hourlyGeneration.forEach((entry) => {
    generationMap.set(entry.hour, {
      hour: `${String(entry.hour).padStart(2, "0")}:00`,
      generated: entry.generated,
    });
  });
  prediction.forEach((entry) => {
    const existing = generationMap.get(entry.hour) || {
      hour: `${String(entry.hour).padStart(2, "0")}:00`,
    };
    existing.predicted = entry.predicted;
    generationMap.set(entry.hour, existing);
  });
  const chartData = Array.from(generationMap.values()).sort(
    (a, b) => parseInt(a.hour) - parseInt(b.hour)
  );

  // Calculate grid contribution percentage
  const gridPct = todayTotal > 0 ? (gridContribution / todayTotal) * 100 : 0;

  const statCards = [
    { label: "Current Generation", value: currentGeneration, suffix: " kW", icon: HiSun, iconColor: "#fbbf24", bgColor: "rgba(245, 158, 11, 0.1)", borderColor: "rgba(245, 158, 11, 0.2)" },
    { label: "Today's Total", value: todayTotal, suffix: " kWh", icon: HiBolt, iconColor: "#fb923c", bgColor: "rgba(249, 115, 22, 0.1)", borderColor: "rgba(249, 115, 22, 0.2)" },
    { label: "Monthly Total", value: monthlyTotal, suffix: " kWh", icon: HiCalendarDays, iconColor: "#818cf8", bgColor: "rgba(99, 102, 241, 0.1)", borderColor: "rgba(99, 102, 241, 0.2)" },
    { label: "Grid Contribution", value: gridContribution, suffix: " kWh", icon: HiArrowUpTray, iconColor: "#34d399", bgColor: "rgba(16, 185, 129, 0.1)", borderColor: "rgba(16, 185, 129, 0.2)" },
  ];

  return (
    <div className="page-container">
      <motion.div className="page-inner-md" variants={container} initial="hidden" animate="show">
        {/* Header */}
        <motion.div variants={item} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <motion.div
            style={{ padding: "0.625rem", borderRadius: "0.75rem", backgroundColor: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)" }}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <HiSun style={{ fontSize: "1.25rem", color: "#fbbf24" }} />
          </motion.div>
          <div>
            <h1 className="page-title">Your Solar Generation</h1>
            <p className="page-subtitle">Real-time solar panel performance</p>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <motion.div variants={item} className="grid-metrics" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <GlassCard hover key={card.label} className="metric-card">
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <p className="metric-label" style={{ fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: 1.25 }}>
                    {card.label}
                  </p>
                  <div style={{ padding: "0.5rem", borderRadius: "0.5rem", backgroundColor: card.bgColor, border: `1px solid ${card.borderColor}` }}>
                    <Icon style={{ color: card.iconColor, fontSize: "1rem" }} />
                  </div>
                </div>
                <AnimatedCounter
                  value={card.value}
                  suffix={card.suffix}
                  style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}
                  duration={1.2}
                />
              </GlassCard>
            );
          })}
        </motion.div>

        {/* Solar Generation Chart */}
        <motion.div variants={item} className="mt-6">
          <GlassCard className="chart-card">
            <div className="chart-header">
              <div>
                <h2 className="chart-title">Hourly Solar Generation</h2>
                <p className="chart-subtitle">Generation data with predicted output</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.75rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "var(--text-secondary)" }}>
                  <span style={{ width: "0.625rem", height: "0.625rem", borderRadius: "0.125rem", backgroundColor: "#f59e0b" }} />
                  Generated
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "var(--text-secondary)" }}>
                  <span style={{ width: "0.625rem", height: "0.625rem", borderRadius: "0.125rem", backgroundColor: "#fb923c", opacity: 0.5 }} />
                  Predicted
                </span>
              </div>
            </div>
            {chartData.length > 0 ? (
              <div className="chart-area">
                <AnimatedAreaChart
                  data={chartData}
                  areas={[
                    { dataKey: "generated", name: "Generated", stroke: "#f59e0b", fill: "#f59e0b", fillOpacity: 0.15, strokeWidth: 2.5 },
                    { dataKey: "predicted", name: "Predicted", stroke: "#fb923c", fill: "#fb923c", fillOpacity: 0.05, strokeWidth: 2 }
                  ]}
                  xKey="hour"
                  height={320}
                />
              </div>
            ) : (
              <div className="flex-col-center h-full chart-area" style={{ color: "var(--text-secondary)" }}>
                <RiSunFoggyLine style={{ fontSize: "2.25rem", marginBottom: "0.5rem", color: "#475569" }} />
                <p style={{ fontSize: "0.875rem" }}>No generation data available</p>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Grid Contribution Meter */}
        <motion.div variants={item} className="mt-6">
          <GlassCard style={{ padding: "2rem" }}>
            <h2 className="page-title text-center mb-6">Grid Contribution Meter</h2>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "2rem" }}>
              <CircularProgress percentage={gridPct} size={160} strokeWidth={12} />
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <p className="metric-label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Energy Fed to Grid</p>
                  <p style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}>
                    {gridContribution.toFixed(1)} <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>kWh</span>
                  </p>
                </div>
                <div>
                  <p className="metric-label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Total Generated Today</p>
                  <p style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}>
                    {todayTotal.toFixed(1)} <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>kWh</span>
                  </p>
                </div>
                <div style={{ padding: "0.75rem", borderRadius: "0.75rem", backgroundColor: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.1)" }}>
                  <p style={{ fontSize: "0.875rem", color: "#34d399", maxWidth: "24rem" }}>
                    You're contributing <span style={{ fontWeight: "700" }}>{gridPct.toFixed(1)}%</span> of your
                    solar energy back to the community grid.
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
