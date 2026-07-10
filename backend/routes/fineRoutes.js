const express = require("express");
const router = express.Router();
const fineController = require("../controllers/fineController");
const { protect, admin } = require("../middleware/auth");

// All routes are protected
router.use(protect);

// Admin only routes
router.get("/all", admin, fineController.getAllFines);
router.put("/cancel/:id", admin, fineController.cancelFine);
router.get("/settings", admin, fineController.getFineSettings);
router.put("/settings", admin, fineController.updateFineSettings);

// Org Admin routes
router.get("/my-fines", fineController.getOrgFines);
router.post("/pay/:id", fineController.payFine);

module.exports = router;
