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
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
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
    <div className="min-h-screen bg-[#0a0a0f] p-6 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-10 w-64 bg-white/5 rounded-xl" />
        <div className="h-6 w-40 bg-white/5 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-white/5 rounded-2xl" />
      </div>
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
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <GlassCard className="p-8 text-center max-w-md">
          <HiBolt className="text-red-400 text-4xl mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Failed to load dashboard</h2>
          <p className="text-slate-400 text-sm">{error}</p>
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
    <div className="min-h-screen bg-[#0a0a0f] p-4 md:p-6 lg:p-8">
      <motion.div
        className="max-w-6xl mx-auto space-y-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Welcome Section */}
        <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                House #{house?.houseNumber}
              </span>
            </h1>
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <HiHome className="text-indigo-400" />
              {house?.address || "Address not available"}
            </p>
          </div>
          <StatusBadge
            status={status || "ok"}
            label={statusLabels[status] || "Supply Stable"}
            size="lg"
          />
        </motion.div>

        {/* Stat Cards */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Units consumed today */}
          <GlassCard hover className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                  Today's Consumption
                </p>
                <AnimatedCounter
                  value={todayConsumption || 0}
                  suffix=" kWh"
                  className="text-2xl md:text-3xl font-bold text-white"
                  duration={1.2}
                />
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <HiBolt className="text-indigo-400 text-xl" />
              </div>
            </div>
          </GlassCard>

          {/* Current allocation */}
          <GlassCard hover className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                  Current Allocation
                </p>
                <AnimatedCounter
                  value={currentAllocation || 0}
                  suffix=" kWh"
                  className="text-2xl md:text-3xl font-bold text-white"
                  duration={1.2}
                />
              </div>
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <HiChartBar className="text-purple-400 text-xl" />
              </div>
            </div>
          </GlassCard>

          {/* House number */}
          <GlassCard hover className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                  House Number
                </p>
                <AnimatedCounter
                  value={house?.houseNumber || 0}
                  prefix="#"
                  className="text-2xl md:text-3xl font-bold text-white"
                  duration={0.8}
                />
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <HiHome className="text-emerald-400 text-xl" />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Hourly Usage Chart */}
        <motion.div variants={item}>
          <GlassCard className="p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Today's Hourly Usage</h2>
                <p className="text-slate-400 text-xs mt-0.5">Live energy consumption</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                kWh consumed
              </div>
            </div>
            {chartData.length > 0 ? (
              <AnimatedAreaChart
                data={chartData}
                areas={[
                  {
                    dataKey: "energyUsed",
                    name: "Energy Used",
                    stroke: "#6366f1",
                    fill: "#6366f1",
                    fillOpacity: 0.15,
                    strokeWidth: 2.5,
                  },
                ]}
                xKey="hour"
                height={320}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
                No usage data available for today
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Last Updated */}
        <motion.div variants={item} className="flex items-center justify-center gap-2 text-slate-500 text-xs pb-4">
          <HiClock className="text-sm" />
          <span>Last updated: {formattedLastUpdated}</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
