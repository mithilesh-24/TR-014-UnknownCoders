/**
 * weatherService.js
 * ------------------
 * Fetches real-time weather data from OpenWeatherMap API.
 * Falls back to realistic simulated weather data when the API key is absent
 * or the request fails — ensuring the pipeline always runs in development.
 */

const axios = require("axios");

const API_KEY = process.env.OPENWEATHER_API_KEY;
const CITY    = process.env.OPENWEATHER_CITY || "London";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

/**
 * Build realistic fallback weather data when the real API is unavailable.
 * Values are time-aware: temperature follows a diurnal cycle,
 * radiation peaks near solar noon, wind is slightly random.
 *
 * @returns {WeatherData}
 */
function getMockWeather() {
  const now        = new Date();
  const hour       = now.getHours();
  const day        = now.getDate();
  const month      = now.getMonth() + 1; // 1-based
  const dayofweek  = now.getDay();       // 0 = Sunday

  // Diurnal temperature: cold at night (~10°C), warm at noon (~28°C)
  const tempBase   = 10 + 18 * Math.sin(((hour - 6) / 12) * Math.PI);
  const temperature = Math.round((tempBase + (Math.random() * 2 - 1)) * 10) / 10;

  // Solar radiation: zero at night, peak ~800 W/m² near noon
  let radiation = 0;
  if (hour >= 6 && hour <= 18) {
    const factor = Math.exp(-Math.pow(hour - 12, 2) / (2 * 4 * 4));
    radiation    = Math.round((factor * 800 + Math.random() * 50) * 10) / 10;
  }

  // Wind speed: 2–12 m/s with slight night-time boost
  const windBase = 4 + Math.random() * 6;
  const wind_speed = Math.round(
    (hour >= 22 || hour <= 5 ? windBase + 2 : windBase) * 10
  ) / 10;

  return {
    temperature,
    wind_speed,
    radiation,
    hour,
    day,
    month,
    dayofweek,
    source: "mock",
  };
}

/**
 * Fetch current weather from OpenWeatherMap and extract the fields
 * needed by the ML prediction service.
 *
 * @returns {Promise<WeatherData>}
 *
 * @typedef {Object} WeatherData
 * @property {number} temperature  - °C
 * @property {number} wind_speed   - m/s
 * @property {number} radiation    - estimated W/m² (derived from clouds)
 * @property {number} hour         - 0-23
 * @property {number} day          - 1-31
 * @property {number} month        - 1-12
 * @property {number} dayofweek    - 0-6 (Sun=0)
 * @property {string} source       - "api" | "mock"
 */
async function getWeather() {
  // No API key → skip network call, return mock immediately
  if (!API_KEY || API_KEY === "your_key_here") {
    console.log("[Weather] No API key — using mock weather data");
    return getMockWeather();
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: { q: CITY, appid: API_KEY, units: "metric" },
      timeout: 5000,
    });

    const data = response.data;
    const now  = new Date();

    // Cloud cover 0–100 → approximate radiation reduction
    const cloudFraction = (data.clouds?.all ?? 50) / 100;
    const hour          = now.getHours();
    let radiation       = 0;
    if (hour >= 6 && hour <= 18) {
      const factor = Math.exp(-Math.pow(hour - 12, 2) / (2 * 4 * 4));
      radiation    = Math.round(factor * 1000 * (1 - cloudFraction * 0.75) * 10) / 10;
    }

    return {
      temperature : Math.round(data.main.temp * 10)       / 10,
      wind_speed  : Math.round(data.wind.speed * 10)      / 10,
      radiation,
      hour        : now.getHours(),
      day         : now.getDate(),
      month       : now.getMonth() + 1,
      dayofweek   : now.getDay(),
      source      : "api",
      city        : data.name,
    };
  } catch (err) {
    console.warn("[Weather] API call failed, using mock data:", err.message);
    return getMockWeather();
  }
}

module.exports = { getWeather };
