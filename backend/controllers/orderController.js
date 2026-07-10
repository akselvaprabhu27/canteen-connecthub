const Order = require("../models/Order");
const Organization = require("../models/Organization");
const Payment = require("../models/Payment");
const Settings = require("../models/Settings");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const OrganizationWallet = require("../models/OrganizationWallet");
const CanteenFinance = require("../models/CanteenFinance");

const generateOrderId = async () => {
  const lastOrder = await Order.findOne().sort({ createdAt: -1 });
  if (!lastOrder || !lastOrder.orderId) {
    return 'CH1001';
  }
  const lastId = parseInt(lastOrder.orderId.replace('CH', ''));
  return `CH${lastId + 1}`;
};

const createOrder = async (req, res) => {
  try {
    const { userId, organizationId, canteenId, items, totalAmount, paymentMethod } = req.body;

    const orderId = await generateOrderId();

    // Handle Wallet Payment
    if (paymentMethod === 'Wallet') {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      
      if (user.walletBalance < totalAmount) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }

      // Deduct balance
      user.walletBalance -= totalAmount;
      await user.save();

      // Log wallet transaction
      await WalletTransaction.create({
        userId,
        amount: totalAmount,
        type: 'debit',
        status: 'success',
        description: `Paid for Order #${orderId}`
      });
    }

    const order = await Order.create({
      orderId,
      userId,
      organizationId,
      canteenId,
      items,
      totalAmount,
      status: 'pending'
    });

    // --- NEW FINANCIAL FLOW ---

    // 1. Update Organization Wallet
    await OrganizationWallet.findOneAndUpdate(
      { organizationId },
      { 
        $inc: { balance: totalAmount, totalRevenue: totalAmount },
        $setOnInsert: { organizationId }
      },
      { upsert: true, new: true }
    );

    let finance = await CanteenFinance.findOne({ canteenId });
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (!finance) {
      finance = new CanteenFinance({
        canteenId,
        organizationId,
        todayOrders: 1,
        overallOrders: 1,
        todayRevenue: 0,
        overallRevenue: 0,
        grossSales: totalAmount,
        updatedAt: new Date()
      });
    } else {
      const lastUpdate = new Date(finance.updatedAt);
      lastUpdate.setHours(0, 0, 0, 0);
      
      if (lastUpdate.getTime() < startOfToday.getTime()) {
        finance.todayOrders = 1;
        finance.todayRevenue = 0;
        finance.overallOrders += 1;
        finance.grossSales += totalAmount;
        finance.updatedAt = new Date();
      } else {
        finance.todayOrders += 1;
        finance.overallOrders += 1;
        finance.grossSales += totalAmount;
        finance.updatedAt = new Date();
      }
    }
    await finance.save();

    // 3. Legacy Payment record (optional, keeping for compatibility if needed)
    await Payment.create({
      orderId: order._id,
      totalAmount,
      platformCommission: 0, // Removed platform commission
      organizationCommission: 0, // Managed via CanteenFinance commissionPercent
      canteenAmount: 0, // Managed via Payout
      paymentStatus: 'completed'
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrdersByUser = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .populate('canteenId', 'canteenName')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrdersByCanteen = async (req, res) => {
  try {
    const orders = await Order.find({ canteenId: req.params.canteenId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrdersByOrg = async (req, res) => {
  try {
    const orders = await Order.find({ organizationId: req.params.orgId })
      .populate('userId', 'name')
      .populate('canteenId', 'canteenName')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOrder, getOrdersByUser, getOrdersByCanteen, getOrdersByOrg, updateOrderStatus };
