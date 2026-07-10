const express = require("express");
const router = express.Router();
const { registerUser, loginUser, updateProfile, changePassword, getMe, syncSession } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/change-password", protect, changePassword);
router.post("/sync-session", protect, syncSession);

module.exports = router;
