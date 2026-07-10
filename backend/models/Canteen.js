const mongoose = require("mongoose");

const canteenSchema = new mongoose.Schema({
  // Organization
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  organizationName: { type: String }, // for display before org is linked

  // Canteen Info
  canteenName: { type: String, required: true },
  category: { type: String }, // Fast Food, South Indian, etc.
  foodType: { type: String, enum: ['Veg', 'Non-Veg', 'General'], default: 'General' },
  logoUrl: { type: String },

  // Location
  address: { type: String },
  floorBlock: { type: String },

  // Capacity
  seatingCapacity: { type: Number, default: 0 },
  kitchenCapacity: { type: Number, default: 0 },
  numberOfStaff: { type: Number, default: 0 },

  // Timings
  openingTime: { type: String },
  closingTime: { type: String },

  // Owner Info
  ownerName: { type: String },
  ownerEmail: { type: String },
  ownerPhone: { type: String },
  alternatePhone: { type: String },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Legal
  fssaiLicense: { type: String },
  businessDescription: { type: String },

  // Banking
  bankAccountName: { type: String },
  bankAccountNumber: { type: String },
  ifscCode: { type: String },
  upiId: { type: String },

  // Approval workflow
  organizationApprovalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  superAdminApprovalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  orgRejectionReason: { type: String },
  adminRejectionReason: { type: String },
  isConfirmed: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  blockReason: { type: String, default: "" },
  blockedBy: { type: String, enum: ['org_admin', 'super_admin'] },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Canteen', canteenSchema);
