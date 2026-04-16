import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
} from 'recharts';
import {
  HiOutlineSparkles,
  HiOutlineArrowPath,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import { RiSunLine, RiWindyLine, RiFlashlightLine, RiLineChartLine } from 'react-icons/ri';
import GlassCard from '../../components/ui/GlassCard';
import AnimatedCounter from '../../components/ui/AnimatedCounter';
import useApi from '../../hooks/useApi';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const darkTooltipStyle = {
  backgroundColor: 'rgba(26, 26, 46, 0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  color: '#e2e8f0',
  fontSize: '13px',
};

function CircularProgress({ value, size = 120, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const offset = circumference - (progress / 100) * circumference;
  const color =
    value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : value >= 40 ? '#f97316' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-slate-100">{Math.round(value)}%</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Confidence</span>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="mb-8 h-10 w-80 animate-pulse rounded-xl bg-white/5" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-2xl border border-white/[0.06] bg-[#1a1a2e]/60"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
      <div className="mt-6 h-96 animate-pulse rounded-2xl border border-white/[0.06] bg-[#1a1a2e]/60" />
      <div className="mt-6 h-40 animate-pulse rounded-2xl border border-white/[0.06] bg-[#1a1a2e]/60" />
    </div>
  );
}

export default function PredictionPage() {
  const { get, post } = useApi();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await get('/admin/prediction');
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load prediction data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateForecast = async () => {
    try {
      setGenerating(true);
      await post('/system/fetch-forecast');
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to generate forecast');
    } finally {
      setGenerating(false);
    }
  };

  const chartData = useMemo(() => {
    if (!data?.forecasts) return [];
    return data.forecasts.map((f) => ({
      ...f,
      time: new Date(f.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hour: new Date(f.timestamp).getHours(),
    }));
  }, [data]);

  const avgConfidence = useMemo(() => {
    if (!data?.forecasts?.length) return 0;
    return (
      data.forecasts.reduce((sum, f) => sum + (f.confidence ?? 0), 0) /
      data.forecasts.length
    );
  }, [data]);

  const summaryCards = useMemo(() => {
    if (!chartData.length) return [];

    const maxSolar = chartData.reduce(
      (max, f) => (f.predictedSolar > max.value ? { value: f.predictedSolar, time: f.time } : max),
      { value: 0, time: '-' }
    );
    const maxWind = chartData.reduce(
      (max, f) => (f.predictedWind > max.value ? { value: f.predictedWind, time: f.time } : max),
      { value: 0, time: '-' }
    );
    const maxDemand = chartData.reduce(
      (max, f) => (f.predictedDemand > max.value ? { value: f.predictedDemand, time: f.time } : max),
      { value: 0, time: '-' }
    );
    const minSupply = chartData.reduce(
      (min, f) => {
        const supply = (f.predictedSolar ?? 0) + (f.predictedWind ?? 0);
        return supply < min.value ? { value: supply, time: f.time } : min;
      },
      { value: Infinity, time: '-' }
    );

    return [
      {
        title: 'Peak Solar',
        value: maxSolar.value,
        time: maxSolar.time,
        icon: RiSunLine,
        iconColor: 'text-amber-400',
        iconBg: 'bg-amber-500/10',
        suffix: ' kW',
      },
      {
        title: 'Peak Wind',
        value: maxWind.value,
        time: maxWind.time,
        icon: RiWindyLine,
        iconColor: 'text-cyan-400',
        iconBg: 'bg-cyan-500/10',
        suffix: ' kW',
      },
      {
        title: 'Peak Demand',
        value: maxDemand.value,
        time: maxDemand.time,
        icon: RiFlashlightLine,
        iconColor: 'text-rose-400',
        iconBg: 'bg-rose-500/10',
        suffix: ' kW',
      },
      {
        title: 'Lowest Supply',
        value: minSupply.value === Infinity ? 0 : minSupply.value,
        time: minSupply.time,
        icon: HiOutlineExclamationTriangle,
        iconColor: 'text-orange-400',
        iconBg: 'bg-orange-500/10',
        suffix: ' kW',
      },
    ];
  }, [chartData]);

  if (loading) return <LoadingSkeleton />;

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] p-6">
        <GlassCard className="max-w-md p-8 text-center">
          <HiOutlineExclamationTriangle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h2 className="mb-2 text-xl font-semibold text-slate-200">Failed to Load</h2>
          <p className="text-sm text-slate-400">{error}</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4 sm:p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-100">48-Hour Energy Forecast</h1>
            <p className="mt-1 text-sm text-slate-400">
              AI-powered predictions for solar, wind, and demand
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGenerateForecast}
            disabled={generating}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HiOutlineArrowPath
              className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`}
            />
            {generating ? 'Generating...' : 'Generate New Forecast'}
          </motion.button>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.title} variants={itemVariants}>
                <GlassCard hover className="p-5">
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}
                    >
                      <Icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <HiOutlineClock className="h-3.5 w-3.5" />
                      <span className="text-xs">{card.time}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      {card.title}
                    </p>
                    <div className="mt-1">
                      <AnimatedCounter
                        value={card.value}
                        suffix={card.suffix}
                        className="text-2xl font-bold text-slate-100"
                      />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Main Forecast Chart */}
        <motion.div variants={itemVariants} className="mt-6">
          <GlassCard hover={false} className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                <RiLineChartLine className="h-4.5 w-4.5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Forecast Overview</h3>
                <p className="text-xs text-slate-500">Predicted generation and demand over 48 hours</p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <ResponsiveContainer width="100%" height={380}>
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  />
                  <Tooltip contentStyle={darkTooltipStyle} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '13px' }} />
                  <Area
                    type="monotone"
                    dataKey="predictedSolar"
                    name="Solar"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.12}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="predictedWind"
                    name="Wind"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.12}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="predictedDemand"
                    name="Demand"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    strokeDasharray="6 3"
                    dot={false}
                    activeDot={{ r: 4, stroke: '#f43f5e', strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </motion.div>
          </GlassCard>
        </motion.div>

        {/* Confidence Section */}
        <motion.div
          variants={containerVariants}
          className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          {/* Average Confidence */}
          <motion.div variants={itemVariants}>
            <GlassCard hover={false} className="flex flex-col items-center justify-center p-6">
              <h3 className="mb-4 text-sm font-semibold text-slate-300">
                Average Confidence
              </h3>
              <CircularProgress value={avgConfidence} size={140} strokeWidth={10} />
              <p className="mt-4 text-xs text-slate-500">
                Based on {data?.forecasts?.length ?? 0} forecast points
              </p>
            </GlassCard>
          </motion.div>

          {/* Individual Confidence Bars */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <GlassCard hover={false} className="p-5">
              <h3 className="mb-4 text-sm font-semibold text-slate-300">
                Confidence Distribution
              </h3>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-2">
                {chartData.map((f, index) => {
                  const confidence = f.confidence ?? 0;
                  const barColor =
                    confidence >= 80
                      ? 'bg-emerald-500'
                      : confidence >= 60
                        ? 'bg-amber-500'
                        : confidence >= 40
                          ? 'bg-orange-500'
                          : 'bg-red-500';
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.015, duration: 0.3 }}
                      className="flex items-center gap-3"
                    >
                      <span className="w-14 shrink-0 text-xs text-slate-500">
                        {f.time}
                      </span>
                      <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                        <motion.div
                          className={`absolute inset-y-0 left-0 rounded-full ${barColor}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${confidence}%` }}
                          transition={{ duration: 0.8, delay: index * 0.015 + 0.2 }}
                          style={{ opacity: 0.7 }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-right text-xs font-medium text-slate-400">
                        {Math.round(confidence)}%
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
