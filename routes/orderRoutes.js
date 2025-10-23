const express = require('express');
const { placeOrder, getMyOrders, getTotalCustomers, getTotalRevenue } = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/place', authMiddleware, placeOrder);
router.get('/my-orders', authMiddleware, getMyOrders);
router.get('/total-revenue', getTotalRevenue);
router.get('/total-customers', getTotalCustomers);


module.exports = router;
