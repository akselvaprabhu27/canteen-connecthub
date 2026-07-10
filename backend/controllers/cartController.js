const Cart = require("../models/Cart");

exports.getCarts = async (req, res) => {
  try {
    const carts = await Cart.find({ userId: req.user.id });
    // Transform to the object format expected by frontend: { [canteenId]: { items, name, orgId } }
    const result = {};
    carts.forEach(c => {
      result[c.canteenId] = {
        items: Object.fromEntries(c.items),
        name: c.name,
        orgId: c.orgId
      };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Error fetching carts" });
  }
};

exports.updateCart = async (req, res) => {
  try {
    const { canteenId, orgId, name, items } = req.body;
    
    if (Object.keys(items || {}).length === 0) {
      await Cart.findOneAndDelete({ userId: req.user.id, canteenId });
      return res.json({ message: "Cart removed" });
    }

    const cart = await Cart.findOneAndUpdate(
      { userId: req.user.id, canteenId },
      { orgId, name, items },
      { upsert: true, new: true }
    );
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Error updating cart" });
  }
};

exports.deleteCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ userId: req.user.id, canteenId: req.params.canteenId });
    res.json({ message: "Cart deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting cart" });
  }
};
