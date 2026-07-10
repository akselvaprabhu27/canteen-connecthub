const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/canteenhub")
    .then(async () => {
        const usersCol = mongoose.connection.db.collection("users");

        // Find how many users exist
        const totalUsers = await usersCol.countDocuments({});

        // Delete all users EXCEPT those with role "super_admin" or email "admin@canteenhub.com"
        const result = await usersCol.deleteMany({
            role: { $ne: "super_admin" },
            email: { $ne: "admin@canteenhub.com" }
        });

        console.log(`Deletion complete. Found ${totalUsers} users.`);
        console.log(`Deleted ${result.deletedCount} non-superadmin accounts.`);

        const remainingUsers = await usersCol.find({}).toArray();
        console.log("Remaining Accounts:");
        remainingUsers.forEach(u => console.log(`- ${u.role}: ${u.email}`));

        process.exit(0);
    })
    .catch(err => {
        console.error("Database connection failed:", err.message);
        process.exit(1);
    });
