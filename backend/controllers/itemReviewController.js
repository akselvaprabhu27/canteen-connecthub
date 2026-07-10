const mongoose = require("mongoose");
const FoodItemReview = require("../models/FoodItemReview");
const Order = require("../models/Order");
const Menu = require("../models/Menu");

// POST /api/item-reviews/add  — add or update an item review (one per order per item)
const addOrUpdateItemReview = async (req, res) => {
  try {
    const { userId, foodItemId, rating, comment, orderId } = req.body;

    if (!userId || !foodItemId || !rating || !orderId) {
      return res.status(400).json({ message: "userId, foodItemId, rating and orderId are required." });
    }

    // Verify order exists, belongs to user, is completed, and contains the item
    const order = await Order.findOne({
      _id: orderId,
      userId: userId,
      status: 'completed',
      'items.menuId': foodItemId
    });

    if (!order) {
      return res.status(403).json({ message: "You can only review items from your completed orders." });
    }

    // Upsert: one review per user per item per order
    const review = await FoodItemReview.findOneAndUpdate(
      { userId, foodItemId, orderId },
      {
        rating,
        comment,
        canteenId: order.canteenId,
        organizationId: order.organizationId,
        createdAt: Date.now()
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ message: "Review saved successfully", review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/item-reviews/item/:foodItemId  — reviews + breakdown for a single item
const getItemReviews = async (req, res) => {
  try {
    const { foodItemId } = req.params;
    const reviews = await FoodItemReview.find({ foodItemId })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    // Aggregate breakdown
    const stats = await FoodItemReview.aggregate([
      { $match: { foodItemId: new mongoose.Types.ObjectId(foodItemId) } },
      { $group: { _id: "$rating", count: { $sum: 1 } } }
    ]);

    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats.forEach(s => { breakdown[s._id] = s.count; });

    res.json({ reviews, breakdown });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/item-reviews/canteen/:canteenId  — avg rating + total for every item in a canteen
const getCanteenItemRatings = async (req, res) => {
  try {
    const { canteenId } = req.params;

    const stats = await FoodItemReview.aggregate([
      { $match: { canteenId: new mongoose.Types.ObjectId(canteenId) } },
      {
        $group: {
          _id: "$foodItemId",
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    // Round averageRating to 1 decimal
    const result = stats.map(s => ({
      _id: s._id,
      averageRating: Number(s.averageRating.toFixed(1)),
      totalRatings: s.totalRatings
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/item-reviews/eligibility/:userId/:foodItemId
const checkReviewEligibility = async (req, res) => {
  try {
    const { userId, foodItemId } = req.params;

    // Find completed orders for this user containing this item
    const orders = await Order.find({
      userId,
      status: 'completed',
      'items.menuId': foodItemId
    }).sort({ createdAt: -1 });

    if (orders.length === 0) {
      return res.json({ canReview: false, message: "You need to order and complete this item before reviewing it." });
    }

    // Find orders that haven't been reviewed yet
    const reviewedOrders = await FoodItemReview.find({
      userId,
      foodItemId,
      orderId: { $in: orders.map(o => o._id) }
    }).select('orderId');

    const reviewedOrderIds = reviewedOrders.map(r => r.orderId.toString());
    const unreviewedOrder = orders.find(o => !reviewedOrderIds.includes(o._id.toString()));

    if (unreviewedOrder) {
      return res.json({
        canReview: true,
        orderId: unreviewedOrder._id,
        isUpdate: false
      });
    }

    // All orders reviewed — allow editing the most recent review
    const latestOrder = orders[0];
    const existingReview = await FoodItemReview.findOne({ userId, foodItemId, orderId: latestOrder._id });

    return res.json({
      canReview: true,
      orderId: latestOrder._id,
      isUpdate: true,
      existingReview
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/item-reviews/user/:userId  — all item reviews by a user
const getUserItemReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = await FoodItemReview.find({ userId })
      .populate("foodItemId", "itemName price")
      .populate("canteenId", "canteenName")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addOrUpdateItemReview,
  getItemReviews,
  getCanteenItemRatings,
  checkReviewEligibility,
  getUserItemReviews
};

