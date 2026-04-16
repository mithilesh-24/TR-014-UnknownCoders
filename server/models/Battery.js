const mongoose = require("mongoose");

const batterySchema = new mongoose.Schema({
  currentLevel: {
    type: Number,
    default: 100,
    min: 0,
  },
  maxCapacity: {
    type: Number,
    default: 500,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Battery", batterySchema);
