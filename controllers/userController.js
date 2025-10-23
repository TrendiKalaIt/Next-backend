const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { sendOtpEmail } = require('../utils/sendEmail');

// Utility to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); 
};

// Temporary in-memory store 
const tempUsers = {};

// REGISTER USER with OTP
exports.registerUser = async (req, res) => {
  const { name, email, mobile, password } = req.body;

  try {
    // DB me pehle se user hai ya nahi check karo
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Agar OTP already bheja hua hai toh dobara mat bhejo
    if (tempUsers[email]) {
      return res.status(400).json({
        message: "OTP already sent. Please verify your email.",
        redirectToOtp: true
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // User data aur OTP ko temporary store me rakho
    tempUsers[email] = {
      name,
      email,
      mobile,
      password: hashedPassword,
      otp,
      otpExpires,
    };

    // OTP verification email ka HTML (tumhara existing code use karo)
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; background-color: #ffffff;">
          <div style="background-color: #5bbd72; padding: 15px 30px; text-align: start; color: #ffffff;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Verify Your Email</h1>
              <p style="font-size: 16px; margin-top: 15px; line-height: 1.5;">Welcome to Trendikala, ${name.split(' ')[0]}!</p>
              <p style="font-size: 16px; margin-top: 5px; line-height: 1.5;">Please use the OTP below to verify your email address and complete your registration.</p>
          </div>

          <div style="padding: 30px; text-align: center;">
              <h2 style="font-size: 20px; margin-top: 0; margin-bottom: 20px; color: #333;">Your One-Time Password (OTP)</h2>
              <p style="font-size: 32px; font-weight: bold; color: #5bbd72; margin-bottom: 25px; letter-spacing: 5px;">
                  ${otp}
              </p>
              <p style="font-size: 14px; color: #555; line-height: 1.6;">
                  This OTP is valid for <strong>10 minutes</strong>. Please enter it on the verification page to activate your account.
              </p>

              <p style="font-size: 13px; color: #777; margin-top: 30px; line-height: 1.5;">
                  If you did not attempt to register, please ignore this email.
              </p>
          </div>

          <div style="padding: 20px 30px; text-align: center; font-size: 12px; color: #999; background-color: #f8f8f8; border-top: 1px solid #eee;">
              &copy; ${new Date().getFullYear()} Trendikala.
          </div>
      </div>
    `;


    await sendOtpEmail(email, 'Verify Your Email for Trendikala', emailHtml);


    res.status(201).json({ message: "OTP sent to email. Please verify your account." });

  } catch (error) {
    console.error('Register user error:', error);
    res.status(500).json({ error: error.message });
  }
};

// VERIFY EMAIL (OTP)
exports.verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Temporary store se user data lo
    const tempUser = tempUsers[email];
    if (!tempUser) return res.status(404).json({ message: "No registration found for this email" });

    // OTP check karo
    if (tempUser.otp !== otp || tempUser.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // OTP sahi hai, ab DB mein save karo user
    const newUser = new User({
      name: tempUser.name,
      email: tempUser.email,
      mobile: tempUser.mobile,
      password: tempUser.password,
      isVerified: true,
    });

    await newUser.save();

    // Temp data delete karo
    delete tempUsers[email];

    // JWT token create karo
    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: "Email verified and registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: error.message });
  }
};

// RESEND OTP Controller
exports.resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user is already registered and verified
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already verified. Please login." });
    }

    // Check if the user exists in temp store
    const tempUser = tempUsers[email];
    if (!tempUser) {
      return res.status(404).json({ message: "No pending registration found for this email." });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    // Update in temp storage
    tempUsers[email].otp = otp;
    tempUsers[email].otpExpires = otpExpires;

    // Prepare email HTML (same format as before)
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; background-color: #ffffff;">
        <div style="background-color: #5bbd72; padding: 15px 30px; text-align: start; color: #ffffff;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Resend OTP</h1>
          <p style="font-size: 16px; margin-top: 15px;">Hi ${tempUser.name.split(' ')[0]},</p>
          <p style="font-size: 16px; margin-top: 5px;">Here is your new OTP to verify your email with Trendikala:</p>
        </div>

        <div style="padding: 30px; text-align: center;">
          <p style="font-size: 32px; font-weight: bold; color: #5bbd72; margin-bottom: 25px; letter-spacing: 5px;">
            ${otp}
          </p>
          <p style="font-size: 14px; color: #555;">
            This OTP is valid for <strong>10 minutes</strong>.
          </p>
        </div>

        <div style="padding: 20px 30px; text-align: center; font-size: 12px; color: #999; background-color: #f8f8f8;">
          &copy; ${new Date().getFullYear()} Trendikala.
        </div>
      </div>
    `;

  


    await sendOtpEmail(email, 'Resend OTP - Trendikala', emailHtml);


    return res.status(200).json({ message: "OTP resent successfully. Please check your email." });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: error.message });
  }
};



// LOGIN USER
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isVerified) return res.status(401).json({ message: 'Email not verified' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage || null,
      },
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//forgot password 
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = crypto.randomBytes(32).toString('hex');

    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; 
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

    // --- HTML for Password Reset Email - Matching the image design ---
    const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; background-color: #ffffff;">
              

                <div style="padding: 30px; text-align: center;">
                    <h2 style="font-size: 20px; margin-top: 0; margin-bottom: 20px; color: #333;">Reset Your Password</h2>
                    <p style="font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 25px;">
                        If you've lost your password or wish to reset it, click the button below to get started. This link is valid for <strong>15 minutes</strong>.
                    </p>
                    <a href="${resetUrl}" style="display: inline-block; background-color: #5bbd72; color: #ffffff; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-size: 16px; font-weight: bold;">
                        Reset Your Password
                    </a>

                    <p style="font-size: 13px; color: #777; margin-top: 30px; line-height: 1.5;">
                        If you did not request a password reset, you can safely ignore this email. Only a person with access to your email can reset your account password.
                    </p>
                </div>

                <div style="padding: 20px 30px; text-align: center; font-size: 12px; color: #999; background-color: #f8f8f8; border-top: 1px solid #eee;">
                    &copy; ${new Date().getFullYear()} Trendikala.
                </div>
            </div>
        `;

    await sendOtpEmail(user.email, 'Password Reset Request', emailHtml);

    res.status(200).json({ message: 'Reset password link sent to email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // token not expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Check if new password is the same as old one
    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password must be different from the old one' });
    }

    //  Hash and update new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET USER PROFILE
exports.getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('getUserProfile error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};


// UPDATE USER PROFILE
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, mobile, addresses } = req.body;

    if (name) user.name = name;
    if (mobile) user.mobile = mobile;

    // Addresses come as string if sent via form-data, so parse if needed
    if (addresses) {
      if (typeof addresses === 'string') {
        user.addresses = JSON.parse(addresses);
      } else {
        user.addresses = addresses;
      }
    }

    // multer saves file info in req.file
    if (req.file && req.file.path) {
      user.profileImage = req.file.path;
    }

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profileImage: user.profileImage,
        addresses: user.addresses,
      },
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: error.message });
  }
};


//GET TOTAL USERS
exports.getTotalRegisteredUsers = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    res.status(200).json({ totalUsers });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};




