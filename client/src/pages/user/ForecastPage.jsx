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
  if (ratio >= 0.7) return { ring: "border-emerald-400", bg: "bg-emerald-400", text: "text-emerald-400", glow: "shadow-[0_0_12px_rgba(52,211,153,0.4)]" };
  if (ratio >= 0.4) return { ring: "border-yellow-400", bg: "bg-yellow-400", text: "text-yellow-400", glow: "shadow-[0_0_12px_rgba(250,204,21,0.4)]" };
  return { ring: "border-red-400", bg: "bg-red-400", text: "text-red-400", glow: "shadow-[0_0_12px_rgba(248,113,113,0.4)]" };
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
    <div className="min-h-screen bg-[#0a0a0f] p-6 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-10 w-56 bg-white/5 rounded-xl" />
        <div className="h-40 bg-white/5 rounded-2xl" />
        <div className="h-72 bg-white/5 rounded-2xl" />
        <div className="h-24 bg-white/5 rounded-2xl" />
      </div>
    </div>
  );
}

function TimelineNode({ forecast, index, isFirst, maxAllocation, totalNodes }) {
  const colors = getNodeColor(forecast.allocatedEnergy, maxAllocation);
  const isCurrentHour = index === 0;

  return (
    <motion.div
      className="flex flex-col items-center relative flex-1"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
    >
      {/* Hour label */}
      <span className={`text-xs font-medium mb-3 ${isCurrentHour ? "text-indigo-300" : "text-slate-400"}`}>
        {isCurrentHour ? "Now" : formatHour(forecast.hour)}
      </span>

      {/* Node */}
      <div className="relative">
        {isCurrentHour && (
          <motion.div
            className={`absolute inset-0 rounded-full ${colors.bg} opacity-30`}
            animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ margin: "-4px" }}
          />
        )}
        <div
          className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 ${colors.ring} ${colors.glow}
            bg-[#0a0a0f] flex items-center justify-center z-10 relative`}
        >
          <HiBolt className={`text-sm md:text-base ${colors.text}`} />
        </div>
      </div>

      {/* Allocated energy */}
      <div className="mt-3 text-center">
        <p className={`text-sm md:text-base font-bold ${colors.text}`}>
          {forecast.allocatedEnergy} kWh
        </p>
        <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">
          {forecast.confidence}% conf
        </p>
      </div>
    </motion.div>
  );
}

function ConnectingLine({ index, total }) {
  return (
    <motion.div
      className="flex-1 flex items-center -mx-1 mt-4"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.4, delay: index * 0.15 + 0.2 }}
      style={{ originX: 0 }}
    >
      <div className="w-full h-[2px] bg-gradient-to-r from-indigo-500/60 to-purple-500/40 rounded-full" />
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
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <GlassCard className="p-8 text-center max-w-md">
          <HiClock className="text-red-400 text-4xl mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Failed to load forecast</h2>
          <p className="text-slate-400 text-sm">{error}</p>
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
    <div className="min-h-screen bg-[#0a0a0f] p-4 md:p-6 lg:p-8">
      <motion.div
        className="max-w-6xl mx-auto space-y-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div variants={item} className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <HiArrowTrendingUp className="text-indigo-400 text-xl" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Energy Forecast</h1>
            <p className="text-slate-400 text-sm">Next {nextHours} hours outlook</p>
          </div>
        </motion.div>

        {/* Visual Timeline */}
        <motion.div variants={item}>
          <GlassCard className="p-5 md:p-8">
            <h2 className="text-lg font-semibold text-white mb-6">Allocation Timeline</h2>

            {forecasts.length > 0 ? (
              <div className="flex items-start px-2 md:px-6 overflow-x-auto pb-2">
                {forecasts.map((forecast, index) => (
                  <div key={index} className="contents">
                    <TimelineNode
                      forecast={forecast}
                      index={index}
                      isFirst={index === 0}
                      maxAllocation={maxAllocation}
                      totalNodes={forecasts.length}
                    />
                    {index < forecasts.length - 1 && (
                      <ConnectingLine index={index} total={forecasts.length} />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-10">
                No forecast data available
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Bar Chart: Allocated vs Predicted */}
        <motion.div variants={item}>
          <GlassCard className="p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Allocated vs Predicted Demand</h2>
                <p className="text-slate-400 text-xs mt-0.5">Comparison for upcoming hours</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                  Allocated
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-500/60" />
                  Predicted
                </span>
              </div>
            </div>
            {barChartData.length > 0 ? (
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
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
                No forecast data to display
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Confidence & Tips */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Average Confidence */}
          <GlassCard className="p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <HiChartBar className="text-indigo-400" />
              Forecast Confidence
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Average confidence</span>
                <span className="text-white font-bold text-lg">{avgConfidence}%</span>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, #6366f1, #8b5cf6, ${
                      avgConfidence > 70 ? "#10b981" : avgConfidence > 40 ? "#f59e0b" : "#ef4444"
                    })`,
                  }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${avgConfidence}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
          </GlassCard>

          {/* Tips */}
          <GlassCard className="p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <HiLightBulb className="text-yellow-400" />
              Smart Tips
            </h3>
            <div className="space-y-3">
              {peakForecast && (
                <motion.div
                  className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-slate-300 text-sm">
                    Based on the forecast, consider reducing usage at{" "}
                    <span className="text-amber-400 font-semibold">
                      {formatHour(peakForecast.hour)}
                    </span>{" "}
                    when demand peaks at{" "}
                    <span className="text-amber-400 font-semibold">
                      {peakForecast.predictedDemand} kWh
                    </span>
                    .
                  </p>
                </motion.div>
              )}
              <motion.div
                className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <p className="text-slate-300 text-sm">
                  Shift heavy appliance usage to hours with{" "}
                  <span className="text-indigo-400 font-semibold">high allocation</span>{" "}
                  for optimal energy distribution.
                </p>
              </motion.div>
              <motion.div
                className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
              >
                <p className="text-slate-300 text-sm">
                  Forecasts refresh every hour. Plan ahead for the most{" "}
                  <span className="text-purple-400 font-semibold">efficient energy usage</span>.
                </p>
              </motion.div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
