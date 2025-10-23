const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Utility to get product image
const getProductImage = (product) => {
  if (product.thumbnail && product.thumbnail.trim() !== '') return product.thumbnail;
  if (product.media && product.media.length > 0) return product.media[0].url;
  return '';
};

// Get user's cart
exports.getUserCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) return res.status(200).json({ items: [] });
    res.status(200).json({ items: cart.items });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching cart', error: err.message });
  }
};

// Add or update items in cart
exports.addToCart = async (req, res) => {
  try {
    const user = req.user._id;
    const { items, shippingOption } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Invalid request format: items must be an array" });
    }

    let cart = await Cart.findOne({ user }) || new Cart({ user, items: [] });

    for (const incomingItem of items) {
      const { product: productId, quantity, color, size } = incomingItem;

      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ message: `Product not found: ${productId}` });

      const sizeObj = product.sizes.find(s => s.size === size);
      if (!sizeObj) return res.status(400).json({ message: `Invalid size selected: ${size}` });

      // Find existing item by _id or product+color+size
      let existingItem = incomingItem._id ? cart.items.id(incomingItem._id) : null;
      if (!existingItem) {
        existingItem = cart.items.find(i =>
          i.product.equals(product._id) &&
          i.color === color &&
          i.size === size
        );
      }

      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.discountPrice = sizeObj.discountPrice || sizeObj.price;
        existingItem.productName = product.productName;
        existingItem.image = getProductImage(product);
        existingItem.color = color;
        existingItem.size = size;
      } else {
        cart.items.push({
          _id: new mongoose.Types.ObjectId(),
          product: product._id,
          quantity,
          discountPrice: sizeObj.discountPrice || sizeObj.price,
          productName: product.productName,
          image: getProductImage(product),
          color,
          size
        });
      }
    }

    cart.shippingOption = shippingOption || cart.shippingOption || 'free';
    cart.updatedAt = Date.now();
    await cart.save();

    cart = await cart.populate('items.product');
    res.status(200).json({ message: 'Cart updated successfully', cart: { items: cart.items } });
  } catch (err) {
    res.status(500).json({ message: 'Error updating cart', error: err.message });
  }
};

// Update quantity or size/color of cart item
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity, color, size } = req.body;

    if (quantity < 1) return res.status(400).json({ message: 'Quantity must be at least 1' });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    let item = cart.items.id(itemId) || cart.items.find(i => i._id && i._id.toString() === itemId);
    if (!item) return res.status(404).json({ message: 'Item not found in cart' });

    if (quantity) item.quantity = quantity;
    if (color) item.color = color;
    if (size) {
      item.size = size;
      // Update discountPrice according to the new size
      const product = await Product.findById(item.product);
      const sizeObj = product.sizes.find(s => s.size === size);
      if (!sizeObj) return res.status(400).json({ message: `Invalid size selected: ${size}` });
      item.discountPrice = sizeObj.discountPrice || sizeObj.price;
    }

    await cart.save();
    cart = await cart.populate('items.product');
    res.status(200).json({ message: 'Cart item updated', cart: { items: cart.items } });
  } catch (err) {
    res.status(500).json({ message: 'Error updating cart item', error: err.message });
  }
};

// Remove single cart item
exports.removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    if (!itemId) return res.status(400).json({ message: 'ItemId param missing' });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();

    cart = await cart.populate('items.product');
    res.status(200).json({ message: 'Item removed', cart: { items: cart.items } });
  } catch (err) {
    res.status(500).json({ message: 'Error removing item', error: err.message });
  }
};

// Clear entire cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOneAndDelete({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found or already empty' });

    res.status(200).json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Error clearing cart', error: err.message });
  }
};
