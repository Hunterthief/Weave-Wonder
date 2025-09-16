// EmailJS Configuration - Initialize with your public key
// Get this from https://www.emailjs.com/dashboard/email-services
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
      to_email: "hassanwaelhh@proton.me", // Your receiving email
      from_name: data.name, // Will appear as "From" name
      subject: `New Order - ${data.productType}`, // Subject line

      // Customer Info
      customer_name: data.name,
      phone: data.phone,
      secondaryPhone: data.secondaryPhone || null, // EmailJS will skip if null
      governorate: data.governorate,
      address: data.address,
      delivery_notes: data.deliveryNotes || null,

      // Order Details
      product_type: data.productType,
      color: data.color || 'Not specified',
      size: data.size || 'Not selected',
      quantity: data.quantity,

      // Payment Summary
      total_price: data.totalPrice.toFixed(2),
      shipping_cost: data.shippingCost.toFixed(2), // 🔴 CRITICAL: Was missing!

      // Design Status & URLs
      has_front_design: data.hasFrontDesign,
      has_back_design: data.hasBackDesign,
      front_design_url: data.frontDesignUrl || '', // Must be string, even if empty
      back_design_url: data.backDesignUrl || ''    // Must be string, even if empty
    };

    console.log('Sending EmailJS template params:', templateParams);

    // Send email using EmailJS (uses template_em0s82a from dashboard)
    const response = await emailjs.send(
      "service_f0illrv", // Your EmailJS Service ID
      "template_em0s82a", // Your EmailJS Template ID
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
