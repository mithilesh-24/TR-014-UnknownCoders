const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["shortage", "battery_low", "overconsumption", "fairness"],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  houseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "House",
    default: null,
  },
  severity: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium",
  },
  resolved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

alertSchema.index({ resolved: 1, createdAt: -1 });

module.exports = mongoose.model("Alert", alertSchema);
