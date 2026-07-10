const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const Organization = require("./models/Organization");
const Canteen = require("./models/Canteen");
const Menu = require("./models/Menu");

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const seedDB = async () => {
    try {
        await User.deleteMany({});
        await Organization.deleteMany({});
        await Canteen.deleteMany({});
        await Menu.deleteMany({});

        console.log("Cleared existing data.");

        // 1. Create Users
        const superAdmin = await User.create({ name: "Super Admin", email: "admin@canteenhub.com", password: "password", role: "super_admin" });
        const orgAdmin = await User.create({ name: "IIT Admin", email: "admin@iit.com", password: "password", role: "org_admin" });
        const canteenOwner = await User.create({ name: "Ramesh", email: "ramesh@canteen.com", password: "password", role: "canteen_owner" });
        const regUser = await User.create({ name: "Student", email: "user@iit.com", password: "password", role: "user" });

        console.log("Users created.");

        // 2. Create Organization
        const org1 = await Organization.create({
            name: "IIT Delhi",
            type: "College",
            location: "New Delhi",
            adminId: orgAdmin._id,
            commissionPercentage: 10
        });

        const org2 = await Organization.create({
            name: "TCS Techpark",
            type: "Company",
            location: "Bangalore",
            adminId: orgAdmin._id,
            commissionPercentage: 12
        });

        console.log("Organizations created.");

        // 3. Create Canteen
        const canteen1 = await Canteen.create({
            organizationId: org1._id,
            canteenName: "Main Cafeteria",
            category: "General",
            ownerId: canteenOwner._id
        });

        const canteen2 = await Canteen.create({
            organizationId: org1._id,
            canteenName: "Green Leaf Veg",
            category: "Veg",
            ownerId: canteenOwner._id
        });

        console.log("Canteens created.");

        // 4. Create Menu Items
        await Menu.insertMany([
            { canteenId: canteen1._id, itemName: "Paneer Butter Masala", price: 120, category: "Veg" },
            { canteenId: canteen1._id, itemName: "Chicken Biryani", price: 180, category: "Non-Veg" },
            { canteenId: canteen1._id, itemName: "Masala Dosa", price: 60, category: "Veg" },
            { canteenId: canteen1._id, itemName: "Cold Coffee", price: 50, category: "Beverage" },
            { canteenId: canteen2._id, itemName: "Veg Thali", price: 100, category: "Veg" },
            { canteenId: canteen2._id, itemName: "Samosa", price: 20, category: "Veg" }
        ]);

        console.log("Menu created.");
        console.log("Database seeded successfully!");
        process.exit();
    } catch (error) {
        console.error("Error with data import:", error);
        process.exit(1);
    }
};

seedDB();
