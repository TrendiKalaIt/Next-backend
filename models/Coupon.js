// models/Coupon.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const UsedBySchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  usedAt: { type: Date, default: Date.now }
}, { _id: false });

// Slab subdocument for advanced coupon rules
const SlabSchema = new Schema({
  name: { type: String, required: true },
  min_amount: { type: Number, required: true },
  max_amount: { type: Number, default: null }, // null => no upper limit
  min_items: { type: Number, default: 0 },
  discount_type: { type: String, enum: ['percentage', 'flat'], required: true },
  discount_value: { type: Number, default: 0, },
  free_delivery: { type: Boolean, default: false }
}, { _id: false });

const CouponSchema = new Schema({
  coupon_code: { type: String, required: true, unique: true, uppercase: true, trim: true },

  // Base discount fields (used when no slabs are defined)
  discount_type: { type: String, enum: ['percentage', 'flat'], required: true },
  discount_value: { type: Number, required: true },

  per_user_usage_limit: { type: Number, default: 1 },
  total_coupon_limit: { type: Number, default: 0 }, // 0 => unlimited (or treat as unlimited)
  total_coupon_used: { type: Number, default: 0 },
  expiry_date: { type: Date, required: true },
  coupon_used_by_users: { type: [UsedBySchema], default: [] },

  // Scope & product-level targeting
  scope: { type: String, enum: ['cart', 'product'], default: 'cart' },
  applicable_product: { type: Schema.Types.ObjectId, ref: 'Product', default: null },

  free_delivery_product: { type: Boolean, default: false },
  // Optional slabs for tiered discounts and free delivery
  slabs: { type: [SlabSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', CouponSchema);
