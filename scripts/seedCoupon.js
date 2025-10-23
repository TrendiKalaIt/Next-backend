require('dotenv').config();
const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');

async function seed() {
  try {
    console.log("Connecting to MongoDB:", process.env.MONGO_URI);

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const coupon = new Coupon({
      coupon_code: 'WELCOME10',
      discount_type: 'percentage',
      discount_value: 10,
      per_user_usage_limit: 1,
      total_coupon_limit: 100,
      expiry_date: new Date('2025-12-31')
    });

    await coupon.save();
    console.log('✅ Coupon Inserted:', coupon);
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error seeding coupon:', err);
    process.exit(1);
  }
}

seed();
