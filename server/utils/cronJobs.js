const cron = require("node-cron");
const House = require("../models/House");
const Consumption = require("../models/Consumption");
const Generation = require("../models/Generation");
const Distribution = require("../models/Distribution");
const Battery = require("../models/Battery");
const Alert = require("../models/Alert");
const Forecast = require("../models/Forecast");
const { generateMockConsumption, generateMockGeneration } = require("./energyCalculations");

/**
 * Run the hourly energy distribution cycle:
 *  1. Generate mock forecast & generation data
 *  2. Record consumption for every house
 *  3. Run distribution algorithm
 */
async function runHourlyDistribution() {
  try {
    const now = new Date();
    const hour = now.getHours();
    console.log(`[Cron] Running hourly distribution at ${now.toISOString()}`);

    // 1. Generate and save generation data
    const gen = generateMockGeneration(hour);
    await Generation.create({ timestamp: now, ...gen });

    // 2. Generate and save forecast
    for (let i = 1; i <= 5; i++) {
      const futureHour = (hour + i) % 24;
      const futureGen = generateMockGeneration(futureHour);
      const futureDemand = generateMockConsumption(futureHour) * 10; // multiply by approx number of houses
      await Forecast.create({
        timestamp: new Date(now.getTime() + i * 60 * 60 * 1000),
        predictedSolar: futureGen.solarEnergy,
        predictedWind: futureGen.windEnergy,
        predictedDemand: Math.round(futureDemand * 100) / 100,
        confidence: Math.floor(70 + Math.random() * 25),
      });
    }

    // 3. Record consumption for each house
    const houses = await House.find();
    if (houses.length === 0) {
      console.log("[Cron] No houses found, skipping distribution.");
      return;
    }

    const consumptionRecords = [];
    for (const house of houses) {
      const energyUsed = generateMockConsumption(hour);
      consumptionRecords.push({
        houseId: house._id,
        timestamp: now,
        energyUsed,
      });
    }
    await Consumption.insertMany(consumptionRecords);

    // 4. Run distribution
    const totalSupply = gen.totalEnergy;
    const battery = await Battery.findOne();
    const availableEnergy = totalSupply + (battery ? battery.currentLevel : 0);

    const totalDemand = consumptionRecords.reduce((sum, c) => sum + c.energyUsed, 0);

    const distributionDocs = [];

    if (availableEnergy >= totalDemand) {
      // Enough supply - allocate fully
      for (const record of consumptionRecords) {
        distributionDocs.push({
          houseId: record.houseId,
          timestamp: now,
          allocatedEnergy: record.energyUsed,
          cutFlag: false,
          cutAmount: 0,
        });
      }

      // Store excess in battery
      const excess = availableEnergy - totalDemand;
      if (battery) {
        battery.currentLevel = Math.min(battery.maxCapacity, battery.currentLevel + excess - (battery ? battery.currentLevel : 0));
        // Actually just set it to: previous level + supply surplus
        battery.currentLevel = Math.min(
          battery.maxCapacity,
          (battery.currentLevel || 0) + (totalSupply - totalDemand)
        );
        if (battery.currentLevel < 0) battery.currentLevel = 0;
        battery.lastUpdated = now;
        await battery.save();
      }
    } else {
      // Shortage - cut proportionally, highest consumers first
      const sorted = [...consumptionRecords].sort((a, b) => b.energyUsed - a.energyUsed);
      let remainingEnergy = availableEnergy;

      // Use all battery reserves
      if (battery) {
        battery.currentLevel = 0;
        battery.lastUpdated = now;
        await battery.save();
      }

      const ratio = availableEnergy / totalDemand;

      for (const record of sorted) {
        const allocated = Math.round(record.energyUsed * ratio * 100) / 100;
        const cut = Math.round((record.energyUsed - allocated) * 100) / 100;
        distributionDocs.push({
          houseId: record.houseId,
          timestamp: now,
          allocatedEnergy: allocated,
          cutFlag: cut > 0,
          cutAmount: cut,
        });
        remainingEnergy -= allocated;
      }

      // Create shortage alert
      await Alert.create({
        type: "shortage",
        message: `Energy shortage detected. Supply: ${availableEnergy.toFixed(2)} kWh, Demand: ${totalDemand.toFixed(2)} kWh. Deficit: ${(totalDemand - availableEnergy).toFixed(2)} kWh.`,
        severity: ratio < 0.5 ? "critical" : ratio < 0.75 ? "high" : "medium",
      });

      // Battery low alert
      if (battery && battery.currentLevel < battery.maxCapacity * 0.1) {
        await Alert.create({
          type: "battery_low",
          message: `Battery level critically low: ${battery.currentLevel.toFixed(2)} / ${battery.maxCapacity} kWh.`,
          severity: "high",
        });
      }
    }

    await Distribution.insertMany(distributionDocs);
    console.log(`[Cron] Distribution complete. Supply: ${totalSupply.toFixed(2)}, Demand: ${totalDemand.toFixed(2)}, Houses: ${houses.length}`);
  } catch (err) {
    console.error("[Cron] Error in hourly distribution:", err.message);
  }
}

/**
 * Start the cron schedule: every hour at minute 0.
 */
function startCronJobs() {
  cron.schedule("0 * * * *", async () => {
    await runHourlyDistribution();
  });
  console.log("[Cron] Hourly distribution cron job scheduled.");
}

module.exports = { startCronJobs, runHourlyDistribution };
