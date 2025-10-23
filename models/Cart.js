const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  discountPrice: {
    type: Number,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  color: {
    type: String
  },
  size: {
    type: String  
  }
}, { _id: true }); 

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  shippingOption: {
    type: String,
    enum: ['free', 'express', 'pickup'],
    default: 'free'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
