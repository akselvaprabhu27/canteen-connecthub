const express = require("express");
const router = express.Router();
const { getCarts, updateCart, deleteCart } = require("../controllers/cartController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getCarts);
router.post("/update", protect, updateCart);
router.delete("/:canteenId", protect, deleteCart);

module.exports = router;
