/**
 * smartGrid.controller.js
 * ------------------------
 * Orchestrates the full smart-grid pipeline:
 *
 *   1. Fetch real-time weather   (weatherService)
 *   2. Predict temperature+energy (mlService → Python Flask)
 *   3. Simulate household demand  (demandService → 55 houses)
 *   4. Distribute energy          (distributionService)
 *   5. Generate shortage alert with severity
 *   6. Return complete payload to frontend
 *
 * This controller is COMPLETELY SEPARATE from the existing
 * system.controller.js — it touches no existing business logic.
 */

const weatherService      = require("../services/weatherService");
const mlService           = require("../services/mlService");
const demandService       = require("../services/demandService");
const distributionService = require("../services/distributionService");

/**
 * Determine alert severity and message based on shortage %.
 *
 * @param {number} shortagePercent
 * @param {number} shortage  - absolute kWh deficit
 * @param {number} totalDemand
 * @returns {{ level: string, message: string } | null}
 */
function buildAlert(shortagePercent, shortage, totalDemand) {
  if (shortagePercent <= 0) return null;

  let level, message;

  if (shortagePercent > 30) {
    level   = "critical";
    message = `⚠️ CRITICAL: Energy shortage of ${shortage.toFixed(2)} kWh (${shortagePercent.toFixed(1)}% of demand). Severe supply disruption expected across the grid.`;
  } else if (shortagePercent > 10) {
    level   = "medium";
    message = `⚠️ WARNING: Energy shortage of ${shortage.toFixed(2)} kWh (${shortagePercent.toFixed(1)}% of demand). Proportional load reduction applied to all houses.`;
  } else {
    level   = "low";
    message = `ℹ️ NOTICE: Minor energy shortfall of ${shortage.toFixed(2)} kWh (${shortagePercent.toFixed(1)}% of demand). Minor load adjustments applied.`;
  }

  return { level, message, shortage, shortagePercent };
}

/**
 * POST /api/smartgrid/run
 *
 * Runs the complete smart-grid prediction and distribution pipeline.
 *
 * Response shape:
 * {
 *   timestamp       : string,
 *   weather         : { temperature, wind_speed, radiation, hour, ... },
 *   prediction      : { temperature, energy, source },
 *   temperature     : number,       // predicted °C
 *   totalEnergy     : number,       // kWh available
 *   demand          : { houses[], totalDemand, isEveningPeak },
 *   totalDemand     : number,       // kWh required
 *   distribution    : HouseAllocation[],
 *   housesAffected  : number,
 *   surplus         : number,
 *   shortage        : number,
 *   shortagePercent : number,
 *   status          : "sufficient" | "shortage",
 *   alert           : { level, message, shortage, shortagePercent } | null,
 *   pipelineMs      : number        // execution time in ms
 * }
 */
exports.runSmartGrid = async (req, res) => {
  const pipelineStart = Date.now();

  try {
    // ── Step 1: Weather ──────────────────────────────────────────────────
    const weather = await weatherService.getWeather();
    console.log(`[SmartGrid] Weather fetched from: ${weather.source}`, {
      temp: weather.temperature,
      wind: weather.wind_speed,
      hour: weather.hour,
    });

    // ── Step 2: ML Prediction ────────────────────────────────────────────
    const prediction = await mlService.predict({
      hour      : weather.hour,
      day       : weather.day,
      month     : weather.month,
      dayofweek : weather.dayofweek,
      radiation : weather.radiation,
      wind_speed: weather.wind_speed,
    });
    console.log(`[SmartGrid] ML prediction (${prediction.source}):`, prediction);

    // ── Step 3: Demand Simulation ────────────────────────────────────────
    const demand = demandService.simulateDemand(weather.hour);
    console.log(`[SmartGrid] Demand simulated: ${demand.totalDemand} kWh across ${demand.houses.length} houses`);

    // ── Step 4: Distribution ─────────────────────────────────────────────
    const result = distributionService.distribute(prediction.energy, demand.houses);
    console.log(`[SmartGrid] Distribution complete. Status: ${result.status}`);

    // ── Step 5: Alert ────────────────────────────────────────────────────
    const alert = buildAlert(result.shortagePercent, result.shortage, result.totalDemand);
    if (alert) {
      console.warn(`[SmartGrid] Alert [${alert.level.toUpperCase()}]: ${alert.message}`);
    }

    // ── Step 6: Respond ──────────────────────────────────────────────────
    return res.status(200).json({
      timestamp      : new Date().toISOString(),
      weather,
      prediction,
      // Flat convenience fields for easy frontend consumption
      temperature    : prediction.temperature,
      totalEnergy    : result.totalEnergy,
      totalDemand    : result.totalDemand,
      demand         : {
        houses       : demand.houses,
        totalDemand  : demand.totalDemand,
        isEveningPeak: demand.isEveningPeak,
      },
      distribution   : result.distribution,
      housesAffected : result.housesAffected,
      surplus        : result.surplus,
      shortage       : result.shortage,
      shortagePercent: result.shortagePercent,
      status         : result.status,
      alert,
      pipelineMs     : Date.now() - pipelineStart,
    });
  } catch (err) {
    console.error("[SmartGrid] Pipeline error:", err.message);
    return res.status(500).json({
      message   : "Smart grid pipeline failed",
      error     : err.message,
      pipelineMs: Date.now() - pipelineStart,
    });
  }
};
