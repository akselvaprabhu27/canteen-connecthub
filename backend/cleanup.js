const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("./models/User");
const Order = require("./models/Order");
const WalletTransaction = require("./models/WalletTransaction");
const PayoutHistory = require("./models/PayoutHistory");
const Payment = require("./models/Payment");
const Review = require("./models/Review");
const CanteenFinance = require("./models/CanteenFinance");
const OrganizationWallet = require("./models/OrganizationWallet");
const PaymentRequest = require("./models/PaymentRequest");
const Fine = require("./models/Fine");
const CanteenStrike = require("./models/CanteenStrike");
const CanteenWarning = require("./models/CanteenWarning");
const Canteen = require("./models/Canteen");
const FoodItemReview = require("./models/FoodItemReview");
const FoodReport = require("./models/FoodReport");
const ReportResponse = require("./models/ReportResponse");
const Cart = require("./models/Cart");
const FavoriteCart = require("./models/FavoriteCart");
const OrganizationMessage = require("./models/OrganizationMessage");

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/canteenhub");
    console.log("Connected to MongoDB for cleanup...");

    // 1. Delete all transactional records
    console.log("Deleting orders, transactions, payouts, payments, reviews, fines, strikes, warnings, reports, messages, and carts...");
    await Order.deleteMany({});
    await WalletTransaction.deleteMany({});
    await PayoutHistory.deleteMany({});
    await Payment.deleteMany({});
    await Review.deleteMany({});
    await FoodItemReview.deleteMany({});
    await PaymentRequest.deleteMany({});
    await Fine.deleteMany({});
    await CanteenStrike.deleteMany({});
    await CanteenWarning.deleteMany({});
    await FoodReport.deleteMany({});
    await ReportResponse.deleteMany({});
    await Cart.deleteMany({});
    await FavoriteCart.deleteMany({});
    await OrganizationMessage.deleteMany({});

    // 2. Reset user wallet balances and clear lastOrderId
    console.log("Resetting user wallet balances to 0 and clearing last order IDs...");
    await User.updateMany({}, { 
      $set: { walletBalance: 0 },
      $unset: { lastOrderId: 1 }
    });

    // 3. Reset CanteenFinance metrics
    console.log("Resetting canteen financial metrics to 0...");
    await CanteenFinance.updateMany({}, {
      $set: {
        todayOrders: 0,
        overallOrders: 0,
        todayRevenue: 0,
        overallRevenue: 0,
        grossSales: 0,
        pendingPayout: 0,
        paidOutAmount: 0
      }
    });

    // 4. Reset OrganizationWallet metrics
    console.log("Resetting organization wallet metrics to 0...");
    await OrganizationWallet.updateMany({}, {
      $set: {
        balance: 0,
        totalRevenue: 0,
        realizedEarnings: 0,
        pendingPayouts: 0
      }
    });

    // 5. Unblock all canteens and clear rejection reasons
    console.log("Unblocking canteens and resetting block/rejection states...");
    await Canteen.updateMany({}, {
      $set: {
        isBlocked: false,
        blockReason: "",
        orgRejectionReason: "",
        adminRejectionReason: ""
      },
      $unset: {
        blockedBy: 1
      }
    });

    console.log("Cleanup completed successfully. The application is now fresh.");
    process.exit(0);
  } catch (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  }
};

cleanup();

