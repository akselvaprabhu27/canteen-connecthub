const mongoose = require("mongoose");

const foodReportSchema = new mongoose.Schema(
  {
    reportId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" }, // Optional, user can report without a specific order maybe, but usually with order
    canteenId: { type: mongoose.Schema.Types.ObjectId, ref: "Canteen", required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    issueType: { 
      type: String, 
      required: true,
      enum: [
        "Spoiled Food", "Bad Taste", "Food Poisoning Symptoms", 
        "Low Food Quality", "Hygiene Problem", "Wrong Item Delivered", 
        "Missing Items", "Late Preparation", "Unsafe Packaging", 
        "Staff Misbehavior", "Overpricing", "Other"
      ]
    },
    severity: { 
      type: String, 
      required: true,
      enum: ["Low", "Medium", "High", "Critical", "Normal"]
    },
    description: { type: String, required: true },
    photos: [{ type: String }], // Array of strings (URLs or base64)
    contactPreference: { type: String, default: "No Contact Needed" },
    status: { 
      type: String, 
      default: "Pending",
      enum: ["Pending", "Under Investigation", "Resolved", "Rejected"]
    },
    deadline: { type: Date, required: true }, // Response deadline
    investigationFineIssued: { type: Boolean, default: false },
    resolutionFineIssued: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FoodReport", foodReportSchema);
