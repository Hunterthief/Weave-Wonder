// EmailJS Configuration - Initialize with your public key
// You need to set this up at https://www.emailjs.com/
emailjs.init("vob8IbRr130DYlPqt"); // Your actual EmailJS public key

/**
 * Formats the order data into a clean HTML email template
 * @param {Object} data - Order data object
 * @returns {string} - Formatted HTML email content
 */
function formatOrderEmail(data) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order - Weave Wonder</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background-color: #f8f9fa; }
            .section { margin-bottom: 20px; }
            .section h3 { color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .item { display: flex; justify-content: space-between; margin: 10px 0; }
            .label { font-weight: 600; }
            .value { color: #555; }
            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
            .product-image { max-width: 150px; height: auto; margin: 10px 0; border: 1px solid #ddd; }
            .highlight { background-color: #e3f2fd; padding: 10px; border-radius: 4px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Weave Wonder</h1>
                <p>New Order Received</p>
            </div>
            
            <div class="content">
                <div class="section">
                    <h3>Customer Information</h3>
                    <div class="item"><span class="label">Name:</span> <span class="value">${data.name}</span></div>
                    <div class="item"><span class="label">Phone:</span> <span class="value">${data.phone}</span></div>
                    ${data.secondaryPhone ? `<div class="item"><span class="label">Secondary Phone:</span> <span class="value">${data.secondaryPhone}</span></div>` : ''}
                    <div class="item"><span class="label">Governorate:</span> <span class="value">${data.governorate}</span></div>
                    <div class="item"><span class="label">Address:</span> <span class="value">${data.address}</span></div>
                    ${data.deliveryNotes ? `<div class="item"><span class="label">Delivery Notes:</span> <span class="value">${data.deliveryNotes}</span></div>` : ''}
                </div>
                
                <div class="section">
                    <h3>Order Details</h3>
                    <div class="item"><span class="label">Product:</span> <span class="value">${data.productType}</span></div>
                    <div class="item"><span class="label">Color:</span> <span class="value">${data.color || 'Not specified'}</span></div>
                    <div class="item"><span class="label">Size:</span> <span class="value">${data.size || 'Not selected'}</span></div>
                    <div class="item"><span class="label">Quantity:</span> <span class="value">${data.quantity}</span></div>
                </div>
                
                <div class="section">
                    <h3>Payment Summary</h3>
                    <div class="item"><span class="label">Product Price:</span> <span class="value">${data.productPrice.toFixed(2)} EGP</span></div>
                    <div class="item"><span class="label">Shipping Cost:</span> <span class="value">${data.shippingCost.toFixed(2)} EGP</span></div>
                    <div class="item"><span class="label" style="font-size: 1.1em;">Total:</span> <span class="value" style="font-size: 1.1em; color: #e74c3c;">${data.totalPrice.toFixed(2)} EGP</span></div>
                </div>
                
                <div class="section">
                    <h3>Design Information</h3>
                    ${data.hasFrontDesign ? `
                        <div class="highlight">
                            <strong>Front Design:</strong> Uploaded
                            <img src="${data.frontDesignUrl}" alt="Front Design" class="product-image">
                        </div>
                    ` : '<p>No front design uploaded.</p>'}
                    
                    ${data.hasBackDesign ? `
                        <div class="highlight">
                            <strong>Back Design:</strong> Uploaded
                            <img src="${data.backDesignUrl}" alt="Back Design" class="product-image">
                        </div>
                    ` : '<p>No back design uploaded.</p>'}

                    ${!data.hasFrontDesign && !data.hasBackDesign ? `
                        <div class="warning">
                            <strong>⚠️ Warning:</strong> No designs were uploaded for this order. 
                            The product will be printed without any custom design unless the customer uploads one later.
                            Please contact the customer to confirm if they want a plain product.
                        </div>
                    ` : ''}
                </div>
                
                <div class="footer">
                    <p>This email was generated automatically by Weave Wonder's ordering system.</p>
                    <p>&copy; 2025 Weave Wonder. All rights reserved.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Sends an order email using EmailJS
 * @param {Object} data - Order data object
 * @returns {Promise} - Promise that resolves when email is sent
 */
async function sendOrderEmail(data) {
  try {
    // Format the email content
    const emailContent = formatOrderEmail(data);
        console.log('Email content being sent:', emailContent); // Add this debug line
    // Prepare EmailJS parameters
    const templateParams = {
      to_email: "hassanwaelhh@proton.me", // Your email address
      from_name: data.name,
      from_email: "noreply@weavewonder.com",
      subject: `New Order - ${data.productType}`,
      message_html: emailContent,
      product_type: data.productType,
      color: data.color,
      size: data.size,
      quantity: data.quantity,
      total_price: data.totalPrice.toFixed(2),
      customer_name: data.name,
      phone: data.phone,
      governorate: data.governorate,
      address: data.address,
      delivery_notes: data.deliveryNotes,
      has_front_design: data.hasFrontDesign ? 'Yes' : 'No',
      has_back_design: data.hasBackDesign ? 'Yes' : 'No'
    };
    
    // Send email using EmailJS
    const response = await emailjs.send(
      "service_f0illrv", // Your EmailJS service ID
      "template_em0s82a", // Your EmailJS template ID
      templateParams
    );
    
    console.log('Email sent successfully:', response.status, response.text);
    return true;
    
  } catch (error) {
    console.error('Failed to send email:', error);
    alert('There was an error sending your order. Please contact support.');
    return false;
  }
}

/**
 * Validates if the user has uploaded at least one design
 * @returns {boolean} - True if at least one design is uploaded
 */
function hasDesignUploaded() {
  const frontLayer = document.getElementById('front-layer');
  const backLayer = document.getElementById('back-layer');
  return frontLayer.querySelector('.design-image') !== null || 
         backLayer.querySelector('.design-image') !== null;
}

/**
 * Shows a confirmation dialog when user tries to submit without designs
 * @returns {Promise<boolean>} - Resolves to true if user confirms submission
 */
function confirmNoDesignSubmission() {
  return new Promise((resolve) => {
    const confirmed = confirm(
      "You haven't uploaded any designs.\n\n" +
      "The product will be printed without any custom design.\n\n" +
      "Are you sure you want to proceed with a plain product?"
    );
    resolve(confirmed);
  });
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sendOrderEmail,
    formatOrderEmail,
    hasDesignUploaded,
    confirmNoDesignSubmission
  };
}
