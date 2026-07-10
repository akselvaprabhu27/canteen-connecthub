const FoodReport = require("../models/FoodReport");
const ReportResponse = require("../models/ReportResponse");
const CanteenStrike = require("../models/CanteenStrike");
const Canteen = require("../models/Canteen");
const Organization = require("../models/Organization");
const Fine = require("../models/Fine");
const Settings = require("../models/Settings");
const mongoose = require("mongoose");

// Helper to calculate deadline based on severity (Updated for testing: 3 minutes for all reports)
const getDeadline = (severity) => {
  const now = new Date();
  return new Date(now.getTime() + 3 * 60 * 1000); // 3 minutes
};

const checkAndApplyFines = async (report) => {
  const now = new Date();
  if (report.status === "Resolved" || report.status === "Rejected") return report;

  let fineAmount = 100; // Default
  const setting = await Settings.findOne({ key: "fineAmount" });
  if (setting) fineAmount = Number(setting.value);

  let updated = false;

  // Case 1: Pending -> Overdue (Investigation)
  if (report.status === "Pending" && now > report.deadline && !report.investigationFineIssued) {
    const fineId = "FN" + Math.floor(100000 + Math.random() * 900000);
    const fine = new Fine({
      fineId,
      reportId: report._id,
      organizationId: report.organizationId,
      amount: fineAmount,
      reason: "Failed to start investigation in time"
    });
    await fine.save();
    report.investigationFineIssued = true;
    updated = true;

    // Send automatic message
    const response = new ReportResponse({
      reportId: report._id,
      senderRole: "system",
      senderId: report.organizationId,
      senderRoleRef: "Organization",
      message: `System: Fine issued of ${fineAmount} for missing the investigation deadline. Please click 'Investigation' to proceed and avoid further fines.`,
    });
    await response.save();
  }

  // Case 2: Under Investigation -> Overdue (Resolution)
  if (report.status === "Under Investigation" && now > report.deadline && !report.resolutionFineIssued) {
    const fineId = "FN" + Math.floor(100000 + Math.random() * 900000);
    const fine = new Fine({
      fineId,
      reportId: report._id,
      organizationId: report.organizationId,
      amount: fineAmount,
      reason: "Failed to resolve report in time"
    });
    await fine.save();
    report.resolutionFineIssued = true;
    updated = true;

    // Send automatic message with pay fine instruction
    const response = new ReportResponse({
      reportId: report._id,
      senderRole: "system",
      senderId: report.organizationId,
      senderRoleRef: "Organization",
      message: `System: Fine issued of ${fineAmount} for missing the resolution deadline. Please pay your fine and resolve the report immediately.`,
    });
    await response.save();
  }

  if (updated) {
    await report.save();
  }
  return report;
};

exports.createReport = async (req, res) => {
  try {
    console.log("Report Submission Body:", req.body);
    let { orderId, canteenId, organizationId, issueType, description, photos, contactPreference } = req.body;
    
    // If IDs are missing, try to fetch them from the order
    if (orderId && (!canteenId || !organizationId)) {
      const Order = require("../models/Order");
      const order = await Order.findById(orderId);
      if (order) {
        canteenId = canteenId || order.canteenId;
        organizationId = organizationId || order.organizationId;
      }
    }

    if (!canteenId || !organizationId) {
      return res.status(400).json({ message: "Canteen ID and Organization ID are required" });
    }

    const reportId = "RP" + Math.floor(100000 + Math.random() * 900000);
    
    const report = new FoodReport({
      reportId,
      userId: req.user.id,
      orderId,
      canteenId,
      organizationId,
      issueType,
      severity: "Normal",
      description,
      photos,
      contactPreference,
      deadline: getDeadline("Normal")
    });

    await report.save();

    res.status(201).json({ message: "Report submitted successfully", report });
  } catch (error) {
    console.error("Report Creation Error:", error);
    res.status(500).json({ message: "Error submitting report", error: error.message });
  }
};

exports.getUserReports = async (req, res) => {
  try {
    const reports = await FoodReport.find({ userId: req.user.id })
      .populate("canteenId", "canteenName")
      .sort("-createdAt");
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reports", error: error.message });
  }
};

exports.getOrgReports = async (req, res) => {
  try {
    // Find the organization managed by this admin
    const org = await Organization.findOne({ adminId: req.user.id });
    if (!org) {
      return res.status(404).json({ message: "Organization not found for this admin" });
    }

    // Org Admin sees all reports for their organization
    const reports = await FoodReport.find({
      organizationId: org._id
    })
      .populate("userId", "name email")
      .populate("canteenId", "canteenName")
      .sort("-createdAt");
    
    // Check fines for each report
    for (let report of reports) {
      await checkAndApplyFines(report);
    }

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Error fetching organization reports", error: error.message });
  }
};

exports.getCanteenOwnerReports = async (req, res) => {
  try {
    // Find the canteen owned by this user
    const canteen = await Canteen.findOne({ ownerId: req.user.id });
    if (!canteen) {
      return res.status(404).json({ message: "Canteen not found for this owner" });
    }

    // Canteen owner sees all reports for their canteen
    const reports = await FoodReport.find({
      canteenId: canteen._id
    })
      .populate("userId", "name email")
      .populate("canteenId", "canteenName")
      .sort("-createdAt");

    for (let report of reports) {
      await checkAndApplyFines(report);
    }

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Error fetching canteen owner reports", error: error.message });
  }
};

exports.getAdminReports = async (req, res) => {
  try {
    // Superadmin sees all reports
    const reports = await FoodReport.find()
      .populate("userId", "name email")
      .populate("canteenId", "canteenName")
      .populate("organizationId", "name")
      .sort("-createdAt");
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Error fetching all reports", error: error.message });
  }
};

exports.getReportDetails = async (req, res) => {
  try {
    let report = await FoodReport.findById(req.params.id)
      .populate("userId", "name email phone")
      .populate("canteenId", "canteenName")
      .populate("organizationId", "name")
      .populate("orderId");
    
    if (report) {
      report = await checkAndApplyFines(report);
    }
    
    const responses = await ReportResponse.find({ reportId: req.params.id })
      .sort("createdAt");

    const fines = await Fine.find({ reportId: req.params.id });

    res.json({ report, responses, fines });
  } catch (error) {
    res.status(500).json({ message: "Error fetching report details", error: error.message });
  }
};

exports.addResponse = async (req, res) => {
  try {
    const { message, attachments } = req.body;
    const response = new ReportResponse({
      reportId: req.params.id,
      senderRole: req.user.role,
      senderId: req.user.id,
      senderRoleRef: req.user.role === 'user' ? 'User' : (req.user.role === 'canteen_owner' ? 'User' : (req.user.role === 'org_admin' ? 'Organization' : 'SuperAdmin')),
      message,
      attachments
    });

    await response.save();

    // If org admin, super admin, or canteen owner responds, update status to 'Under Investigation' if it was 'Pending'
    const report = await FoodReport.findById(req.params.id);
    if (report.status === "Pending" && (req.user.role === "org_admin" || req.user.role === "super_admin" || req.user.role === "canteen_owner")) {
      report.status = "Under Investigation";
      await report.save();
    }

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ message: "Error adding response", error: error.message });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    let updateData = { status };
    
    // If moving to investigation, reset the timer/deadline
    if (status === "Under Investigation") {
      const currentReport = await FoodReport.findById(req.params.id);
      if (currentReport) {
        updateData.deadline = getDeadline(currentReport.severity);
      }
    }

    const report = await FoodReport.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate("userId", "name email phone")
      .populate("canteenId", "canteenName")
      .populate("organizationId", "name");
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: "Error updating status", error: error.message });
  }
};

exports.getReportAnalytics = async (req, res) => {
  try {
    const stats = await FoodReport.aggregate([
      {
        $group: {
          _id: "$issueType",
          count: { $sum: 1 }
        }
      }
    ]);

    const severityStats = await FoodReport.aggregate([
      {
        $group: {
          _id: "$severity",
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = await FoodReport.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({ issueTypes: stats, severity: severityStats, status: statusStats });
  } catch (error) {
    res.status(500).json({ message: "Error fetching analytics", error: error.message });
  }
};

exports.getHighReportedCanteens = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let reportQuery = {
      createdAt: { $gte: sevenDaysAgo }
    };

    if (req.user.role === 'org_admin') {
      const org = await Organization.findOne({ adminId: req.user.id });
      if (!org) {
        return res.status(404).json({ message: "Organization not found for this admin" });
      }
      reportQuery.organizationId = org._id;
    }

    const reports = await FoodReport.find(reportQuery);
    const canteenGroups = {};

    for (const report of reports) {
      if (!report.canteenId) continue;
      const canteenIdStr = report.canteenId.toString();
      if (!canteenGroups[canteenIdStr]) {
        canteenGroups[canteenIdStr] = {
          canteenId: report.canteenId,
          reports: [],
          users: new Set(),
          pendingCount: 0,
          investigatingCount: 0,
          resolvedCount: 0,
          rejectedCount: 0
        };
      }
      
      canteenGroups[canteenIdStr].reports.push(report);
      if (report.userId) {
        canteenGroups[canteenIdStr].users.add(report.userId.toString());
      }
      
      if (report.status === "Pending") {
        canteenGroups[canteenIdStr].pendingCount++;
      } else if (report.status === "Under Investigation") {
        canteenGroups[canteenIdStr].investigatingCount++;
      } else if (report.status === "Resolved") {
        canteenGroups[canteenIdStr].resolvedCount++;
      } else if (report.status === "Rejected") {
        canteenGroups[canteenIdStr].rejectedCount++;
      }
    }

    const highReportedList = [];
    for (const key in canteenGroups) {
      const group = canteenGroups[key];
      if (group.users.size >= 5) {
        const canteen = await Canteen.findById(group.canteenId);
        if (canteen) {
          highReportedList.push({
            canteenId: canteen._id,
            canteenName: canteen.canteenName,
            logoUrl: canteen.logoUrl,
            isBlocked: canteen.isBlocked,
            blockReason: canteen.blockReason,
            blockedBy: canteen.blockedBy,
            totalReports: group.reports.length,
            uniqueUsers: group.users.size,
            pendingCount: group.pendingCount,
            investigatingCount: group.investigatingCount,
            resolvedCount: group.resolvedCount,
            rejectedCount: group.rejectedCount
          });
        }
      }
    }

    res.json(highReportedList);
  } catch (error) {
    console.error("Error in getHighReportedCanteens:", error);
    res.status(500).json({ message: "Error fetching high reported canteens", error: error.message });
  }
};

