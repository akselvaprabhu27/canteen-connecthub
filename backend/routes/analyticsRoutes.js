const express = require("express");
const router = express.Router();
const {
  getSuperAdminStats,
  getRevenueStats,
  getOrgAdminStats,
  getCanteenOwnerStats,
  getUserStats,
  getTopCanteens,
  getPopularItems,
  saveCommission
} = require("../controllers/analyticsController");
const { protect, admin, canteenOwner, orgAdmin } = require("../middleware/auth");

router.get("/super-admin", protect, admin, getSuperAdminStats);
router.get("/revenue", protect, admin, getRevenueStats);
router.get("/org-admin", protect, orgAdmin, getOrgAdminStats);
router.get("/canteen-owner", protect, canteenOwner, getCanteenOwnerStats);
router.get("/user", protect, getUserStats);
router.get("/top-canteens", protect, admin, getTopCanteens);
router.get("/popular-items", protect, admin, getPopularItems);
router.post("/commission", protect, admin, saveCommission);

module.exports = router;
