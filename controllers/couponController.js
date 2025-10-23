// controllers/couponController.js

const Coupon = require('../models/Coupon');

exports.applyCouponTest = async (req, res) => {
  try {
    const { coupon_code } = req.body;
    const user = req.user;

    if (!coupon_code) {
      return res.status(400).json({ success: false, message: "Coupon code is required" });
    }

    const coupon = await Coupon.findOne({ coupon_code });
    if (!coupon) {
      return res.status(400).json({ success: false, message: "Invalid coupon" });
    }

    if (coupon.expiry_date < new Date()) {
      return res.status(400).json({ success: false, message: "Coupon expired" });
    }

    if (
      coupon.total_coupon_limit > 0 &&
      coupon.total_coupon_used >= coupon.total_coupon_limit
    ) {
      return res.status(400).json({ success: false, message: "Total usage limit reached" });
    }

    const userUsage = coupon.coupon_used_by_users.filter(
      (u) => u.user_id.toString() === user._id.toString()
    );
    if (userUsage.length >= coupon.per_user_usage_limit) {
      return res.status(400).json({ success: false, message: "Per user usage limit reached" });
    }

    return res.json({
      success: true,
      message: "Coupon valid",
      coupon: {
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
