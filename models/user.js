const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  fullName: String,
  streetAddress: String,
  apartment: String,
  townCity: String,
  state: String,
  zipcode: {
    type: String,
    required: true,
    match: [/^\d{6}$/, 'Please enter a valid 6-digit PIN code'],
  },
  phoneNumber: String,
  emailAddress: String,
}, { _id: true });

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  otp: String,
  otpExpires: Date,
  isVerified: { type: Boolean, default: false },
  profileImage: { type: String, default: "" },
  addresses: [addressSchema],
  createdAt: { type: Date, default: Date.now },
  //for reset password 
  resetPasswordToken: String,
  resetPasswordExpires: Date,

});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = User;
