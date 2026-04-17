/**
 * routes/weather.js
 * ------------------
 * Public route: GET /api/weather
 *
 * Returns the current real-time weather data used by the smart grid ML pipeline.
 * Delegates to the existing weatherService which handles API key auth and fallback.
 */

const express          = require('express');
const router           = express.Router();
const { getWeather }   = require('../services/weatherService');

/**
 * GET /api/weather
 *
 * Response:
 *  { success: true, data: WeatherData }
 *  { success: false, error: string }
 */
router.get('/', async (req, res, next) => {
  try {
    const weatherData = await getWeather();
    res.status(200).json({ success: true, data: weatherData });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
