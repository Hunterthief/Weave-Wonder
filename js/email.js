// EmailJS Configuration - Initialize with your public key
// You need to set this up at https://www.emailjs.com/
emailjs.init("vob8IbRr130DYlPqt"); // Your actual EmailJS public key

/**
 * Sends an order email using EmailJS
 * @param {Object} data - Order data object
 * @returns {Promise} - Promise that resolves when email is sent
 */
async function sendOrderEmail(data) {
  try {
    // Prepare EmailJS parameters - ONLY the parameters that match your template placeholders
    const templateParams = {
      to_email: "hassanwaelhh@proton.me", // Your email address
      from_name: data.name,
      subject: `New Order - ${data.productType}`,
      name: data.name,
      time: new Date().toLocaleString(), // Add current time for the template
      customer_name: data.name,
      phone: data.phone,
      governorate: data.governorate,
      address: data.address,
      delivery_notes: data.deliveryNotes || "None",
      product_type: data.productType,
      color: data.color || "Not specified",
      size: data.size || "Not selected",
      quantity: data.quantity,
      total_price: data.totalPrice.toFixed(2),
      shipping_cost: data.shippingCost.toFixed(2),
      has_front_design: data.hasFrontDesign ? "Yes" : "No",
      has_back_design: data.hasBackDesign ? "Yes" : "No"
    };
    
    // Send email using EmailJS with the template
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
    hasDesignUploaded,
    confirmNoDesignSubmission
  };
}
