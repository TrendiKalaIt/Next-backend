// utils/orderEmailTemplates.js
function generateOrderEmails(newOrder, shippingInfo, paymentMethod, items, shippingCost, totalAmount) {
  const orderItemsTableHtml = items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: left; vertical-align: top; font-size: 16px;">
        <strong>${item.productName}</strong><br />
        <span style="font-size: 14px; color: #555;">
          ${item.color ? `Color: ${item.color}` : ''}
          ${item.color && item.size ? ', ' : ''}
          ${item.size ? `Size: ${item.size}` : ''}
        </span>
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; vertical-align: top; font-size: 16px;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; vertical-align: top; font-size: 16px;">₹${item.discountPrice.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; vertical-align: top; font-size: 16px;">₹${(item.quantity * item.discountPrice).toFixed(2)}</td>
    </tr>
  `).join('');

  const orderSummaryTableStructure = `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left; font-size: 17px;">Item</th>
          <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center; font-size: 17px;">Qty</th>
          <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-size: 17px;">Price</th>
          <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-size: 17px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${orderItemsTableHtml}
        <tr style="background-color: #eaf7ed;">
          <td colspan="3" style="padding: 8px; text-align: left; font-weight: bold; font-size: 16px;">Subtotal:</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; font-size: 16px;">₹${(totalAmount - shippingCost).toFixed(2)}</td>
        </tr>
        <tr style="background-color: #eaf7ed;">
          <td colspan="3" style="padding: 8px; text-align: left; font-weight: bold; font-size: 16px;">Delivery Charge:</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; font-size: 16px;">₹${shippingCost.toFixed(2)}</td>
        </tr>
        <tr style="background-color: #eaf7ed;">
          <td colspan="3" style="padding: 8px; text-align: left; font-weight: bold; font-size: 18px;">Total Amount:</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; font-size: 18px; color: #4CAF50;">₹${totalAmount.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  `;

  const shippingDetailsHtml = `
    <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; font-size: 16px;">
      <p style="margin: 0; font-size: 17px;"><strong>${shippingInfo.fullName}</strong></p>
      <p style="margin: 8px 0; font-size: 16px;">${shippingInfo.streetAddress}${shippingInfo.apartment ? ', ' + shippingInfo.apartment : ''}</p>
      <p style="margin: 8px 0; font-size: 16px;">${shippingInfo.townCity}, ${shippingInfo.state || ''}, ${shippingInfo.zipCode || ''}</p>
      <p style="margin: 8px 0; font-size: 16px;">Phone: ${shippingInfo.phoneNumber}</p>
      <p style="margin: 8px 0 0; font-size: 16px;">Email: ${shippingInfo.emailAddress}</p>
    </div>
  `;

  const customerEmailHtml = `
    <div style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.8; color: #333; max-width: 650px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; background-color: #ffffff; font-size: 17px;">
      <div style="background-color: #4CAF50; color: #ffffff; padding: 25px; text-align: center;">
        <h1 style="margin: 0; font-size: 32px;">TrendiKala</h1>
        <p style="margin: 8px 0 0; font-size: 20px;">Order Confirmation</p>
      </div>

      <div style="padding: 25px;">
        <h2 style="color: #2E7D32; font-size: 26px; margin-top: 0; margin-bottom: 20px;">Hi ${shippingInfo.fullName}, thank you for your order!</h2>
        <p style="margin-bottom: 25px; font-size: 17px;">Your order <strong style="color: #007bff;">${newOrder.orderId}</strong> has been successfully placed with TrendiKala. We're excited for you to receive your items!</p>

        <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
          <p style="font-size: 18px; margin-bottom: 8px;"><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="font-size: 18px; margin-top: 8px;"><strong>Payment Method:</strong> ${paymentMethod}</p>
        </div>

        <h3 style="font-size: 20px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 20px;">🧾 Order Summary</h3>
        ${orderSummaryTableStructure}

        <h3 style="font-size: 20px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 20px;">📦 Shipping Details</h3>
        ${shippingDetailsHtml}

        <p style="margin-top: 35px; text-align: center; font-size: 16px; color: #666;">
          We’ll send you another email with tracking information once your order has shipped.<br/>
          For any questions, please contact our support team.
        </p>
      </div>

      <div style="background-color: #f2f2f2; padding: 20px; text-align: center; font-size: 14px; color: #777; border-top: 1px solid #e0e0e0;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} TrendiKala. All rights reserved.</p>
        <p style="margin: 8px 0 0;">
          <a href="[Your Website Link]" style="color: #007bff; text-decoration: none;">Visit Our Store</a> |
          <a href="[Your Privacy Policy Link]" style="color: #007bff; text-decoration: none;">Privacy Policy</a>
        </p>
      </div>
    </div>
  `;

  const adminEmailHtml = `
    <div style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.8; color: #333; max-width: 650px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; background-color: #ffffff; font-size: 17px;">
      <div style="background-color: #DC3545; color: #ffffff; padding: 25px; text-align: center;">
        <h1 style="margin: 0; font-size: 32px;">TrendiKala Admin</h1>
        <p style="margin: 8px 0 0; font-size: 20px;">New Order Notification</p>
      </div>

      <div style="padding: 25px;">
        <h2 style="color: #DC3545; font-size: 26px; margin-top: 0; margin-bottom: 20px;">New Order Received!</h2>
        <p style="margin-bottom: 25px; font-size: 17px;">An order has been placed by <strong style="color: #007bff;">${shippingInfo.fullName}</strong>.</p>

        <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
          <p style="font-size: 18px; margin-bottom: 8px;"><strong>Order ID:</strong> <span style="color: #007bff;">${newOrder.orderId}</span></p>
          <p style="font-size: 18px; margin-bottom: 8px;"><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="font-size: 18px; margin-top: 8px;"><strong>Payment Method:</strong> ${paymentMethod}</p>
        </div>

        <h3 style="font-size: 20px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 20px;">🧾 Order Details</h3>
        ${orderSummaryTableStructure}

        <h3 style="font-size: 20px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 20px;">📦 Customer & Shipping Information</h3>
        ${shippingDetailsHtml}

        <p style="margin-top: 35px; text-align: center; font-size: 16px; color: #666;">
          Please process this order promptly.
        </p>
      </div>

      <div style="background-color: #f2f2f2; padding: 20px; text-align: center; font-size: 14px; color: #777; border-top: 1px solid #e0e0e0;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} TrendiKala Admin. All rights reserved.</p>
      </div>
    </div>
  `;

  return { customerEmailHtml, adminEmailHtml };
}

module.exports = { generateOrderEmails };
