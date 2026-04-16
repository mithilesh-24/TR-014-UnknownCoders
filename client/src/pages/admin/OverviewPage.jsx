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
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="mb-8 h-10 w-64 animate-pulse rounded-xl bg-white/5" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-2xl border border-white/[0.06] bg-[#1a1a2e]/60"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-2xl border border-white/[0.06] bg-[#1a1a2e]/60" />
        <div className="h-80 animate-pulse rounded-2xl border border-white/[0.06] bg-[#1a1a2e]/60" />
      </div>
      <div className="mt-6 h-40 animate-pulse rounded-2xl border border-white/[0.06] bg-[#1a1a2e]/60" />
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
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] p-6">
        <GlassCard className="max-w-md p-8 text-center">
          <HiOutlineExclamationTriangle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h2 className="mb-2 text-xl font-semibold text-slate-200">Failed to Load</h2>
          <p className="text-sm text-slate-400">{error}</p>
        </GlassCard>
      </div>
    );
  }

  const supplyRatio = data?.supplyDemandRatio ?? 0;
  const ratioTrend = supplyRatio >= 1 ? 'up' : 'down';

  const statCards = [
    {
      title: 'Total Generation',
      value: data?.totalGeneration ?? 0,
      suffix: ' kWh',
      icon: HiOutlineBolt,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
      trend: 'up',
    },
    {
      title: 'Total Consumption',
      value: data?.totalConsumption ?? 0,
      suffix: ' kWh',
      icon: HiOutlineBoltSlash,
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-500/10',
      trend: 'down',
    },
    {
      title: 'Supply/Demand Ratio',
      value: supplyRatio,
      suffix: '',
      icon: HiOutlineScale,
      iconColor: supplyRatio >= 1 ? 'text-emerald-400' : 'text-red-400',
      iconBg: supplyRatio >= 1 ? 'bg-emerald-500/10' : 'bg-red-500/10',
      trend: ratioTrend,
    },
    {
      title: 'Battery Level',
      value: data?.batteryLevel ?? 0,
      suffix: '%',
      icon: HiOutlineBattery50,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10',
      trend: (data?.batteryLevel ?? 0) >= 50 ? 'up' : 'down',
    },
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
    <div className="min-h-screen bg-[#0a0a0f] p-4 sm:p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100">Admin Overview</h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time energy monitoring dashboard &middot;{' '}
            {data?.houseCount ?? 0} houses connected
          </p>
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          {statCards.map((card) => {
            const Icon = card.icon;
            const TrendIcon =
              card.trend === 'up'
                ? HiOutlineArrowTrendingUp
                : HiOutlineArrowTrendingDown;
            const trendColor =
              card.trend === 'up' ? 'text-emerald-400' : 'text-red-400';

            return (
              <motion.div key={card.title} variants={itemVariants}>
                <GlassCard hover className="p-5">
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}
                    >
                      <Icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                    <div className={`flex items-center gap-1 ${trendColor}`}>
                      <TrendIcon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
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

        {/* Charts Row */}
        <motion.div
          variants={containerVariants}
          className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          {/* Generation Chart */}
          <motion.div variants={itemVariants}>
            <GlassCard hover={false} className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                  <RiSunLine className="h-4.5 w-4.5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    Hourly Generation
                  </h3>
                  <p className="text-xs text-slate-500">Last 24 hours</p>
                </div>
              </div>
              <AnimatedAreaChart
                data={data?.hourlyGeneration ?? []}
                areas={generationAreas}
                xKey="hour"
                height={280}
                showLegend
              />
            </GlassCard>
          </motion.div>

          {/* Consumption Chart */}
          <motion.div variants={itemVariants}>
            <GlassCard hover={false} className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
                  <HiOutlineBolt className="h-4.5 w-4.5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    Hourly Consumption
                  </h3>
                  <p className="text-xs text-slate-500">Last 24 hours</p>
                </div>
              </div>
              <AnimatedBarChart
                data={data?.hourlyConsumption ?? []}
                bars={consumptionBars}
                xKey="hour"
                height={280}
              />
            </GlassCard>
          </motion.div>
        </motion.div>

        {/* Active Alerts */}
        <motion.div variants={itemVariants} className="mt-6">
          <GlassCard hover={false} className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    alertCount > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'
                  }`}
                >
                  <HiOutlineExclamationTriangle
                    className={`h-4.5 w-4.5 ${
                      alertCount > 0 ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    Active Alerts
                  </h3>
                  <p className="text-xs text-slate-500">
                    System notifications and warnings
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {alertCount > 0 ? (
                  <>
                    <StatusBadge
                      status={alertCount >= 5 ? 'critical' : 'warning'}
                      label={`${alertCount} active`}
                    />
                  </>
                ) : (
                  <StatusBadge status="ok" label="All clear" />
                )}
              </div>
            </div>
            {alertCount > 0 && (
              <div className="mt-4 rounded-xl bg-red-500/5 border border-red-500/10 p-4">
                <p className="text-sm text-red-300">
                  There {alertCount === 1 ? 'is' : 'are'}{' '}
                  <span className="font-semibold">{alertCount}</span> active
                  alert{alertCount !== 1 && 's'} requiring attention. Visit the
                  Fairness &amp; Alerts page for details.
                </p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
