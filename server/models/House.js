const mongoose = require("mongoose");

const houseSchema = new mongoose.Schema({
  houseNumber: {
    type: String,
    required: [true, "House number is required"],
    unique: true,
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  address: {
    type: String,
    required: [true, "Address is required"],
    trim: true,
  },
  aadhaarNumber: {
    type: String,
    required: [true, "Aadhaar number is required"],
    trim: true,
  },
  ownerProof: {
    type: String,
    default: "",
  },
  residents: {
    type: Number,
    required: true,
    min: 1,
  },
  solarCapacity: {
    type: Number,
    default: 0,
  },
  hasSolar: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("House", houseSchema);
