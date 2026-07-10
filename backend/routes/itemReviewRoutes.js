const express = require("express");
const router = express.Router();
const { 
    addOrUpdateItemReview, 
    getItemReviews, 
    getCanteenItemRatings,
    checkReviewEligibility,
    getUserItemReviews
} = require("../controllers/itemReviewController");
const { protect } = require("../middleware/auth");

router.post("/add", protect, addOrUpdateItemReview);
router.get("/item/:foodItemId", getItemReviews);
router.get("/canteen/:canteenId", getCanteenItemRatings);
router.get("/user/:userId", protect, getUserItemReviews);
router.get("/eligibility/:userId/:foodItemId", protect, checkReviewEligibility);

module.exports = router;

