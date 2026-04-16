import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineHome,
  HiOutlineUser,
  HiOutlineXMark,
  HiOutlineTableCells,
  HiOutlineSquares2X2,
  HiOutlineBolt,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import { RiSunLine } from 'react-icons/ri';
import GlassCard from '../../components/ui/GlassCard';
import AnimatedCounter from '../../components/ui/AnimatedCounter';
import StatusBadge from '../../components/ui/StatusBadge';
import AnimatedAreaChart from '../../components/charts/AnimatedAreaChart';
import useApi from '../../hooks/useApi';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 30 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.92, y: 30, transition: { duration: 0.2 } },
};

const periods = ['day', 'week', 'month'];

function LoadingSkeleton() {
  return (
    <div className="page-container">
      <div className="skeleton-pulse skeleton-title" style={{ width: "18rem", marginBottom: "2rem" }} />
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="skeleton-pulse skeleton-title" style={{ width: "16rem", height: "2.5rem" }} />
        <div className="skeleton-pulse skeleton-title" style={{ width: "12rem", height: "2.5rem" }} />
      </div>
      <div className="grid-metrics" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="skeleton-pulse skeleton-chart-full"
            style={{ height: "13rem", animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function HouseDetailModal({ house, onClose }) {
  const { get } = useApi();
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoadingDetail(true);
        const result = await get(`/admin/houses/${house._id}`);
        setDetail(result);
      } catch {
        setDetail(null);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchDetail();
  }, [house._id]);

  const consumptionAreas = [
    { dataKey: 'energyUsed', name: 'Energy Used', stroke: '#8b5cf6', fill: '#8b5cf6', fillOpacity: 0.15 },
  ];

  const distributionAreas = [
    { dataKey: 'allocatedEnergy', name: 'Allocated', stroke: '#06b6d4', fill: '#06b6d4', fillOpacity: 0.15 },
  ];

  const consumptionData = (detail?.consumptionHistory ?? []).map((item) => ({
    ...item,
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  const distributionData = (detail?.distributionHistory ?? []).map((item) => ({
    ...item,
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  return (
    <AnimatePresence>
      <motion.div
        style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Backdrop */}
        <motion.div
          style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <motion.div
          style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "48rem", maxHeight: "85vh", overflowY: "auto", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(26, 26, 46, 0.95)", backdropFilter: "blur(16px)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)" }}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{ position: "absolute", right: "1rem", top: "1rem", zIndex: 10, display: "flex", height: "2rem", width: "2rem", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", backgroundColor: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", transition: "colors 0.2s", border: "none", cursor: "pointer" }}
          >
            <HiOutlineXMark style={{ height: "1.25rem", width: "1.25rem" }} />
          </button>

          <div style={{ padding: "1.5rem" }}>
            {/* House Details Header */}
            <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ display: "flex", height: "3.5rem", width: "3.5rem", alignItems: "center", justifyContent: "center", borderRadius: "0.75rem", backgroundColor: "rgba(99, 102, 241, 0.1)" }}>
                <HiOutlineHome style={{ height: "1.75rem", width: "1.75rem", color: "#818cf8" }} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#f1f5f9" }}>
                  House #{house.houseNumber}
                </h2>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{house.address}</p>
                <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
                  {house.user && (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      <HiOutlineUser style={{ height: "0.875rem", width: "0.875rem" }} />
                      {house.user.name}
                    </span>
                  )}
                  <StatusBadge
                    status={house.hasSolar ? 'ok' : 'warning'}
                    label={house.hasSolar ? `Solar ${house.solarCapacity ?? 0} kW` : 'No Solar'}
                  />
                  {house.cutCount > 0 && (
                    <StatusBadge
                      status="critical"
                      label={`${house.cutCount} cuts`}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ borderRadius: "0.75rem", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)", padding: "1rem" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Residents</p>
                <p style={{ marginTop: "0.25rem", fontSize: "1.125rem", fontWeight: "600", color: "#e2e8f0" }}>{house.residents ?? '-'}</p>
              </div>
              <div style={{ borderRadius: "0.75rem", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)", padding: "1rem" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Latest Consumption</p>
                <p style={{ marginTop: "0.25rem", fontSize: "1.125rem", fontWeight: "600", color: "#e2e8f0" }}>
                  {house.latestConsumption != null ? `${house.latestConsumption} kWh` : '-'}
                </p>
              </div>
              <div style={{ borderRadius: "0.75rem", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)", padding: "1rem" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Total Consumption</p>
                <p style={{ marginTop: "0.25rem", fontSize: "1.125rem", fontWeight: "600", color: "#e2e8f0" }}>
                  {house.totalConsumption != null ? `${Math.round(house.totalConsumption)} kWh` : '-'}
                </p>
              </div>
            </div>

            {/* Charts */}
            {loadingDetail ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="skeleton-pulse skeleton-chart-full" style={{ height: "14rem" }} />
                <div className="skeleton-pulse skeleton-chart-full" style={{ height: "14rem" }} />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {consumptionData.length > 0 && (
                  <div>
                    <h4 style={{ marginBottom: "0.75rem", fontSize: "0.875rem", fontWeight: "500", color: "#cbd5e1" }}>
                      Consumption History
                    </h4>
                    <div style={{ borderRadius: "0.75rem", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "0.75rem" }}>
                      <AnimatedAreaChart
                        data={consumptionData}
                        areas={consumptionAreas}
                        xKey="time"
                        height={220}
                      />
                    </div>
                  </div>
                )}
                {distributionData.length > 0 && (
                  <div>
                    <h4 style={{ marginBottom: "0.75rem", fontSize: "0.875rem", fontWeight: "500", color: "#cbd5e1" }}>
                      Distribution History
                    </h4>
                    <div style={{ borderRadius: "0.75rem", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "0.75rem" }}>
                      <AnimatedAreaChart
                        data={distributionData}
                        areas={distributionAreas}
                        xKey="time"
                        height={220}
                      />
                    </div>
                  </div>
                )}
                {consumptionData.length === 0 && distributionData.length === 0 && (
                  <div style={{ borderRadius: "0.75rem", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "2rem", textAlign: "center" }}>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>No historical data available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function HouseMonitoringPage() {
  const { get } = useApi();
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('day');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedHouse, setSelectedHouse] = useState(null);

  useEffect(() => {
    const fetchHouses = async () => {
      try {
        setLoading(true);
        const result = await get('/admin/houses', { period });
        setHouses(result.houses ?? []);
      } catch (err) {
        setError(err.message || 'Failed to load houses');
      } finally {
        setLoading(false);
      }
    };
    fetchHouses();
  }, [period]);

  const filteredHouses = useMemo(() => {
    if (!search.trim()) return houses;
    const q = search.toLowerCase();
    return houses.filter(
      (h) =>
        String(h.houseNumber).includes(q) ||
        (h.user?.name && h.user.name.toLowerCase().includes(q)) ||
        (h.address && h.address.toLowerCase().includes(q))
    );
  }, [houses, search]);

  if (loading && houses.length === 0) return <LoadingSkeleton />;

  return (
    <div className="page-container">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="page-inner-xl">
        {/* Header */}
        <motion.div variants={itemVariants} style={{ marginBottom: "2rem" }}>
          <h1 className="page-title">House Monitoring</h1>
          <p className="page-subtitle" style={{ marginTop: "0.25rem" }}>
            Monitor and manage all connected households
          </p>
        </motion.div>

        {/* Filter Bar */}
        <motion.div variants={itemVariants} style={{ marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* Period Tabs */}
            <div style={{ display: "flex", borderRadius: "0.75rem", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", padding: "0.25rem" }}>
              {periods.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    position: "relative",
                    borderRadius: "0.5rem",
                    padding: "0.375rem 1rem",
                    fontSize: "0.75rem",
                    fontWeight: "500",
                    textTransform: "capitalize",
                    transition: "colors 0.2s",
                    color: period === p ? "#fff" : "var(--text-secondary)",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  {period === p && (
                    <motion.div
                      layoutId="period-tab"
                      style={{ position: "absolute", inset: 0, borderRadius: "0.5rem", backgroundColor: "rgba(99, 102, 241, 0.2)", border: "1px solid rgba(99, 102, 241, 0.3)" }}
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    />
                  )}
                  <span style={{ position: "relative", zIndex: 10 }}>{p}</span>
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div style={{ display: "flex", borderRadius: "0.75rem", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", padding: "0.25rem" }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  borderRadius: "0.5rem",
                  padding: "0.375rem",
                  transition: "colors 0.2s",
                  backgroundColor: viewMode === 'grid' ? "rgba(99, 102, 241, 0.2)" : "transparent",
                  color: viewMode === 'grid' ? "#818cf8" : "var(--text-secondary)",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                <HiOutlineSquares2X2 style={{ height: "1rem", width: "1rem" }} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  borderRadius: "0.5rem",
                  padding: "0.375rem",
                  transition: "colors 0.2s",
                  backgroundColor: viewMode === 'table' ? "rgba(99, 102, 241, 0.2)" : "transparent",
                  color: viewMode === 'table' ? "#818cf8" : "var(--text-secondary)",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                <HiOutlineTableCells style={{ height: "1rem", width: "1rem" }} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: "relative", width: "100%", maxWidth: "16rem" }}>
            <HiOutlineMagnifyingGlass style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", height: "1rem", width: "1rem", color: "var(--text-secondary)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by house # or name..."
              style={{
                width: "100%",
                borderRadius: "0.75rem",
                border: "1px solid rgba(255,255,255,0.06)",
                backgroundColor: "rgba(255,255,255,0.04)",
                padding: "0.5rem 1rem 0.5rem 2.25rem",
                fontSize: "0.875rem",
                color: "#e2e8f0",
                outline: "none",
                transition: "all 0.2s"
              }}
              onFocus={(e) => { e.target.style.borderColor = "rgba(99, 102, 241, 0.3)"; e.target.style.backgroundColor = "rgba(255,255,255,0.06)"; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.06)"; e.target.style.backgroundColor = "rgba(255,255,255,0.04)"; }}
            />
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div variants={itemVariants} style={{ marginBottom: "1.5rem" }}>
            <div style={{ borderRadius: "0.75rem", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "1rem" }}>
              <p style={{ fontSize: "0.875rem", color: "#fca5a5" }}>{error}</p>
            </div>
          </motion.div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid-metrics"
            style={{ marginTop: "1.5rem" }}
          >
            {filteredHouses.map((house) => (
              <motion.div key={house._id} variants={itemVariants} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <GlassCard
                  hover
                  onClick={() => setSelectedHouse(house)}
                  style={{ padding: "1.25rem", height: "100%", cursor: "pointer", display: "flex", flexDirection: "column" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ display: "flex", height: "2.75rem", width: "2.75rem", alignItems: "center", justifyContent: "center", borderRadius: "0.75rem", backgroundColor: "rgba(99, 102, 241, 0.1)" }}>
                        <HiOutlineHome style={{ height: "1.25rem", width: "1.25rem", color: "#818cf8" }} />
                      </div>
                      <div>
                        <h3 style={{ fontWeight: "600", color: "#e2e8f0" }}>
                          House #{house.houseNumber}
                        </h3>
                        {house.user && (
                          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{house.user.name}</p>
                        )}
                      </div>
                    </div>
                    <StatusBadge
                      status={house.hasSolar ? 'ok' : 'warning'}
                      label={house.hasSolar ? 'Solar' : 'No Solar'}
                    />
                  </div>

                  <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", flexGrow: 1 }}>
                    <div style={{ borderRadius: "0.5rem", backgroundColor: "rgba(255,255,255,0.03)", padding: "0.75rem" }}>
                      <p style={{ fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                        Consumption
                      </p>
                      <div style={{ marginTop: "0.125rem" }}>
                        <AnimatedCounter
                          value={house.latestConsumption ?? 0}
                          suffix=" kWh"
                          className="font-semibold"
                          style={{ fontSize: "0.875rem", color: "#e2e8f0" }}
                        />
                      </div>
                    </div>
                    {house.hasSolar ? (
                      <div style={{ borderRadius: "0.5rem", backgroundColor: "rgba(255,255,255,0.03)", padding: "0.75rem" }}>
                        <p style={{ fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                          Solar Cap.
                        </p>
                        <div style={{ marginTop: "0.125rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <RiSunLine style={{ height: "0.875rem", width: "0.875rem", color: "#fbbf24" }} />
                          <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#e2e8f0" }}>
                            {house.solarCapacity ?? 0} kW
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ borderRadius: "0.5rem", backgroundColor: "rgba(255,255,255,0.03)", padding: "0.75rem" }}>
                        <p style={{ fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                          Solar Cap.
                        </p>
                        <p style={{ marginTop: "0.125rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>N/A</p>
                      </div>
                    )}
                  </div>

                  {house.cutCount > 0 && (
                    <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", borderRadius: "0.5rem", backgroundColor: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.1)", padding: "0.5rem 0.75rem" }}>
                      <HiOutlineExclamationTriangle style={{ height: "0.875rem", width: "0.875rem", color: "#f87171" }} />
                      <span style={{ fontSize: "0.75rem", color: "#fca5a5" }}>
                        {house.cutCount} power cut{house.cutCount !== 1 && 's'}
                      </span>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <motion.div variants={itemVariants} style={{ marginTop: "1rem" }}>
            <GlassCard hover={false} style={{ overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", textAlign: "left", fontSize: "0.875rem", borderCollapse: "collapse" }}>
                  <thead style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <tr>
                      <th style={{ padding: "0.875rem 1.25rem", fontSize: "0.75rem", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                        House
                      </th>
                      <th style={{ padding: "0.875rem 1.25rem", fontSize: "0.75rem", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                        Owner
                      </th>
                      <th style={{ padding: "0.875rem 1.25rem", fontSize: "0.75rem", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                        Consumption
                      </th>
                      <th style={{ padding: "0.875rem 1.25rem", fontSize: "0.75rem", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                        Solar
                      </th>
                      <th style={{ padding: "0.875rem 1.25rem", fontSize: "0.75rem", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                        Cuts
                      </th>
                      <th style={{ padding: "0.875rem 1.25rem", fontSize: "0.75rem", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHouses.map((house, index) => (
                      <motion.tr
                        key={house._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => setSelectedHouse(house)}
                        style={{ cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background-color 0.2s" }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        <td style={{ padding: "0.75rem 1.25rem", fontWeight: "500", color: "#e2e8f0" }}>
                          #{house.houseNumber}
                        </td>
                        <td style={{ padding: "0.75rem 1.25rem", color: "var(--text-secondary)" }}>
                          {house.user?.name ?? '-'}
                        </td>
                        <td style={{ padding: "0.75rem 1.25rem", color: "#cbd5e1" }}>
                          {house.latestConsumption != null
                            ? `${house.latestConsumption} kWh`
                            : '-'}
                        </td>
                        <td style={{ padding: "0.75rem 1.25rem" }}>
                          <StatusBadge
                            status={house.hasSolar ? 'ok' : 'warning'}
                            label={
                              house.hasSolar
                                ? `${house.solarCapacity ?? 0} kW`
                                : 'None'
                            }
                          />
                        </td>
                        <td style={{ padding: "0.75rem 1.25rem" }}>
                          {house.cutCount > 0 ? (
                            <span style={{ fontWeight: "500", color: "#f87171" }}>
                              {house.cutCount}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-secondary)" }}>0</span>
                          )}
                        </td>
                        <td style={{ padding: "0.75rem 1.25rem", color: "var(--text-secondary)" }}>
                          {house.totalConsumption != null
                            ? `${Math.round(house.totalConsumption)} kWh`
                            : '-'}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredHouses.length === 0 && (
                <div style={{ padding: "2rem", textAlign: "center" }}>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    {search ? 'No houses match your search' : 'No houses found'}
                  </p>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* Empty state for grid */}
        {viewMode === 'grid' && filteredHouses.length === 0 && (
          <motion.div variants={itemVariants} style={{ marginTop: "2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <HiOutlineHome style={{ height: "3rem", width: "3rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }} />
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              {search ? 'No houses match your search' : 'No houses found'}
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedHouse && (
          <HouseDetailModal
            house={selectedHouse}
            onClose={() => setSelectedHouse(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
