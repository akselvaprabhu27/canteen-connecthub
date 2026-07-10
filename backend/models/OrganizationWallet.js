const mongoose = require("mongoose");

const organizationWalletSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true },
  balance: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  realizedEarnings: { type: Number, default: 0 },
  pendingPayouts: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OrganizationWallet', organizationWalletSchema);
