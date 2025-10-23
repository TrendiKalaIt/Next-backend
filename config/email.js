const nodemailer = require("nodemailer");

const otpTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.OTP_EMAIL,
    pass: process.env.OTP_EMAIL_PASS,
  },
});

const orderTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ORDER_EMAIL,
    pass: process.env.ORDER_EMAIL_PASS,
  },
});

module.exports = { otpTransporter, orderTransporter };
