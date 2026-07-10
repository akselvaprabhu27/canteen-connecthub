const FavoriteCart = require("../models/FavoriteCart");

exports.getFavorites = async (req, res) => {
  try {
    const favorites = await FavoriteCart.find({ userId: req.user.id }).sort({ savedAt: -1 });
    // Convert Map to Object for frontend
    const result = favorites.map(f => ({
      ...f._doc,
      items: Object.fromEntries(f.items)
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Error fetching favorites" });
  }
};

exports.addFavorite = async (req, res) => {
  try {
    const { canteenId, canteenName, orgId, items, total, itemCount } = req.body;
    const favorite = new FavoriteCart({
      userId: req.user.id,
      canteenId,
      canteenName,
      orgId,
      items,
      total,
      itemCount
    });
    await favorite.save();
    res.status(201).json(favorite);
  } catch (error) {
    res.status(500).json({ message: "Error saving favorite" });
  }
};

exports.renameFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const { canteenName } = req.body;
    const favorite = await FavoriteCart.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { canteenName },
      { new: true }
    );
    res.json(favorite);
  } catch (error) {
    res.status(500).json({ message: "Error renaming favorite" });
  }
};

exports.deleteFavorite = async (req, res) => {
  try {
    await FavoriteCart.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: "Favorite removed" });
  } catch (error) {
    res.status(500).json({ message: "Error removing favorite" });
  }
};
