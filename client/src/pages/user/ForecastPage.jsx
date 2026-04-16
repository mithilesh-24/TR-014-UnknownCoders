import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HiClock,
  HiBolt,
  HiChartBar,
  HiLightBulb,
  HiArrowTrendingUp,
} from "react-icons/hi2";
import GlassCard from "../../components/ui/GlassCard";
import AnimatedBarChart from "../../components/charts/AnimatedBarChart";
import useApi from "../../hooks/useApi";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function getNodeColor(allocatedEnergy, maxAllocation) {
  const ratio = allocatedEnergy / (maxAllocation || 1);
  if (ratio >= 0.7) return { border: "rgba(52, 211, 153, 0.5)", bg: "#34d399", text: "#34d399", glow: "0 0 12px rgba(52,211,153,0.4)" };
  if (ratio >= 0.4) return { border: "rgba(250, 204, 21, 0.5)", bg: "#facc15", text: "#facc15", glow: "0 0 12px rgba(250,204,21,0.4)" };
  return { border: "rgba(248, 113, 113, 0.5)", bg: "#f87171", text: "#f87171", glow: "0 0 12px rgba(248,113,113,0.4)" };
}

function formatHour(hour) {
  const h = hour % 24;
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function LoadingSkeleton() {
  return (
    <div className="page-container">
      <div className="skeleton-pulse skeleton-title" />
      <div className="skeleton-pulse skeleton-chart-full" style={{ height: "10rem" }} />
      <div className="skeleton-pulse skeleton-chart-full" style={{ height: "18rem" }} />
      <div className="grid-metrics">
        <div className="skeleton-pulse skeleton-chart-full" style={{ height: "6rem" }} />
        <div className="skeleton-pulse skeleton-chart-full" style={{ height: "6rem" }} />
      </div>
    </div>
  );
}

function TimelineNode({ forecast, index, maxAllocation }) {
  const colors = getNodeColor(forecast.allocatedEnergy, maxAllocation);
  const isCurrentHour = index === 0;

  return (
    <motion.div
      style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", flex: 1 }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
    >
      {/* Hour label */}
      <span style={{ fontSize: "0.75rem", fontWeight: "500", marginBottom: "0.75rem", color: isCurrentHour ? "#a5b4fc" : "var(--text-secondary)" }}>
        {isCurrentHour ? "Now" : formatHour(forecast.hour)}
      </span>

      {/* Node */}
      <div style={{ position: "relative" }}>
        {isCurrentHour && (
          <motion.div
            style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: colors.bg, opacity: 0.3, margin: "-4px" }}
            animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <div
          style={{ width: "3rem", height: "3rem", borderRadius: "50%", border: `2px solid ${colors.border}`, boxShadow: colors.glow, backgroundColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, position: "relative" }}
        >
          <HiBolt style={{ fontSize: "1rem", color: colors.text }} />
        </div>
      </div>

      {/* Allocated energy */}
      <div style={{ marginTop: "0.75rem", textAlign: "center" }}>
        <p style={{ fontSize: "1rem", fontWeight: "700", color: colors.text }}>
          {forecast.allocatedEnergy} kWh
        </p>
        <p style={{ fontSize: "0.625rem", color: "var(--text-secondary)", marginTop: "0.125rem" }}>
          {forecast.confidence}% conf
        </p>
      </div>
    </motion.div>
  );
}

function ConnectingLine({ index }) {
  return (
    <motion.div
      style={{ flex: 1, display: "flex", alignItems: "center", margin: "1rem -0.25rem 0", transformOrigin: "left" }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.4, delay: index * 0.15 + 0.2 }}
    >
      <div style={{ width: "100%", height: "2px", background: "linear-gradient(90deg, rgba(99, 102, 241, 0.6), rgba(168, 85, 247, 0.4))", borderRadius: "9999px" }} />
    </motion.div>
  );
}

export default function ForecastPage() {
  const api = useApi();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchForecast() {
      try {
        setLoading(true);
        const res = await api.get("/user/forecast");
        if (mounted) setData(res);
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchForecast();
    return () => { mounted = false; };
  }, [api]);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="page-container flex-col-center h-full">
        <GlassCard className="p-6 text-center" style={{ maxWidth: '28rem' }}>
          <HiClock style={{ fontSize: "2.25rem", color: "#f87171", margin: '0 auto 1rem' }} />
          <h2 className="page-title mb-2">Failed to load forecast</h2>
          <p className="page-subtitle">{error}</p>
        </GlassCard>
      </div>
    );
  }

  const { forecasts = [], nextHours = 5 } = data;
  const maxAllocation = Math.max(...forecasts.map((f) => f.allocatedEnergy), 1);
  const avgConfidence = forecasts.length
    ? Math.round(forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length)
    : 0;

  const peakForecast = forecasts.reduce(
    (peak, f) => (f.predictedDemand > (peak?.predictedDemand || 0) ? f : peak),
    forecasts[0]
  );

  const barChartData = forecasts.map((f) => ({
    hour: formatHour(f.hour),
    allocated: f.allocatedEnergy,
    predicted: f.predictedDemand,
  }));

  return (
    <div className="page-container">
      <motion.div className="page-inner-md" variants={container} initial="hidden" animate="show">
        {/* Header */}
        <motion.div variants={item} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div style={{ padding: "0.625rem", borderRadius: "0.75rem", backgroundColor: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
            <HiArrowTrendingUp style={{ fontSize: "1.25rem", color: "#818cf8" }} />
          </div>
          <div>
            <h1 className="page-title">Energy Forecast</h1>
            <p className="page-subtitle">Next {nextHours} hours outlook</p>
          </div>
        </motion.div>

        {/* Visual Timeline */}
        <motion.div variants={item} className="mt-6">
          <GlassCard className="chart-card">
            <h2 className="chart-title">Allocation Timeline</h2>
            
            {forecasts.length > 0 ? (
              <div style={{ display: "flex", alignItems: "flex-start", padding: "0 1.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                {forecasts.map((forecast, index) => (
                  <div key={index} style={{ display: "contents" }}>
                    <TimelineNode
                      forecast={forecast}
                      index={index}
                      maxAllocation={maxAllocation}
                    />
                    {index < forecasts.length - 1 && (
                      <ConnectingLine index={index} />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-col-center py-10" style={{ color: "var(--text-secondary)" }}>
                No forecast data available
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Bar Chart: Allocated vs Predicted */}
        <motion.div variants={item} className="mt-6">
          <GlassCard className="chart-card">
            <div className="chart-header">
              <div>
                <h2 className="chart-title">Allocated vs Predicted Demand</h2>
                <p className="chart-subtitle">Comparison for upcoming hours</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.75rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "var(--text-secondary)" }}>
                  <span style={{ width: "0.625rem", height: "0.625rem", borderRadius: "0.125rem", backgroundColor: "#6366f1" }} />
                  Allocated
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "var(--text-secondary)" }}>
                  <span style={{ width: "0.625rem", height: "0.625rem", borderRadius: "0.125rem", backgroundColor: "rgba(168, 85, 247, 0.6)" }} />
                  Predicted
                </span>
              </div>
            </div>
            {barChartData.length > 0 ? (
              <div className="chart-area">
                <AnimatedBarChart
                  data={barChartData}
                  bars={[
                    { dataKey: "allocated", name: "Allocated", fill: "#6366f1", radius: [4, 4, 0, 0] },
                    { dataKey: "predicted", name: "Predicted", fill: "#8b5cf6", radius: [4, 4, 0, 0] },
                  ]}
                  xKey="hour"
                  height={300}
                  showLegend={false}
                />
              </div>
            ) : (
              <div className="flex-col-center h-full chart-area" style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                No forecast data to display
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Confidence & Tips */}
        <motion.div variants={item} className="grid-metrics mt-6">
          {/* Average Confidence */}
          <GlassCard className="metric-card">
            <h3 style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--text-primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <HiChartBar style={{ color: "#818cf8" }} />
              Forecast Confidence
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Average confidence</span>
                <span style={{ fontSize: "1.125rem", fontWeight: "700", color: "var(--text-primary)" }}>{avgConfidence}%</span>
              </div>
              <div style={{ width: "100%", height: "0.75rem", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "9999px", overflow: "hidden" }}>
                <motion.div
                  style={{
                    height: "100%", borderRadius: "9999px",
                    background: `linear-gradient(90deg, #6366f1, #8b5cf6, ${
                      avgConfidence > 70 ? "#10b981" : avgConfidence > 40 ? "#f59e0b" : "#ef4444"
                    })`,
                  }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${avgConfidence}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.625rem", color: "#475569" }}>
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
          </GlassCard>

          {/* Tips */}
          <GlassCard className="metric-card">
            <h3 style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--text-primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <HiLightBulb style={{ color: "#facc15" }} />
              Smart Tips
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {peakForecast && (
                <motion.div
                  style={{ padding: "0.75rem", borderRadius: "0.75rem", backgroundColor: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.1)" }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <p style={{ color: "#cbd5e1", fontSize: "0.875rem", lineHeight: 1.5 }}>
                    Based on the forecast, consider reducing usage at{" "}
                    <span style={{ color: "#fbbf24", fontWeight: "600" }}>
                      {formatHour(peakForecast.hour)}
                    </span>{" "}
                    when demand peaks at{" "}
                    <span style={{ color: "#fbbf24", fontWeight: "600" }}>
                      {peakForecast.predictedDemand} kWh
                    </span>.
                  </p>
                </motion.div>
              )}
              <motion.div
                style={{ padding: "0.75rem", borderRadius: "0.75rem", backgroundColor: "rgba(99, 102, 241, 0.05)", border: "1px solid rgba(99, 102, 241, 0.1)" }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <p style={{ color: "#cbd5e1", fontSize: "0.875rem", lineHeight: 1.5 }}>
                  Shift heavy appliance usage to hours with{" "}
                  <span style={{ color: "#818cf8", fontWeight: "600" }}>high allocation</span>{" "}
                  for optimal energy distribution.
                </p>
              </motion.div>
              <motion.div
                style={{ padding: "0.75rem", borderRadius: "0.75rem", backgroundColor: "rgba(168, 85, 247, 0.05)", border: "1px solid rgba(168, 85, 247, 0.1)" }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
              >
                <p style={{ color: "#cbd5e1", fontSize: "0.875rem", lineHeight: 1.5 }}>
                  Forecasts refresh every hour. Plan ahead for the most{" "}
                  <span style={{ color: "#c084fc", fontWeight: "600" }}>efficient energy usage</span>.
                </p>
              </motion.div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
