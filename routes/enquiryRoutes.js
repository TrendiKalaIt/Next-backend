const express = require('express');
const router = express.Router();
const { sendEnquiry } = require('../controllers/enquiryController');
const multer = require('multer');
 
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/send-enquiry', upload.single('image'), sendEnquiry);
 
module.exports = router;