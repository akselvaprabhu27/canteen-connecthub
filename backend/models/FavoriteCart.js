const mongoose = require("mongoose");

const FavoriteCartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  canteenId: { type: String, required: true },
  canteenName: { type: String, required: true },
  orgId: { type: String, required: true },
  items: { type: Map, of: Number, default: {} },
  total: { type: Number, required: true },
  itemCount: { type: Number, required: true },
  savedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("FavoriteCart", FavoriteCartSchema);
