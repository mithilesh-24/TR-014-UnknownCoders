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
    <div className="page-container">
      <div className="skeleton-pulse skeleton-title" style={{ width: "20rem", marginBottom: "2rem" }} />
      <div className="grid-metrics" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="skeleton-pulse skeleton-chart-full"
            style={{ height: "9rem", animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
      <div className="skeleton-pulse skeleton-chart-full" style={{ height: "24rem", marginTop: "1.5rem" }} />
      <div className="skeleton-pulse skeleton-chart-full" style={{ height: "10rem", marginTop: "1.5rem" }} />
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
      <div className="page-container flex-col-center h-full">
        <GlassCard className="p-8 text-center" style={{ maxWidth: '28rem' }}>
          <HiOutlineExclamationTriangle style={{ fontSize: "3rem", color: "#f87171", margin: "0 auto 1rem" }} />
          <h2 className="page-title mb-2">Failed to Load</h2>
          <p className="page-subtitle">{error}</p>
        </GlassCard>
      </div>
    );
  }


  return (
    <div className="page-container">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="page-inner-lg"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}
        >
          <div>
            <h1 className="page-title">48-Hour Energy Forecast</h1>
            <p className="page-subtitle" style={{ marginTop: "0.25rem" }}>
              AI-powered predictions for solar, wind, and demand
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGenerateForecast}
            disabled={generating}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              borderRadius: "0.75rem",
              backgroundColor: "var(--accent)",
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#fff",
              boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.2)",
              transition: "all 0.2s",
              opacity: generating ? 0.5 : 1,
              cursor: generating ? "not-allowed" : "pointer",
              border: "none",
            }}
          >
            <HiOutlineArrowPath
              style={{ fontSize: "1rem", animation: generating ? "spin 1s linear infinite" : "none" }}
            />
            {generating ? 'Generating...' : 'Generate New Forecast'}
          </motion.button>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          variants={containerVariants}
          className="grid-metrics"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}
        >
          {summaryCards.map((card) => {
            const Icon = card.icon;
            
            // Generate icon color logic natively
            let iconColor = "#fbbf24";
            let bgFill = "rgba(245, 158, 11, 0.1)";
            if (card.title.includes("Wind")) {
              iconColor = "#22d3ee";
              bgFill = "rgba(6, 182, 212, 0.1)";
            } else if (card.title.includes("Demand")) {
              iconColor = "#fb7185";
              bgFill = "rgba(244, 63, 94, 0.1)";
            } else if (card.title.includes("Lowest Supply")) {
              iconColor = "#fb923c";
              bgFill = "rgba(249, 115, 22, 0.1)";
            }

            return (
              <motion.div key={card.title} variants={itemVariants}>
                <GlassCard hover className="metric-card">
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "2.5rem",
                        width: "2.5rem",
                        borderRadius: "0.75rem",
                        backgroundColor: bgFill,
                      }}
                    >
                      <Icon style={{ fontSize: "1.25rem", color: iconColor }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--text-secondary)" }}>
                      <HiOutlineClock style={{ fontSize: "0.875rem" }} />
                      <span style={{ fontSize: "0.75rem" }}>{card.time}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: "0.75rem" }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                      {card.title}
                    </p>
                    <div style={{ marginTop: "0.25rem" }}>
                      <AnimatedCounter
                        value={card.value}
                        suffix={card.suffix}
                        style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}
                      />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Main Forecast Chart */}
        <motion.div variants={itemVariants} style={{ marginTop: "1.5rem" }}>
          <GlassCard hover={false} className="chart-card">
            <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ display: "flex", height: "2.25rem", width: "2.25rem", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", backgroundColor: "rgba(168, 85, 247, 0.1)" }}>
                <RiLineChartLine style={{ fontSize: "1.125rem", color: "#c084fc" }} />
              </div>
              <div>
                <h3 className="chart-title">Forecast Overview</h3>
                <p className="chart-subtitle" style={{ marginTop: "0.125rem" }}>Predicted generation and demand over 48 hours</p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="chart-area"
              style={{ marginTop: "1rem" }}
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
          className="grid-metrics"
          style={{ gridTemplateColumns: "1fr 2fr", marginTop: "1.5rem" }}
        >
          {/* Average Confidence */}
          <motion.div variants={itemVariants}>
            <GlassCard hover={false} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem", height: "100%" }}>
              <h3 style={{ marginBottom: "1rem", fontSize: "0.875rem", fontWeight: "600", color: "#cbd5e1" }}>
                Average Confidence
              </h3>
              <CircularProgress value={avgConfidence} size={140} strokeWidth={10} />
              <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                Based on {data?.forecasts?.length ?? 0} forecast points
              </p>
            </GlassCard>
          </motion.div>

          {/* Individual Confidence Bars */}
          <motion.div variants={itemVariants}>
            <GlassCard hover={false} className="metric-card" style={{ height: "100%" }}>
              <h3 style={{ marginBottom: "1rem", fontSize: "0.875rem", fontWeight: "600", color: "#cbd5e1" }}>
                Confidence Distribution
              </h3>
              <div style={{ maxHeight: "18rem", overflowY: "auto", paddingRight: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {chartData.map((f, index) => {
                  const confidence = f.confidence ?? 0;
                  
                  let barColor = "#ef4444";
                  if (confidence >= 80) barColor = "#10b981";
                  else if (confidence >= 60) barColor = "#f59e0b";
                  else if (confidence >= 40) barColor = "#f97316";

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.015, duration: 0.3 }}
                      style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
                    >
                      <span style={{ width: "3.5rem", flexShrink: 0, fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {f.time}
                      </span>
                      <div style={{ position: "relative", height: "1.25rem", flex: 1, overflow: "hidden", borderRadius: "9999px", backgroundColor: "rgba(255,255,255,0.04)" }}>
                        <motion.div
                          style={{ position: "absolute", inset: "0 auto 0 0", borderRadius: "9999px", backgroundColor: barColor, opacity: 0.7 }}
                          initial={{ width: 0 }}
                          animate={{ width: `${confidence}%` }}
                          transition={{ duration: 0.8, delay: index * 0.015 + 0.2 }}
                        />
                      </div>
                      <span style={{ width: "2.5rem", flexShrink: 0, textAlign: "right", fontSize: "0.75rem", fontWeight: "500", color: "#94a3b8" }}>
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
