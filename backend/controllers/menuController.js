const Menu = require("../models/Menu");

const addMenuItem = async (req, res) => {
  try {
    const { canteenId, itemName, price, category, quantity } = req.body;
    const menu = await Menu.create({ canteenId, itemName, price, category, quantity });
    res.status(201).json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMenuByCanteen = async (req, res) => {
  try {
    const menu = await Menu.find({ canteenId: req.params.canteenId });
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const menu = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    await Menu.findByIdAndDelete(req.params.id);
    res.json({ message: "Item removed from menu" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addMenuItem, getMenuByCanteen, updateMenuItem, deleteMenuItem };
