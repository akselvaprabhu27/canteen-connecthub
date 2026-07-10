const express = require("express");
const router = express.Router();
const {
  registerCanteen, confirmCanteen,
  getAllCanteenRequests, getOrgCanteenRequests,
  orgApproveCanteen, orgRejectCanteen,
  adminApproveCanteen, adminRejectCanteen,
  createCanteen, getCanteensByOrg, getAllCanteens,
  getCanteenByOwner, getCanteenById, updateCanteen, deleteCanteen,
  blockCanteen, unblockCanteen, getOrgCanteens, getOrgsBlockedStats,
  warnCanteen, getMyWarnings
} = require("../controllers/canteenController");
const { protect, admin, orgAdmin, canteenOwner } = require("../middleware/auth");

// Public
router.post("/register", registerCanteen);

// Canteen owner confirm
router.post("/confirm/:id", protect, confirmCanteen);

// Requests
router.get("/requests/all", protect, admin, getAllCanteenRequests);
router.get("/requests/org", protect, orgAdmin, getOrgCanteenRequests);

// Approval actions
router.put("/approve/org/:id", protect, orgAdmin, orgApproveCanteen);
router.put("/reject/org/:id", protect, orgAdmin, orgRejectCanteen);
router.put("/approve/admin/:id", protect, admin, adminApproveCanteen);
router.put("/reject/admin/:id", protect, admin, adminRejectCanteen);

// Block/Unblock & Action Dashboards (MUST be before parameter routes to avoid collisions)
router.get("/org-canteens", protect, orgAdmin, getOrgCanteenRequests ? getOrgCanteens : getOrgCanteens);
router.get("/orgs-blocked-stats", protect, admin, getOrgsBlockedStats);
router.put("/block/:id", protect, orgAdmin, blockCanteen);
router.put("/unblock/:id", protect, orgAdmin, unblockCanteen);
router.post("/warn/:id", protect, orgAdmin, warnCanteen);
router.get("/my-warnings", protect, canteenOwner, getMyWarnings);

// Canteen owner
router.get("/my", protect, canteenOwner, getCanteenByOwner);

// All approved canteens
router.get("/", getAllCanteens);

// Get single canteen by ID (public — used by MenuPage, ReviewPage)
router.get("/details/:id", getCanteenById);

// Org canteens (Accessible by Org Admin and consumers)
router.get("/:organizationId", protect, getCanteensByOrg);

// Create / Update / Delete
router.post("/", protect, admin, createCanteen);
router.put("/:id", protect, updateCanteen);
router.delete("/:id", protect, admin, deleteCanteen);

module.exports = router;
