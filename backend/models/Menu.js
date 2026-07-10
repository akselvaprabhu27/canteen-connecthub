const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
  canteenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
  itemName: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String }, // e.g., Beverages, Snacks, Main Course
  quantity: { type: String }, // e.g., 1 Plate, 250ml, 1 piece
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Menu', menuSchema);
