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
    // Rolling Blackout allocation — fulfill houses randomly until energy runs out
    // This allows us to see some houses as Optimal (green) and others as Critical (red)
    const shuffledHouses = [...houses].sort(() => Math.random() - 0.5);

    let remainingEnergy = totalEnergy;
    distribution = [];

    for (const h of shuffledHouses) {
      if (remainingEnergy >= h.demand) {
        // House gets full power
        distribution.push({
          houseId   : h.houseId,
          tier      : h.tier,
          demand    : h.demand,
          allocated : h.demand,
          cutAmount : 0,
          cut       : false,
        });
        remainingEnergy -= h.demand;
      } else if (remainingEnergy > 0) {
        // Partial power for this one house
        const allocated = Math.round(remainingEnergy * 100) / 100;
        distribution.push({
          houseId   : h.houseId,
          tier      : h.tier,
          demand    : h.demand,
          allocated,
          cutAmount : Math.round((h.demand - allocated) * 100) / 100,
          cut       : true,
        });
        remainingEnergy = 0;
      } else {
        // Total power cut for remaining houses
        distribution.push({
          houseId   : h.houseId,
          tier      : h.tier,
          demand    : h.demand,
          allocated : 0,
          cutAmount : h.demand,
          cut       : true,
        });
      }
    }

    // Sort back into original order by houseId so the map stays stable
    distribution.sort((a, b) => a.houseId.localeCompare(b.houseId));
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
