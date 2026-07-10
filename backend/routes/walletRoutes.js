const express = require("express");
const router = express.Router();
const { getWalletDetails, topUpWallet } = require("../controllers/walletController");
const { protect } = require("../middleware/auth");

router.get("/details", protect, getWalletDetails);
router.post("/topup", protect, topUpWallet);

module.exports = router;
