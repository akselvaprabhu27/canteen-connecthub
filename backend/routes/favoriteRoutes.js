const express = require("express");
const router = express.Router();
const { getFavorites, addFavorite, renameFavorite, deleteFavorite } = require("../controllers/favoriteController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getFavorites);
router.post("/add", protect, addFavorite);
router.patch("/rename/:id", protect, renameFavorite);
router.delete("/:id", protect, deleteFavorite);

module.exports = router;
