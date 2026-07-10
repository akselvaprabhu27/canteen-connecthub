const express = require("express");
const router = express.Router();
const {
  getOrgWallet,
  getCanteensFinance,
  getCanteenFinanceDetail,
  updateCanteenCommission,
  processPayout
} = require("../controllers/orgFinanceController");
const { protect, orgAdmin } = require("../middleware/auth");

router.get("/wallet/:orgId", protect, orgAdmin, getOrgWallet);
router.get("/canteens/:orgId", protect, orgAdmin, getCanteensFinance);
router.get("/canteen-detail/:canteenId", protect, orgAdmin, getCanteenFinanceDetail);
router.put("/commission/:canteenId", protect, orgAdmin, updateCanteenCommission);
router.post("/payout/:canteenId", protect, orgAdmin, processPayout);

module.exports = router;
