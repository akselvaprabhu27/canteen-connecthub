const express = require("express");
const router = express.Router();
const {
  registerOrganization,
  confirmOrganization,
  getOrganizationRequests,
  approveOrganization,
  rejectOrganization,
  createOrganization,
  getOrganizations,
  getOrganizationById,
  getOrganizationsByAdmin,
  updateOrganization
} = require("../controllers/orgController");
const { protect, admin, orgAdmin } = require("../middleware/auth");

// Public routes
router.post("/register", registerOrganization);

// Org admin routes
router.post("/confirm/:id", protect, confirmOrganization);
router.get("/my", protect, orgAdmin, getOrganizationsByAdmin);

// Super Admin routes
router.get("/requests", protect, admin, getOrganizationRequests);
router.put("/approve/:id", protect, admin, approveOrganization);
router.put("/reject/:id", protect, admin, rejectOrganization);
router.post("/create", protect, admin, createOrganization);
router.put("/:id", protect, admin, updateOrganization);

// Public routes
router.get("/", getOrganizations);
router.get("/:id", getOrganizationById);

module.exports = router;
