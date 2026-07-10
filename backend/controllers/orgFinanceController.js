const OrganizationWallet = require("../models/OrganizationWallet");
const CanteenFinance = require("../models/CanteenFinance");
const PayoutHistory = require("../models/PayoutHistory");
const Canteen = require("../models/Canteen");
const Order = require("../models/Order");
const mongoose = require("mongoose");

// Get Organization Wallet Summary
const getOrgWallet = async (req, res) => {
  try {
    const { orgId } = req.params;
    let wallet = await OrganizationWallet.findOne({ organizationId: orgId });
    
    if (!wallet) {
      wallet = await OrganizationWallet.create({ organizationId: orgId });
    }

    // Self-healing: If all canteens are paid out but balance remains, it's leftover commission
    const canteens = await Canteen.find({ organizationId: orgId });
    let totalPending = 0;
    for (const c of canteens) {
      const finance = await CanteenFinance.findOne({ canteenId: c._id });
      if (finance) {
        // Use 2 decimal precision for each canteen's pending
        const pending = Number((finance.grossSales * (1 - finance.commissionPercent / 100) - finance.paidOutAmount).toFixed(2));
        totalPending += Math.max(0, pending);
      }
    }

    // Only wipe balance if totalPending is truly zero (using a tighter buffer)
    if (totalPending < 0.01 && wallet.balance > 0.01) {
      wallet.realizedEarnings = Number(((wallet.realizedEarnings || 0) + wallet.balance).toFixed(2));
      wallet.balance = 0;
      await wallet.save();
    }

    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all canteens finance under an organization
const getCanteensFinance = async (req, res) => {
  try {
    const { orgId } = req.params;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    // Find all canteens in this org
    const canteens = await Canteen.find({ organizationId: orgId });
    
    const canteenFinanceData = await Promise.all(canteens.map(async (canteen) => {
      let finance = await CanteenFinance.findOne({ canteenId: canteen._id });
      if (!finance) {
        finance = await CanteenFinance.create({ 
          canteenId: canteen._id, 
          organizationId: orgId 
        });
      }

      // Daily Reset Check
      const lastUpdate = new Date(finance.updatedAt);
      lastUpdate.setHours(0, 0, 0, 0);
      
      if (lastUpdate.getTime() < startOfToday.getTime()) {
        finance.todayOrders = 0;
        finance.todayRevenue = 0;
        finance.updatedAt = new Date();
        await finance.save();
      }
      
      const todayOrdersCount = await Order.countDocuments({
        canteenId: canteen._id,
        createdAt: { $gte: startOfToday }
      });

      const overallOrdersCount = await Order.countDocuments({
        canteenId: canteen._id
      });

      return {
        canteenId: canteen._id,
        canteenName: canteen.canteenName,
        todayOrders: todayOrdersCount,
        overallOrders: overallOrdersCount,
        todayRevenue: finance.todayRevenue,
        overallRevenue: finance.overallRevenue,
        grossSales: finance.grossSales,
        pendingPayout: Number((finance.grossSales * (1 - finance.commissionPercent / 100) - finance.paidOutAmount).toFixed(2)),
        commissionPercent: finance.commissionPercent
      };
    }));

    res.json(canteenFinanceData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get detailed financial info for a specific canteen
const getCanteenFinanceDetail = async (req, res) => {
  try {
    const { canteenId } = req.params;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const canteen = await Canteen.findById(canteenId);
    if (!canteen) return res.status(404).json({ message: "Canteen not found" });

    let finance = await CanteenFinance.findOne({ canteenId });
    if (!finance) {
      finance = await CanteenFinance.create({ 
        canteenId, 
        organizationId: canteen.organizationId 
      });
    }

    // Daily Reset Check
    const lastUpdate = new Date(finance.updatedAt);
    lastUpdate.setHours(0, 0, 0, 0);
    
    if (lastUpdate.getTime() < startOfToday.getTime()) {
      finance.todayOrders = 0;
      finance.todayRevenue = 0;
      finance.updatedAt = new Date();
      await finance.save();
    }

    // Payout History
    const payouts = await PayoutHistory.find({ canteenId }).sort({ paidAt: -1 });

    const netPending = Number((finance.grossSales * (1 - finance.commissionPercent / 100) - finance.paidOutAmount).toFixed(2));

    const todayOrdersCount = await Order.countDocuments({
      canteenId,
      createdAt: { $gte: startOfToday }
    });

    const overallOrdersCount = await Order.countDocuments({
      canteenId
    });

    res.json({
      canteenInfo: {
        name: canteen.canteenName,
        owner: canteen.ownerName,
        status: canteen.isConfirmed ? 'Active' : 'Pending'
      },
      stats: {
        todayOrders: todayOrdersCount,
        overallOrders: overallOrdersCount,
        todayRevenue: finance.todayRevenue,
        overallRevenue: finance.overallRevenue,
        grossSales: finance.grossSales,
        commissionPercent: finance.commissionPercent,
        pendingPayout: netPending,
        paidOutAmount: finance.paidOutAmount
      },
      payouts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Canteen Commission
const updateCanteenCommission = async (req, res) => {
  try {
    const { canteenId } = req.params;
    const { commissionPercent } = req.body;

    const finance = await CanteenFinance.findOneAndUpdate(
      { canteenId },
      { commissionPercent },
      { new: true, upsert: true }
    );

    res.json(finance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Process Payout
const processPayout = async (req, res) => {
  try {
    const { canteenId } = req.params;
    const { amount } = req.body;

    const finance = await CanteenFinance.findOne({ canteenId });
    if (!finance) return res.status(404).json({ message: "Canteen finance records not found" });

    const wallet = await OrganizationWallet.findOne({ organizationId: finance.organizationId });
    if (!wallet) return res.status(404).json({ message: "Organization wallet not found" });

    // Precise commission calculation with safeguard for 100% commission
    let commission = 0;
    if (finance.commissionPercent < 100) {
      commission = amount * (finance.commissionPercent / (100 - finance.commissionPercent));
    } else {
      // If commission is 100%, everything except the payout amount is commission
      // But usually 'amount' would be 0 in this case.
      commission = 0; 
    }
    
    const totalToDeduct = Number((amount + commission).toFixed(2));

    // Use rounded comparison to avoid floating point precision issues (e.g. 10.0000000001 < 10.01)
    if (Number(wallet.balance.toFixed(2)) < (totalToDeduct - 0.01)) {
      return res.status(400).json({ 
        message: "Insufficient organization balance",
        details: `Available Wallet Balance: ₹${wallet.balance.toFixed(2)}, Total Required (Payout + Commission): ₹${totalToDeduct.toFixed(2)}. Please ensure the organization has sufficient funds.`
      });
    }

    // 1. Mark payout as completed in history
    await PayoutHistory.create({
      canteenId,
      organizationId: finance.organizationId,
      amount,
      status: 'completed'
    });

    // 2. Deduct from Org Wallet Balance and move commission to realizedEarnings
    // We round the final values to 2 decimal places to avoid float garbage
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

    // 4. Send automated message to canteen
    const canteen = await Canteen.findById(canteenId);
    if (canteen) {
      const OrganizationMessage = require("../models/OrganizationMessage");
      await OrganizationMessage.create({
        senderId: req.user._id,
        receiverId: canteen.ownerId,
        organizationId: finance.organizationId,
        canteenId,
        title: "✅ Payout Completed",
        message: `Your pending payment of ₹${amount.toFixed(2)} has been paid to you.`,
        priority: 'Medium'
      });
    }

    res.json({ 
      message: "Payout processed successfully",
      payoutAmount: amount,
      commissionEarned: actualCommission.toFixed(2),
      newWalletBalance: wallet.balance.toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOrgWallet,
  getCanteensFinance,
  getCanteenFinanceDetail,
  updateCanteenCommission,
  processPayout
};
