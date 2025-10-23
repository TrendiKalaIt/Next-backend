const crypto = require('crypto');
const Razorpay = require('razorpay');

const Order = require('../models/Order');
const Product = require('../models/Product.js');
const { generateCustomerEmail } = require('../utils/customerEmailTemplate.js');
const { generateAdminEmail } = require('../utils/adminEmailTemplate.js');
const { sendOrderEmail } = require('../utils/sendEmail');

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
});

// Create Razorpay order
exports.createOrder = async (req, res) => {
    let { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
    }

    try {
        const amountInPaise = Math.round(parseFloat(amount) * 1);

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `receipt_order_${Date.now()}`,
        };

        const order = await razorpayInstance.orders.create(options);

        return res.status(200).json(order);
    } catch (error) {
        console.error('Razorpay order error:', error);
        return res.status(500).json({ message: 'Failed to create Razorpay order' });
    }
};

// Verify Razorpay payment signature
exports.verifyPayment = async (req, res) => {
    console.log("Razorpay verifyPayment: req.user =", req.user);
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderPayload,
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderPayload) {
            return res.status(400).json({ success: false, message: 'Missing payment or order details' });
        }

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Invalid Razorpay signature' });
        }

        // Extract order data
        let {
            shippingInfo,
            items,
            shippingCost = 0,
            totalAmount,
        } = orderPayload;

        // Convert to numbers safely
        shippingCost = Number(shippingCost) || 0;
        totalAmount = Number(totalAmount) || 0;

        // Generate incremental orderId
        const lastOrder = await Order.findOne().sort({ orderId: -1 }).select('orderId');
        const nextOrderId = (lastOrder && lastOrder.orderId ? lastOrder.orderId : 0) + 1;
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(400).json({ success: false, message: `Product not found.` });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Product "${product.productName}" is out of stock or has only ${product.stock} left.`,
                });
            }
        }
        // Save order
        const newOrder = new Order({
            user: req.user?._id || null,
            isGuest: true,
            items,
            shippingInfo,
            paymentMethod: 'Razorpay',
            shippingCost,
            totalAmount,
            shippingOption: 'fixed_12_percent_delivery',
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            isPaid: true,
            paidAt: new Date(),
            paymentStatus: 'Paid',
            orderId: nextOrderId,
        });

        await newOrder.save();


        // *** Stock update logic ***
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) continue;

            product.stock = Math.max(product.stock - item.quantity, 0);

            await product.save();
        }


        // Generate emails — pass numbers (no toFixed here)
        const customerEmailHtml = generateCustomerEmail(
            newOrder,
            shippingInfo,
            items,
            'Razorpay',
            Number(totalAmount),
            Number(shippingCost)
        );

        const adminEmailHtml = generateAdminEmail(
            newOrder,
            shippingInfo,
            items,
            'Razorpay',
            totalAmount,
            shippingCost
        );

        // Send emails
        await sendOrderEmail(
            shippingInfo.emailAddress,
            `Your TrendiKala Order #${newOrder.orderId} Confirmed!`,
            customerEmailHtml
        );

        if (process.env.ADMIN_EMAIL) {
            await sendOrderEmail(
                process.env.ADMIN_EMAIL,
                `NEW RAZORPAY ORDER: ${newOrder.orderId}`,
                adminEmailHtml
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Payment verified, order placed and emails sent',
            order: newOrder,
        });

    } catch (error) {
        console.error('Error in verifyPayment:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during Razorpay verification',
            error: error.message,
        });
    }
};
