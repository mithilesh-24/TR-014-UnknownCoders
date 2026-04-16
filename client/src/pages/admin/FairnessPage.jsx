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
  shortage: { bg: 'rgba(239, 68, 68, 0.1)', text: '#f87171' },
  'battery-low': { bg: 'rgba(245, 158, 11, 0.1)', text: '#fbbf24' },
  'battery_low': { bg: 'rgba(245, 158, 11, 0.1)', text: '#fbbf24' },
  overconsumption: { bg: 'rgba(249, 115, 22, 0.1)', text: '#fb923c' },
  default: { bg: 'rgba(100, 116, 139, 0.1)', text: '#94a3b8' },
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
    <div className="page-container">
      <div className="skeleton-pulse skeleton-title" style={{ width: "18rem", marginBottom: "2rem" }} />
      <div className="grid-metrics" style={{ gridTemplateColumns: "1fr 2fr" }}>
        <div className="skeleton-pulse skeleton-chart-full" style={{ height: "18rem" }} />
        <div className="skeleton-pulse skeleton-chart-full" style={{ height: "18rem" }} />
      </div>
      <div className="skeleton-pulse skeleton-chart-full" style={{ height: "24rem", marginTop: "1.5rem" }} />
    </div>
  );
}

export default function FairnessPage() {
  const [error, setError] = useState(null);
  const { post } = useApi();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertFilter, setAlertFilter] = useState('All');
  const [distributing, setDistributing] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch live predictions from the ML pipeline instead of the DB
      const result = await post('/system/run');

      const alerts = result.alert
        ? [
          {
            message: result.alert.message,
            type: 'shortage',
            severity: result.alert.level,
            createdAt: result.timestamp,
          },
        ]
        : [];

      const mappedHouses = (result.distribution || []).map((h) => ({
        houseNumber: h.houseId.replace('HOUSE_', ''),
        cutCount: h.cut ? 1 : 0,
        totalCutAmount: h.cutAmount,
      }));

      const fairnessScore =
        result.status === 'sufficient' ? 100 : Math.max(0, 100 - result.shortagePercent);

      // Std deviation mock using shortage for visual variance
      const stdDeviation = result.shortagePercent ? (result.shortagePercent / 4) : 0.4;

      setData({
        fairnessScore,
        stdDeviation,
        houses: mappedHouses,
        alerts,
      });
      setDismissedAlerts(new Set());
    } catch (err) {
      setError(err.message || 'Failed to load smart grid ML data');
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
      // Force a fresh fetch from the ML process
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to run smart grid ML pipeline');
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
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="page-inner-xl">
        {/* Header */}
        <motion.div variants={itemVariants} style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <h1 className="page-title">Fairness &amp; Alerts</h1>
            <p className="page-subtitle" style={{ marginTop: "0.25rem" }}>
              Monitor distribution equity and system alerts
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleRunDistribution}
            disabled={distributing}
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
              boxShadow: "0 10px 15px -3px rgba(139, 92, 246, 0.25)",
              transition: "all 0.2s",
              opacity: distributing ? 0.5 : 1,
              cursor: distributing ? "not-allowed" : "pointer",
              border: "none",
            }}
          >
            <HiOutlineArrowPath
              style={{ fontSize: "1rem", animation: distributing ? "spin 1s linear infinite" : "none" }}
            />
            {distributing ? 'Running...' : 'Run Distribution'}
          </motion.button>
        </motion.div>

        {/* Top Row: Fairness Gauge + Most Affected */}
        <motion.div variants={containerVariants} className="grid-metrics" style={{ gridTemplateColumns: "1fr 2fr" }}>
          {/* Fairness Score Gauge */}
          <motion.div variants={itemVariants}>
            <GlassCard hover={false} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1.5rem", height: "100%" }}>
              <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <RiShieldCheckLine style={{ height: "1.25rem", width: "1.25rem", color: "#818cf8" }} />
                <h3 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#e2e8f0" }}>Fairness Score</h3>
              </div>
              <FairnessGauge score={data?.fairnessScore ?? 0} />
              <div style={{ marginTop: "1.25rem", width: "100%", borderRadius: "0.75rem", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)", padding: "0.75rem", textAlign: "center" }}>
                <p style={{ fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                  Standard Deviation
                </p>
                <p style={{ marginTop: "0.125rem", fontSize: "1.125rem", fontWeight: "600", color: "#e2e8f0" }}>
                  {data?.stdDeviation != null ? data.stdDeviation.toFixed(3) : '-'}
                </p>
              </div>
            </GlassCard>
          </motion.div>

          {/* Most Affected Houses */}
          <motion.div variants={itemVariants}>
            <GlassCard hover={false} style={{ padding: "1.5rem", height: "100%" }}>
              <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <HiOutlineHome style={{ height: "1.25rem", width: "1.25rem", color: "#fb7185" }} />
                <h3 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#e2e8f0" }}>
                  Most Affected Houses
                </h3>
              </div>

              {houses.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 0", textAlign: "center" }}>
                  <HiOutlineCheckCircle style={{ margin: "0 auto", height: "2.5rem", width: "2.5rem", color: "rgba(16, 185, 129, 0.5)" }} />
                  <p style={{ marginTop: "0.75rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>No houses have been affected</p>
                </div>
              ) : (
                <div style={{ maxHeight: "20rem", overflowY: "auto", paddingRight: "0.25rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
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
                          style={{
                            borderRadius: "0.75rem",
                            border: "1px solid",
                            padding: "0.875rem",
                            transition: "colors 0.2s",
                            borderColor: isTopAffected ? "rgba(239, 68, 68, 0.1)" : "rgba(255,255,255,0.04)",
                            background: isTopAffected ? "linear-gradient(to right, rgba(239, 68, 68, 0.04), transparent)" : "rgba(255,255,255,0.02)"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              <div
                                style={{
                                  display: "flex",
                                  height: "2rem",
                                  width: "2rem",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: "0.5rem",
                                  fontSize: "0.75rem",
                                  fontWeight: "700",
                                  backgroundColor: isTopAffected ? "rgba(239, 68, 68, 0.15)" : "rgba(255,255,255,0.06)",
                                  color: isTopAffected ? "#f87171" : "#94a3b8"
                                }}
                              >
                                #{house.houseNumber}
                              </div>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                  <span style={{ fontSize: "0.875rem", fontWeight: "500", color: "#cbd5e1" }}>
                                    {house.cutCount ?? 0} cuts
                                  </span>
                                  {isTopAffected && (
                                    <span style={{ fontSize: "0.625rem", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em", color: "#f87171" }}>
                                      High Impact
                                    </span>
                                  )}
                                </div>
                                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                  Total cut: {house.totalCutAmount != null ? `${Math.round(house.totalCutAmount)} kWh` : '-'}
                                  {house.lastCut && (
                                    <span style={{ marginLeft: "0.5rem" }}>
                                      Last: {new Date(house.lastCut).toLocaleDateString()}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                          {/* Impact bar */}
                          <div style={{ marginTop: "0.625rem", height: "0.375rem", width: "100%", overflow: "hidden", borderRadius: "9999px", backgroundColor: "rgba(255,255,255,0.04)" }}>
                            <motion.div
                              style={{ height: "100%", borderRadius: "9999px", backgroundColor: isTopAffected ? "rgba(239, 68, 68, 0.6)" : "rgba(99, 102, 241, 0.4)" }}
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
        <motion.div variants={itemVariants} style={{ marginTop: "1.5rem" }}>
          <GlassCard hover={false} style={{ padding: "1.5rem" }}>
            <div style={{ marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <HiOutlineBell style={{ height: "1.25rem", width: "1.25rem", color: "#fbbf24" }} />
                <h3 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#e2e8f0" }}>System Alerts</h3>
                {(data?.alerts?.length ?? 0) > 0 && (
                  <span style={{ marginLeft: "0.25rem", borderRadius: "9999px", backgroundColor: "rgba(239, 68, 68, 0.15)", padding: "0.125rem 0.5rem", fontSize: "0.625rem", fontWeight: "500", color: "#f87171" }}>
                    {data.alerts.length}
                  </span>
                )}
              </div>

              {/* Filter Tabs */}
              <div style={{ display: "flex", borderRadius: "0.75rem", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", padding: "0.25rem", overflowX: "auto" }}>
                {alertFilterTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAlertFilter(tab)}
                    style={{
                      position: "relative",
                      borderRadius: "0.5rem",
                      padding: "0.375rem 0.75rem",
                      fontSize: "0.75rem",
                      fontWeight: "500",
                      transition: "colors 0.2s",
                      color: alertFilter === tab ? "#fff" : "var(--text-secondary)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    {alertFilter === tab && (
                      <motion.div
                        layoutId="alert-tab"
                        style={{ position: "absolute", inset: 0, borderRadius: "0.5rem", backgroundColor: "rgba(99, 102, 241, 0.2)", border: "1px solid rgba(99, 102, 241, 0.3)" }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      />
                    )}
                    <span style={{ position: "relative", zIndex: 10 }}>{tab}</span>
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
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 0", textAlign: "center" }}
                >
                  <HiOutlineCheckCircle style={{ margin: "0 auto", height: "3rem", width: "3rem", color: "rgba(16, 185, 129, 0.4)" }} />
                  <p style={{ marginTop: "0.75rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    {alertFilter === 'All'
                      ? 'No active alerts - system is running smoothly'
                      : `No ${alertFilter.toLowerCase()} alerts`}
                  </p>
                </motion.div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
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
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "1rem",
                          borderRadius: "0.75rem",
                          border: "1px solid rgba(255,255,255,0.04)",
                          backgroundColor: "rgba(255,255,255,0.02)",
                          padding: "1rem",
                          transition: "background-color 0.2s"
                        }}
                      >
                        <div
                          style={{
                            marginTop: "0.125rem",
                            display: "flex",
                            height: "2.25rem",
                            width: "2.25rem",
                            flexShrink: 0,
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "0.5rem",
                            backgroundColor: colors.bg
                          }}
                        >
                          <Icon style={{ height: "1.125rem", width: "1.125rem", color: colors.text }} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                            <p style={{ fontSize: "0.875rem", color: "#e2e8f0" }}>{alert.message}</p>
                            <button
                              onClick={() => handleDismissAlert(origIndex)}
                              style={{
                                marginLeft: "0.5rem",
                                flexShrink: 0,
                                borderRadius: "0.5rem",
                                padding: "0.25rem",
                                color: "var(--text-secondary)",
                                transition: "colors 0.2s",
                                backgroundColor: "transparent",
                                border: "none",
                                cursor: "pointer"
                              }}
                              title="Dismiss"
                            >
                              <HiOutlineXMark style={{ height: "1rem", width: "1rem" }} />
                            </button>
                          </div>
                          <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
                            <StatusBadge
                              status={severityMap(alert.severity)}
                              label={alert.severity || 'Info'}
                            />
                            {alert.houseId && (
                              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                House #{alert.houseId}
                              </span>
                            )}
                            {alert.createdAt && (
                              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
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
