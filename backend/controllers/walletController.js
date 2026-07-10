const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");

const getWalletDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('walletBalance');
    if (!user) return res.status(404).json({ message: "User not found" });

    const transactions = await WalletTransaction.find({ userId: req.user.id }).sort({ createdAt: -1 });

    res.json({
      walletBalance: user.walletBalance,
      transactions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const topUpWallet = async (req, res) => {
  try {
    const { amount, description } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid top-up amount" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update wallet balance
    user.walletBalance += amount;
    await user.save();

    // Create transaction
    const transaction = await WalletTransaction.create({
      userId: req.user.id,
      amount,
      type: 'credit',
      status: 'success',
      description: description || `Added money to wallet`
    });

    res.status(200).json({
      message: "Wallet topped up successfully",
      walletBalance: user.walletBalance,
      transaction
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWalletDetails,
  topUpWallet
};
