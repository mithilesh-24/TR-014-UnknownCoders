const mongoose = require("mongoose");

const generationSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  solarEnergy: {
    type: Number,
    required: true,
    min: 0,
  },
  windEnergy: {
    type: Number,
    required: true,
    min: 0,
  },
  totalEnergy: {
    type: Number,
    required: true,
    min: 0,
  },
});

generationSchema.index({ timestamp: -1 });

module.exports = mongoose.model("Generation", generationSchema);
