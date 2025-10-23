const { generateCustomerEmail } = require('../utils/customerEmailTemplate.js');
const { generateAdminEmail } = require('../utils/adminEmailTemplate.js');

const Order = require('../models/Order.js');
const Cart = require('../models/Cart.js');
const { sendOrderEmail } = require('../utils/sendEmail');
const Counter = require('../models/counterSchema');
const Product = require('../models/Product.js');
const Coupon = require('../models/Coupon.js')


const dotenv = require('dotenv');
dotenv.config();


// exports.placeOrder = async (req, res) => {
//     try {
//         const userId = req.user._id;
//         const { shippingInfo, paymentMethod, items, shippingCost, totalAmount } = req.body;

//         let orderItems;
//         if (items && Array.isArray(items) && items.length > 0) {
//             orderItems = items;
//         } else {
//             const cart = await Cart.findOne({ user: userId });
//             if (!cart || cart.items.length === 0) {
//                 return res.status(400).json({ message: 'Cart is empty' });
//             }
//             orderItems = cart.items;
//         }

//         //  Validate stock before placing the order
//         for (const item of orderItems) {
//             const product = await Product.findById(item.product);
//             if (!product) {
//                 return res.status(400).json({ message: 'Product not found' });
//             }

//             const sizeEntry = product.sizes.find(s => s.size === item.size);
//             if (!sizeEntry) {
//                 return res.status(400).json({ message: `Selected size "${item.size}" not available for product "${product.productName}"` });
//             }

//             if (sizeEntry.stock < item.quantity) {
//                 return res.status(400).json({
//                     message: `Product "${product.productName}" (Size: ${item.size}) has only ${sizeEntry.stock} left.`,
//                 });
//             }
//         }

//         // Create new order
//         const newOrder = new Order({
//             user: userId,
//             items: orderItems,
//             shippingInfo,
//             paymentMethod,
//             shippingCost,
//             totalAmount,
//             shippingOption: 'fixed_12_percent_delivery',
//             paymentStatus: paymentMethod === 'Razorpay' ? 'Paid' : 'Pending',
//         });


//         await newOrder.save();

//         // Update stock for each product in the order
//         for (const item of orderItems) {
//             const product = await Product.findById(item.product);
//             if (!product) continue;

//             const sizeEntry = product.sizes.find(s => s.size === item.size);
//             if (sizeEntry) {
//                 sizeEntry.stock = Math.max(sizeEntry.stock - item.quantity, 0);
//             }

//             await product.save();
//         }

//         // Clear cart if items were taken from cart
//         if (!items || items.length === 0) {
//             await Cart.findOneAndDelete({ user: userId });
//         }

//         // Generate emails
//         const customerEmailHtml = generateCustomerEmail(
//             newOrder,
//             shippingInfo,
//             orderItems,
//             paymentMethod,
//             Number(totalAmount),
//             Number(shippingCost)
//         );
//         const adminEmailHtml = generateAdminEmail(newOrder, shippingInfo, orderItems, paymentMethod, totalAmount, shippingCost);

//         // Send emails
//         await sendOrderEmail(shippingInfo.emailAddress, `Your TrendiKala Order ${newOrder.orderId} Confirmed!`, customerEmailHtml);
//         if (process.env.ADMIN_EMAIL) {
//             await sendOrderEmail(process.env.ADMIN_EMAIL, `NEW ORDER: ${newOrder.orderId} from ${shippingInfo.fullName}`, adminEmailHtml);
//         }

//         res.status(201).json({ message: 'Order placed successfully and emails sent', order: newOrder });
//     } catch (err) {
//         console.error('Order placement error:', err);
//         res.status(500).json({ message: 'Failed to place order', error: err.message });
//     }
// };

exports.placeOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingInfo, paymentMethod, items, shippingCost, totalAmount, coupon_code } = req.body;

    let orderItems;
    if (items && Array.isArray(items) && items.length > 0) {
      orderItems = items;
    } else {
      const cart = await Cart.findOne({ user: userId });
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
      orderItems = cart.items;
    }

    // ✅ Validate stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ message: "Product not found" });
      }

      const sizeEntry = product.sizes.find((s) => s.size === item.size);
      if (!sizeEntry) {
        return res.status(400).json({
          message: `Selected size "${item.size}" not available for product "${product.productName}"`,
        });
      }

      if (sizeEntry.stock < item.quantity) {
        return res.status(400).json({
          message: `Product "${product.productName}" (Size: ${item.size}) has only ${sizeEntry.stock} left.`,
        });
      }
    }

    // ✅ Handle Coupon (only if applied)
    let appliedCoupon = null;
    if (coupon_code) {
      appliedCoupon = await Coupon.findOne({ coupon_code });
      if (!appliedCoupon) {
        return res.status(400).json({ message: "Invalid coupon code" });
      }

      // check expiry
      if (appliedCoupon.expiry_date < new Date()) {
        return res.status(400).json({ message: "Coupon expired" });
      }

      // check total limit
      if (appliedCoupon.total_coupon_used >= appliedCoupon.total_coupon_limit) {
        return res.status(400).json({ message: "Coupon usage limit reached" });
      }

      // check per-user limit
      const userUsage = appliedCoupon.coupon_used_by_users.filter(
        (u) => u.user_id.toString() === userId.toString()
      );
      if (userUsage.length >= appliedCoupon.per_user_usage_limit) {
        return res.status(400).json({ message: "You have already used this coupon" });
      }
    }

    // ✅ Create order
    const newOrder = new Order({
      user: userId,
      items: orderItems,
      shippingInfo,
      paymentMethod,
      shippingCost,
      totalAmount,
      shippingOption: "fixed_12_percent_delivery",
      paymentStatus: paymentMethod === "Razorpay" ? "Paid" : "Pending",
      coupon: coupon_code || null, // save coupon reference in order
    });

    await newOrder.save();

    // ✅ Update stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      const sizeEntry = product.sizes.find((s) => s.size === item.size);
      if (sizeEntry) {
        sizeEntry.stock = Math.max(sizeEntry.stock - item.quantity, 0);
      }

      await product.save();
    }

    // ✅ Update coupon usage (only if order successful)
    if (appliedCoupon) {
      appliedCoupon.total_coupon_used += 1;
      appliedCoupon.coupon_used_by_users.push({
        user_id: userId,
        order_id: newOrder._id,
      });
      await appliedCoupon.save();
    }

    // ✅ Clear cart if needed
    if (!items || items.length === 0) {
      await Cart.findOneAndDelete({ user: userId });
    }

    // ✅ Emails
    const customerEmailHtml = generateCustomerEmail(
      newOrder,
      shippingInfo,
      orderItems,
      paymentMethod,
      Number(totalAmount),
      Number(shippingCost)
    );
    const adminEmailHtml = generateAdminEmail(
      newOrder,
      shippingInfo,
      orderItems,
      paymentMethod,
      totalAmount,
      shippingCost
    );

    await sendOrderEmail(
      shippingInfo.emailAddress,
      `Your TrendiKala Order ${newOrder.orderId} Confirmed!`,
      customerEmailHtml
    );
    if (process.env.ADMIN_EMAIL) {
      await sendOrderEmail(
        process.env.ADMIN_EMAIL,
        `NEW ORDER: ${newOrder.orderId} from ${shippingInfo.fullName}`,
        adminEmailHtml
      );
    }

    res
      .status(201)
      .json({ message: "Order placed successfully and emails sent", order: newOrder });
  } catch (err) {
    console.error("Order placement error:", err);
    res.status(500).json({ message: "Failed to place order", error: err.message });
  }
};


exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user._id;

        const orders = await Order.find({ user: userId })
            .sort({ createdAt: -1 }) // most recent first
            .lean();

        res.status(200).json({ orders });
    } catch (err) {
        console.error('Failed to fetch user orders:', err);
        res.status(500).json({ message: 'Failed to get orders', error: err.message });
    }
};


//GET TOTAL REVENUE
exports.getTotalRevenue = async (req, res) => {
    try {
        const result = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" }
                }
            }
        ]);

        const totalRevenue = result[0]?.totalRevenue || 0;
        res.status(200).json({ totalRevenue });
    } catch (error) {
        console.error("Error calculating total revenue:", error);
        res.status(500).json({ message: "Server error" });
    }
};


//GET TOTAL CUSTOMERS
exports.getTotalCustomers = async (req, res) => {
    try {
        const uniqueUsers = await Order.distinct('user', { user: { $ne: null } });
        const totalCustomers = uniqueUsers.length;
        res.status(200).json({ totalCustomers });
    } catch (error) {
        console.error("Error fetching total customers:", error);
        res.status(500).json({ message: "Server error" });
    }
};
