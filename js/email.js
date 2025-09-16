// EmailJS Configuration - Initialize with your public key
emailjs.init("vob8IbRr130DYlPqt");

/**
 * Uploads a base64 image to Imgur and returns a public URL
 * @param {string} base64Image - Base64 string of the image (e.g., "data:image/png;base64,iVBORw0KGgo...")
 * @returns {Promise<string>} - Public Imgur URL or empty string if failed
 */
async function uploadToImgur(base64Image) {
  try {
    // Extract the raw base64 part (remove data URI prefix)
    const base64Data = base64Image.split(',')[1];
    if (!base64Data) throw new Error('Invalid base64 image');

    // Create FormData and send to Imgur
    const formData = new FormData();
    formData.append('image', base64Data);

    // Add a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        Authorization: 'Client-ID 9c7f8a333496552' // Public Imgur Client ID (free, no auth required)
      },
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success || !result.data?.link) {
      throw new Error('Image upload failed: ' + JSON.stringify(result));
    }

    return result.data.link; // Return public URL
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('Imgur upload timed out');
    } else {
      console.error('Failed to upload image to Imgur:', error);
    }
    return ''; // Return empty string if upload fails — email will show "No design uploaded"
  }
}

/**
 * Enhanced version of sendOrderEmail that uploads images to Imgur before sending
 * @param {Object} data - Order data object from script.js
 * @returns {Promise<boolean>} - Resolves to true if email sent successfully
 */
async function sendOrderEmail(data) {
  try {
    // Clone data to avoid mutating original
    const emailData = { ...data };

    // If front design exists and has base64 URL, upload it to Imgur
    if (emailData.has_front_design && emailData.front_design_url?.startsWith('data:')) {
      console.log('Uploading front design to Imgur...');
      const imgUrl = await uploadToImgur(emailData.front_design_url);
      emailData.front_design_url = imgUrl || '';
      if (!imgUrl) {
        console.warn('Front design upload failed or timed out, proceeding without image');
      }
    }

    // If back design exists and has base64 URL, upload it to Imgur
    if (emailData.has_back_design && emailData.back_design_url?.startsWith('data:')) {
      console.log('Uploading back design to Imgur...');
      const imgUrl = await uploadToImgur(emailData.back_design_url);
      emailData.back_design_url = imgUrl || '';
      if (!imgUrl) {
        console.warn('Back design upload failed or timed out, proceeding without image');
      }
    }

    // Prepare template parameters — fixed to match actual data structure from script.js
    const templateParams = {
      to_email: "hassanwaelhh@proton.me",
      from_name: emailData.name,
      subject: `New Order - ${emailData.productType}`,

      customer_name: emailData.name,
      phone: emailData.phone,
      secondary_phone: emailData.secondaryPhone || null,
      governorate: emailData.governorate,
      address: emailData.address,
      delivery_notes: emailData.deliveryNotes || null,

      product_type: emailData.productType,
      color: emailData.color || 'Not specified',
      size: emailData.size || 'Not selected',
      quantity: emailData.quantity,

      // FIXED: Use the correct property names and add fallbacks
      total_price: (emailData.totalPrice || 0).toFixed(2),
      shipping_cost: (emailData.shippingCost || 0).toFixed(2),

      has_front_design: emailData.has_front_design,
      has_back_design: emailData.has_back_design,
      front_design_url: emailData.front_design_url,
      back_design_url: emailData.back_design_url
    };

    console.log('Sending final template params:', templateParams);

    const response = await emailjs.send(
      "service_f0illrv",
      "template_em0s82a",
      templateParams
    );

    console.log('✅ Email sent successfully:', response.status, response.text);
    
    // Show success message to user
    alert('Order submitted successfully! We will contact you soon.');
    
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
