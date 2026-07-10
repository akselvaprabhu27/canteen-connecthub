const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  canteenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  canteenResponse: { type: String },
  complaintFlag: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Allow multiple reviews across orders


module.exports = mongoose.model('Review', reviewSchema);
