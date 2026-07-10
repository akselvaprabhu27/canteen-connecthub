const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  gender: { type: String },
  dateOfBirth: { type: Date },
  profilePhoto: { type: String },
  role: { 
    type: String, 
    enum: ['super_admin', 'org_admin', 'canteen_owner', 'user'],
    default: 'user'
  },
  savedOrganizations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }],
  walletBalance: { type: Number, default: 0 },
  lastSelectedCanteenId: { type: String },
  lastSelectedOrgId: { type: String },
  lastOrderId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
