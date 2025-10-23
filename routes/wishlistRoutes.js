const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const authMiddleware = require('../middleware/authMiddleware');

// Add product to wishlist - user ID from token
router.post('/', authMiddleware, wishlistController.addProduct);

// Remove product from wishlist - user ID from token
router.delete('/:productId', authMiddleware, wishlistController.removeProduct);

// Get all wishlist products for the logged-in user
router.get('/', authMiddleware, wishlistController.getWishlist);

// // Check if a product is in wishlist for logged-in user
// router.get('/check/:productId', authMiddleware, wishlistController.checkProduct);

// // Clear entire wishlist for logged-in user
// router.delete('/clear', authMiddleware, wishlistController.clearWishlist);

module.exports = router;
