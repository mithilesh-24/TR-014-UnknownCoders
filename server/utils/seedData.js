const User = require("../models/User");
const House = require("../models/House");
const Consumption = require("../models/Consumption");
const Generation = require("../models/Generation");
const Battery = require("../models/Battery");
const { generateMockConsumption, generateMockGeneration } = require("./energyCalculations");

/**
 * Create the admin user if one does not already exist.
 */
async function seedAdmin() {
  try {
    const existing = await User.findOne({ email: "admin@smartenergy.com" });
    if (existing) {
      console.log("[Seed] Admin user already exists.");
      return existing;
    }

    const admin = await User.create({
      name: "Admin",
      email: "admin@smartenergy.com",
      password: "admin123",
      role: "admin",
      onboarded: true,
    });

    console.log("[Seed] Admin user created.");
    return admin;
  } catch (err) {
    console.error("[Seed] Error creating admin:", err.message);
  }
}

/**
 * Seed 10 sample houses with users and recent consumption data.
 */
async function seedHouses() {
  try {
    const houseCount = await House.countDocuments();
    if (houseCount >= 10) {
      console.log("[Seed] Houses already seeded.");
      return;
    }

    console.log("[Seed] Seeding sample houses...");

    const sampleHouses = [
      { name: "Rajesh Kumar", houseNumber: "H-101", address: "12 MG Road, Sector 5", residents: 4, hasSolar: true, solarCapacity: 3.5 },
      { name: "Priya Sharma", houseNumber: "H-102", address: "34 Nehru Nagar, Block A", residents: 3, hasSolar: false, solarCapacity: 0 },
      { name: "Amit Patel", houseNumber: "H-103", address: "56 Gandhi Chowk, Lane 2", residents: 5, hasSolar: true, solarCapacity: 5.0 },
      { name: "Sunita Devi", houseNumber: "H-104", address: "78 Subhash Marg", residents: 2, hasSolar: false, solarCapacity: 0 },
      { name: "Vikram Singh", houseNumber: "H-105", address: "90 Patel Colony, Phase 3", residents: 6, hasSolar: true, solarCapacity: 4.0 },
      { name: "Meera Joshi", houseNumber: "H-106", address: "11 Tagore Lane", residents: 3, hasSolar: false, solarCapacity: 0 },
      { name: "Arjun Reddy", houseNumber: "H-107", address: "22 Bose Street, Sector 9", residents: 4, hasSolar: true, solarCapacity: 2.5 },
      { name: "Kavita Nair", houseNumber: "H-108", address: "33 Sarojini Nagar", residents: 2, hasSolar: false, solarCapacity: 0 },
      { name: "Deepak Gupta", houseNumber: "H-109", address: "44 Ambedkar Road", residents: 5, hasSolar: false, solarCapacity: 0 },
      { name: "Ananya Das", houseNumber: "H-110", address: "55 Vivekananda Park", residents: 3, hasSolar: true, solarCapacity: 3.0 },
    ];

    for (const data of sampleHouses) {
      // Check if user or house already exists
      const existingHouse = await House.findOne({ houseNumber: data.houseNumber });
      if (existingHouse) continue;

      let user = await User.findOne({ email: `${data.name.toLowerCase().replace(/\s+/g, ".")}@example.com` });
      if (!user) {
        user = await User.create({
          name: data.name,
          email: `${data.name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
          password: "password123",
          role: "user",
          hasSolar: data.hasSolar,
          solarCapacity: data.solarCapacity,
          onboarded: true,
        });
      }

      const house = await House.create({
        houseNumber: data.houseNumber,
        userId: user._id,
        address: data.address,
        aadhaarNumber: `${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
        residents: data.residents,
        hasSolar: data.hasSolar,
        solarCapacity: data.solarCapacity,
      });

      // Seed 24 hours of consumption data for each house
      const now = new Date();
      const consumptionDocs = [];
      for (let h = 23; h >= 0; h--) {
        const timestamp = new Date(now);
        timestamp.setHours(now.getHours() - h, 0, 0, 0);
        consumptionDocs.push({
          houseId: house._id,
          timestamp,
          energyUsed: generateMockConsumption(timestamp.getHours()),
        });
      }
      await Consumption.insertMany(consumptionDocs);
    }

    console.log("[Seed] 10 sample houses with consumption data created.");
  } catch (err) {
    console.error("[Seed] Error seeding houses:", err.message);
  }
}

/**
 * Seed generation data for the last 24 hours.
 */
async function seedGeneration() {
  try {
    const count = await Generation.countDocuments();
    if (count >= 24) {
      console.log("[Seed] Generation data already seeded.");
      return;
    }

    const now = new Date();
    const docs = [];
    for (let h = 23; h >= 0; h--) {
      const timestamp = new Date(now);
      timestamp.setHours(now.getHours() - h, 0, 0, 0);
      const gen = generateMockGeneration(timestamp.getHours());
      docs.push({ timestamp, ...gen });
    }

    await Generation.insertMany(docs);
    console.log("[Seed] 24 hours of generation data created.");
  } catch (err) {
    console.error("[Seed] Error seeding generation:", err.message);
  }
}

/**
 * Initialize the battery document if it does not exist.
 */
async function initBattery() {
  try {
    const battery = await Battery.findOne();
    if (battery) {
      console.log("[Seed] Battery already initialized.");
      return;
    }

    await Battery.create({
      currentLevel: 250,
      maxCapacity: 500,
      lastUpdated: new Date(),
    });

    console.log("[Seed] Battery initialized at 250/500 kWh.");
  } catch (err) {
    console.error("[Seed] Error initializing battery:", err.message);
  }
}

/**
 * Run all seed functions.
 */
async function runAllSeeds() {
  console.log("[Seed] Starting data seeding...");
  await seedAdmin();
  await seedHouses();
  await seedGeneration();
  await initBattery();
  console.log("[Seed] Data seeding complete.");
}

module.exports = { seedAdmin, seedHouses, seedGeneration, initBattery, runAllSeeds };
