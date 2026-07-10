const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true },
  type: { type: String, required: true }, // College / Company / Hospital / Hostel / Tech Park / Factory / Other
  logoUrl: { type: String },

  // Address
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },

  // Contact
  officialEmail: { type: String },
  phone: { type: String },
  alternatePhone: { type: String },
  websiteUrl: { type: String },

  // Admin Info
  adminFullName: { type: String },
  adminEmail: { type: String },
  adminPhone: { type: String },

  // Business
  expectedUsers: { type: Number, default: 0 },
  expectedCanteens: { type: Number, default: 0 },
  businessDescription: { type: String },
  gstNumber: { type: String },

  // Legacy / computed
  location: { type: String },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  commissionPercentage: { type: Number, default: 10 },

  // Approval workflow
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: { type: String },
  isConfirmed: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Organization', organizationSchema);
