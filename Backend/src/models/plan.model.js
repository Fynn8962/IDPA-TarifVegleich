const mongoose = require("mongoose");

const PlanSchema = new mongoose.Schema(
  {
    name: String,
    provider: String,
    priceBase: Number,
    includedMinutes: Number,
    includedSMS: Number,
    includedDataMB: Number,
    pricePerMinute: Number,
    pricePerSMS: Number,
    pricePerMB: Number
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", PlanSchema);
