const express = require('express');
const router = express.Router();

const {
  saveAddress,
  getUserAddresses,
  deleteAddress
} = require('../controllers/addressController');
const protect = require('../middleware/authMiddleware');


router.post('/save', protect, saveAddress);
router.get('/my', protect, getUserAddresses);
router.delete('/:id', protect, deleteAddress);

module.exports = router;
