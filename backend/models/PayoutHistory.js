const mongoose = require("mongoose");

const payoutHistorySchema = new mongoose.Schema({
  canteenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'completed' },
  paidAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PayoutHistory', payoutHistorySchema);
