const express = require("express");
const router = express.Router();
const { createOrder, getOrdersByUser, getOrdersByCanteen, getOrdersByOrg, updateOrderStatus } = require("../controllers/orderController");
const { protect, canteenOwner, orgAdmin } = require("../middleware/auth");

router.post("/create", protect, createOrder);
router.get("/user/:userId", protect, getOrdersByUser);
router.get("/canteen/:canteenId", protect, getOrdersByCanteen);
router.get("/org/:orgId", protect, orgAdmin, getOrdersByOrg);
router.put("/updateStatus/:id", protect, canteenOwner, updateOrderStatus);

module.exports = router;
