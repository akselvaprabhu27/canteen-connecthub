const express = require("express");
const router = express.Router();
const { addMenuItem, getMenuByCanteen, updateMenuItem, deleteMenuItem } = require("../controllers/menuController");
const { protect, canteenOwner } = require("../middleware/auth");

router.post("/add", protect, canteenOwner, addMenuItem);
router.get("/:canteenId", getMenuByCanteen);
router.put("/update/:id", protect, canteenOwner, updateMenuItem);
router.delete("/delete/:id", protect, canteenOwner, deleteMenuItem);

module.exports = router;
