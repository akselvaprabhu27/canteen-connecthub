const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  canteenId: { type: mongoose.Schema.Types.ObjectId, ref: "Canteen", required: true },
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  name: { type: String, required: true }, // Canteen Name
  items: { 
    type: Map, 
    of: Number, // menuId -> quantity
    default: {} 
  }
}, { timestamps: true });

// Ensure one cart per user per canteen
CartSchema.index({ userId: 1, canteenId: 1 }, { unique: true });

module.exports = mongoose.model("Cart", CartSchema);
