const PaymentRequest = require('../models/PaymentRequest');
const OrganizationMessage = require('../models/OrganizationMessage');
const CanteenFinance = require('../models/CanteenFinance');
const OrganizationWallet = require('../models/OrganizationWallet');
const PayoutHistory = require('../models/PayoutHistory');
const Canteen = require('../models/Canteen');
const User = require('../models/User');
const Organization = require('../models/Organization');
const mongoose = require('mongoose');

// @desc    Request a payout
// @route   POST /api/payment-requests/request
// @access  CanteenOwner
exports.createRequest = async (req, res) => {
  try {
    const { amount, canteenId, organizationId } = req.body;

    // Removed the check for existing pending request to allow multiple requests
    
    const paymentRequest = await PaymentRequest.create({
      canteenId,
      organizationId,
      amount,
      status: 'pending'
    });

    // Send notification message to organization admin
    const canteen = await Canteen.findById(canteenId);
    const org = await Organization.findById(organizationId);
    const receiverId = org ? org.adminId : null;

    if (receiverId) {
      await OrganizationMessage.create({
        senderId: req.user._id,
        receiverId: receiverId,
        organizationId,
        canteenId,
        title: "💰 Payment Request",
        message: `Payout Request: ${canteen.canteenName} has requested an instant payout of ₹${amount.toFixed(2)}. You can approve or reject this request directly using the buttons below.`,
        priority: 'High'
      });
    }

    res.status(201).json(paymentRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all payment requests for an organization
// @route   GET /api/payment-requests/org/:orgId
// @access  OrgAdmin
exports.getOrgRequests = async (req, res) => {
  try {
    const { orgId } = req.params;
    const requests = await PaymentRequest.find({ organizationId: orgId })
      .sort({ requestedAt: -1 })
      .populate('canteenId', 'canteenName');
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all payment requests for a canteen
// @route   GET /api/payment-requests/canteen/:canteenId
// @access  CanteenOwner
exports.getCanteenRequests = async (req, res) => {
  try {
    const { canteenId } = req.params;
    const requests = await PaymentRequest.find({ canteenId })
      .sort({ requestedAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Process payment request (Approve/Reject)
// @route   PUT /api/payment-requests/process/:requestId
// @access  OrgAdmin
exports.processRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, remarks } = req.body; // 'approved' or 'rejected'

    const paymentRequest = await PaymentRequest.findById(requestId);
    if (!paymentRequest) return res.status(404).json({ message: "Request not found" });

    if (paymentRequest.status !== 'pending') {
      return res.status(400).json({ message: "Request already processed" });
    }

    const { canteenId, organizationId, amount } = paymentRequest;

    if (status === 'approved') {
      // Reusing logic from orgFinanceController.js
      const finance = await CanteenFinance.findOne({ canteenId });
      if (!finance) return res.status(404).json({ message: "Canteen finance records not found" });

      const wallet = await OrganizationWallet.findOne({ organizationId });
      if (!wallet) return res.status(404).json({ message: "Organization wallet not found" });

      let commission = 0;
      if (finance.commissionPercent < 100) {
        commission = amount * (finance.commissionPercent / (100 - finance.commissionPercent));
      }
      
      const totalToDeduct = Number((amount + commission).toFixed(2));

      if (Number(wallet.balance.toFixed(2)) < (totalToDeduct - 0.01)) {
        return res.status(400).json({ 
          message: "Insufficient organization balance to approve this request"
        });
      }

      // 1. Mark payout as completed in history
      await PayoutHistory.create({
        canteenId,
        organizationId,
        amount,
        status: 'completed'
      });

      // 2. Deduct from Org Wallet
      const actualDeduction = Number(Math.min(wallet.balance, totalToDeduct).toFixed(2));
      const actualCommission = Number(Math.min(commission, actualDeduction - amount).toFixed(2));

      wallet.balance = Number(Math.max(0, wallet.balance - actualDeduction).toFixed(2));
      wallet.realizedEarnings = Number(((wallet.realizedEarnings || 0) + actualCommission).toFixed(2));
      wallet.updatedAt = new Date();
      await wallet.save();

      // 3. Update Canteen Finance
      finance.paidOutAmount += amount;
      finance.todayRevenue += amount;
      finance.overallRevenue += amount;
      finance.updatedAt = new Date();
      await finance.save();

      // Update request status
      paymentRequest.status = 'approved';
      paymentRequest.processedAt = Date.now();
      paymentRequest.remarks = remarks || "Payout approved";
      await paymentRequest.save();

      // Send automated message to canteen
      const canteen = await Canteen.findById(canteenId);
      await OrganizationMessage.create({
        senderId: req.user._id,
        receiverId: canteen.ownerId,
        organizationId,
        canteenId,
        title: "✅ Payout Completed",
        message: `Your pending payment of ₹${amount.toFixed(2)} has been paid to you.`,
        priority: 'Medium'
      });

    } else if (status === 'rejected') {
      if (!remarks) return res.status(400).json({ message: "Rejection reason is required" });

      paymentRequest.status = 'rejected';
      paymentRequest.processedAt = Date.now();
      paymentRequest.remarks = remarks;
      await paymentRequest.save();

      // Send rejection message
      const canteen = await Canteen.findById(canteenId);
      await OrganizationMessage.create({
        senderId: req.user._id,
        receiverId: canteen.ownerId,
        organizationId,
        canteenId,
        title: "❌ Payout Rejected",
        message: `Your payout request of ₹${amount.toFixed(2)} was rejected. Reason: ${remarks}`,
        priority: 'High'
      });
    }

    res.json(paymentRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
