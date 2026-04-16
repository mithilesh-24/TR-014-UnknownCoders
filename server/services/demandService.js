/**
 * demandService.js
 * -----------------
 * Simulates realistic household energy demand for 55 houses.
 *
 * Since no real smart-meter data exists, demand is generated using
 * controlled randomness:
 *   - Each house is randomly assigned a consumption tier (low / medium / high)
 *   - Evening hours (18–23) apply a 30% demand multiplier
 *   - Values stay within real-world residential ranges
 */

const HOUSE_COUNT = 55;

// Weighted tier distribution — most houses are medium consumers
const TIERS = [
  { name: "low",    min: 1.0, max: 3.0, weight: 0.25 },
  { name: "medium", min: 3.0, max: 6.0, weight: 0.55 },
  { name: "high",   min: 6.0, max: 10.0, weight: 0.20 },
];

/**
 * Pick a demand tier using weighted random selection.
 * @returns {{ name: string, min: number, max: number }}
 */
function pickTier() {
  const rand = Math.random();
  let cumulative = 0;
  for (const tier of TIERS) {
    cumulative += tier.weight;
    if (rand <= cumulative) return tier;
  }
  return TIERS[1]; // fallback to medium
}

/**
 * Generate a uniformly distributed random value within [min, max].
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomBetween(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

/**
 * Simulate energy demand for all 55 houses.
 *
 * @param {number} hour - Current hour (0-23), used for evening multiplier
 * @returns {{ houses: Array<{houseId: string, tier: string, demand: number}>, totalDemand: number }}
 */
function simulateDemand(hour) {
  // Evening peak multiplier: 18:00 – 23:00
  const isEveningPeak = hour >= 18 && hour <= 23;
  const eveningFactor = isEveningPeak ? 1.30 : 1.0;

  const houses = [];

  for (let i = 1; i <= HOUSE_COUNT; i++) {
    const houseId = `HOUSE_${String(i).padStart(3, "0")}`;
    const tier    = pickTier();
    const baseDemand = randomBetween(tier.min, tier.max);
    const demand     = Math.round(baseDemand * eveningFactor * 100) / 100;

    houses.push({ houseId, tier: tier.name, demand });
  }

  const totalDemand = Math.round(
    houses.reduce((sum, h) => sum + h.demand, 0) * 100
  ) / 100;

  return {
    houses,
    totalDemand,
    isEveningPeak,
  };
}

module.exports = { simulateDemand };
