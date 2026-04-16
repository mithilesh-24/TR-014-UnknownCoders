const express = require("express");
const router = express.Router();
const { auth, adminOnly } = require("../middleware/auth");
const House = require("../models/House");
const Consumption = require("../models/Consumption");
const Generation = require("../models/Generation");
const Distribution = require("../models/Distribution");
const Battery = require("../models/Battery");
const Alert = require("../models/Alert");
const Forecast = require("../models/Forecast");
const { generateMockGeneration, generateMockConsumption } = require("../utils/energyCalculations");

// All routes require auth + admin
router.use(auth, adminOnly);

// ---------------------------------------------------------------------------
// POST /api/system/run-distribution
// ---------------------------------------------------------------------------
router.post("/run-distribution", async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // 1. Calculate total supply from latest generation + battery
    const latestGeneration = await Generation.findOne().sort({ timestamp: -1 }).lean();
    if (!latestGeneration) {
      return res.status(400).json({ message: "No generation data available. Please generate data first." });
    }

    const battery = await Battery.findOne();
    const batteryLevel = battery ? battery.currentLevel : 0;
    const totalSupply = latestGeneration.totalEnergy + batteryLevel;

    // 2. Calculate total demand from all houses (current hour consumption)
    const houses = await House.find().lean();
    if (houses.length === 0) {
      return res.status(400).json({ message: "No houses in the system." });
    }

    // Get latest consumption per house
    const houseConsumption = await Promise.all(
      houses.map(async (house) => {
        const consumption = await Consumption.findOne({
          houseId: house._id,
          timestamp: { $gte: oneHourAgo },
        })
          .sort({ timestamp: -1 })
          .lean();

        return {
          houseId: house._id,
          houseNumber: house.houseNumber,
          hasSolar: house.hasSolar,
          solarCapacity: house.solarCapacity,
          demand: consumption ? consumption.energyUsed : generateMockConsumption(now.getHours()),
        };
      })
    );

    const totalDemand = houseConsumption.reduce((sum, h) => sum + h.demand, 0);

    // 3 & 4. Distribution logic
    const distributionDocs = [];
    const alerts = [];

    if (totalSupply >= totalDemand) {
      // Sufficient supply: allocate fully, store excess in battery
      for (const hc of houseConsumption) {
        distributionDocs.push({
          houseId: hc.houseId,
          timestamp: now,
          allocatedEnergy: Math.round(hc.demand * 100) / 100,
          cutFlag: false,
          cutAmount: 0,
        });
      }

      // Store excess in battery
      const excess = totalSupply - totalDemand - batteryLevel; // net generation surplus
      if (battery) {
        const netExcess = latestGeneration.totalEnergy - totalDemand;
        if (netExcess > 0) {
          battery.currentLevel = Math.min(battery.maxCapacity, battery.currentLevel + netExcess);
        }
        battery.lastUpdated = now;
        await battery.save();
      }
    } else {
      // Shortage: reduce proportionally, cut highest consumers first
      const sorted = [...houseConsumption].sort((a, b) => b.demand - a.demand);
      const ratio = totalSupply / totalDemand;

      // Use all battery reserves
      if (battery) {
        battery.currentLevel = 0;
        battery.lastUpdated = now;
        await battery.save();
      }

      for (const hc of sorted) {
        // Higher consumers get proportionally more cuts
        const allocated = Math.round(hc.demand * ratio * 100) / 100;
        const cutAmount = Math.round((hc.demand - allocated) * 100) / 100;

        distributionDocs.push({
          houseId: hc.houseId,
          timestamp: now,
          allocatedEnergy: allocated,
          cutFlag: cutAmount > 0,
          cutAmount,
        });

        // Create overconsumption alert for highest consumers
        if (hc.demand > totalDemand / houses.length * 1.5) {
          alerts.push({
            type: "overconsumption",
            message: `House ${hc.houseNumber} is consuming ${hc.demand.toFixed(2)} kWh, significantly above average (${(totalDemand / houses.length).toFixed(2)} kWh).`,
            houseId: hc.houseId,
            severity: "medium",
          });
        }
      }

      // Create shortage alert
      const deficit = totalDemand - totalSupply;
      alerts.push({
        type: "shortage",
        message: `Energy shortage: Supply ${totalSupply.toFixed(2)} kWh vs Demand ${totalDemand.toFixed(2)} kWh. Deficit: ${deficit.toFixed(2)} kWh.`,
        severity: ratio < 0.5 ? "critical" : ratio < 0.75 ? "high" : "medium",
      });

      // Battery low alert
      if (battery && batteryLevel < battery.maxCapacity * 0.1) {
        alerts.push({
          type: "battery_low",
          message: `Battery depleted during shortage. Previous level: ${batteryLevel.toFixed(2)} kWh.`,
          severity: "high",
        });
      }
    }

    // 5. Save distribution records
    const savedDistributions = await Distribution.insertMany(distributionDocs);

    // Save alerts
    if (alerts.length > 0) {
      await Alert.insertMany(alerts);
    }

    // 6. Return results
    return res.json({
      timestamp: now,
      totalSupply: Math.round(totalSupply * 100) / 100,
      totalDemand: Math.round(totalDemand * 100) / 100,
      batteryUsed: totalSupply < totalDemand ? batteryLevel : 0,
      surplus: totalSupply >= totalDemand ? Math.round((totalSupply - totalDemand) * 100) / 100 : 0,
      deficit: totalSupply < totalDemand ? Math.round((totalDemand - totalSupply) * 100) / 100 : 0,
      status: totalSupply >= totalDemand ? "sufficient" : "shortage",
      distributions: savedDistributions,
      alerts,
      housesAffected: distributionDocs.filter((d) => d.cutFlag).length,
    });
  } catch (err) {
    console.error("[System] Distribution error:", err.message);
    return res.status(500).json({ message: "Server error running distribution" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/system/fetch-forecast
// ---------------------------------------------------------------------------
router.post("/fetch-forecast", async (req, res) => {
  try {
    const now = new Date();
    const forecasts = [];

    for (let i = 1; i <= 24; i++) {
      const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000);
      const hour = futureTime.getHours();

      // Solar: higher at midday, zero at night
      let predictedSolar = 0;
      if (hour >= 6 && hour <= 18) {
        const peakHour = 12;
        const spread = 4;
        const factor = Math.exp(-Math.pow(hour - peakHour, 2) / (2 * spread * spread));
        predictedSolar = factor * 50 + (Math.random() * 8 - 4);
        if (predictedSolar < 0) predictedSolar = 0;
      }
      predictedSolar = Math.round(predictedSolar * 100) / 100;

      // Wind: random variation, slightly stronger at night
      let predictedWind = 10 + Math.random() * 15;
      if (hour >= 22 || hour <= 5) {
        predictedWind += 5 + Math.random() * 8;
      }
      predictedWind = Math.round(predictedWind * 100) / 100;

      // Demand: peaks at 6-9pm, morning peak, low at night
      let predictedDemand;
      if (hour >= 18 && hour <= 21) {
        predictedDemand = 35 + Math.random() * 15;
      } else if (hour >= 6 && hour <= 9) {
        predictedDemand = 25 + Math.random() * 10;
      } else if (hour >= 0 && hour <= 5) {
        predictedDemand = 8 + Math.random() * 5;
      } else {
        predictedDemand = 15 + Math.random() * 10;
      }
      predictedDemand = Math.round(predictedDemand * 100) / 100;

      // Confidence: 70-95
      const confidence = Math.floor(70 + Math.random() * 25);

      forecasts.push({
        timestamp: futureTime,
        predictedSolar,
        predictedWind,
        predictedDemand,
        confidence,
      });
    }

    const savedForecasts = await Forecast.insertMany(forecasts);

    return res.json({
      message: "Forecast data generated successfully",
      count: savedForecasts.length,
      forecasts: savedForecasts,
    });
  } catch (err) {
    console.error("[System] Forecast error:", err.message);
    return res.status(500).json({ message: "Server error generating forecast" });
  }
});

module.exports = router;
