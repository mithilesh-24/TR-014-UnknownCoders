/**
 * mlService.js
 * -------------
 * Sends weather features to the Python Flask ML server and returns
 * the predicted temperature and energy generation values.
 *
 * Falls back to a physics-based simulation when Flask is unavailable,
 * so the entire Node pipeline still runs in development without Python.
 */

const axios = require("axios");

const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

/**
 * Physics-inspired energy fallback.
 * Solar follows a Gaussian bell curve peaking at noon.
 * Wind uses a simplified kinetic energy formula.
 *
 * @param {Object} features
 * @returns {{ temperature: number, energy: number, source: string }}
 */
function getFallbackPrediction({ hour, wind_speed, radiation }) {
  // Temperature: diurnal cycle
  const tempBase  = 10 + 18 * Math.sin(((hour - 6) / 12) * Math.PI);
  const temperature = Math.round((tempBase + (Math.random() * 2 - 1)) * 10) / 10;

  // Solar energy from radiation (assume 50 m² panel, 20% efficiency)
  const solarEnergy = Math.round((radiation * 50 * 0.20) / 1000 * 100) / 100; // kWh

  // Wind energy: P = 0.5 * rho * A * v^3  (rotor area ~25π m²)
  const airDensity  = 1.225;
  const rotorArea   = Math.PI * 25;
  const windEnergy  = Math.round(
    (0.5 * airDensity * rotorArea * Math.pow(wind_speed, 3)) / 1000 * 100
  ) / 100; // kWh

  const energy = Math.round((solarEnergy + windEnergy + Math.random() * 2) * 100) / 100;

  return { temperature, energy, source: "fallback" };
}

/**
 * Call the Python Flask prediction endpoint.
 *
 * @param {Object} features
 * @param {number} features.hour
 * @param {number} features.day
 * @param {number} features.month
 * @param {number} features.dayofweek
 * @param {number} features.radiation
 * @param {number} features.wind_speed
 *
 * @returns {Promise<{ temperature: number, energy: number, source: string }>}
 */
async function predict(features) {
  const payload = {
    hour       : features.hour,
    day        : features.day,
    month      : features.month,
    dayofweek  : features.dayofweek,
    radiation  : features.radiation,
    wind_speed : features.wind_speed,
  };

  console.log(`[ML] Calling ${ML_URL}/predict with:`, payload);

  try {
    const response = await axios.post(`${ML_URL}/predict`, payload, {
      timeout: 8000,
      headers: { "Content-Type": "application/json" },
    });

    const { temperature, energy } = response.data;
    console.log(`[ML] Model response: temp=${temperature}, energy=${energy}`);

    return {
      temperature : Math.round(temperature * 100) / 100,
      energy      : Math.round(energy      * 100) / 100,
      source      : "ml_model",
    };
  } catch (err) {
    console.warn("[ML] Flask service unavailable, using fallback:", err.message);
    return getFallbackPrediction(features);
  }
}

module.exports = { predict };
