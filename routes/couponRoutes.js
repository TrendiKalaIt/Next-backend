const express = require("express");
const router = express.Router();
const { applyCouponTest } = require("../controllers/couponController");
const auth = require("../middleware/authMiddleware"); // make sure JWT middleware laga ho

// POST /api/coupons/apply
router.post("/apply", auth, applyCouponTest);

module.exports = router;
