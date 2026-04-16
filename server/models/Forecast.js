const mongoose = require("mongoose");

const forecastSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true,
  },
  predictedSolar: {
    type: Number,
    required: true,
    min: 0,
  },
  predictedWind: {
    type: Number,
    required: true,
    min: 0,
  },
  predictedDemand: {
    type: Number,
    required: true,
    min: 0,
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

forecastSchema.index({ timestamp: -1 });

module.exports = mongoose.model("Forecast", forecastSchema);
