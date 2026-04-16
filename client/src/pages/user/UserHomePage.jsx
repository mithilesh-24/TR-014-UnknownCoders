import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HiHome, HiBolt, HiClock, HiChartBar } from "react-icons/hi2";
import GlassCard from "../../components/ui/GlassCard";
import AnimatedCounter from "../../components/ui/AnimatedCounter";
import StatusBadge from "../../components/ui/StatusBadge";
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

const statusLabels = {
  ok: "Supply Stable",
  warning: "Limited Supply",
  critical: "Supply Shortage",
};

function LoadingSkeleton() {
  return (
    <div className="page-container">
      <div className="skeleton-pulse skeleton-title" />
      <div className="grid-metrics" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton-pulse skeleton-metric" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
      <div className="skeleton-pulse skeleton-chart-full" />
    </div>
  );
}

export default function UserHomePage() {
  const api = useApi();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchDashboard() {
      try {
        setLoading(true);
        const res = await api.get("/user/dashboard");
        if (mounted) setData(res);
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchDashboard();
    return () => { mounted = false; };
  }, [api]);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="page-container flex-col-center h-full">
        <GlassCard className="p-6 text-center" style={{ maxWidth: '28rem' }}>
          <HiBolt style={{ width: '3rem', height: '3rem', color: '#f87171', margin: '0 auto 1rem' }} />
          <h2 className="page-title mb-2">Failed to load dashboard</h2>
          <p className="page-subtitle">{error}</p>
        </GlassCard>
      </div>
    );
  }

  const { house, todayConsumption, currentAllocation, status, hourlyUsage, lastUpdated } = data;

  const chartData = (hourlyUsage || []).map((entry) => ({
    hour: `${String(entry.hour).padStart(2, "0")}:00`,
    energyUsed: entry.energyUsed,
  }));

  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        month: "short",
        day: "numeric",
      })
    : "N/A";

  return (
    <div className="page-container">
      <motion.div className="page-inner-md" variants={container} initial="hidden" animate="show">
        {/* Welcome Section */}
        <motion.div variants={item} className="flex-row-between page-header" style={{ flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="page-title" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              Welcome back,{" "}
              <span className="gradient-text">House #{house?.houseNumber}</span>
            </h1>
            <p className="page-subtitle" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <HiHome style={{ color: "var(--accent)" }} />
              {house?.address || "Address not available"}
            </p>
          </div>
          <StatusBadge status={status || "ok"} label={statusLabels[status] || "Supply Stable"} size="lg" />
        </motion.div>

        {/* Stat Cards */}
        <motion.div variants={item} className="grid-metrics" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {/* Units consumed today */}
          <GlassCard hover className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <p className="metric-label">Today's Consumption</p>
                <AnimatedCounter
                  value={todayConsumption || 0}
                  suffix=" kWh"
                  className="metric-value"
                  duration={1.2}
                />
              </div>
              <div className="metric-icon-wrapper" style={{ backgroundColor: "rgba(99, 102, 241, 0.1)" }}>
                <HiBolt className="metric-icon" style={{ color: "#818cf8" }} />
              </div>
            </div>
          </GlassCard>

          {/* Current allocation */}
          <GlassCard hover className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <p className="metric-label">Current Allocation</p>
                <AnimatedCounter
                  value={currentAllocation || 0}
                  suffix=" kWh"
                  className="metric-value"
                  duration={1.2}
                />
              </div>
              <div className="metric-icon-wrapper" style={{ backgroundColor: "rgba(168, 85, 247, 0.1)" }}>
                <HiChartBar className="metric-icon" style={{ color: "#c084fc" }} />
              </div>
            </div>
          </GlassCard>

          {/* House number */}
          <GlassCard hover className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <p className="metric-label">House Number</p>
                <AnimatedCounter
                  value={house?.houseNumber || 0}
                  prefix="#"
                  className="metric-value"
                  duration={0.8}
                />
              </div>
              <div className="metric-icon-wrapper" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}>
                <HiHome className="metric-icon" style={{ color: "#34d399" }} />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Hourly Usage Chart */}
        <motion.div variants={item} className="mt-6">
          <GlassCard className="chart-card">
            <div className="chart-header">
              <div>
                <h2 className="chart-title">Today's Hourly Usage</h2>
                <p className="chart-subtitle">Live energy consumption</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", backgroundColor: "#818cf8" }} />
                <span className="chart-subtitle">kWh consumed</span>
              </div>
            </div>
            {chartData.length > 0 ? (
              <div className="chart-area">
                <AnimatedAreaChart
                  data={chartData}
                  areas={[
                    { dataKey: "energyUsed", name: "Energy Used", stroke: "#6366f1", fill: "#6366f1", fillOpacity: 0.15, strokeWidth: 2.5 },
                  ]}
                  xKey="hour"
                  height={320}
                />
              </div>
            ) : (
              <div className="flex-col-center h-full chart-area" style={{ color: "var(--text-secondary)" }}>
                No usage data available for today
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Last Updated */}
        <motion.div variants={item} className="flex-row-center mt-6" style={{ gap: "0.5rem", color: "var(--text-secondary)", fontSize: "0.75rem", paddingBottom: "1rem" }}>
          <HiClock />
          <span>Last updated: {formattedLastUpdated}</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
