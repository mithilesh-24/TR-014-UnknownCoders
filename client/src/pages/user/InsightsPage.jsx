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
    <div className="min-h-screen bg-[#0a0a0f] p-6 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-10 w-52 bg-white/5 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 bg-white/5 rounded-2xl" />
          <div className="h-48 bg-white/5 rounded-2xl" />
        </div>
        <div className="h-80 bg-white/5 rounded-2xl" />
        <div className="h-24 bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-28 bg-white/5 rounded-2xl" />
          <div className="h-28 bg-white/5 rounded-2xl" />
        </div>
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
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <GlassCard className="p-8 text-center max-w-md">
          <HiChartBar className="text-red-400 text-4xl mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Failed to load insights</h2>
          <p className="text-slate-400 text-sm">{error}</p>
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
    <div className="min-h-screen bg-[#0a0a0f] p-4 md:p-6 lg:p-8">
      <motion.div
        className="max-w-6xl mx-auto space-y-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div variants={item} className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <RiFlashlightLine className="text-purple-400 text-xl" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Usage Insights</h1>
            <p className="text-slate-400 text-sm">Analyze your energy consumption patterns</p>
          </div>
        </motion.div>

        {/* Comparison Cards Row */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Today vs Yesterday Card */}
          <GlassCard className="p-5 md:p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <HiChartBar className="text-indigo-400" />
              Today vs Yesterday
            </h3>

            <div className="flex items-center gap-6 mb-4">
              {/* Today */}
              <div className="flex-1">
                <p className="text-slate-400 text-xs mb-1">Today</p>
                <AnimatedCounter
                  value={todayTotal}
                  suffix=" kWh"
                  className="text-2xl font-bold text-white"
                  duration={1}
                />
              </div>

              {/* Arrow / change indicator */}
              <div className="flex flex-col items-center">
                <motion.div
                  className={`p-2 rounded-full ${
                    isReduced ? "bg-emerald-500/10" : "bg-red-500/10"
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  {isReduced ? (
                    <HiArrowTrendingDown className="text-emerald-400 text-lg" />
                  ) : (
                    <HiArrowTrendingUp className="text-red-400 text-lg" />
                  )}
                </motion.div>
                <span
                  className={`text-xs font-bold mt-1 ${
                    isReduced ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {changeAbs.toFixed(1)}%
                </span>
              </div>

              {/* Yesterday */}
              <div className="flex-1 text-right">
                <p className="text-slate-400 text-xs mb-1">Yesterday</p>
                <AnimatedCounter
                  value={yesterdayTotal}
                  suffix=" kWh"
                  className="text-2xl font-bold text-white"
                  duration={1}
                />
              </div>
            </div>

            {/* Small comparison bars */}
            <div className="space-y-2">
              {comparisonData.map((entry) => {
                const maxVal = Math.max(todayTotal, yesterdayTotal, 1);
                const pct = (entry.value / maxVal) * 100;
                const isToday = entry.label === "Today";
                return (
                  <div key={entry.label} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-16">{entry.label}</span>
                    <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          isToday ? "bg-indigo-500" : "bg-purple-500/60"
                        }`}
                        initial={{ width: "0%" }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-14 text-right">
                      {entry.value.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* This Week Card */}
          <GlassCard className="p-5 md:p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <HiCalendarDays className="text-purple-400" />
              This Week
            </h3>

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-slate-400 text-xs mb-1">Avg. Daily</p>
                <p className="text-2xl font-bold text-white">
                  {weeklyAvg} <span className="text-sm text-slate-400">kWh</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs mb-1">Total</p>
                <p className="text-lg font-semibold text-slate-300">
                  {weeklyData.reduce((s, d) => s + d.consumption, 0).toFixed(1)}{" "}
                  <span className="text-xs text-slate-400">kWh</span>
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
              <div className="h-24 flex items-center justify-center text-slate-500 text-xs">
                No weekly data
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Weekly Bar Chart */}
        <motion.div variants={item}>
          <GlassCard className="p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Weekly Consumption</h2>
                <p className="text-slate-400 text-xs mt-0.5">Daily energy usage breakdown</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                kWh per day
              </div>
            </div>
            {weeklyChartData.length > 0 ? (
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
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
                No weekly data available
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Peak Usage Hour */}
        <motion.div variants={item}>
          <GlassCard hover className="p-5">
            <div className="flex items-center gap-4">
              <motion.div
                className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <HiClock className="text-amber-400 text-2xl" />
              </motion.div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider">Peak Usage Hour</p>
                <p className="text-xl font-bold text-white mt-0.5">
                  {peakHour !== undefined && peakHour !== null
                    ? formatHour(peakHour)
                    : "N/A"}
                </p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Your highest energy consumption period today
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <motion.div variants={item}>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <HiLightBulb className="text-yellow-400" />
              Smart Suggestions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map((suggestion, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + idx * 0.12 }}
                >
                  <div className="relative rounded-2xl overflow-hidden">
                    {/* Gradient border effect */}
                    <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-transparent pointer-events-none">
                      <div className="w-full h-full rounded-2xl bg-[#0a0a0f]" />
                    </div>

                    <GlassCard className="relative p-4 md:p-5">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/15 flex-shrink-0 mt-0.5">
                          <HiLightBulb className="text-yellow-400 text-sm" />
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">{suggestion}</p>
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
          <motion.div variants={item}>
            <GlassCard className="p-8 text-center">
              <HiLightBulb className="text-slate-600 text-3xl mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
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
