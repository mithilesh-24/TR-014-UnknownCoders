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
        <div className="h-10 w-64 bg-white/5 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white/5 rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-white/5 rounded-2xl" />
      </div>
    </div>
  );
}

function CircularProgress({ percentage, size = 140, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
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
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{Math.round(clampedPct)}%</span>
        <span className="text-[10px] text-slate-400">to grid</span>
      </div>
    </div>
  );
}

function NoSolarMessage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <GlassCard className="p-8 md:p-12 text-center max-w-lg">
          <motion.div
            className="mx-auto w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <HiSun className="text-amber-400 text-4xl" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-3">No Solar Panels Detected</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Your home doesn't currently have solar panels configured.
            Solar panels can help reduce your energy costs and contribute
            clean energy to the grid.
          </p>
          <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
            <div className="flex items-start gap-3">
              <HiExclamationTriangle className="text-indigo-400 text-lg mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-slate-300 text-sm font-medium mb-1">Interested in solar?</p>
                <p className="text-slate-400 text-xs leading-relaxed">
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
  const api = useApi();
  const [data, setData] = useState(null);
  const [hasSolar, setHasSolar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchSolar() {
      try {
        setLoading(true);
        // First check if user has solar from dashboard
        const dashboard = await api.get("/user/dashboard");
        if (!mounted) return;

        if (!dashboard.house?.hasSolar) {
          setHasSolar(false);
          setLoading(false);
          return;
        }

        setHasSolar(true);
        const solarData = await api.get("/user/solar");
        if (mounted) setData(solarData);
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchSolar();
    return () => { mounted = false; };
  }, [api]);

  if (loading) return <LoadingSkeleton />;

  if (hasSolar === false) return <NoSolarMessage />;

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <GlassCard className="p-8 text-center max-w-md">
          <HiSun className="text-red-400 text-4xl mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Failed to load solar data</h2>
          <p className="text-slate-400 text-sm">{error}</p>
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
    {
      label: "Current Generation",
      value: currentGeneration,
      suffix: " kW",
      icon: HiSun,
      iconColor: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      label: "Today's Total",
      value: todayTotal,
      suffix: " kWh",
      icon: HiBolt,
      iconColor: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
    },
    {
      label: "Monthly Total",
      value: monthlyTotal,
      suffix: " kWh",
      icon: HiCalendarDays,
      iconColor: "text-indigo-400",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/20",
    },
    {
      label: "Grid Contribution",
      value: gridContribution,
      suffix: " kWh",
      icon: HiArrowUpTray,
      iconColor: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
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
          <motion.div
            className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <HiSun className="text-amber-400 text-xl" />
          </motion.div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Your Solar Generation</h1>
            <p className="text-slate-400 text-sm">Real-time solar panel performance</p>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <GlassCard hover key={card.label} className="p-4 md:p-5">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-slate-400 text-[10px] md:text-xs uppercase tracking-wider leading-tight">
                    {card.label}
                  </p>
                  <div className={`p-2 rounded-lg ${card.bgColor} border ${card.borderColor}`}>
                    <Icon className={`${card.iconColor} text-sm md:text-base`} />
                  </div>
                </div>
                <AnimatedCounter
                  value={card.value}
                  suffix={card.suffix}
                  className="text-xl md:text-2xl font-bold text-white"
                  duration={1.2}
                />
              </GlassCard>
            );
          })}
        </motion.div>

        {/* Solar Generation Chart */}
        <motion.div variants={item}>
          <GlassCard className="p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Hourly Solar Generation</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Generation data with predicted output
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                  Generated
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-orange-400 opacity-50" />
                  Predicted
                </span>
              </div>
            </div>
            {chartData.length > 0 ? (
              <AnimatedAreaChart
                data={chartData}
                areas={[
                  {
                    dataKey: "generated",
                    name: "Generated",
                    stroke: "#f59e0b",
                    fill: "#f59e0b",
                    fillOpacity: 0.15,
                    strokeWidth: 2.5,
                  },
                  {
                    dataKey: "predicted",
                    name: "Predicted",
                    stroke: "#fb923c",
                    fill: "#fb923c",
                    fillOpacity: 0.05,
                    strokeWidth: 2,
                  },
                ]}
                xKey="hour"
                height={320}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <RiSunFoggyLine className="text-4xl mb-2 text-slate-600" />
                <p className="text-sm">No generation data available</p>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Grid Contribution Meter */}
        <motion.div variants={item}>
          <GlassCard className="p-5 md:p-8">
            <h2 className="text-lg font-semibold text-white mb-6 text-center">
              Grid Contribution Meter
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <CircularProgress percentage={gridPct} size={160} strokeWidth={12} />
              <div className="space-y-4 text-center md:text-left">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                    Energy Fed to Grid
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {gridContribution.toFixed(1)} <span className="text-sm text-slate-400">kWh</span>
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                    Total Generated Today
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {todayTotal.toFixed(1)} <span className="text-sm text-slate-400">kWh</span>
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-emerald-400 text-sm">
                    You're contributing{" "}
                    <span className="font-bold">{gridPct.toFixed(1)}%</span> of your
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
