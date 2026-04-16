const mongoose = require("mongoose");

const distributionSchema = new mongoose.Schema({
  houseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "House",
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  allocatedEnergy: {
    type: Number,
    required: true,
    min: 0,
  },
  cutFlag: {
    type: Boolean,
    default: false,
  },
  cutAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
});

distributionSchema.index({ houseId: 1, timestamp: -1 });

module.exports = mongoose.model("Distribution", distributionSchema);
