const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { protect, admin, orgAdmin, canteenOwner } = require("../middleware/auth");

router.post("/", protect, reportController.createReport);
router.get("/my-reports", protect, reportController.getUserReports);
router.get("/org-reports", protect, orgAdmin, reportController.getOrgReports);
router.get("/canteen-reports", protect, canteenOwner, reportController.getCanteenOwnerReports);
router.get("/admin-reports", protect, admin, reportController.getAdminReports);
router.get("/analytics", protect, admin, reportController.getReportAnalytics);
router.get("/high-reported", protect, orgAdmin, reportController.getHighReportedCanteens);
router.get("/:id", protect, reportController.getReportDetails);
router.post("/:id/response", protect, reportController.addResponse);
router.patch("/:id/status", protect, reportController.updateReportStatus);

module.exports = router;
