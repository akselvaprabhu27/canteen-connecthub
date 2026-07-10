const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Canteen = require("../models/Canteen");
const mongoose = require("mongoose");

const getCanteenWallet = async (req, res) => {
  try {
    const canteenId = req.params.canteenId;
    
    // Calculate total earned by this canteen
    // We need to join Payment with Order to filter by canteenId
    
    const earnings = await Payment.aggregate([
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "orderData"
        }
      },
      { $unwind: "$orderData" },
      { $match: { "orderData.canteenId": new mongoose.Types.ObjectId(canteenId) } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$canteenAmount" },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    if (earnings.length === 0) {
      return res.json({ totalEarnings: 0, totalOrders: 0 });
    }

    res.json(earnings[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrganizationWallet = async (req, res) => {
  try {
    const organizationId = req.params.orgId;
    
    const earnings = await Payment.aggregate([
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "orderData"
        }
      },
      { $unwind: "$orderData" },
      { $match: { "orderData.organizationId": new mongoose.Types.ObjectId(organizationId) } },
      {
        $group: {
          _id: null,
          totalCommission: { $sum: "$organizationCommission" },
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    if (earnings.length === 0) {
      return res.json({ totalCommission: 0, totalRevenue: 0, totalOrders: 0 });
    }

    res.json(earnings[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCanteenWallet, getOrganizationWallet };
