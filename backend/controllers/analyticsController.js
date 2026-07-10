const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Canteen = require('../models/Canteen');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Settings = require('../models/Settings');
const Menu = require('../models/Menu');
const CanteenFinance = require('../models/CanteenFinance');
const OrganizationWallet = require('../models/OrganizationWallet');

const getSuperAdminStats = async (req, res) => {
  try {
    const [
      totalOrgs,
      totalCanteens,
      totalUsers,
      totalOrders,
      ordersToday,
      revenueAgg,
      avgAgg,
      reviewAgg,
      recentOrgs,
      recentOrders,
      commissionSetting
    ] = await Promise.all([
      Organization.countDocuments(),
      Canteen.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.aggregate([{ $group: { _id: null, avg: { $avg: '$totalAmount' } } }]),
      Review.aggregate([{ $group: { _id: null, avgRating: { $avg: '$rating' } } }]),
      Organization.find().sort({ createdAt: -1 }).limit(3).select('name createdAt'),
      Order.find().sort({ createdAt: -1 }).limit(3).populate('canteenId', 'canteenName'),
      Settings.findOne({ key: 'platformCommission' })
    ]);
    const recentActivity = [];
    recentOrgs.forEach(o => recentActivity.push({ text: `New organization '${o.name}' registered`, time: o.createdAt }));
    recentOrders.forEach(o => recentActivity.push({ text: `Order #${o._id} placed at ${o.canteenId?.canteenName || 'canteen'}`, time: o.createdAt }));
    recentActivity.sort((a, b) => new Date(b.time) - new Date(a.time));
    res.json({
      totalOrgs,
      totalCanteens,
      totalUsers,
      totalOrders,
      ordersToday,
      totalRevenue: revenueAgg[0]?.total || 0,
      avgOrderValue: avgAgg[0]?.avg || 0,
      avgRating: reviewAgg[0]?.avgRating || 0,
      recentActivity: recentActivity.map(a => a.text)
    });
  } catch (error) {
    console.error('Error in getSuperAdminStats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getRevenueStats = async (req, res) => {
  try {
    const commissionSetting = await Settings.findOne({ key: 'platformCommission' });
    const commissionRate = commissionSetting ? commissionSetting.value : 0;

    const totalAgg = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]);
    const totalRevenue = totalAgg[0]?.total || 0;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const thisMonth = monthAgg[0]?.total || 0;

    const commissionEarned = (totalRevenue * commissionRate) / 100;

    const monthlyAgg = await Order.aggregate([
      { $group: { _id: { $month: '$createdAt' }, revenue: { $sum: '$totalAmount' } } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData = monthNames.map((name, index) => {
      const found = monthlyAgg.find(m => m._id === index + 1);
      return { month: name, revenue: found ? found.revenue : 0 };
    });

    res.json({
      totalRevenue,
      thisMonth,
      monthlyData
    });
  } catch (error) {
    console.error('Error in getRevenueStats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getOrgAdminStats = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const org = await Organization.findOne({ adminId: userId });
    if (!org) {
      return res.status(404).json({ error: 'Organization not found for this admin' });
    }
    const orgId = org._id;

    const [
      canteenCount,
      totalUsers,
      totalOrders,
      revenueAgg,
      avgAgg,
      recentOrders,
      commissionSetting,
      wallet
    ] = await Promise.all([
      Canteen.countDocuments({ organizationId: orgId }),
      User.countDocuments({ orgId: orgId, role: 'user' }),
      Order.countDocuments({ organizationId: orgId }),
      Order.aggregate([{ $match: { organizationId: new mongoose.Types.ObjectId(orgId) } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.aggregate([{ $match: { organizationId: new mongoose.Types.ObjectId(orgId) } }, { $group: { _id: null, avg: { $avg: '$totalAmount' } } }]),
      Order.find({ organizationId: orgId }).sort({ createdAt: -1 }).limit(5).populate('canteenId', 'canteenName'),
      Settings.findOne({ key: 'platformCommission' }),
      OrganizationWallet.findOne({ organizationId: orgId })
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const platformCommission = commissionSetting?.value || 0;
    const commissionPaid = (totalRevenue * platformCommission) / 100;

    const recentActivity = [];
    recentOrders.forEach(o => recentActivity.push({ text: `Order #${o.orderId || o._id} at ${o.canteenId?.canteenName || 'canteen'}`, time: o.createdAt }));
    
    res.json({
      canteenCount,
      totalUsers,
      totalOrders,
      totalRevenue,
      commissionPaid,
      totalEarnings: wallet?.realizedEarnings || 0,
      avgOrderValue: avgAgg[0]?.avg || 0,
      recentActivity: recentActivity.map(a => a.text),
      platformCommission
    });
  } catch (error) {
    console.error('Error in getOrgAdminStats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCanteenOwnerStats = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const canteen = await Canteen.findOne({ ownerId: userId });
    if (!canteen) {
      return res.status(404).json({ error: 'Canteen not found for this owner' });
    }
    const canteenId = canteen._id;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrders,
      pendingOrders,
      completedOrders,
      revenueAgg,
      todayRevenueAgg,
      reviewAgg,
      menuCount,
      recentOrders,
      commissionSetting,
      canteenFinance,
      earningsPerDayAgg
    ] = await Promise.all([
      Order.countDocuments({ canteenId }),
      Order.countDocuments({ canteenId, createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ canteenId, status: { $in: ['pending', 'preparing'] } }),
      Order.countDocuments({ canteenId, status: 'completed' }),
      Order.aggregate([
        { $match: { canteenId: new mongoose.Types.ObjectId(String(canteenId)), status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { 
          $match: { 
            canteenId: new mongoose.Types.ObjectId(String(canteenId)), 
            status: 'completed',
            createdAt: { $gte: startOfToday } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Review.aggregate([
        { $match: { canteenId: new mongoose.Types.ObjectId(String(canteenId)) } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]),
      Menu.countDocuments({ canteenId }),
      Order.find({ canteenId }).sort({ createdAt: -1 }).limit(5),
      Settings.findOne({ key: 'platformCommission' }),
      CanteenFinance.findOne({ canteenId }),
      Order.aggregate([
        { 
          $match: { 
            canteenId: new mongoose.Types.ObjectId(String(canteenId)), 
            status: 'completed',
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            amount: { $sum: "$totalAmount" }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const days = [];
    const safeEarningsAgg = Array.isArray(earningsPerDayAgg) ? earningsPerDayAgg : [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const found = safeEarningsAgg.find(item => item._id === dateStr);
      days.push({ day: dayName, amount: found ? found.amount : 0 });
    }

    let finance = canteenFinance;
    if (!finance) {
      finance = await CanteenFinance.create({ 
        canteenId, 
        organizationId: canteen.organizationId 
      });
    }

    const pendingPayout = finance.grossSales * (1 - finance.commissionPercent / 100) - finance.paidOutAmount;

    const recentActivity = [];
    recentOrders.forEach(o => recentActivity.push({ text: `Order #${o.orderId || o._id} placed`, time: o.createdAt }));

    res.json({
      totalOrders,
      todayOrders,
      pendingOrders,
      completedOrders,
      totalEarnings: revenueAgg[0]?.total || 0,
      todayEarnings: todayRevenueAgg[0]?.total || 0,
      pendingPayout: Math.max(0, Number(pendingPayout.toFixed(2))),
      receivedEarnings: finance.paidOutAmount,
      avgRating: reviewAgg[0]?.avgRating ? parseFloat(reviewAgg[0].avgRating.toFixed(1)) : 0,
      reviewCount: reviewAgg[0]?.count || 0,
      menuCount: menuCount || 0,
      earningsPerDay: days,
      recentActivity: recentActivity.map(a => a.text),
      platformCommission: commissionSetting?.value || 0
    });
  } catch (error) {
    console.error('Error in getCanteenOwnerStats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const [
      totalOrders,
      totalSpent,
      recentOrders,
      favoriteCanteen
    ] = await Promise.all([
      Order.countDocuments({ userId }),
      Order.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(userId) } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.find({ userId }).sort({ createdAt: -1 }).limit(5).populate('canteenId', 'canteenName'),
      Order.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: '$canteenId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
        { $lookup: { from: 'canteens', localField: '_id', foreignField: '_id', as: 'canteen' } },
        { $unwind: '$canteen' },
        { $project: { canteenName: '$canteen.canteenName' } }
      ])
    ]);
    const recentActivity = [];
    recentOrders.forEach(o => recentActivity.push({ text: `Order #${o._id} at ${o.canteenId?.canteenName || 'canteen'}`, time: o.createdAt }));
    res.json({
      totalOrders,
      totalSpent: totalSpent[0]?.total || 0,
      recentActivity: recentActivity.map(a => a.text),
      favoriteCanteen: favoriteCanteen[0]?.canteenName || null
    });
  } catch (error) {
    console.error('Error in getUserStats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getTopCanteens = async (req, res) => {
  try {
    const topCanteens = await Order.aggregate([
      { $group: { _id: '$canteenId', orders: { $sum: 1 } } },
      { $sort: { orders: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'canteens', localField: '_id', foreignField: '_id', as: 'canteen' } },
      { $unwind: '$canteen' },
      { $project: { name: '$canteen.canteenName', orders: 1, _id: 0 } }
    ]);
    res.json(topCanteens);
  } catch (error) {
    console.error('Error in getTopCanteens:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPopularItems = async (req, res) => {
  try {
    const popularItems = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.menuId', sold: { $sum: '$items.quantity' } } },
      { $sort: { sold: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'menus', localField: '_id', foreignField: '_id', as: 'menu' } },
      { $unwind: { path: '$menu', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ['$menu.itemName', 'Unknown Item'] }, sold: 1, _id: 0 } }
    ]);
    res.json(popularItems);
  } catch (error) {
    console.error('Error in getPopularItems:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const saveCommission = async (req, res) => {
  try {
    const { commission } = req.body;
    
    if (commission === undefined || typeof commission !== 'number' || commission < 0 || commission > 100) {
      return res.status(400).json({ message: 'Invalid commission value' });
    }

    await Settings.findOneAndUpdate(
      { key: 'platformCommission' },
      { value: commission },
      { upsert: true, new: true }
    );
    
    res.json({ message: 'Commission updated successfully' });
  } catch (error) {
    console.error('Error in saveCommission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getSuperAdminStats,
  getRevenueStats,
  getOrgAdminStats,
  getCanteenOwnerStats,
  getUserStats,
  getTopCanteens,
  getPopularItems,
  saveCommission
};
