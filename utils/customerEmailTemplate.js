// emails/customerEmailTemplate.js
const { getOrderSummaryTable } = require('./emailHelpers');

exports.generateCustomerEmail = (order, shippingInfo, orderItems, paymentMethod, totalAmount, shippingCost) => {
  const orderSummaryTable = getOrderSummaryTable(orderItems, totalAmount, shippingCost);

  return `
    <div style="font-family: Arial; max-width: 600px; margin: auto; background-color: #fff; border: 1px solid #ddd;">
      <div style="background-color: #bedaa4; padding: 20px; color: white;">
        <h1>Thanks for your order, ${shippingInfo.fullName.split(' ')[0]}</h1>
        <p>Your order number is <strong>${order.orderId}</strong></p>
        <p><strong>Payment Method:</strong>${paymentMethod}</p>
      </div>
      <div style="padding: 20px;">
        ${orderSummaryTable}
      </div>
      <div style="background-color: #f5f5f5; text-align: center; padding: 15px; font-size: 12px; color: #999;">
        &copy; ${new Date().getFullYear()} Trendikala
      </div>
    </div>
  `;
};
