const Fine = require("../models/Fine");
const FoodReport = require("../models/FoodReport");
const Organization = require("../models/Organization");
const ReportResponse = require("../models/ReportResponse");
const Settings = require("../models/Settings");

exports.getAllFines = async (req, res) => {
  try {
    const fines = await Fine.find()
      .populate({
        path: "reportId",
        populate: { path: "userId", select: "name email" }
      })
      .populate("organizationId", "name")
      .sort("-createdAt");
    res.json(fines);
  } catch (error) {
    res.status(500).json({ message: "Error fetching all fines", error: error.message });
  }
};

exports.getOrgFines = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminId: req.user.id });
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const fines = await Fine.find({ organizationId: org._id })
      .populate({
        path: "reportId",
        populate: { path: "userId", select: "name email" }
      })
      .sort("-createdAt");
    res.json(fines);
  } catch (error) {
    res.status(500).json({ message: "Error fetching organization fines", error: error.message });
  }
};

exports.cancelFine = async (req, res) => {
  try {
    const fine = await Fine.findByIdAndUpdate(
      req.params.id,
      { status: "Cancelled" },
      { new: true }
    );
    res.json({ message: "Fine cancelled successfully", fine });
  } catch (error) {
    res.status(500).json({ message: "Error cancelling fine", error: error.message });
  }
};

exports.payFine = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const fine = await Fine.findById(req.params.id);
    if (!fine) return res.status(404).json({ message: "Fine not found" });

    fine.status = "Paid";
    fine.paidAt = new Date();
    fine.transactionId = transactionId || "TEST_TX_" + Date.now();
    await fine.save();

    // Add a message to the report conversation
    const response = new ReportResponse({
      reportId: fine.reportId,
      senderRole: "org_admin",
      senderId: req.user.id,
      senderRoleRef: "Organization",
      message: `System: Fine of ${fine.amount} has been PAID for report ${fine.reportId}.`,
    });
    await response.save();

    res.json({ message: "Fine paid successfully", fine });
  } catch (error) {
    res.status(500).json({ message: "Error paying fine", error: error.message });
  }
};

exports.getFineSettings = async (req, res) => {
  try {
    let setting = await Settings.findOne({ key: "fineAmount" });
    if (!setting) {
      setting = new Settings({ key: "fineAmount", value: 100 });
      await setting.save();
    }
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: "Error fetching fine settings", error: error.message });
  }
};

exports.updateFineSettings = async (req, res) => {
  try {
    const { amount } = req.body;
    let setting = await Settings.findOne({ key: "fineAmount" });
    if (!setting) {
      setting = new Settings({ key: "fineAmount", value: amount });
    } else {
      setting.value = amount;
    }
    await setting.save();
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: "Error updating fine settings", error: error.message });
  }
};
