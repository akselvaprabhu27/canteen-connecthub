const mongoose = require("mongoose");

const foodItemReviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true },
  canteenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Ensure one review per user per item per order
foodItemReviewSchema.index({ userId: 1, foodItemId: 1, orderId: 1 }, { unique: true });

module.exports = mongoose.model('FoodItemReview', foodItemReviewSchema);

