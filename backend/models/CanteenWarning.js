const mongoose = require("mongoose");

const canteenWarningSchema = new mongoose.Schema({
  canteenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canteen',
    required: true
  },
  warnedBy: {
    type: String,
    enum: ['org_admin', 'super_admin'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CanteenWarning', canteenWarningSchema);
