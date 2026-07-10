const express = require("express");
const router = express.Router();
const { getCanteenWallet, getOrganizationWallet } = require("../controllers/paymentController");
const { protect, canteenOwner, orgAdmin } = require("../middleware/auth");

// canteen_owner OR super_admin can see canteen wallet
router.get("/canteen/:canteenId", protect, getCanteenWallet);
router.get("/organization/:orgId", protect, orgAdmin, getOrganizationWallet);

module.exports = router;
