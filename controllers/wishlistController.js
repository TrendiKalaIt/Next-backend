

const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');

// Add product to wishlist
exports.addProduct = async (req, res) => {
    const userId = req.user?._id || req.body.userId;
    const { productId } = req.body;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'User ID is required' });
    }

    if (!productId) {
        return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ success: false, message: 'Invalid Product ID format' });
    }

    try {
        let wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            wishlist = new Wishlist({
                user: userId,
                products: [{ product: productId }],
            });
        } else {
            const exists = wishlist.products.some(
                (p) => p.product.toString() === productId
            );

            if (exists) {
                return res.status(400).json({
                    success: false,
                    message: 'Product already in wishlist',
                });
            }

            wishlist.products.push({ product: productId });
        }

        await wishlist.save();

        res.status(201).json({
            success: true,
            message: 'Product added to wishlist',
            data: wishlist,
        });
    } catch (error) {
        console.error("Error in addProduct:", error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message,
        });
    }
};

// Remove product from wishlist
exports.removeProduct = async (req, res) => {
    const userId = req.user?._id || req.body.userId;
    const { productId } = req.params;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'User ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ success: false, message: 'Invalid productId' });
    }

    try {
        const wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            return res.status(404).json({ success: false, message: 'Wishlist not found' });
        }

        const initialLength = wishlist.products.length;
        wishlist.products = wishlist.products.filter(p => p.product.toString() !== productId);

        if (wishlist.products.length === initialLength) {
            return res.status(404).json({ success: false, message: 'Product not found in wishlist' });
        }

        await wishlist.save();

        const updatedWishlist = await Wishlist.findOne({ user: userId }).populate('products.product');

        res.json({ success: true, message: 'Product removed from wishlist', data: updatedWishlist });
    } catch (error) {
        console.error("Error in removeProduct:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all wishlist products for user
// exports.getWishlist = async (req, res) => {
//     const userId = req.user?._id || req.body.userId;

//     if (!userId) {
//         return res.status(401).json({ success: false, message: 'User ID is required' });
//     }

//     try {    
//         const wishlist = await Wishlist.findOne({ user: userId }).populate('products.product').lean();

//         if (!wishlist) {
//             return res.json({ success: true, data: [] });
//         }

//         res.json({ success: true, data: wishlist.products });
//     } catch (error) {
//         console.error("Error in getWishlist:", error);
//         res.status(500).json({ success: false, message: error.message });
//     }
// };
exports.getWishlist = async (req, res) => {
    const userId = req.user?._id || req.body.userId;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'User ID is required' });
    }

    try {
        const wishlist = await Wishlist.findOne({ user: userId })
            .populate({
                path: 'products.product',
                select: 'productName slug category media sizes colors',
                populate: { path: 'category', select: 'name slug' }
            })
            .lean();

        if (!wishlist) {
            return res.json({ success: true, data: [] });
        }

        res.json({ success: true, data: wishlist.products });
    } catch (error) {
        console.error("Error in getWishlist:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

