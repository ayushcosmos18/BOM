const mongoose = require("mongoose");

const ProductionLogSchema = new mongoose.Schema(
  {
    productLine: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    stage: {
      type: String,
      required: true,
      enum: ["Assembly", "Calibration (QA)", "Rework", "Packaging"],
    },
    hoursLogged: {
      type: Number,
      required: true,
    },
    // type determines if the time spent was 'ValueAdd' or 'Waste'
    type: {
      type: String,
      required: true,
      enum: ["ValueAdd", "Waste"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductionLog", ProductionLogSchema);