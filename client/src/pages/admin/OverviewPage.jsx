import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineBoltSlash,
  HiOutlineBolt,
  HiOutlineScale,
  HiOutlineBattery50,
  HiOutlineExclamationTriangle,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
} from 'react-icons/hi2';
import { RiSunLine, RiWindyLine } from 'react-icons/ri';
import GlassCard from '../../components/ui/GlassCard';
import AnimatedCounter from '../../components/ui/AnimatedCounter';
import StatusBadge from '../../components/ui/StatusBadge';
import AnimatedAreaChart from '../../components/charts/AnimatedAreaChart';
import AnimatedBarChart from '../../components/charts/AnimatedBarChart';
import useApi from '../../hooks/useApi';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function LoadingSkeleton() {
  return (
    <div className="page-container">
      <div className="skeleton-pulse skeleton-title" />
      <div className="grid-metrics">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton-pulse skeleton-metric" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
      <div className="grid-charts mt-6">
        <div className="skeleton-pulse skeleton-chart" />
        <div className="skeleton-pulse skeleton-chart" />
      </div>
      <div className="skeleton-pulse skeleton-chart-full" />
    </div>
  );
}

export default function OverviewPage() {
  const { get } = useApi();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await get('/admin/overview');
        setData(result);
      } catch (err) {
        setError(err.message || 'Failed to load overview data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="page-container flex-col-center h-full">
        <GlassCard className="p-6 text-center" style={{ maxWidth: '28rem' }}>
          <HiOutlineExclamationTriangle style={{ width: '3rem', height: '3rem', color: '#f87171', margin: '0 auto 1rem' }} />
          <h2 className="page-title mb-2">Failed to Load</h2>
          <p className="page-subtitle">{error}</p>
        </GlassCard>
      </div>
    );
  }

  const supplyRatio = data?.supplyDemandRatio ?? 0;
  const ratioTrend = supplyRatio >= 1 ? 'up' : 'down';

  const statCards = [
    { title: 'Total Generation', value: data?.totalGeneration ?? 0, suffix: ' kWh', icon: HiOutlineBolt, iconColor: 'text-amber-400', iconBg: 'bg-amber-500/10', trend: 'up' },
    { title: 'Total Consumption', value: data?.totalConsumption ?? 0, suffix: ' kWh', icon: HiOutlineBoltSlash, iconColor: 'text-indigo-400', iconBg: 'bg-indigo-500/10', trend: 'down' },
    { title: 'Supply/Demand Ratio', value: supplyRatio, suffix: '', icon: HiOutlineScale, iconColor: supplyRatio >= 1 ? 'text-emerald-400' : 'text-red-400', iconBg: supplyRatio >= 1 ? 'bg-emerald-500/10' : 'bg-red-500/10', trend: ratioTrend },
    { title: 'Battery Level', value: data?.batteryLevel ?? 0, suffix: '%', icon: HiOutlineBattery50, iconColor: 'text-cyan-400', iconBg: 'bg-cyan-500/10', trend: (data?.batteryLevel ?? 0) >= 50 ? 'up' : 'down' },
  ];

  const generationAreas = [
    { dataKey: 'solar', name: 'Solar', stroke: '#f59e0b', fill: '#f59e0b', fillOpacity: 0.12 },
    { dataKey: 'wind', name: 'Wind', stroke: '#06b6d4', fill: '#06b6d4', fillOpacity: 0.12 },
    { dataKey: 'total', name: 'Total', stroke: '#8b5cf6', fill: '#8b5cf6', fillOpacity: 0.08, strokeWidth: 2.5 },
  ];

  const consumptionBars = [
    { dataKey: 'consumption', name: 'Consumption', fill: '#6366f1' },
  ];

  const alertCount = data?.activeAlerts ?? 0;

  return (
    <div className="page-container">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="page-inner">
        {/* Header */}
        <motion.div variants={itemVariants} className="page-header">
          <h1 className="page-title">Admin Overview</h1>
          <p className="page-subtitle">Real-time energy monitoring dashboard &middot; {data?.houseCount ?? 0} houses connected</p>
        </motion.div>

        {/* Stat Cards */}
        <motion.div variants={containerVariants} className="grid-metrics">
          {statCards.map((card) => {
            const Icon = card.icon;
            const TrendIcon = card.trend === 'up' ? HiOutlineArrowTrendingUp : HiOutlineArrowTrendingDown;

            return (
              <motion.div key={card.title} variants={itemVariants}>
                <GlassCard hover className="metric-card">
                  <div className="metric-header">
                    <div className="metric-icon-wrapper">
                      <Icon className="metric-icon" />
                    </div>
                    <div className={`metric-trend ${card.trend}`}>
                      <TrendIcon style={{ width: '1rem', height: '1rem' }} />
                    </div>
                  </div>
                  <div className="metric-info">
                    <p className="metric-label">{card.title}</p>
                    <AnimatedCounter value={card.value} suffix={card.suffix} className="metric-value" />
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts Row */}
        <motion.div variants={containerVariants} className="grid-charts mt-6">
          {/* Generation Chart */}
          <motion.div variants={itemVariants}>
            <GlassCard hover={false} className="chart-card">
              <div className="chart-header">
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div className="metric-icon-wrapper bg-amber-500/10">
                    <RiSunLine className="metric-icon" style={{ color: "#f59e0b" }} />
                  </div>
                  <div>
                    <h3 className="chart-title">Hourly Generation</h3>
                    <p className="chart-subtitle">Last 24 hours</p>
                  </div>
                </div>
              </div>
              <div className="chart-area">
                <AnimatedAreaChart data={data?.hourlyGeneration ?? []} areas={generationAreas} xKey="hour" height={280} showLegend />
              </div>
            </GlassCard>
          </motion.div>

          {/* Consumption Chart */}
          <motion.div variants={itemVariants}>
            <GlassCard hover={false} className="chart-card">
              <div className="chart-header">
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div className="metric-icon-wrapper bg-indigo-500/10">
                    <HiOutlineBolt className="metric-icon" style={{ color: "#6366f1" }} />
                  </div>
                  <div>
                    <h3 className="chart-title">Hourly Consumption</h3>
                    <p className="chart-subtitle">Last 24 hours</p>
                  </div>
                </div>
              </div>
              <div className="chart-area">
                <AnimatedBarChart data={data?.hourlyConsumption ?? []} bars={consumptionBars} xKey="hour" height={280} />
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>

        {/* Active Alerts */}
        <motion.div variants={itemVariants} className="mt-6">
          <GlassCard hover={false} className="chart-card">
            <div className="flex-row-between">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div className="metric-icon-wrapper" style={{ backgroundColor: alertCount > 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)" }}>
                  <HiOutlineExclamationTriangle className="metric-icon" style={{ color: alertCount > 0 ? "#f87171" : "#34d399" }} />
                </div>
                <div>
                  <h3 className="chart-title">Active Alerts</h3>
                  <p className="chart-subtitle">System notifications and warnings</p>
                </div>
              </div>
              <div>
                {alertCount > 0 ? (
                  <StatusBadge status={alertCount >= 5 ? 'critical' : 'warning'} label={`${alertCount} active`} />
                ) : (
                  <StatusBadge status="ok" label="All clear" />
                )}
              </div>
            </div>
            {alertCount > 0 && (
              <div className="mt-4 p-4" style={{ backgroundColor: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.1)", borderRadius: "0.75rem" }}>
                <p style={{ fontSize: "0.875rem", color: "#fca5a5" }}>
                  There {alertCount === 1 ? 'is' : 'are'} <span style={{ fontWeight: 600 }}>{alertCount}</span> active alert{alertCount !== 1 && 's'} requiring attention. Visit the Fairness & Alerts page for details.
                </p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
