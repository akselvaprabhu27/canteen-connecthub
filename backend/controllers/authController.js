const User = require("../models/User");
const Organization = require("../models/Organization");
const Canteen = require("../models/Canteen");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const registerUser = async (req, res) => {
  const { name, email, password, phone, gender, dateOfBirth } = req.body;

  // SECURITY: role is ALWAYS forced to 'user' for the normal registration endpoint.
  // org_admin and canteen_owner roles are only assigned via their dedicated registration flows.
  const role = 'user';

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone: phone || undefined,
      gender: gender || undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // --- org_admin approval check ---
    if (user.role === "org_admin") {
      const org = await Organization.findOne({ adminId: user._id });
      if (org) {
        if (org.approvalStatus === "pending") {
          return res.status(200).json({
            approvalRequired: true,
            approvalStatus: "pending",
            message: "Your request is under review by Super Admin.",
          });
        }
        if (org.approvalStatus === "rejected") {
          return res.status(200).json({
            approvalRequired: true,
            approvalStatus: "rejected",
            rejectionReason: org.rejectionReason,
            message: "Your organization request has been rejected.",
          });
        }
        if (org.approvalStatus === "approved" && !org.isConfirmed) {
          return res.status(200).json({
            approvalRequired: true,
            approvalStatus: "approved_unconfirmed",
            organizationId: org._id,
            message: "Your organization has been approved by Super Admin. Please confirm to start using CanteenHub.",
            token: generateToken(user._id),
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth,
          });
        }
      }
    }

    // --- canteen_owner approval check ---
    if (user.role === "canteen_owner") {
      const canteen = await Canteen.findOne({ ownerId: user._id });
      if (canteen) {
        const orgStatus = canteen.organizationApprovalStatus;
        const adminStatus = canteen.superAdminApprovalStatus;
        const bothApproved = orgStatus === "approved" && adminStatus === "approved";

        if (!bothApproved) {
          return res.status(200).json({
            approvalRequired: true,
            approvalStatus: "canteen_pending",
            organizationApprovalStatus: orgStatus,
            superAdminApprovalStatus: adminStatus,
            orgRejectionReason: canteen.orgRejectionReason,
            adminRejectionReason: canteen.adminRejectionReason,
            message: "Your canteen is pending approval.",
          });
        }

        if (bothApproved && !canteen.isConfirmed) {
          return res.status(200).json({
            approvalRequired: true,
            approvalStatus: "canteen_approved_unconfirmed",
            canteenId: canteen._id,
            message: "Your canteen has been approved. Please confirm to start using CanteenHub.",
            token: generateToken(user._id),
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth,
          });
        }
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      user.gender = req.body.gender || user.gender;
      user.dateOfBirth = req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : user.dateOfBirth;
      
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        gender: updatedUser.gender,
        dateOfBirth: updatedUser.dateOfBirth,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (user && (await user.matchPassword(oldPassword))) {
      user.password = newPassword;
      await user.save();
      res.json({ message: "Password changed successfully" });
    } else {
      res.status(401).json({ message: "Invalid old password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const syncSession = async (req, res) => {
  try {
    const { lastSelectedCanteenId, lastSelectedOrgId, lastOrderId } = req.body;
    const user = await User.findById(req.user._id);
    if (user) {
      if (lastSelectedCanteenId !== undefined) user.lastSelectedCanteenId = lastSelectedCanteenId;
      if (lastSelectedOrgId !== undefined) user.lastSelectedOrgId = lastSelectedOrgId;
      if (lastOrderId !== undefined) user.lastOrderId = lastOrderId;
      await user.save();
      res.json({ message: "Session synced" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, updateProfile, changePassword, getMe, syncSession };

