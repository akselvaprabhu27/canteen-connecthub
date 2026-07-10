const express = require("express");
const router = express.Router();
const { addReview, getReviewsByCanteen, getCanteenReviewStats, getReviewsByUser, addReplyToReview } = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");

router.post("/add", protect, addReview);
router.get("/stats/:canteenId", getCanteenReviewStats);
router.get("/user/:userId", protect, getReviewsByUser);
router.get("/:canteenId", getReviewsByCanteen);
router.put("/reply/:reviewId", protect, addReplyToReview);

module.exports = router;
