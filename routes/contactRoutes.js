const express = require('express');
const { sendMessage } = require('../controllers/contactController');

const router = express.Router();

// Contact form submission
router.post('/', sendMessage);

module.exports = router;
