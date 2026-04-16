const mongoose = require("mongoose");

const consumptionSchema = new mongoose.Schema({
  houseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "House",
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  energyUsed: {
    type: Number,
    required: true,
    min: 0,
  },
});

consumptionSchema.index({ houseId: 1, timestamp: -1 });

module.exports = mongoose.model("Consumption", consumptionSchema);
