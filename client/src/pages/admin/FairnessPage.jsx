import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineScale,
  HiOutlineExclamationTriangle,
  HiOutlineBoltSlash,
  HiOutlineBattery0,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineHome,
  HiOutlineBell,
} from 'react-icons/hi2';
import { RiFlashlightLine, RiShieldCheckLine } from 'react-icons/ri';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import useApi from '../../hooks/useApi';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const alertFilterTabs = ['All', 'Shortage', 'Battery Low', 'Overconsumption'];

const alertTypeIcons = {
  shortage: HiOutlineBoltSlash,
  'battery-low': HiOutlineBattery0,
  'battery_low': HiOutlineBattery0,
  overconsumption: RiFlashlightLine,
  default: HiOutlineExclamationTriangle,
};

const alertTypeColors = {
  shortage: { bg: 'bg-red-500/10', text: 'text-red-400' },
  'battery-low': { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  'battery_low': { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  overconsumption: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  default: { bg: 'bg-slate-500/10', text: 'text-slate-400' },
};

function FairnessGauge({ score, size = 180, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(score), 150);
    return () => clearTimeout(timer);
  }, [score]);

  const offset = circumference - (progress / 100) * circumference;

  const getColor = (val) => {
    if (val >= 90) return { stroke: '#10b981', label: 'Excellent' };
    if (val >= 75) return { stroke: '#22d3ee', label: 'Good' };
    if (val >= 60) return { stroke: '#f59e0b', label: 'Fair' };
    if (val >= 40) return { stroke: '#f97316', label: 'Poor' };
    return { stroke: '#ef4444', label: 'Critical' };
  };

  const { stroke, label } = getColor(score);

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-slate-100">{Math.round(score)}</span>
        <span className="text-xs uppercase tracking-wider text-slate-500">/ 100</span>
      </div>
      <motion.span
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-2 text-sm font-medium"
        style={{ color: stroke }}
      >
        {label}
      </motion.span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="mb-8 h-10 w-72 animate-pulse rounded-xl bg-white/5" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-2xl border border-white/[0.06] bg-[#1a1a2e]/60" />
        <div className="lg:col-span-2 h-72 animate-pulse rounded-2xl border border-white/[0.06] bg-[#1a1a2e]/60" />
      </div>
      <div className="mt-6 h-96 animate-pulse rounded-2xl border border-white/[0.06] bg-[#1a1a2e]/60" />
    </div>
  );
}

export default function FairnessPage() {
  const { get, post } = useApi();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertFilter, setAlertFilter] = useState('All');
  const [distributing, setDistributing] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await get('/admin/fairness');
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load fairness data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunDistribution = async () => {
    try {
      setDistributing(true);
      await post('/system/run-distribution');
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to run distribution');
    } finally {
      setDistributing(false);
    }
  };

  const handleDismissAlert = (index) => {
    setDismissedAlerts((prev) => new Set([...prev, index]));
  };

  const filteredAlerts = useMemo(() => {
    if (!data?.alerts) return [];
    return data.alerts.filter((alert, index) => {
      if (dismissedAlerts.has(index)) return false;
      if (alertFilter === 'All') return true;
      const filterKey = alertFilter.toLowerCase().replace(' ', '-');
      const alertType = (alert.type || '').toLowerCase().replace('_', '-');
      return alertType.includes(filterKey) || filterKey.includes(alertType);
    });
  }, [data, alertFilter, dismissedAlerts]);

  const houses = data?.houses ?? [];
  const maxCutCount = useMemo(
    () => Math.max(...houses.map((h) => h.cutCount ?? 0), 1),
    [houses]
  );

  const severityMap = (sev) => {
    const s = (sev || '').toLowerCase();
    if (s === 'critical' || s === 'high') return 'critical';
    if (s === 'warning' || s === 'medium') return 'warning';
    return 'ok';
  };

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
            <h1 className="text-3xl font-bold text-slate-100">Fairness &amp; Alerts</h1>
            <p className="mt-1 text-sm text-slate-400">
              Monitor distribution equity and system alerts
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleRunDistribution}
            disabled={distributing}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/20 transition-all hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HiOutlineArrowPath
              className={`h-4 w-4 ${distributing ? 'animate-spin' : ''}`}
            />
            {distributing ? 'Running...' : 'Run Distribution'}
          </motion.button>
        </motion.div>

        {/* Top Row: Fairness Gauge + Most Affected */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          {/* Fairness Score Gauge */}
          <motion.div variants={itemVariants}>
            <GlassCard hover={false} className="flex flex-col items-center p-6">
              <div className="mb-4 flex items-center gap-2">
                <RiShieldCheckLine className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-200">Fairness Score</h3>
              </div>
              <FairnessGauge score={data?.fairnessScore ?? 0} />
              <div className="mt-5 w-full rounded-xl bg-white/[0.03] border border-white/[0.04] p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  Standard Deviation
                </p>
                <p className="mt-0.5 text-lg font-semibold text-slate-200">
                  {data?.stdDeviation != null ? data.stdDeviation.toFixed(3) : '-'}
                </p>
              </div>
            </GlassCard>
          </motion.div>

          {/* Most Affected Houses */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <GlassCard hover={false} className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <HiOutlineHome className="h-5 w-5 text-rose-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Most Affected Houses
                </h3>
              </div>

              {houses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <HiOutlineCheckCircle className="mx-auto h-10 w-10 text-emerald-500/50" />
                  <p className="mt-3 text-sm text-slate-500">No houses have been affected</p>
                </div>
              ) : (
                <div className="max-h-80 space-y-2.5 overflow-y-auto pr-1">
                  {houses
                    .sort((a, b) => (b.cutCount ?? 0) - (a.cutCount ?? 0))
                    .map((house, index) => {
                      const cutPercent = ((house.cutCount ?? 0) / maxCutCount) * 100;
                      const isTopAffected = index < 3 && (house.cutCount ?? 0) > 0;
                      return (
                        <motion.div
                          key={house.houseNumber}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                          className={`rounded-xl border p-3.5 transition-colors ${
                            isTopAffected
                              ? 'border-red-500/10 bg-gradient-to-r from-red-500/[0.04] to-transparent'
                              : 'border-white/[0.04] bg-white/[0.02]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                                  isTopAffected
                                    ? 'bg-red-500/15 text-red-400'
                                    : 'bg-white/[0.06] text-slate-400'
                                }`}
                              >
                                #{house.houseNumber}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-slate-300">
                                    {house.cutCount ?? 0} cuts
                                  </span>
                                  {isTopAffected && (
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-red-400">
                                      High Impact
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500">
                                  Total cut: {house.totalCutAmount != null ? `${Math.round(house.totalCutAmount)} kWh` : '-'}
                                  {house.lastCut && (
                                    <span className="ml-2">
                                      Last: {new Date(house.lastCut).toLocaleDateString()}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                          {/* Impact bar */}
                          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                            <motion.div
                              className={`h-full rounded-full ${
                                isTopAffected ? 'bg-red-500/60' : 'bg-indigo-500/40'
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${cutPercent}%` }}
                              transition={{ duration: 0.8, delay: index * 0.05 + 0.2 }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              )}
            </GlassCard>
          </motion.div>
        </motion.div>

        {/* Alerts Section */}
        <motion.div variants={itemVariants} className="mt-6">
          <GlassCard hover={false} className="p-5">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <HiOutlineBell className="h-5 w-5 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-200">System Alerts</h3>
                {(data?.alerts?.length ?? 0) > 0 && (
                  <span className="ml-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400">
                    {data.alerts.length}
                  </span>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex rounded-xl bg-white/[0.04] border border-white/[0.06] p-1">
                {alertFilterTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAlertFilter(tab)}
                    className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      alertFilter === tab
                        ? 'text-white'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {alertFilter === tab && (
                      <motion.div
                        layoutId="alert-tab"
                        className="absolute inset-0 rounded-lg bg-indigo-500/20 border border-indigo-500/30"
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      />
                    )}
                    <span className="relative z-10">{tab}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Alert Cards */}
            <AnimatePresence mode="popLayout">
              {filteredAlerts.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <HiOutlineCheckCircle className="mx-auto h-12 w-12 text-emerald-500/40" />
                  <p className="mt-3 text-sm text-slate-500">
                    {alertFilter === 'All'
                      ? 'No active alerts - system is running smoothly'
                      : `No ${alertFilter.toLowerCase()} alerts`}
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {filteredAlerts.map((alert, index) => {
                    const origIndex = data.alerts.indexOf(alert);
                    const type = (alert.type || '').toLowerCase().replace('_', '-');
                    const Icon = alertTypeIcons[type] || alertTypeIcons.default;
                    const colors = alertTypeColors[type] || alertTypeColors.default;

                    return (
                      <motion.div
                        key={`${alert.type}-${alert.createdAt}-${origIndex}`}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                        transition={{ delay: index * 0.04, duration: 0.3 }}
                        className="flex items-start gap-4 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.03]"
                      >
                        <div
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}
                        >
                          <Icon className={`h-4.5 w-4.5 ${colors.text}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-slate-200">{alert.message}</p>
                            <button
                              onClick={() => handleDismissAlert(origIndex)}
                              className="ml-2 shrink-0 rounded-lg p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
                              title="Dismiss"
                            >
                              <HiOutlineXMark className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <StatusBadge
                              status={severityMap(alert.severity)}
                              label={alert.severity || 'Info'}
                            />
                            {alert.houseId && (
                              <span className="text-xs text-slate-500">
                                House #{alert.houseId}
                              </span>
                            )}
                            {alert.createdAt && (
                              <span className="text-xs text-slate-500">
                                {new Date(alert.createdAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
