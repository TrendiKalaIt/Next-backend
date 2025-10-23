// utils/sendEmail.js
const { otpTransporter, orderTransporter } = require('../config/email');

const sendOtpEmail = async (to, subject, html) => {
  try {
    const info = await otpTransporter.sendMail({
      from: `"TrendiKala OTP" <${process.env.OTP_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`OTP Email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.error(' Failed to send OTP email:', error);
  }
};

const sendOrderEmail = async (to, subject, html) => {
  try {
    const info = await orderTransporter.sendMail({
      from: `"TrendiKala Orders" <${process.env.ORDER_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`Order Email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.error(' Failed to send Order email:', error);
  }
};

module.exports = { sendOtpEmail, sendOrderEmail };
