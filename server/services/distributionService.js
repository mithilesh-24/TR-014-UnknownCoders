/**
 * distributionService.js
 * -----------------------
 * Distributes available energy across all simulated houses.
 *
 * Rules:
 *   1. If energy >= totalDemand  → each house gets its full demand  (cut = false)
 *   2. If energy <  totalDemand  → pro-rata allocation               (cut = true for shortfalls)
 *      allocation_i = (demand_i / totalDemand) * totalEnergy
 *
 * Returns per-house allocation, aggregate stats, and a shortage value.
 */

/**
 * @typedef {Object} House
 * @property {string} houseId
 * @property {string} tier     - "low" | "medium" | "high"
 * @property {number} demand   - kWh required
 *
 * @typedef {Object} HouseAllocation
 * @property {string}  houseId
 * @property {string}  tier
 * @property {number}  demand       - kWh requested
 * @property {number}  allocated    - kWh actually supplied
 * @property {number}  cutAmount    - kWh not supplied (0 if fully met)
 * @property {boolean} cut          - true if house did not receive its full demand
 *
 * @typedef {Object} DistributionResult
 * @property {HouseAllocation[]} distribution
 * @property {number} totalDemand
 * @property {number} totalEnergy
 * @property {number} shortage       - kWh deficit (0 if sufficient)
 * @property {number} shortagePercent
 * @property {number} surplus        - kWh excess (0 if shortage)
 * @property {number} housesAffected - count of houses that were cut
 * @property {string} status         - "sufficient" | "shortage"
 */

/**
 * Distribute energy to houses.
 *
 * @param {number} totalEnergy  - Total kWh available (from ML prediction)
 * @param {House[]} houses      - Array of house objects from demandService
 * @returns {DistributionResult}
 */
function distribute(totalEnergy, houses) {
  const totalDemand = Math.round(
    houses.reduce((sum, h) => sum + h.demand, 0) * 100
  ) / 100;

  const isSufficient = totalEnergy >= totalDemand;

  let distribution;

  if (isSufficient) {
    // Full allocation — no cuts
    distribution = houses.map((h) => ({
      houseId   : h.houseId,
      tier      : h.tier,
      demand    : h.demand,
      allocated : h.demand,
      cutAmount : 0,
      cut       : false,
    }));
  } else {
    // Pro-rata allocation — spread the available energy proportionally
    const ratio = totalEnergy / totalDemand;

    distribution = houses.map((h) => {
      const allocated = Math.round(h.demand * ratio * 100) / 100;
      const cutAmount = Math.round((h.demand - allocated) * 100) / 100;

      return {
        houseId   : h.houseId,
        tier      : h.tier,
        demand    : h.demand,
        allocated,
        cutAmount : cutAmount > 0 ? cutAmount : 0,
        cut       : cutAmount > 0,
      };
    });
  }

  const shortage        = isSufficient ? 0 : Math.round((totalDemand - totalEnergy) * 100) / 100;
  const shortagePercent = isSufficient ? 0 : Math.round((shortage / totalDemand) * 10000) / 100;
  const surplus         = isSufficient ? Math.round((totalEnergy - totalDemand) * 100) / 100 : 0;
  const housesAffected  = distribution.filter((d) => d.cut).length;

  return {
    distribution,
    totalDemand,
    totalEnergy : Math.round(totalEnergy * 100) / 100,
    shortage,
    shortagePercent,
    surplus,
    housesAffected,
    status : isSufficient ? "sufficient" : "shortage",
  };
}

module.exports = { distribute };
