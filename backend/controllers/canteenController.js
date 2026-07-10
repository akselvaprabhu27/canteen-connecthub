const mongoose = require("mongoose");
const Canteen = require("../models/Canteen");
const Organization = require("../models/Organization");
const Menu = require("../models/Menu");
const User = require("../models/User");
const Review = require("../models/Review");
const OrganizationMessage = require("../models/OrganizationMessage");
const PaymentRequest = require("../models/PaymentRequest");
const CanteenWarning = require("../models/CanteenWarning");

// POST /api/canteens/register
// Public: Canteen self-registration
const registerCanteen = async (req, res) => {
  try {
    const {
      canteenName, ownerName, ownerEmail, ownerPhone, alternatePhone,
      organizationName, category, foodType, logoUrl,
      address, floorBlock, seatingCapacity, kitchenCapacity, numberOfStaff,
      openingTime, closingTime, fssaiLicense, businessDescription,
      bankAccountName, bankAccountNumber, ifscCode, upiId, password
    } = req.body;

    // Check if owner email already exists
    const existingUser = await User.findOne({ email: ownerEmail });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    // Find organization by name (Relaxed criteria to link even if pending)
    const org = await Organization.findOne({
      name: { $regex: new RegExp(`^${organizationName}$`, "i") }
    });

    // Create owner user
    const ownerUser = await User.create({
      name: ownerName,
      email: ownerEmail,
      password,
      role: "canteen_owner",
    });

    // Create canteen with pending status
    const canteen = await Canteen.create({
      canteenName,
      ownerName,
      ownerEmail,
      ownerPhone,
      alternatePhone,
      organizationId: org ? org._id : null,
      organizationName,
      category,
      foodType,
      logoUrl: logoUrl || "",
      address,
      floorBlock,
      seatingCapacity: Number(seatingCapacity) || 0,
      kitchenCapacity: Number(kitchenCapacity) || 0,
      numberOfStaff: Number(numberOfStaff) || 0,
      openingTime,
      closingTime,
      fssaiLicense,
      businessDescription,
      bankAccountName,
      bankAccountNumber,
      ifscCode,
      upiId,
      ownerId: ownerUser._id,
      organizationApprovalStatus: "pending",
      superAdminApprovalStatus: "pending",
      isConfirmed: false,
    });

    res.status(201).json({
      message: "Your request has been sent for approval.",
      canteenId: canteen._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/canteens/confirm/:id
// Canteen owner confirms after both approvals
const confirmCanteen = async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.id);
    if (!canteen) return res.status(404).json({ message: "Canteen not found" });
    if (
      canteen.organizationApprovalStatus !== "approved" ||
      canteen.superAdminApprovalStatus !== "approved"
    ) {
      return res.status(400).json({ message: "Canteen is not fully approved yet." });
    }
    canteen.isConfirmed = true;
    await canteen.save();
    res.json({ message: "Canteen confirmed. You can now access your dashboard." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/canteens/requests/all
// Super Admin: get all canteen requests
const getAllCanteenRequests = async (req, res) => {
  try {
    const { status, search } = req.query;
    let filter = {};
    if (search) filter.canteenName = { $regex: search, $options: "i" };
    if (status === "pending") {
      filter.$or = [
        { organizationApprovalStatus: "pending" },
        { superAdminApprovalStatus: "pending" }
      ];
    } else if (status === "approved") {
      filter.organizationApprovalStatus = "approved";
      filter.superAdminApprovalStatus = "approved";
    } else if (status === "rejected") {
      filter.$or = [
        { organizationApprovalStatus: "rejected" },
        { superAdminApprovalStatus: "rejected" }
      ];
    }
    const canteens = await Canteen.find(filter).sort({ createdAt: -1 });
    res.json(canteens);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/canteens/requests/org
// Org Admin: get canteen requests for their organization
const getOrgCanteenRequests = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminId: req.user._id });
    if (!org) return res.status(404).json({ message: "Organization not found" });

    // SELF-HEALING: Update any canteens that have this org's name but no ID linked
    await Canteen.updateMany(
      { organizationName: { $regex: new RegExp(`^${org.name}$`, "i") }, organizationId: { $exists: false } },
      { organizationId: org._id }
    );
    await Canteen.updateMany(
      { organizationName: { $regex: new RegExp(`^${org.name}$`, "i") }, organizationId: null },
      { organizationId: org._id }
    );

    const canteens = await Canteen.find({ organizationId: org._id }).sort({ createdAt: -1 });
    res.json(canteens);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/canteens/approve/org/:id
// Org Admin: approve canteen
const orgApproveCanteen = async (req, res) => {
  try {
    const canteen = await Canteen.findByIdAndUpdate(
      req.params.id,
      { organizationApprovalStatus: "approved" },
      { new: true }
    );
    if (!canteen) return res.status(404).json({ message: "Canteen not found" });
    res.json({ message: "Canteen approved by organization.", canteen });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/canteens/reject/org/:id
// Org Admin: reject canteen
const orgRejectCanteen = async (req, res) => {
  try {
    const { reason } = req.body;
    const canteen = await Canteen.findByIdAndUpdate(
      req.params.id,
      { organizationApprovalStatus: "rejected", orgRejectionReason: reason || "No reason provided" },
      { new: true }
    );
    if (!canteen) return res.status(404).json({ message: "Canteen not found" });
    res.json({ message: "Canteen rejected by organization.", canteen });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/canteens/approve/admin/:id
// Super Admin: approve canteen
const adminApproveCanteen = async (req, res) => {
  try {
    const canteen = await Canteen.findByIdAndUpdate(
      req.params.id,
      { superAdminApprovalStatus: "approved" },
      { new: true }
    );
    if (!canteen) return res.status(404).json({ message: "Canteen not found" });
    res.json({ message: "Canteen approved by super admin.", canteen });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/canteens/reject/admin/:id
// Super Admin: reject canteen
const adminRejectCanteen = async (req, res) => {
  try {
    const { reason } = req.body;
    const canteen = await Canteen.findByIdAndUpdate(
      req.params.id,
      { superAdminApprovalStatus: "rejected", adminRejectionReason: reason || "No reason provided" },
      { new: true }
    );
    if (!canteen) return res.status(404).json({ message: "Canteen not found" });
    res.json({ message: "Canteen rejected by super admin.", canteen });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Existing controllers
const createCanteen = async (req, res) => {
  try {
    const { organizationId, canteenName, category, ownerId } = req.body;
    const canteen = await Canteen.create({
      organizationId, canteenName, category,
      ownerId: ownerId || req.user._id,
      organizationApprovalStatus: "approved",
      superAdminApprovalStatus: "approved",
      isConfirmed: true,
    });
    res.status(201).json(canteen);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCanteensByOrg = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    // SELF-HEALING: Update canteens that might have been registered with the name but not the ID
    const org = await Organization.findById(organizationId);
    if (org) {
      await Canteen.updateMany(
        { organizationName: { $regex: new RegExp(`^${org.name}$`, "i") }, organizationId: { $exists: false } },
        { organizationId: org._id }
      );
      await Canteen.updateMany(
        { organizationName: { $regex: new RegExp(`^${org.name}$`, "i") }, organizationId: null },
        { organizationId: org._id }
      );
    }

    const canteens = await Canteen.find({
      organizationId,
      organizationApprovalStatus: "approved",
      superAdminApprovalStatus: "approved",
      isConfirmed: true,
    }).populate("ownerId", "name email");

    const result = await Promise.all(
      canteens.map(async (c) => {
        const itemCount = await Menu.countDocuments({ canteenId: c._id });
        
        // Calculate average rating from Reviews
        const reviews = await Review.find({ canteenId: c._id });
        const totalReviews = reviews.length;
        const avgRating = totalReviews > 0 
          ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews 
          : 0;

        // Get admin-specific data ONLY if user is org_admin
        let unreadMessagesCount = 0;
        let hasPendingPaymentRequest = false;
        let pendingPaymentAmount = 0;

        if (req.user && req.user.role === 'org_admin') {
          unreadMessagesCount = await OrganizationMessage.countDocuments({
            canteenId: c._id,
            organizationId: new mongoose.Types.ObjectId(organizationId),
            receiverId: req.user._id,
            isRead: false
          });

          // Check for pending payment requests
          const pendingPaymentRequest = await PaymentRequest.findOne({
            canteenId: c._id,
            organizationId: new mongoose.Types.ObjectId(organizationId),
            status: 'pending'
          });
          
          hasPendingPaymentRequest = !!pendingPaymentRequest;
          pendingPaymentAmount = pendingPaymentRequest ? pendingPaymentRequest.amount : 0;
        }

        const orgWarningsCount = await CanteenWarning.countDocuments({ canteenId: c._id, warnedBy: 'org_admin' });
        const adminWarningsCount = await CanteenWarning.countDocuments({ canteenId: c._id, warnedBy: 'super_admin' });

        return { 
          ...c.toObject(), 
          itemCount, 
          avgRating: Number(avgRating.toFixed(1)), 
          totalReviews,
          unreadMessagesCount,
          hasPendingPaymentRequest,
          pendingPaymentAmount,
          orgWarningsCount,
          adminWarningsCount
        };
      })
    );
    res.json(result);
  } catch (error) {
    console.error("Error in getCanteensByOrg:", error);
    res.status(500).json({ message: error.message });
  }
};

const getAllCanteens = async (req, res) => {
  try {
    const canteens = await Canteen.find({
      organizationApprovalStatus: "approved",
      superAdminApprovalStatus: "approved",
      isConfirmed: true,
    }).populate("organizationId", "name").populate("ownerId", "name email");

    const result = await Promise.all(
      canteens.map(async (c) => {
        const itemCount = await Menu.countDocuments({ canteenId: c._id });
        const reviews = await Review.find({ canteenId: c._id });
        const totalReviews = reviews.length;
        const avgRating = totalReviews > 0 
          ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews 
          : 0;

        return { 
          ...c.toObject(), 
          itemCount, 
          avgRating: Number(avgRating.toFixed(1)), 
          totalReviews 
        };
      })
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getCanteenByOwner = async (req, res) => {
  try {
    const canteen = await Canteen.findOne({ ownerId: req.user._id });
    if (!canteen) return res.status(404).json({ message: "No canteen found for this owner" });

    const orgWarningsCount = await CanteenWarning.countDocuments({ canteenId: canteen._id, warnedBy: 'org_admin' });
    const adminWarningsCount = await CanteenWarning.countDocuments({ canteenId: canteen._id, warnedBy: 'super_admin' });

    res.json({
      ...canteen.toObject(),
      orgWarningsCount,
      adminWarningsCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCanteenById = async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.id);
    if (!canteen) return res.status(404).json({ message: "Canteen not found" });

    const orgWarningsCount = await CanteenWarning.countDocuments({ canteenId: canteen._id, warnedBy: 'org_admin' });
    const adminWarningsCount = await CanteenWarning.countDocuments({ canteenId: canteen._id, warnedBy: 'super_admin' });

    res.json({
      ...canteen.toObject(),
      orgWarningsCount,
      adminWarningsCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCanteen = async (req, res) => {
  try {
    const canteen = await Canteen.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(canteen);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCanteen = async (req, res) => {
  try {
    await Canteen.findByIdAndDelete(req.params.id);
    res.json({ message: "Canteen removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const blockCanteen = async (req, res) => {
  try {
    const { reason } = req.body;
    const canteen = await Canteen.findById(req.params.id);
    if (!canteen) return res.status(404).json({ message: "Canteen not found" });

    canteen.isBlocked = true;
    canteen.blockReason = reason || "Suspended due to multiple food safety reports.";
    canteen.blockedBy = req.user.role === 'super_admin' ? 'super_admin' : 'org_admin';
    await canteen.save();

    res.json({ message: "Canteen blocked successfully.", canteen });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const unblockCanteen = async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.id);
    if (!canteen) return res.status(404).json({ message: "Canteen not found" });

    canteen.isBlocked = false;
    canteen.blockReason = "";
    canteen.blockedBy = undefined;
    await canteen.save();

    res.json({ message: "Canteen unblocked successfully.", canteen });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrgCanteens = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminId: req.user.id });
    if (!org) return res.status(404).json({ message: "Organization not found" });

    const canteens = await Canteen.find({
      organizationId: org._id,
      organizationApprovalStatus: "approved",
      superAdminApprovalStatus: "approved",
      isConfirmed: true
    }).populate("ownerId", "name email");

    const result = await Promise.all(
      canteens.map(async (canteen) => {
        const orgWarningsCount = await CanteenWarning.countDocuments({ canteenId: canteen._id, warnedBy: 'org_admin' });
        const adminWarningsCount = await CanteenWarning.countDocuments({ canteenId: canteen._id, warnedBy: 'super_admin' });
        return {
          ...canteen.toObject(),
          orgWarningsCount,
          adminWarningsCount
        };
      })
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrgsBlockedStats = async (req, res) => {
  try {
    const orgs = await Organization.find();
    const result = await Promise.all(
      orgs.map(async (org) => {
        const blockedCount = await Canteen.countDocuments({
          organizationId: org._id,
          isBlocked: true
        });
        return {
          _id: org._id,
          name: org.name,
          adminEmail: org.adminEmail,
          blockedCount
        };
      })
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const warnCanteen = async (req, res) => {
  try {
    const { reason } = req.body;
    const canteen = await Canteen.findById(req.params.id);
    if (!canteen) return res.status(404).json({ message: "Canteen not found" });

    const warnedBy = req.user.role === 'super_admin' ? 'super_admin' : 'org_admin';
    const warning = await CanteenWarning.create({
      canteenId: canteen._id,
      warnedBy,
      reason: reason || "General warning for policy infraction."
    });

    res.status(201).json({ message: "Canteen warned successfully.", warning });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyWarnings = async (req, res) => {
  try {
    const canteen = await Canteen.findOne({ ownerId: req.user._id });
    if (!canteen) return res.status(404).json({ message: "Canteen not found" });

    const warnings = await CanteenWarning.find({ canteenId: canteen._id }).sort({ createdAt: -1 });
    res.json(warnings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerCanteen, confirmCanteen,
  getAllCanteenRequests, getOrgCanteenRequests,
  orgApproveCanteen, orgRejectCanteen,
  adminApproveCanteen, adminRejectCanteen,
  createCanteen, getCanteensByOrg, getAllCanteens,
  getCanteenByOwner, getCanteenById, updateCanteen, deleteCanteen,
  blockCanteen, unblockCanteen, getOrgCanteens, getOrgsBlockedStats,
  warnCanteen, getMyWarnings
};
