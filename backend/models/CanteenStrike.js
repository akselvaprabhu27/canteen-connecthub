const mongoose = require("mongoose");

const canteenStrikeSchema = new mongoose.Schema(
  {
    canteenId: { type: mongoose.Schema.Types.ObjectId, ref: "Canteen", required: true },
    strikeCount: { type: Number, default: 0 },
    reason: { type: String, required: true },
    severity: { type: String, enum: ["High", "Critical"] },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodReport" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CanteenStrike", canteenStrikeSchema);
