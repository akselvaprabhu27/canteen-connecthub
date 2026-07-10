const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/canteenhub")
    .then(async () => {
        const usersCol = mongoose.connection.db.collection("users");
        const users = await usersCol.find({}).toArray();
        console.log("----- DATABASE EMAIL ACCOUNTS -----");
        users.forEach(u => {
            console.log(`Role: ${u.role}\nEmail: ${u.email}\nName: ${u.name}\n`);
        });
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
