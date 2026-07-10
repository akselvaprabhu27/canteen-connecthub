const mongoose = require('mongoose');

const paymentRequestSchema = new mongoose.Schema({
  canteenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canteen',
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  remarks: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('PaymentRequest', paymentRequestSchema);
