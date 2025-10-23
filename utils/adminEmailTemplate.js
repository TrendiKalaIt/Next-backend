// emails/adminEmailTemplate.js
const { getOrderSummaryTable } = require('./emailHelpers');

exports.generateAdminEmail = (order, shippingInfo, orderItems, paymentMethod, totalAmount, shippingCost) => {
  const orderSummaryTable = getOrderSummaryTable(orderItems, totalAmount, shippingCost);

  return `
    <div style="font-family: Arial; max-width: 600px; margin: auto; border: 1px solid #ccc;">
      <div style="background-color: #bedaa4; padding: 15px; text-align: center; color: white;">
        <h2>New Order - ${order.orderId}</h2>
      </div>
      <div style="padding: 20px;">
        <p><strong>Order ID:</strong> ${order.orderId}</p>
        <p><strong>Payment Method:</strong> ${paymentMethod}</p>
        ${orderSummaryTable}
        <h3>Customer & Shipping Information:</h3>
        <p><strong>Name:</strong>${shippingInfo.fullName}</p>
        <p><strong>Phone:</strong>${shippingInfo.phoneNumber}</p>
        <p><strong>Email:</strong>${shippingInfo.emailAddress}</p>
        <p><strong>Address:</strong>${shippingInfo.streetAddress}${shippingInfo.apartment}, ${shippingInfo.townCity}, ${shippingInfo.state} - ${shippingInfo.zipcode}</p>

      </div>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #e0e0e0;">
        &copy; ${new Date().getFullYear()} Trendikala Admin.
      </div>
    </div>
  `;
};
