const mongoose = require("mongoose");

const canteenFinanceSchema = new mongoose.Schema({
  canteenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true, unique: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  todayOrders: { type: Number, default: 0 },
  overallOrders: { type: Number, default: 0 },
  todayRevenue: { type: Number, default: 0 },
  overallRevenue: { type: Number, default: 0 },
  grossSales: { type: Number, default: 0 },
  commissionPercent: { type: Number, default: 10 },
  pendingPayout: { type: Number, default: 0 },
  paidOutAmount: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CanteenFinance', canteenFinanceSchema);
