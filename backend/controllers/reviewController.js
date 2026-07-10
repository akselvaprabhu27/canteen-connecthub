const Review = require("../models/Review");
const mongoose = require("mongoose");

// POST /api/reviews/add  — one review per user per order per canteen
const addReview = async (req, res) => {
  try {
    const { userId, canteenId, orderId, rating, comment, complaintFlag } = req.body;

    if (!userId || !canteenId || !rating) {
      return res.status(400).json({ message: "userId, canteenId and rating are required." });
    }

    // Validate ObjectIds to prevent CastError
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid User ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(canteenId)) {
        return res.status(400).json({ message: "Invalid Canteen ID" });
    }
    
    let validOrderId = null;
    if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
        validOrderId = orderId;
    }

    // Always create a new review for history
    const review = await Review.create({
      userId,
      canteenId,
      orderId: validOrderId,
      rating,
      comment,
      complaintFlag: complaintFlag || false,
      createdAt: Date.now()
    });

    res.status(200).json(review);
  } catch (error) {
    console.error("ADD_REVIEW_ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reviews/:canteenId  — all reviews for a canteen, newest first
const getReviewsByCanteen = async (req, res) => {
  try {
    const reviews = await Review.find({ canteenId: req.params.canteenId })
      .populate("userId", "name")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reviews/stats/:canteenId  — average rating + breakdown
const getCanteenReviewStats = async (req, res) => {
  try {
    const { canteenId } = req.params;
    const reviews = await Review.find({ canteenId });
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
      : 0;

    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1; });

    res.json({ avgRating, totalReviews, breakdown });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reviews/user/:userId  — all canteen reviews by this user
const getReviewsByUser = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.params.userId })
      .populate({
        path: "canteenId",
        select: "canteenName organizationId",
        populate: { path: "organizationId", select: "name" }
      })
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/reviews/reply/:reviewId  — canteen owner reply
const addReplyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { canteenResponse } = req.body;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { canteenResponse },
      { new: true }
    );

    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addReview,
  getReviewsByCanteen,
  getCanteenReviewStats,
  getReviewsByUser,
  addReplyToReview
};
