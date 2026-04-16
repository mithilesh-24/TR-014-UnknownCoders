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
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="mb-8 h-10 w-72 animate-pulse rounded-xl bg-white/5" />
      <div className="mb-6 flex gap-4">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-white/5" />
        <div className="h-10 w-48 animate-pulse rounded-xl bg-white/5" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-52 animate-pulse rounded-2xl border border-white/[0.06] bg-[#1a1a2e]/60"
            style={{ animationDelay: `${i * 80}ms` }}
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <motion.div
          className="relative z-10 w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#1a1a2e]/95 backdrop-blur-xl shadow-2xl shadow-black/40"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>

          <div className="p-6">
            {/* House Details Header */}
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-500/10">
                <HiOutlineHome className="h-7 w-7 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">
                  House #{house.houseNumber}
                </h2>
                <p className="text-sm text-slate-400">{house.address}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {house.user && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <HiOutlineUser className="h-3.5 w-3.5" />
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
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4">
                <p className="text-xs text-slate-500">Residents</p>
                <p className="mt-1 text-lg font-semibold text-slate-200">{house.residents ?? '-'}</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4">
                <p className="text-xs text-slate-500">Latest Consumption</p>
                <p className="mt-1 text-lg font-semibold text-slate-200">
                  {house.latestConsumption != null ? `${house.latestConsumption} kWh` : '-'}
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4">
                <p className="text-xs text-slate-500">Total Consumption</p>
                <p className="mt-1 text-lg font-semibold text-slate-200">
                  {house.totalConsumption != null ? `${Math.round(house.totalConsumption)} kWh` : '-'}
                </p>
              </div>
            </div>

            {/* Charts */}
            {loadingDetail ? (
              <div className="space-y-4">
                <div className="h-56 animate-pulse rounded-xl bg-white/[0.03]" />
                <div className="h-56 animate-pulse rounded-xl bg-white/[0.03]" />
              </div>
            ) : (
              <div className="space-y-6">
                {consumptionData.length > 0 && (
                  <div>
                    <h4 className="mb-3 text-sm font-medium text-slate-300">
                      Consumption History
                    </h4>
                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
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
                    <h4 className="mb-3 text-sm font-medium text-slate-300">
                      Distribution History
                    </h4>
                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
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
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-8 text-center">
                    <p className="text-sm text-slate-500">No historical data available</p>
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
    <div className="min-h-screen bg-[#0a0a0f] p-4 sm:p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100">House Monitoring</h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor and manage all connected households
          </p>
        </motion.div>

        {/* Filter Bar */}
        <motion.div
          variants={itemVariants}
          className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            {/* Period Tabs */}
            <div className="flex rounded-xl bg-white/[0.04] border border-white/[0.06] p-1">
              {periods.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`relative rounded-lg px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
                    period === p
                      ? 'text-white'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {period === p && (
                    <motion.div
                      layoutId="period-tab"
                      className="absolute inset-0 rounded-lg bg-indigo-500/20 border border-indigo-500/30"
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    />
                  )}
                  <span className="relative z-10">{p}</span>
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex rounded-xl bg-white/[0.04] border border-white/[0.06] p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-1.5 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <HiOutlineSquares2X2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`rounded-lg p-1.5 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <HiOutlineTableCells className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by house # or name..."
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] py-2 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-indigo-500/30 focus:bg-white/[0.06] sm:w-64"
            />
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div variants={itemVariants} className="mb-6">
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
          >
            {filteredHouses.map((house) => (
              <motion.div key={house._id} variants={itemVariants}>
                <GlassCard
                  hover
                  onClick={() => setSelectedHouse(house)}
                  className="p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10">
                        <HiOutlineHome className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-200">
                          House #{house.houseNumber}
                        </h3>
                        {house.user && (
                          <p className="text-xs text-slate-500">{house.user.name}</p>
                        )}
                      </div>
                    </div>
                    <StatusBadge
                      status={house.hasSolar ? 'ok' : 'warning'}
                      label={house.hasSolar ? 'Solar' : 'No Solar'}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white/[0.03] p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">
                        Consumption
                      </p>
                      <div className="mt-0.5">
                        <AnimatedCounter
                          value={house.latestConsumption ?? 0}
                          suffix=" kWh"
                          className="text-sm font-semibold text-slate-200"
                        />
                      </div>
                    </div>
                    {house.hasSolar && (
                      <div className="rounded-lg bg-white/[0.03] p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">
                          Solar Cap.
                        </p>
                        <div className="mt-0.5 flex items-center gap-1">
                          <RiSunLine className="h-3.5 w-3.5 text-amber-400" />
                          <span className="text-sm font-semibold text-slate-200">
                            {house.solarCapacity ?? 0} kW
                          </span>
                        </div>
                      </div>
                    )}
                    {!house.hasSolar && (
                      <div className="rounded-lg bg-white/[0.03] p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">
                          Solar Cap.
                        </p>
                        <p className="mt-0.5 text-sm text-slate-500">N/A</p>
                      </div>
                    )}
                  </div>

                  {house.cutCount > 0 && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/5 border border-red-500/10 px-3 py-2">
                      <HiOutlineExclamationTriangle className="h-3.5 w-3.5 text-red-400" />
                      <span className="text-xs text-red-300">
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
          <motion.div variants={itemVariants}>
            <GlassCard hover={false} className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                        House
                      </th>
                      <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Owner
                      </th>
                      <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Consumption
                      </th>
                      <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Solar
                      </th>
                      <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Cuts
                      </th>
                      <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-slate-500">
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
                        className="cursor-pointer border-b border-white/[0.03] transition-colors hover:bg-white/[0.03]"
                      >
                        <td className="px-5 py-3 font-medium text-slate-200">
                          #{house.houseNumber}
                        </td>
                        <td className="px-5 py-3 text-slate-400">
                          {house.user?.name ?? '-'}
                        </td>
                        <td className="px-5 py-3 text-slate-300">
                          {house.latestConsumption != null
                            ? `${house.latestConsumption} kWh`
                            : '-'}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge
                            status={house.hasSolar ? 'ok' : 'warning'}
                            label={
                              house.hasSolar
                                ? `${house.solarCapacity ?? 0} kW`
                                : 'None'
                            }
                          />
                        </td>
                        <td className="px-5 py-3">
                          {house.cutCount > 0 ? (
                            <span className="font-medium text-red-400">
                              {house.cutCount}
                            </span>
                          ) : (
                            <span className="text-slate-500">0</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-400">
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
                <div className="p-8 text-center">
                  <p className="text-sm text-slate-500">
                    {search ? 'No houses match your search' : 'No houses found'}
                  </p>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* Empty state for grid */}
        {viewMode === 'grid' && filteredHouses.length === 0 && (
          <motion.div variants={itemVariants} className="mt-8 text-center">
            <HiOutlineHome className="mx-auto h-12 w-12 text-slate-600" />
            <p className="mt-3 text-sm text-slate-500">
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
