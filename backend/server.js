const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Routes
const authRoutes = require("./routes/authRoutes");
const orgRoutes = require("./routes/orgRoutes");
const canteenRoutes = require("./routes/canteenRoutes");
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const walletRoutes = require("./routes/walletRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const orgFinanceRoutes = require("./routes/orgFinanceRoutes");
const cartRoutes = require("./routes/cartRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const itemReviewRoutes = require("./routes/itemReviewRoutes");
const messageRoutes = require("./routes/messageRoutes");
const paymentRequestRoutes = require("./routes/paymentRequestRoutes");
const reportRoutes = require("./routes/reportRoutes");
const fineRoutes = require("./routes/fineRoutes");
app.use("/api/auth", authRoutes);
app.use("/api/organizations", orgRoutes);
app.use("/api/canteens", canteenRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/org-finance", orgFinanceRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/item-reviews", itemReviewRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/payment-requests", paymentRequestRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/fines", fineRoutes);

// Connect to MongoDB
const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
      console.log("MongoDB connected to", uri);
    } catch (err) {
      console.log("Could not connect to MongoDB at", uri, "- Starting fallback persistent MongoDB...");
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, 'data');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath);
      }
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create({
        instance: {
          dbPath: dbPath
        }
      });
      uri = mongoServer.getUri();
      await mongoose.connect(uri);
      console.log("Persistent Local MongoDB connected at", dbPath);
    }
  } catch (err) {
    console.error("Critical MongoDB connection error:", err);
  }
};
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
