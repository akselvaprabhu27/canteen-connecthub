const mongoose = require('mongoose');
const OrganizationMessage = require('../models/OrganizationMessage');
const Organization = require('../models/Organization');
const Canteen = require('../models/Canteen');
const User = require('../models/User');

// @desc    Send a message from organization to canteens
// @route   POST /api/messages/send
// @access  OrgAdmin
exports.sendMessage = async (req, res) => {
  try {
    const { canteenIds, title, message, priority } = req.body;
    let organizationId = req.user.organizationId;

    // Fallback if organizationId is not on the user object
    if (!organizationId) {
      const org = await Organization.findOne({ adminId: req.user._id });
      if (org) organizationId = org._id;
    }

    if (!organizationId) {
      return res.status(400).json({ message: "User is not associated with any organization" });
    }

    if (!canteenIds || !Array.isArray(canteenIds) || canteenIds.length === 0) {
      return res.status(400).json({ message: "No canteens selected" });
    }

    const messages = [];

    for (const canteenId of canteenIds) {
      const canteen = await Canteen.findById(canteenId);
      if (!canteen) continue;

      const newMessage = await OrganizationMessage.create({
        senderId: req.user._id,
        receiverId: canteen.ownerId,
        organizationId,
        canteenId,
        title,
        message,
        priority
      });
      messages.push(newMessage);
    }

    res.status(201).json({ message: "Messages sent successfully", count: messages.length });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Reply to a message
// @route   POST /api/messages/reply
// @access  Private
exports.replyMessage = async (req, res) => {
  try {
    let { canteenId, organizationId, title, message, priority, receiverId } = req.body;

    // Fallback for organizationId
    if (!organizationId) {
      if (req.user.role === 'org_admin' || req.user.role === 'super_admin') {
        const org = await Organization.findOne({ adminId: req.user._id });
        if (org) organizationId = org._id;
      } else {
        // For canteen owner, find the organizationId from the canteen
        const canteen = await Canteen.findById(canteenId);
        if (canteen) organizationId = canteen.organizationId;
      }
    }

    // Fallback for receiverId if not provided (find the other party in the thread)
    if (!receiverId) {
      const lastMsg = await OrganizationMessage.findOne({ canteenId }).sort({ createdAt: -1 });
      if (lastMsg) {
        receiverId = lastMsg.senderId.toString() === req.user._id.toString() 
          ? lastMsg.receiverId 
          : lastMsg.senderId;
      }
    }

    if (!organizationId || !canteenId || !receiverId) {
      return res.status(400).json({ 
        message: "Missing required fields for reply", 
        details: { organizationId: !!organizationId, canteenId: !!canteenId, receiverId: !!receiverId } 
      });
    }

    const newMessage = await OrganizationMessage.create({
      senderId: req.user._id,
      receiverId,
      organizationId,
      canteenId,
      title,
      message,
      priority: priority || 'Medium'
    });

    const populatedMessage = await OrganizationMessage.findById(newMessage._id).populate('senderId', 'name role');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error in replyMessage:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get messages for a specific canteen-org thread
// @route   GET /api/messages/thread/:canteenId
// @access  Private
exports.getMessageThread = async (req, res) => {
  try {
    const { canteenId } = req.params;
    let organizationId = req.user.organizationId || req.query.organizationId;

    if (!organizationId) {
      const org = await Organization.findOne({ adminId: req.user._id });
      if (org) organizationId = org._id;
    }

    if (!organizationId) {
      return res.status(400).json({ message: "Organization ID not found" });
    }

    const messages = await OrganizationMessage.find({
      canteenId,
      organizationId
    }).sort({ createdAt: 1 }).populate('senderId', 'name role');

    res.json(messages);
  } catch (error) {
    console.error("Error in getMessageThread:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all message threads for an organization
// @route   GET /api/messages/org/threads
// @access  OrgAdmin
exports.getOrgThreads = async (req, res) => {
  try {
    let organizationId = req.user.organizationId;
    if (!organizationId) {
      const org = await Organization.findOne({ adminId: req.user._id });
      if (org) organizationId = org._id;
    }

    if (!organizationId) {
      return res.status(400).json({ message: "Organization ID not found" });
    }
    
    // Group by canteenId to get latest message from each canteen
    const threads = await OrganizationMessage.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      { $sort: { createdAt: -1 } },
      { $group: {
          _id: "$canteenId",
          latestMessage: { $first: "$$ROOT" },
          unreadCount: { 
            $sum: { 
              $cond: [
                { $and: [
                  { $eq: ["$isRead", false] },
                  { $ne: ["$senderId", req.user._id] }
                ]}, 
                1, 
                0
              ] 
            }
          }
      }},
      { $lookup: {
          from: 'canteens',
          localField: '_id',
          foreignField: '_id',
          as: 'canteen'
      }},
      { $unwind: { path: '$canteen', preserveNullAndEmptyArrays: true } }
    ]);

    // Filter out threads without a valid canteen (in case of orphan messages)
    const validThreads = threads.filter(t => t.canteen);

    res.json(validThreads);
  } catch (error) {
    console.error("Error in getOrgThreads:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get inbox for canteen
// @route   GET /api/messages/canteen/inbox
// @access  CanteenOwner
exports.getCanteenInbox = async (req, res) => {
  try {
    // Find canteens owned by this user
    const canteens = await Canteen.find({ ownerId: req.user._id });
    const canteenIds = canteens.map(c => c._id);

    const messages = await OrganizationMessage.find({
      canteenId: { $in: canteenIds }
    }).sort({ createdAt: -1 }).populate('senderId', 'name role');

    res.json(messages);
  } catch (error) {
    console.error("Error in getCanteenInbox:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:canteenId
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { canteenId } = req.params;
    let organizationId = req.user.organizationId || req.query.organizationId;

    if (!organizationId) {
      const org = await Organization.findOne({ adminId: req.user._id });
      if (org) organizationId = org._id;
    }

    await OrganizationMessage.updateMany(
      { 
        canteenId, 
        organizationId, 
        receiverId: req.user._id,
        isRead: false 
      },
      { $set: { isRead: true } }
    );

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error in markAsRead:", error);
    res.status(500).json({ message: "Server error" });
  }
};
