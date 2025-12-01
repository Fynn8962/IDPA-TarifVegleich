const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema(
  {
    name: String,
    minutesPerMonth: Number,
    smsPerMonth: Number,
    dataPerMonthMB: Number
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", ProfileSchema);
