const mongoose = require("mongoose");

const fineSchema = new mongoose.Schema(
  {
    fineId: { type: String, required: true, unique: true },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodReport", required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    status: { 
      type: String, 
      enum: ["Pending", "Paid", "Cancelled"], 
      default: "Pending" 
    },
    paidAt: { type: Date },
    transactionId: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fine", fineSchema);
