const mongoose = require("mongoose");

const reportResponseSchema = new mongoose.Schema(
  {
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodReport", required: true },
    senderRole: { type: String, required: true, enum: ["user", "org_admin", "super_admin", "system", "canteen_owner"] },
    senderId: { type: mongoose.Schema.Types.ObjectId, refPath: "senderRoleRef", required: true },
    senderRoleRef: { type: String, required: true, enum: ["User", "Organization", "SuperAdmin"] }, // For dynamic ref if needed, or just use User if all are in User collection
    message: { type: String, required: true },
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReportResponse", reportResponseSchema);
