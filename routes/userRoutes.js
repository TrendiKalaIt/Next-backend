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
  getTotalRegisteredUsers,
} = require('../controllers/userController');
//  Validation imports
const protect = require('../middleware/authMiddleware');
const { registerValidation, loginValidation } = require('../middleware/validators/userValidator');
const validate = require('../middleware/validators/validate');

const passport = require("passport");
require("../config/passport");


const router = express.Router();

router.post('/register', registerValidation, validate, registerUser);
router.post('/login', loginValidation, validate, loginUser);
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

// Redirect user to Google for auth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Callback URL after Google login
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.CLIENT_URL}/signin` }),
  (req, res) => {
    console.log(" Google login success for:", req.user.email);

    const jwt = require("jsonwebtoken");
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Redirect user to frontend with JWT token in URL
    res.redirect(`${process.env.CLIENT_URL}/google-success?token=${token}`);
  }
);

module.exports = router;
