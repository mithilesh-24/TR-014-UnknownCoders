const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const House = require("../models/House");
const Consumption = require("../models/Consumption");
const Distribution = require("../models/Distribution");
const Generation = require("../models/Generation");
const Forecast = require("../models/Forecast");
const User = require("../models/User");
const { generateMockConsumption, generateMockGeneration } = require("../utils/energyCalculations");

// All routes require auth
router.use(auth);

// ---------------------------------------------------------------------------
// GET /api/user/dashboard
// ---------------------------------------------------------------------------
router.get("/dashboard", async (req, res) => {
  try {
    const house = await House.findOne({ userId: req.user._id }).lean();
    if (!house) {
      return res.json({
        house: null,
        todayConsumption: 0,
        status: "no_house",
        message: "Please complete onboarding first.",
      });
    }

    // Today's consumption
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const consumptionAgg = await Consumption.aggregate([
      { $match: { houseId: house._id, timestamp: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: "$energyUsed" } } },
    ]);
    const todayConsumption = consumptionAgg.length > 0 ? Math.round(consumptionAgg[0].total * 100) / 100 : 0;

    // Latest distribution to determine status
    const latestDistribution = await Distribution.findOne({ houseId: house._id })
      .sort({ timestamp: -1 })
      .lean();

    let status = "supply_ok";
    if (latestDistribution && latestDistribution.cutFlag) {
      status = "shortage";
    }

    // Hourly consumption today
    const hourlyConsumption = await Consumption.find({
      houseId: house._id,
      timestamp: { $gte: startOfDay },
    })
      .sort({ timestamp: 1 })
      .lean();

    return res.json({
      house,
      todayConsumption,
      status,
      latestDistribution: latestDistribution || null,
      hourlyConsumption,
    });
  } catch (err) {
    console.error("[User] Dashboard error:", err.message);
    return res.status(500).json({ message: "Server error fetching dashboard" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/user/forecast
// ---------------------------------------------------------------------------
router.get("/forecast", async (req, res) => {
  try {
    const house = await House.findOne({ userId: req.user._id }).lean();
    if (!house) {
      return res.status(404).json({ message: "No house found. Please complete onboarding." });
    }

    const now = new Date();

    // Get next 5 hours of forecast
    let forecasts = await Forecast.find({ timestamp: { $gte: now } })
      .sort({ timestamp: 1 })
      .limit(5)
      .lean();

    // If not enough forecast data, generate mock
    if (forecasts.length < 5) {
      const mockForecasts = [];
      for (let i = forecasts.length; i < 5; i++) {
        const futureTime = new Date(now.getTime() + (i + 1) * 60 * 60 * 1000);
        const hour = futureTime.getHours();
        const gen = generateMockGeneration(hour);
        const demand = generateMockConsumption(hour) * 10;

        mockForecasts.push({
          timestamp: futureTime,
          predictedSolar: gen.solarEnergy,
          predictedWind: gen.windEnergy,
          predictedDemand: Math.round(demand * 100) / 100,
          confidence: Math.floor(70 + Math.random() * 25),
        });
      }

      if (mockForecasts.length > 0) {
        const saved = await Forecast.insertMany(mockForecasts);
        forecasts = [...forecasts, ...saved];
      }
    }

    // Calculate allocation prediction per house (simple proportional)
    const houseCount = await House.countDocuments();
    const allocations = forecasts.map((f) => {
      const totalSupply = f.predictedSolar + f.predictedWind;
      const perHouseShare = houseCount > 0 ? totalSupply / houseCount : totalSupply;
      const perHouseDemand = houseCount > 0 ? f.predictedDemand / houseCount : f.predictedDemand;

      return {
        timestamp: f.timestamp,
        predictedAllocation: Math.round(Math.min(perHouseShare, perHouseDemand) * 100) / 100,
        predictedDemand: Math.round(perHouseDemand * 100) / 100,
        totalSupply: Math.round(totalSupply * 100) / 100,
        confidence: f.confidence,
        status: perHouseShare >= perHouseDemand ? "sufficient" : "shortage_expected",
      };
    });

    return res.json({ forecasts: allocations });
  } catch (err) {
    console.error("[User] Forecast error:", err.message);
    return res.status(500).json({ message: "Server error fetching forecast" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/user/solar
// ---------------------------------------------------------------------------
router.get("/solar", async (req, res) => {
  try {
    const house = await House.findOne({ userId: req.user._id }).lean();
    if (!house) {
      return res.status(404).json({ message: "No house found. Please complete onboarding." });
    }

    if (!house.hasSolar) {
      return res.json({
        hasSolar: false,
        message: "This house does not have solar panels installed.",
        solarData: [],
      });
    }

    // Get last 24h of generation data and calculate house's solar contribution
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const generationData = await Generation.find({ timestamp: { $gte: twentyFourHoursAgo } })
      .sort({ timestamp: 1 })
      .lean();

    // Proportion of solar based on house's solar capacity
    const totalSolarCapacity = await House.aggregate([
      { $match: { hasSolar: true } },
      { $group: { _id: null, total: { $sum: "$solarCapacity" } } },
    ]);
    const totalCapacity = totalSolarCapacity.length > 0 ? totalSolarCapacity[0].total : house.solarCapacity;
    const proportion = totalCapacity > 0 ? house.solarCapacity / totalCapacity : 0;

    const solarData = generationData.map((g) => ({
      timestamp: g.timestamp,
      totalSolarGeneration: Math.round(g.solarEnergy * 100) / 100,
      yourContribution: Math.round(g.solarEnergy * proportion * 100) / 100,
      totalGeneration: g.totalEnergy,
    }));

    return res.json({
      hasSolar: true,
      solarCapacity: house.solarCapacity,
      proportion: Math.round(proportion * 10000) / 100, // percentage
      solarData,
    });
  } catch (err) {
    console.error("[User] Solar error:", err.message);
    return res.status(500).json({ message: "Server error fetching solar data" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/user/insights
// ---------------------------------------------------------------------------
router.get("/insights", async (req, res) => {
  try {
    const house = await House.findOne({ userId: req.user._id }).lean();
    if (!house) {
      return res.status(404).json({ message: "No house found. Please complete onboarding." });
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    // Today's consumption
    const todayAgg = await Consumption.aggregate([
      { $match: { houseId: house._id, timestamp: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: "$energyUsed" } } },
    ]);
    const todayTotal = todayAgg.length > 0 ? todayAgg[0].total : 0;

    // Yesterday's consumption
    const yesterdayAgg = await Consumption.aggregate([
      { $match: { houseId: house._id, timestamp: { $gte: startOfYesterday, $lt: startOfToday } } },
      { $group: { _id: null, total: { $sum: "$energyUsed" } } },
    ]);
    const yesterdayTotal = yesterdayAgg.length > 0 ? yesterdayAgg[0].total : 0;

    // Comparison
    const changePercent =
      yesterdayTotal > 0
        ? Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 10000) / 100
        : 0;

    // Weekly trends (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyTrends = await Consumption.aggregate([
      { $match: { houseId: house._id, timestamp: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          total: { $sum: "$energyUsed" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Generate suggestions
    const suggestions = [];

    if (changePercent > 10) {
      suggestions.push("Your consumption is higher than yesterday. Consider turning off unused appliances.");
    }
    if (todayTotal > 20) {
      suggestions.push("High daily usage detected. Check for energy-intensive appliances running during peak hours.");
    }
    if (!house.hasSolar) {
      suggestions.push("Installing solar panels can reduce your grid dependency and lower electricity costs.");
    }
    if (house.residents > 4) {
      suggestions.push("With a larger household, scheduling heavy appliance usage during off-peak hours (10am-4pm) can help.");
    }
    if (suggestions.length === 0) {
      suggestions.push("Great job! Your energy consumption is within optimal range.");
    }

    return res.json({
      todayConsumption: Math.round(todayTotal * 100) / 100,
      yesterdayConsumption: Math.round(yesterdayTotal * 100) / 100,
      changePercent,
      weeklyTrends,
      suggestions,
    });
  } catch (err) {
    console.error("[User] Insights error:", err.message);
    return res.status(500).json({ message: "Server error fetching insights" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/user/onboard
// ---------------------------------------------------------------------------
router.post("/onboard", async (req, res) => {
  try {
    const { houseNumber, address, aadhaarNumber, ownerProof, residents, hasSolar, solarCapacity } = req.body;

    if (!houseNumber || !address || !aadhaarNumber || !residents) {
      return res.status(400).json({ message: "houseNumber, address, aadhaarNumber, and residents are required" });
    }

    // Check if user already has a house
    const existingHouse = await House.findOne({ userId: req.user._id });
    if (existingHouse) {
      return res.status(400).json({ message: "You already have a registered house" });
    }

    // Check if house number is taken
    const duplicateHouse = await House.findOne({ houseNumber });
    if (duplicateHouse) {
      return res.status(400).json({ message: "This house number is already registered" });
    }

    const house = await House.create({
      houseNumber,
      userId: req.user._id,
      address,
      aadhaarNumber,
      ownerProof: ownerProof || "",
      residents,
      hasSolar: hasSolar || false,
      solarCapacity: solarCapacity || 0,
    });

    // Update user onboarding status
    await User.findByIdAndUpdate(req.user._id, {
      onboarded: true,
      hasSolar: hasSolar || false,
      solarCapacity: solarCapacity || 0,
    });

    return res.status(201).json({
      message: "Onboarding complete",
      house,
    });
  } catch (err) {
    console.error("[User] Onboard error:", err.message);
    return res.status(500).json({ message: "Server error during onboarding" });
  }
});

module.exports = router;
