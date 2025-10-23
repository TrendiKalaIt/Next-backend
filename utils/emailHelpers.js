
// emails/emailHelpers.js
exports.getOrderSummaryTable = (orderItems, totalAmount, shippingCost) => {
  // Subtotal (without shipping)
  const subtotal = totalAmount - shippingCost;

  // Discount = (sum of discountPrice * qty) - subtotal
  const totalDiscountPrice = orderItems.reduce((sum, item) => sum + (item.discountPrice * item.quantity), 0);
  const discount = totalDiscountPrice - subtotal;

  const orderItemsTableHtml = orderItems.map(item => `
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 14px;">
        <strong>${item.productName}</strong><br />
        <span style="color: #666; font-size: 13px;">${item.domainName || ''}</span><br />
         ${item.color?`Color : ${item.color}` : ''}${item.size?` | Size : ${item.size}` : ''}
      </td>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 14px;">
        ${item.quantity} ${item.unit || 'Unit'}
      </td>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px;">
        ₹${(item.discountPrice * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-family: Arial, sans-serif; border: 1px solid #ddd;">
      <thead>
        <tr>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: left; background-color: #f8f8f8; font-size: 14px; color: #555;">Product</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: center; background-color: #f8f8f8; font-size: 14px; color: #555;">Quantity</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: right; background-color: #f8f8f8; font-size: 14px; color: #555;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${orderItemsTableHtml}
        <tr>
          <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; font-size: 14px; border: 1px solid #ddd;">Subtotal:</td>
          <td style="padding: 10px; text-align: right; font-size: 14px; border: 1px solid #ddd;">₹${subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; font-size: 14px; border: 1px solid #ddd; color: green;">Discount:</td>
          <td style="padding: 10px; text-align: right; font-size: 14px; border: 1px solid #ddd; color: green;">- ₹${discount.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; font-size: 14px; border: 1px solid #ddd;">Shipping:</td>
          <td style="padding: 10px; text-align: right; font-size: 14px; border: 1px solid #ddd;">₹${shippingCost.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; font-size: 16px; border: 1px solid #ddd;">Total:</td>
          <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 16px; border: 1px solid #ddd;">₹${totalAmount.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  `;
};
