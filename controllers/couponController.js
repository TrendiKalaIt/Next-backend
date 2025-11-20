// controllers/couponController.js

const Coupon = require('../models/Coupon');

// Helper: compute cart-level totals from request items
function computeCartTotals(cartItems) {
  let cartTotal = 0;
  let itemCount = 0;

  for (const item of cartItems) {
    const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
    const unitPrice =
      typeof item.discountPrice === 'number'
        ? item.discountPrice
        : typeof item.price === 'number'
          ? item.price
          : 0;

    const lineTotal = unitPrice * quantity;
    cartTotal += lineTotal;
    itemCount += quantity;
  }

  return { cartTotal, itemCount };
}

// Helper: compute totals for a specific product (for product-scope coupons)
function computeProductTotals(cartItems, productId) {
  let baseAmount = 0;
  let itemsCount = 0;

  // normalize productId to string for comparisons
  const targetId = productId ? productId.toString() : null;

  for (const item of cartItems) {
    // normalize incoming item product id from various possible keys
    let incomingProd = null;
    if (!item) continue;
    if (item.product && (typeof item.product === 'string' || item.product._id)) {
      incomingProd = typeof item.product === 'string' ? item.product : item.product._id;
    } else if (item.productId) {
      incomingProd = item.productId;
    } else if (item._id) {
      incomingProd = item._id;
    } else if (item.id) {
      incomingProd = item.id;
    }

    if (!incomingProd) continue;
    if (!targetId) continue;

    if (incomingProd.toString() !== targetId.toString()) continue;

    const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
    const unitPrice =
      typeof item.discountPrice === 'number'
        ? item.discountPrice
        : typeof item.price === 'number'
          ? item.price
          : 0;

    const lineTotal = unitPrice * quantity;
    baseAmount += lineTotal;
    itemsCount += quantity;
  }

  return { baseAmount, itemsCount };
}


// Helper: find matching slab based on amount and item count
function findMatchingSlab(slabs, baseAmount, itemsCount) {
  const candidates = slabs.filter((slab) => {
    const withinMin = baseAmount >= slab.min_amount;
    const withinMax = slab.max_amount == null || baseAmount <= slab.max_amount;
    const enoughItems = itemsCount >= (slab.min_items || 0);
    return withinMin && withinMax && enoughItems;
  });

  if (!candidates.length) return null;

  // If multiple slabs match (misconfiguration), pick the one with highest min_amount
  candidates.sort((a, b) => (b.min_amount || 0) - (a.min_amount || 0));
  return candidates[0];
}

// POST /api/coupons/apply
// Body: { coupon_code, cartItems: [...], shippingCharge }
exports.applyCouponTest = async (req, res) => {
  try {
    const { coupon_code, cartItems, shippingCharge } = req.body;
    const user = req.user;

    if (!coupon_code) {
      return res.status(400).json({
        valid: false,
        reason: 'MISSING_COUPON_CODE',
        message: 'Coupon code is required',
      });
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        valid: false,
        reason: 'EMPTY_CART',
        message: 'Cart items are required to apply coupon',
      });
    }

    const coupon = await Coupon.findOne({ coupon_code: coupon_code.toUpperCase() }).populate(
      'applicable_product'
    );

    if (!coupon) {
      return res.status(400).json({
        valid: false,
        reason: 'INVALID_CODE',
        message: 'Invalid coupon code',
      });
    }

    const now = new Date();
    if (coupon.expiry_date < now) {
      return res.status(400).json({
        valid: false,
        reason: 'EXPIRED',
        message: 'Coupon has expired',
      });
    }

    if (
      coupon.total_coupon_limit > 0 &&
      coupon.total_coupon_used >= coupon.total_coupon_limit
    ) {
      return res.status(400).json({
        valid: false,
        reason: 'TOTAL_LIMIT_REACHED',
        message: 'Total usage limit for this coupon has been reached',
      });
    }

    const userUsage = coupon.coupon_used_by_users.filter(
      (u) => u.user_id.toString() === user._id.toString()
    );
    if (userUsage.length >= coupon.per_user_usage_limit) {
      return res.status(400).json({
        valid: false,
        reason: 'PER_USER_LIMIT_REACHED',
        message: 'You have already used this coupon the maximum allowed times',
      });
    }

    const { cartTotal, itemCount } = computeCartTotals(cartItems);
    const shipping = typeof shippingCharge === 'number' && shippingCharge >= 0 ? shippingCharge : 0;

    let baseAmount = 0;
    let itemsForScope = 0;
    let appliedScope = coupon.scope || 'cart';

    if (appliedScope === 'cart') {
      baseAmount = cartTotal;
      itemsForScope = itemCount;
    } else if (appliedScope === 'product') {
      if (!coupon.applicable_product) {
        return res.status(400).json({
          valid: false,
          reason: 'INVALID_SCOPE_CONFIG',
          message: 'Product-scope coupon is missing applicable product',
        });
      }

      const { baseAmount: productAmount, itemsCount: productItems } = computeProductTotals(
        cartItems,
        coupon.applicable_product._id
      );

      if (productItems === 0) {
        return res.status(400).json({
          valid: false,
          reason: 'NOT_APPLICABLE_PRODUCT_NOT_IN_CART',
          message: 'Coupon applies to a specific product that is not in the cart',
        });
      }

      baseAmount = productAmount;
      itemsForScope = productItems;
    } else {
      return res.status(400).json({
        valid: false,
        reason: 'UNSUPPORTED_SCOPE',
        message: 'Unsupported coupon scope',
      });
    }

    let appliedSlab = null;
    let discountAmount = 0;
    let freeDeliveryApplied = false;

    if (appliedScope === 'cart' && Array.isArray(coupon.slabs) && coupon.slabs.length > 0) {
      appliedSlab = findMatchingSlab(coupon.slabs, baseAmount, itemsForScope);
      if (!appliedSlab) {
        return res.status(400).json({
          valid: false,
          reason: 'NO_MATCHING_SLAB',
          message: 'No matching discount slab for this cart total and item count',
        });
      }

      if (appliedSlab.discount_type === 'flat') {
        discountAmount = appliedSlab.discount_value;
      } else if (appliedSlab.discount_type === 'percentage') {
        discountAmount = baseAmount * (appliedSlab.discount_value / 100);
      }

      if (discountAmount < 0) discountAmount = 0;
      if (discountAmount > baseAmount) discountAmount = baseAmount;

      freeDeliveryApplied = !!appliedSlab.free_delivery;
    } else {

      // normal base discount
      if (coupon.discount_type === 'flat') {
        discountAmount = coupon.discount_value;
      } else if (coupon.discount_type === 'percentage') {
        discountAmount = baseAmount * (coupon.discount_value / 100);
      }

      if (discountAmount < 0) discountAmount = 0;
      if (discountAmount > baseAmount) discountAmount = baseAmount;

      appliedSlab = null;

      // ⭐ PRODUCT-SCOPE free delivery support
      if (appliedScope === 'product') {
        freeDeliveryApplied = coupon.free_delivery_product || false;
      } else {
        freeDeliveryApplied = false;
      }
    }


    const finalShipping = freeDeliveryApplied ? 0 : shipping;
    const subtotal = cartTotal;
    const grandTotal = Math.max(subtotal - discountAmount + finalShipping, 0);

    return res.status(200).json({
      valid: true,
      coupon_code: coupon.coupon_code,
      appliedScope,
      appliedSlab: appliedSlab
        ? {
          name: appliedSlab.name,
          min_amount: appliedSlab.min_amount,
          max_amount: appliedSlab.max_amount,
          min_items: appliedSlab.min_items,
          discount_type: appliedSlab.discount_type,
          discount_value: appliedSlab.discount_value,
          free_delivery: appliedSlab.free_delivery,
        }
        : null,
      discountAmount,
      freeDeliveryApplied,
      newTotals: {
        subtotal,
        shipping: finalShipping,
        grandTotal,
      },
    });
  } catch (err) {
    return res.status(500).json({
      valid: false,
      reason: 'SERVER_ERROR',
      message: 'Failed to apply coupon',
      error: err.message,
    });
  }
};
