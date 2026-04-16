import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineLightningBolt,
  HiOutlinePlay,
  HiOutlineRefresh,
  HiOutlineArrowRight,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import GlassCard from '../../components/ui/GlassCard';
import useApi from '../../hooks/useApi';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function QuantumDashboardPage() {
  const { post } = useApi();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Simulation State
  const [simulating, setSimulating] = useState(false);
  const [iteration, setIteration] = useState(0);
  const [currentCost, setCurrentCost] = useState(0);
  const [bestCost, setBestCost] = useState(null);
  
  // Real vs Simulated distribution array
  const [displayHouses, setDisplayHouses] = useState([]);

  // Fetch initial base state
  const fetchBaseline = async () => {
    try {
      setLoading(true);
      const result = await post('/system/run'); // ML pipeline point
      
      const houses = result.distribution || [];
      const baseCost = houses.reduce((acc, h) => acc + (h.cutAmount || 0), 0) * 12.5;

      setData({
        totalEnergy: result.totalEnergy,
        totalDemand: result.totalDemand,
        shortage: result.shortagePercent,
        baseHouses: houses,
      });

      // Initialize displayed houses with baseline allocation
      setDisplayHouses(houses.map(h => ({
        id: h.houseId,
        demand: h.demand,
        allocated: h.allocated || 0,
        optimized: false,
      })));

      setCurrentCost(Math.round(baseCost));
      setBestCost(Math.round(baseCost));
      setIteration(0);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load baseline metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaseline();
  }, []);

  const handleRunOptimization = () => {
    if (!data || simulating) return;
    setSimulating(true);
    setIteration(0);
    
    // Total energy available
    const totalAvail = data.totalEnergy;
    
    // Simulate iterative quantum annealing process
    let currentIter = 0;
    const maxIters = 60;
    
    // Copy base items to animate
    let currentDistribution = data.baseHouses.map(h => ({
      ...h,
      allocated: h.allocated || 0
    }));

    // Baseline cost
    let minCost = bestCost || 1000;

    const interval = setInterval(() => {
      currentIter++;
      
      // Simulate random perturbation of energy allocation (Annealing jitter)
      if (currentIter < maxIters) {
        // Shuffle energy slightly between houses
        const idx1 = Math.floor(Math.random() * currentDistribution.length);
        const idx2 = Math.floor(Math.random() * currentDistribution.length);
        
        if (idx1 !== idx2) {
          const shift = (Math.random() * 0.5); // Shift up to 0.5 kWh
          if (currentDistribution[idx1].allocated > shift) {
            currentDistribution[idx1].allocated -= shift;
            currentDistribution[idx2].allocated = Math.min(
              currentDistribution[idx2].demand, 
              currentDistribution[idx2].allocated + shift
            );
          }
        }
      } else {
        // Final optimization step: "Quantum exact fairness"
        // Try to distribute energy roughly equally proportional to demand
        let remaining = totalAvail;
        const sorted = [...currentDistribution].sort((a,b) => a.demand - b.demand);
        
        sorted.forEach(h => h.allocated = 0);
        let activeCount = sorted.length;
        
        // Fair share logic
        while(remaining > 0.1 && activeCount > 0) {
          const fairShare = remaining / activeCount;
          let changed = false;
          
          for (const h of sorted) {
            if (h.allocated < h.demand) {
              const shortfall = h.demand - h.allocated;
              const give = Math.min(fairShare, shortfall, remaining);
              h.allocated += give;
              remaining -= give;
              if (h.allocated >= h.demand) activeCount--;
              changed = true;
            }
          }
          if (!changed) break;
        }
        currentDistribution = sorted;
      }

      // Calculate new cost function (Penalty for variance & absolute shortage)
      const cost = currentDistribution.reduce((acc, h) => {
        const deficit = Math.max(0, h.demand - h.allocated);
        return acc + (deficit * deficit * 3.1); // Quadratic penalty for deficit
      }, 0);

      if (cost < minCost) {
        minCost = cost;
      }

      setIteration(currentIter);
      setCurrentCost(Math.round(cost));
      setBestCost(Math.round(minCost));
      
      setDisplayHouses(currentDistribution.map(h => ({
        id: h.houseId,
        demand: h.demand,
        allocated: h.allocated,
        optimized: currentIter === maxIters,
      })));

      if (currentIter >= maxIters) {
        clearInterval(interval);
        setSimulating(false);
      }
    }, 100);
  };

  const handleReset = () => {
    if (simulating) return;
    setIteration(0);
    if (data?.baseHouses) {
      const baseCost = data.baseHouses.reduce((acc, h) => acc + (h.cutAmount || 0), 0) * 12.5;
      setCurrentCost(Math.round(baseCost));
      setBestCost(Math.round(baseCost));
      setDisplayHouses(data.baseHouses.map(h => ({
        id: h.houseId,
        demand: h.demand,
        allocated: h.allocated || 0,
        optimized: false,
      })));
    }
  };

  const optimizationImprovement = 
    (data && bestCost && data.baseHouses) 
      ? Math.max(0, (((data.baseHouses.reduce((acc, h) => acc + (h.cutAmount || 0)*12.5, 0) - bestCost) / (data.baseHouses.reduce((acc, h) => acc + (h.cutAmount || 0)*12.5, 0) || 1)) * 100))
      : 0;

  if (loading) return (
    <div className="page-container flex-col-center h-full">
      <div className="skeleton-pulse skeleton-chart-full" style={{ height: "400px", width: "100%" }} />
    </div>
  );

  return (
    <div className="page-container">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="page-inner-xl">
        {/* HEADER */}
        <motion.div variants={itemVariants} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <HiOutlineLightningBolt style={{ color: "#c084fc", fontSize: "1.75rem" }} />
              <h1 className="page-title text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400" style={{ background: "linear-gradient(to right, #c084fc, #818cf8)", WebkitBackgroundClip: "text", color: "transparent" }}>
                Quantum Energy Optimization
              </h1>
            </div>
            <p className="page-subtitle" style={{ marginTop: "0.25rem", color: "#94a3b8" }}>
              Smart Distribution using Quantum Annealing
            </p>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              disabled={simulating}
              className="btn"
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.25rem", borderRadius: "0.5rem",
                backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", cursor: simulating ? "not-allowed" : "pointer"
              }}
            >
              <HiOutlineRefresh />
              Reset Simulation
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(168, 85, 247, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRunOptimization}
              disabled={simulating}
              className="btn"
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.25rem", borderRadius: "0.5rem",
                background: "linear-gradient(135deg, #a855f7, #6366f1)", border: "none", color: "#fff", cursor: simulating ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(168, 85, 247, 0.25)"
              }}
            >
              <HiOutlineSparkles strokeWidth={2} />
              {simulating ? 'Optimizing...' : 'Run Optimization'}
            </motion.button>
          </div>
        </motion.div>

        {/* METRICS & STATUS */}
        <motion.div variants={itemVariants} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          <GlassCard style={{ padding: "1.5rem" }}>
            <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8" }}>Total Energy Supply</p>
            <div style={{ fontSize: "1.875rem", fontWeight: "700", color: "#22c55e", marginTop: "0.5rem" }}>
              {data?.totalEnergy?.toFixed(1) || 0} kWh
            </div>
          </GlassCard>
          
          <GlassCard style={{ padding: "1.5rem" }}>
            <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8" }}>Total Demand</p>
            <div style={{ fontSize: "1.875rem", fontWeight: "700", color: "#eab308", marginTop: "0.5rem" }}>
              {data?.totalDemand?.toFixed(1) || 0} kWh
            </div>
          </GlassCard>

          <GlassCard style={{ padding: "1.5rem" }}>
            <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8" }}>Optimization Improvement</p>
            <div style={{ fontSize: "1.875rem", fontWeight: "700", color: "#c084fc", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {optimizationImprovement.toFixed(1)}%
              {optimizationImprovement > 0 && <HiOutlineArrowRight style={{ color: "#a855f7", fontSize: "1.25rem", transform: "rotate(-45deg)" }} />}
            </div>
          </GlassCard>

          <GlassCard style={{ padding: "1.5rem", background: "rgba(168, 85, 247, 0.05)", border: "1px solid rgba(168, 85, 247, 0.2)" }}>
            <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#c084fc", display: "flex", justifyContent: "space-between" }}>
              <span>Simulation Status</span>
              <span>Iter: {iteration}</span>
            </p>
            <div style={{ marginTop: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Cost Function</p>
                <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#f87171" }}>{currentCost}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Best Target</p>
                <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#4ade80" }}>{bestCost || '-'}</div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* COMPARISON CHART */}
        <motion.div variants={itemVariants}>
          <GlassCard style={{ padding: "2rem", minHeight: "450px", overflowX: "auto" }}>
            <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#e2e8f0" }}>Energy Allocation Profile</h3>
              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: "12px", height: "12px", borderRadius: "2px", background: "rgba(255,255,255,0.1)" }} /><span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>Demand Constraint</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: "12px", height: "12px", borderRadius: "2px", background: "#22c55e" }} /><span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>Satisfied</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: "12px", height: "12px", borderRadius: "2px", background: "#f59e0b" }} /><span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>Partial Fill</span></div>
              </div>
            </div>

            <div style={{ position: "relative", height: "300px", display: "flex", alignItems: "flex-end", gap: "1.5rem", paddingBottom: "2rem" }}>
              <AnimatePresence>
                {displayHouses.map((house, idx) => {
                  const supplyPerc = Math.max(0, Math.min(100, (house.allocated / (house.demand || 1)) * 100));
                  const bgGradient = supplyPerc >= 95 ? "linear-gradient(to top, #15803d, #22c55e)" : supplyPerc >= 60 ? "linear-gradient(to top, #b45309, #f59e0b)" : "linear-gradient(to top, #b91c1c, #ef4444)";
                  const barHeight = Math.max(5, (house.demand / 10) * 200); // Scale relative to max realistic demand ~10

                  return (
                    <div key={house.id || idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative", height: "100%", justifyContent: "flex-end" }}>
                      
                      {/* Demand Ghost Box */}
                      <div style={{ position: "absolute", bottom: 0, width: "100%", height: `${barHeight}px`, background: "rgba(255,255,255,0.05)", borderRadius: "4px", border: "1px dashed rgba(255,255,255,0.15)", zIndex: 1 }} />
                      
                      {/* Allocated Fill Box */}
                      <motion.div
                        initial={false}
                        animate={{ height: `${(supplyPerc / 100) * barHeight}px` }}
                        transition={{ type: "spring", stiffness: 100, damping: 15 }}
                        style={{ width: "100%", borderRadius: "4px", background: house.optimized ? "linear-gradient(to top, #7e22ce, #c084fc)" : bgGradient, zIndex: 2, boxShadow: house.optimized ? "0 0 15px rgba(192, 132, 252, 0.4)" : "none" }}
                      />
                      
                      {/* X-axis Label */}
                      <div style={{ position: "absolute", bottom: "-25px", fontSize: "0.75rem", color: "#64748b", fontWeight: "500", whiteSpace: "nowrap" }}>
                        {(house.id || '').replace('HOUSE_', '#')}
                      </div>

                      {/* Tooltip Float */}
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ position: "absolute", top: `-${30}px`, fontSize: "0.7rem", color: "#cbd5e1", background: "rgba(0,0,0,0.5)", padding: "2px 6px", borderRadius: "4px", pointerEvents: "none" }}
                      >
                        {house.allocated.toFixed(1)}k
                      </motion.div>
                    </div>
                  );
                })}
              </AnimatePresence>
            </div>
            
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
