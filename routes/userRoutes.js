const express = require('express');
const upload = require('../middleware/multer'); 
const {
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendOtp,
  getUserProfile,
  updateUserProfile,
  getTotalRegisteredUsers ,
} = require('../controllers/userController');
//  Validation imports
const protect = require('../middleware/authMiddleware');
const { registerValidation, loginValidation } = require('../middleware/validators/userValidator');
const validate = require('../middleware/validators/validate');

const router = express.Router();

router.post('/register', registerValidation, validate, registerUser);
router.post('/login',loginValidation, validate, loginUser);
router.post('/resend-otp', resendOtp);
router.post('/verify-otp', verifyEmail);


//for reset Password
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

//  Profile Routes
router.get('/profile', protect, getUserProfile);
// For profile update with image upload, use multer middleware `upload.single('profileImage')`
router.put('/profile', protect, upload.single('profileImage'), updateUserProfile);

//GET TOTAL USER ROUTE
router.get('/total-registered-users', getTotalRegisteredUsers);

module.exports = router;
