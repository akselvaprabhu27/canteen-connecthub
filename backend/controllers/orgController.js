const Organization = require("../models/Organization");
const Canteen = require("../models/Canteen");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// POST /api/organizations/register
// Public: Organization self-registration
const registerOrganization = async (req, res) => {
  try {
    const {
      name, type, address, city, state, pincode,
      officialEmail, phone, alternatePhone, websiteUrl,
      adminFullName, adminEmail, adminPhone,
      expectedUsers, expectedCanteens, businessDescription, gstNumber,
      password, logoUrl
    } = req.body;

    // Check if admin email already exists
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this admin email already exists." });
    }

    // Create the org admin user (role: org_admin, no token yet - pending approval)
    const adminUser = await User.create({
      name: adminFullName,
      email: adminEmail,
      password,
      role: "org_admin",
    });

    // Create organization with pending status
    const org = await Organization.create({
      name,
      type,
      logoUrl: logoUrl || "",
      address,
      city,
      state,
      pincode,
      officialEmail,
      phone,
      alternatePhone,
      websiteUrl,
      adminFullName,
      adminEmail,
      adminPhone,
      expectedUsers: Number(expectedUsers) || 0,
      expectedCanteens: Number(expectedCanteens) || 0,
      businessDescription,
      gstNumber,
      location: `${city}, ${state}`,
      adminId: adminUser._id,
      approvalStatus: "pending",
      isConfirmed: false,
    });

    res.status(201).json({
      message: "Your request has been sent to Super Admin for approval.",
      organizationId: org._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/organizations/confirm/:id
// Org admin confirms after approval
const confirmOrganization = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ message: "Organization not found" });
    if (org.approvalStatus !== "approved") {
      return res.status(400).json({ message: "Organization is not approved yet." });
    }
    org.isConfirmed = true;
    await org.save();
    res.json({ message: "Organization confirmed. You can now access your dashboard." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/organizations/requests
// Super Admin: get all org requests
const getOrganizationRequests = async (req, res) => {
  try {
    const { status, search } = req.query;
    let filter = {};
    if (status && status !== "all") filter.approvalStatus = status;
    if (search) filter.name = { $regex: search, $options: "i" };
    const orgs = await Organization.find(filter).sort({ createdAt: -1 });
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/organizations/approve/:id
// Super Admin: approve an organization
const approveOrganization = async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: "approved" },
      { new: true }
    );
    if (!org) return res.status(404).json({ message: "Organization not found" });
    res.json({ message: "Organization approved.", org });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/organizations/reject/:id
// Super Admin: reject an organization
const rejectOrganization = async (req, res) => {
  try {
    const { reason } = req.body;
    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: "rejected", rejectionReason: reason || "No reason provided" },
      { new: true }
    );
    if (!org) return res.status(404).json({ message: "Organization not found" });
    res.json({ message: "Organization rejected.", org });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Existing controllers
const createOrganization = async (req, res) => {
  try {
    const { name, type, location, adminId, commissionPercentage } = req.body;
    const org = await Organization.create({
      name, type, location,
      adminId: adminId || req.user._id,
      commissionPercentage: commissionPercentage || 10,
      approvalStatus: "approved",
      isConfirmed: true,
    });
    res.status(201).json(org);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.find({ approvalStatus: "approved", isConfirmed: true })
      .populate("adminId", "name email");
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrganizationById = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id).populate("adminId", "name email");
    if (!org) return res.status(404).json({ message: "Organization not found" });
    res.json(org);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrganizationsByAdmin = async (req, res) => {
  try {
    const orgs = await Organization.find({ adminId: req.user._id });
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrganization = async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!org) return res.status(404).json({ message: "Organization not found" });
    res.json(org);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerOrganization,
  confirmOrganization,
  getOrganizationRequests,
  approveOrganization,
  rejectOrganization,
  createOrganization,
  getOrganizations,
  getOrganizationById,
  getOrganizationsByAdmin,
  updateOrganization,
};
