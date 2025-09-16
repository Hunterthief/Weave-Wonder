/**
 * EmailJS Configuration - NO INIT NEEDED
 * We pass publicKey directly in send() — this is the modern, reliable method.
 * Replace "YOUR_ACTUAL_USER_ID_HERE" with your real User ID from:
 * https://dashboard.emailjs.com/admin/integration
 */

/**
 * Compresses an image to reduce file size while maintaining quality
 * @param {string} base64Image - Base64 string of the image
 * @param {number} maxWidth - Maximum width (default: 800)
 * @param {number} quality - JPEG quality 0-1 (default: 0.7)
 * @returns {Promise<string>} - Compressed Base64 image string
 */
async function compressImage(base64Image, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = function() {
      // Calculate new dimensions while preserving aspect ratio
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Draw image to canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to compressed JPEG
      let compressedBase64;
      if (base64Image.includes('image/png') || base64Image.includes('image/webp')) {
        compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      } else {
        compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      }

      resolve(compressedBase64);
    };
    img.src = base64Image;
  });
}

/**
 * Enhanced version of sendOrderEmail that attaches compressed design images directly
 * @param {Object} data - Order data object from script.js
 * @returns {Promise<boolean>} - Resolves to true if email sent successfully
 */
async function sendOrderEmail(data) {
  try {
    // Clone data to avoid mutating original
    const emailData = { ...data };

    // Check if any designs are uploaded
    const hasAnyDesign = emailData.has_front_design || emailData.has_back_design;
    
    // If no designs are uploaded, warn the user
    if (!hasAnyDesign) {
      const confirmed = confirm(
        "⚠️ WARNING: You haven't uploaded any designs.\n\n" +
        "The product will be printed as a plain item with no custom designs.\n\n" +
        "Are you sure you want to proceed with a plain product?"
      );
      
      if (!confirmed) {
        return false; // Cancel order if user doesn't confirm
      }
    }

    // Prepare attachments object
    const attachments = {};

    // Process front design
    if (emailData.has_front_design && emailData.front_design_url?.startsWith('data:')) {
      console.log('Compressing front design...');
      const compressedImg = await compressImage(emailData.front_design_url, 800, 0.7);
      attachments.front_design = compressedImg;
      console.log('✅ Front design compressed and attached');
    }

    // Process back design
    if (emailData.has_back_design && emailData.back_design_url?.startsWith('data:')) {
      console.log('Compressing back design...');
      const compressedImg = await compressImage(emailData.back_design_url, 800, 0.7);
      attachments.back_design = compressedImg;
      console.log('✅ Back design compressed and attached');
    }

    // Prepare template parameters — match your EmailJS template
    const templateParams = {
      to_email: "hassanwaelhh@proton.me",
      from_name: emailData.name,
      subject: `New Order - ${emailData.productType}`,

      customer_name: emailData.name,
      phone: emailData.phone,
      secondary_phone: emailData.secondaryPhone || 'Not provided',
      governorate: emailData.governorate,
      address: emailData.address,
      delivery_notes: emailData.deliveryNotes || 'Not provided',

      product_type: emailData.productType,
      color: emailData.color || 'Not specified',
      size: emailData.size || 'Not selected',
      quantity: emailData.quantity,

      total_price: (emailData.totalPrice || 0).toFixed(2),
      shipping_cost: (emailData.shippingCost || 0).toFixed(2),

      has_front_design: emailData.has_front_design ? 'Yes' : 'No',
      has_back_design: emailData.has_back_design ? 'Yes' : 'No',
      front_design_url: emailData.has_front_design ? 'See attached file: front_design.jpg' : 'No design uploaded',
      back_design_url: emailData.has_back_design ? 'See attached file: back_design.jpg' : 'No design uploaded'
    };

    console.log('Sending final template params:', templateParams);

    // ✅ SEND EMAIL WITH MODERN publicKey OPTION — NO INIT REQUIRED
    const response = await emailjs.send(
      "service_f0illrv",    // Your Service ID
      "template_em0s82a",   // Your Template ID
      templateParams,
      {
        publicKey: "kMkCJJdFsA9rILDiO", // ⚠️ REPLACE THIS WITH YOUR REAL USER ID FROM DASHBOARD
        attachments: attachments
      }
    );

    console.log('✅ Email sent successfully:', response.status, response.text);
    
    // Show success message to user
    if (hasAnyDesign) {
      alert('Order submitted successfully! We will contact you soon. Your design files have been sent to our team.');
    } else {
      alert('Order submitted successfully! Your plain product will be prepared without any designs.');
    }
    
    // Reset form
    document.getElementById('order-form').reset();
    document.getElementById('product-type-order').dispatchEvent(new Event('change'));
    
    return true;

  } catch (error) {
    console.error('❌ Failed to send email:', error);
    alert('There was an error sending your order. Please contact support or try again later.');
    return false;
  }
}

function hasDesignUploaded() {
  const frontLayer = document.getElementById('front-layer');
  const backLayer = document.getElementById('back-layer');
  return frontLayer?.querySelector('.design-image') !== null ||
         backLayer?.querySelector('.design-image') !== null;
}

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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sendOrderEmail,
    hasDesignUploaded,
    confirmNoDesignSubmission
  };
}
