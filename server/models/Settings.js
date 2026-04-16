const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  gridName: { type: String, default: "Smart Energy Grid" },
  location: { type: String, default: "London" },
  maxHouses: { type: Number, default: 55 },
  batteryCapacity: { type: Number, default: 500 },
  alertThresholdCritical: { type: Number, default: 30 },
  alertThresholdWarning: { type: Number, default: 10 },
  mlServiceUrl: { type: String, default: "http://localhost:5001" },
  weatherCity: { type: String, default: "London" },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Settings", settingsSchema);
