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
const { calculateFairnessScore, generateMockGeneration } = require("../utils/energyCalculations");

// All routes require auth + admin
router.use(auth, adminOnly);

// ---------------------------------------------------------------------------
// GET /api/admin/overview
// ---------------------------------------------------------------------------
router.get("/overview", async (req, res) => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Total generation in last 24h
    const generationAgg = await Generation.aggregate([
      { $match: { timestamp: { $gte: twentyFourHoursAgo } } },
      { $group: { _id: null, total: { $sum: "$totalEnergy" } } },
    ]);
    const totalGeneration = generationAgg.length > 0 ? generationAgg[0].total : 0;

    // Total consumption in last 24h
    const consumptionAgg = await Consumption.aggregate([
      { $match: { timestamp: { $gte: twentyFourHoursAgo } } },
      { $group: { _id: null, total: { $sum: "$energyUsed" } } },
    ]);
    const totalConsumption = consumptionAgg.length > 0 ? consumptionAgg[0].total : 0;

    // Supply vs demand ratio
    const supplyDemandRatio =
      totalConsumption > 0
        ? Math.round((totalGeneration / totalConsumption) * 100) / 100
        : totalGeneration > 0
          ? Infinity
          : 1;

    // Battery
    const battery = await Battery.findOne();

    // House count
    const houseCount = await House.countDocuments();

    // Active alerts
    const activeAlerts = await Alert.countDocuments({ resolved: false });

    const batteryPercent = battery
      ? Math.round((battery.currentLevel / battery.maxCapacity) * 100)
      : 0;

    // Hourly generation for last 24h
    const hourlyGeneration = await Generation.aggregate([
      { $match: { timestamp: { $gte: twentyFourHoursAgo } } },
      {
        $group: {
          _id: { $hour: "$timestamp" },
          solar: { $sum: "$solarEnergy" },
          wind: { $sum: "$windEnergy" },
          total: { $sum: "$totalEnergy" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const hourlyGenData = hourlyGeneration.map((h) => ({
      hour: `${h._id}:00`,
      solar: Math.round(h.solar * 100) / 100,
      wind: Math.round(h.wind * 100) / 100,
      total: Math.round(h.total * 100) / 100,
    }));

    // Hourly consumption for last 24h
    const hourlyConsumption = await Consumption.aggregate([
      { $match: { timestamp: { $gte: twentyFourHoursAgo } } },
      {
        $group: {
          _id: { $hour: "$timestamp" },
          consumption: { $sum: "$energyUsed" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const hourlyConData = hourlyConsumption.map((h) => ({
      hour: `${h._id}:00`,
      consumption: Math.round(h.consumption * 100) / 100,
    }));

    return res.json({
      totalGeneration: Math.round(totalGeneration * 100) / 100,
      totalConsumption: Math.round(totalConsumption * 100) / 100,
      supplyDemandRatio,
      batteryLevel: batteryPercent,
      batteryMax: battery ? battery.maxCapacity : 500,
      houseCount,
      activeAlerts,
      hourlyGeneration: hourlyGenData,
      hourlyConsumption: hourlyConData,
    });
  } catch (err) {
    console.error("[Admin] Overview error:", err.message);
    return res.status(500).json({ message: "Server error fetching overview" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/admin/houses
// ---------------------------------------------------------------------------
router.get("/houses", async (req, res) => {
  try {
    const { period } = req.query; // day | week | month
    const now = new Date();
    let since;

    switch (period) {
      case "week":
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "day":
      default:
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
    }

    const houses = await House.find().populate("userId", "name email role hasSolar solarCapacity onboarded").lean();

    // Attach latest consumption for each house
    const housesWithConsumption = await Promise.all(
      houses.map(async (house) => {
        const latestConsumption = await Consumption.findOne({ houseId: house._id })
          .sort({ timestamp: -1 })
          .lean();

        const totalConsumption = await Consumption.aggregate([
          { $match: { houseId: house._id, timestamp: { $gte: since } } },
          { $group: { _id: null, total: { $sum: "$energyUsed" } } },
        ]);

        return {
          ...house,
          user: house.userId || null,
          latestConsumption: latestConsumption || null,
          totalConsumption: totalConsumption.length > 0 ? Math.round(totalConsumption[0].total * 100) / 100 : 0,
        };
      })
    );

    return res.json({ houses: housesWithConsumption });
  } catch (err) {
    console.error("[Admin] Houses error:", err.message);
    return res.status(500).json({ message: "Server error fetching houses" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/admin/houses/:id
// ---------------------------------------------------------------------------
router.get("/houses/:id", async (req, res) => {
  try {
    const house = await House.findById(req.params.id)
      .populate("userId", "name email role hasSolar solarCapacity onboarded")
      .lean();

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    const consumptionHistory = await Consumption.find({ houseId: house._id })
      .sort({ timestamp: -1 })
      .limit(168) // up to 7 days of hourly data
      .lean();

    const distributionHistory = await Distribution.find({ houseId: house._id })
      .sort({ timestamp: -1 })
      .limit(168)
      .lean();

    return res.json({
      ...house,
      user: house.userId || null,
      consumptionHistory,
      distributionHistory,
    });
  } catch (err) {
    console.error("[Admin] House detail error:", err.message);
    return res.status(500).json({ message: "Server error fetching house details" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/admin/prediction
// ---------------------------------------------------------------------------
router.get("/prediction", async (req, res) => {
  try {
    let forecasts = await Forecast.find()
      .sort({ timestamp: -1 })
      .limit(24)
      .lean();

    // If no forecasts exist, generate mock data
    if (forecasts.length === 0) {
      const now = new Date();
      const docs = [];
      for (let i = 0; i < 24; i++) {
        const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000);
        const hour = futureTime.getHours();
        const gen = generateMockGeneration(hour);

        // Demand peaks in evening
        let demand = 15 + Math.random() * 5;
        if (hour >= 17 && hour <= 22) demand = 35 + Math.random() * 15;
        else if (hour >= 6 && hour <= 9) demand = 25 + Math.random() * 10;
        else if (hour >= 0 && hour <= 5) demand = 8 + Math.random() * 4;

        docs.push({
          timestamp: futureTime,
          predictedSolar: gen.solarEnergy,
          predictedWind: gen.windEnergy,
          predictedDemand: Math.round(demand * 100) / 100,
          confidence: Math.floor(70 + Math.random() * 25),
        });
      }

      forecasts = await Forecast.insertMany(docs);
    }

    return res.json(forecasts);
  } catch (err) {
    console.error("[Admin] Prediction error:", err.message);
    return res.status(500).json({ message: "Server error fetching predictions" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/admin/fairness
// ---------------------------------------------------------------------------
router.get("/fairness", async (req, res) => {
  try {
    const houses = await House.find().populate("userId", "name email").lean();

    const fairnessData = await Promise.all(
      houses.map(async (house) => {
        const distributions = await Distribution.find({ houseId: house._id }).lean();
        const cutCount = distributions.filter((d) => d.cutFlag).length;
        const totalCutAmount = distributions.reduce((sum, d) => sum + (d.cutAmount || 0), 0);

        return {
          houseId: house._id,
          houseNumber: house.houseNumber,
          ownerName: house.userId ? house.userId.name : "Unknown",
          residents: house.residents,
          hasSolar: house.hasSolar,
          cutCount,
          totalCutAmount: Math.round(totalCutAmount * 100) / 100,
        };
      })
    );

    // Sort by most affected (highest total cut)
    fairnessData.sort((a, b) => b.totalCutAmount - a.totalCutAmount);

    // Std deviation
    const allDistributions = await Distribution.find().lean();
    const stdDeviation = calculateFairnessScore(allDistributions);

    // Active alerts
    const activeAlerts = await Alert.find({ resolved: false })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.json({
      houses: fairnessData,
      stdDeviation: Math.round(stdDeviation * 1000) / 1000,
      activeAlerts,
    });
  } catch (err) {
    console.error("[Admin] Fairness error:", err.message);
    return res.status(500).json({ message: "Server error calculating fairness" });
  }
});

module.exports = router;
