// EmailJS Configuration - Initialize with your public key
emailjs.init("vob8IbRr130DYlPqt"); // Your actual EmailJS public key

/**
 * Formats and sends an order email using EmailJS template
 * @param {Object} data - Order data object from frontend
 * @returns {Promise<boolean>} - Resolves to true if sent successfully
 */
async function sendOrderEmail(data) {
  try {
    // Prepare parameters that MATCH your EmailJS template placeholders EXACTLY
    const templateParams = {
      to_email: "hassanwaelhh@proton.me",
      from_name: data.name,
      subject: `New Order - ${data.product_type}`,

      // Customer Info — MUST match template exactly!
      customer_name: data.name,
      phone: data.phone,
      secondaryPhone: data.secondary_phone || null, // 👈 CAMELCASE: matches {{secondaryPhone}}
      governorate: data.governorate,
      address: data.address,
      delivery_notes: data.delivery_notes || null,  // 👈 SNAKE_CASE: matches {{delivery_notes}}

      // Order Details
      product_type: data.product_type,
      color: data.color || 'Not specified',
      size: data.size || 'Not selected',
      quantity: data.quantity,

      // Payment Summary
      total_price: data.total_price.toFixed(2),
      shipping_cost: data.shipping_cost.toFixed(2),

      // Design Status & URLs
      has_front_design: data.has_front_design,
      has_back_design: data.has_back_design,
      front_design_url: data.front_design_url || '',
      back_design_url: data.back_design_url || ''
    };

    console.log('Sending EmailJS template params:', templateParams);

    const response = await emailjs.send(
      "service_f0illrv",
      "template_em0s82a",
      templateParams
    );

    console.log('✅ Email sent successfully:', response.status, response.text);
    return true;

  } catch (error) {
    console.error('❌ Failed to send email:', error);
    alert('There was an error sending your order. Please contact support.');
    return false;
  }
}

/**
 * Validates if the user has uploaded at least one design
 * @returns {boolean} - True if front or back design is uploaded
 */
function hasDesignUploaded() {
  const frontLayer = document.getElementById('front-layer');
  const backLayer = document.getElementById('back-layer');
  return frontLayer?.querySelector('.design-image') !== null ||
         backLayer?.querySelector('.design-image') !== null;
}

/**
 * Shows confirmation dialog if no design is uploaded
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

// Export functions for module systems (Node.js, bundlers)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sendOrderEmail,
    hasDesignUploaded,
    confirmNoDesignSubmission
  };
}
