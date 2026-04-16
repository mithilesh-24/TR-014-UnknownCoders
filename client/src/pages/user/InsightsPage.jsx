import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HiArrowTrendingUp,
  HiArrowTrendingDown,
  HiClock,
  HiLightBulb,
  HiChartBar,
  HiCalendarDays,
} from "react-icons/hi2";
import { RiFlashlightLine } from "react-icons/ri";
import GlassCard from "../../components/ui/GlassCard";
import AnimatedCounter from "../../components/ui/AnimatedCounter";
import AnimatedBarChart from "../../components/charts/AnimatedBarChart";
import AnimatedAreaChart from "../../components/charts/AnimatedAreaChart";
import useApi from "../../hooks/useApi";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function LoadingSkeleton() {
  return (
    <div className="page-container">
      <div className="skeleton-pulse skeleton-title" />
      <div className="grid-metrics" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <div className="skeleton-pulse skeleton-chart-full" style={{ height: "12rem" }} />
        <div className="skeleton-pulse skeleton-chart-full" style={{ height: "12rem" }} />
      </div>
      <div className="skeleton-pulse skeleton-chart-full" style={{ height: "20rem" }} />
      <div className="skeleton-pulse skeleton-title" style={{ width: "12rem" }} />
      <div className="grid-metrics" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <div className="skeleton-pulse skeleton-chart-full" style={{ height: "8rem" }} />
        <div className="skeleton-pulse skeleton-chart-full" style={{ height: "8rem" }} />
      </div>
    </div>
  );
}

function formatHour(hour) {
  if (hour === undefined || hour === null) return "N/A";
  const h = Number(hour) % 24;
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

export default function InsightsPage() {
  const api = useApi();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchInsights() {
      try {
        setLoading(true);
        const res = await api.get("/user/insights");
        if (mounted) setData(res);
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchInsights();
    return () => { mounted = false; };
  }, [api]);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="page-container flex-col-center h-full">
        <GlassCard className="p-6 text-center" style={{ maxWidth: '28rem' }}>
          <HiChartBar style={{ fontSize: "2.25rem", color: "#f87171", margin: '0 auto 1rem' }} />
          <h2 className="page-title mb-2">Failed to load insights</h2>
          <p className="page-subtitle">{error}</p>
        </GlassCard>
      </div>
    );
  }

  const {
    todayTotal = 0,
    yesterdayTotal = 0,
    percentChange = 0,
    weeklyData = [],
    peakHour,
    suggestions = [],
  } = data || {};

  const isReduced = percentChange <= 0;
  const changeAbs = Math.abs(percentChange);

  // Prepare weekly chart data
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const weeklyChartData = weeklyData.map((entry, idx) => ({
    day: entry.day || dayNames[idx % 7],
    consumption: entry.consumption,
  }));

  // Sparkline data for the week
  const sparklineData = weeklyData.map((entry, idx) => ({
    day: entry.day || dayNames[idx % 7],
    value: entry.consumption,
  }));

  // Calculate weekly average
  const weeklyAvg = weeklyData.length
    ? (weeklyData.reduce((sum, d) => sum + d.consumption, 0) / weeklyData.length).toFixed(1)
    : 0;

  // Small comparison data for today vs yesterday
  const comparisonData = [
    { label: "Yesterday", value: yesterdayTotal },
    { label: "Today", value: todayTotal },
  ];

  return (
    <div className="page-container">
      <motion.div className="page-inner-md" variants={container} initial="hidden" animate="show">
        {/* Header */}
        <motion.div variants={item} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div style={{ padding: "0.625rem", borderRadius: "0.75rem", backgroundColor: "rgba(168, 85, 247, 0.1)", border: "1px solid rgba(168, 85, 247, 0.2)" }}>
            <RiFlashlightLine style={{ fontSize: "1.25rem", color: "#c084fc" }} />
          </div>
          <div>
            <h1 className="page-title">Usage Insights</h1>
            <p className="page-subtitle">Analyze your energy consumption patterns</p>
          </div>
        </motion.div>

        {/* Comparison Cards Row */}
        <motion.div variants={item} className="grid-metrics mt-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
          {/* Today vs Yesterday Card */}
          <GlassCard className="metric-card">
            <h3 style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--text-primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <HiChartBar style={{ color: "#818cf8" }} />
              Today vs Yesterday
            </h3>

            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "1rem" }}>
              {/* Today */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Today</p>
                <AnimatedCounter
                  value={todayTotal}
                  suffix=" kWh"
                  style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}
                  duration={1}
                />
              </div>

              {/* Arrow / change indicator */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <motion.div
                  style={{ padding: "0.5rem", borderRadius: "50%", backgroundColor: isReduced ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)" }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  {isReduced ? (
                    <HiArrowTrendingDown style={{ fontSize: "1.125rem", color: "#34d399" }} />
                  ) : (
                    <HiArrowTrendingUp style={{ fontSize: "1.125rem", color: "#f87171" }} />
                  )}
                </motion.div>
                <span
                  style={{ fontSize: "0.75rem", fontWeight: "700", marginTop: "0.25rem", color: isReduced ? "#34d399" : "#f87171" }}
                >
                  {changeAbs.toFixed(1)}%
                </span>
              </div>

              {/* Yesterday */}
              <div style={{ flex: 1, textAlign: "right" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Yesterday</p>
                <AnimatedCounter
                  value={yesterdayTotal}
                  suffix=" kWh"
                  style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}
                  duration={1}
                />
              </div>
            </div>

            {/* Small comparison bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {comparisonData.map((entry) => {
                const maxVal = Math.max(todayTotal, yesterdayTotal, 1);
                const pct = (entry.value / maxVal) * 100;
                const isToday = entry.label === "Today";
                return (
                  <div key={entry.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", width: "4rem" }}>{entry.label}</span>
                    <div style={{ flex: 1, height: "0.625rem", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "9999px", overflow: "hidden" }}>
                      <motion.div
                        style={{ height: "100%", borderRadius: "9999px", backgroundColor: isToday ? "#6366f1" : "rgba(168, 85, 247, 0.6)" }}
                        initial={{ width: "0%" }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                      />
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", width: "3.5rem", textAlign: "right" }}>
                      {entry.value.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* This Week Card */}
          <GlassCard className="metric-card">
            <h3 style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--text-primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <HiCalendarDays style={{ color: "#c084fc" }} />
              This Week
            </h3>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Avg. Daily</p>
                <p style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}>
                  {weeklyAvg} <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>kWh</span>
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Total</p>
                <p style={{ fontSize: "1.125rem", fontWeight: "600", color: "#cbd5e1" }}>
                  {weeklyData.reduce((s, d) => s + d.consumption, 0).toFixed(1)}{" "}
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>kWh</span>
                </p>
              </div>
            </div>

            {/* Sparkline mini chart */}
            {sparklineData.length > 0 ? (
              <AnimatedAreaChart
                data={sparklineData}
                areas={[
                  {
                    dataKey: "value",
                    name: "Usage",
                    stroke: "#8b5cf6",
                    fill: "#8b5cf6",
                    fillOpacity: 0.1,
                    strokeWidth: 2,
                  },
                ]}
                xKey="day"
                height={100}
                showGrid={false}
              />
            ) : (
              <div className="flex-col-center" style={{ height: "6rem", color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                No weekly data
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Weekly Bar Chart */}
        <motion.div variants={item} className="mt-6">
          <GlassCard className="chart-card">
            <div className="chart-header">
              <div>
                <h2 className="chart-title">Weekly Consumption</h2>
                <p className="chart-subtitle">Daily energy usage breakdown</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span style={{ width: "0.625rem", height: "0.625rem", borderRadius: "0.125rem", backgroundColor: "#6366f1" }} />
                kWh per day
              </div>
            </div>
            {weeklyChartData.length > 0 ? (
              <div className="chart-area">
                <AnimatedBarChart
                  data={weeklyChartData}
                  bars={[
                    {
                      dataKey: "consumption",
                      name: "Consumption",
                      fill: "#6366f1",
                      radius: [6, 6, 0, 0],
                      maxBarSize: 50,
                    },
                  ]}
                  xKey="day"
                  height={320}
                />
              </div>
            ) : (
              <div className="flex-col-center h-full chart-area" style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                No weekly data available
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Peak Usage Hour */}
        <motion.div variants={item} className="mt-6">
          <GlassCard hover className="metric-card">
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <motion.div
                style={{ padding: "0.75rem", borderRadius: "0.75rem", backgroundColor: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)" }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <HiClock style={{ fontSize: "1.5rem", color: "#fbbf24" }} />
              </motion.div>
              <div>
                <p className="metric-label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Peak Usage Hour</p>
                <p style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-primary)", marginTop: "0.125rem" }}>
                  {peakHour !== undefined && peakHour !== null
                    ? formatHour(peakHour)
                    : "N/A"}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.125rem" }}>
                  Your highest energy consumption period today
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <motion.div variants={item} className="mt-6">
            <h2 style={{ fontSize: "1.125rem", fontWeight: "600", color: "var(--text-primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <HiLightBulb style={{ color: "#facc15" }} />
              Smart Suggestions
            </h2>
            <div className="grid-metrics" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
              {suggestions.map((suggestion, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + idx * 0.12 }}
                >
                  <div style={{ position: "relative", borderRadius: "1rem", overflow: "hidden" }}>
                    {/* Gradient border effect */}
                    <div style={{ position: "absolute", inset: 0, borderRadius: "1rem", padding: "1px", background: "linear-gradient(to bottom right, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.2), transparent)", pointerEvents: "none" }}>
                      <div style={{ width: "100%", height: "100%", borderRadius: "1rem", backgroundColor: "transparent" }} />
                    </div>

                    <GlassCard style={{ position: "relative", padding: "1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                        <div style={{ padding: "0.375rem", borderRadius: "0.5rem", backgroundColor: "rgba(234, 179, 8, 0.1)", border: "1px solid rgba(234, 179, 8, 0.15)", flexShrink: 0, marginTop: "0.125rem" }}>
                          <HiLightBulb style={{ fontSize: "0.875rem", color: "#facc15" }} />
                        </div>
                        <p style={{ color: "#cbd5e1", fontSize: "0.875rem", lineHeight: 1.6 }}>{suggestion}</p>
                      </div>
                    </GlassCard>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty suggestions state */}
        {suggestions.length === 0 && (
          <motion.div variants={item} className="mt-6">
            <GlassCard className="p-8 text-center" style={{ padding: "2rem" }}>
              <HiLightBulb style={{ fontSize: "1.875rem", color: "#475569", margin: "0 auto 0.75rem" }} />
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                No suggestions available yet. Keep using energy and we'll provide
                personalized tips to optimize your consumption.
              </p>
            </GlassCard>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
