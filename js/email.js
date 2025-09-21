// 🚀 Initialize EmailJS
emailjs.init("kMkCJJdFsA9rILDiO");

// 🚀 Initialize Supabase — FIXED: TRAILING SPACE REMOVED!
const SUPABASE_URL = 'https://cfjaaslhkoaxwjpghgbb.supabase.co'; // <-- TRAILING SPACE REMOVED
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamFhc2xoa29heHdqcGdoZ2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDk2NjIsImV4cCI6MjA3MzYyNTY2Mn0.SmjkIejOYcqbB5CSjuA9AvGcDuPu9uzaUcQwf3wy6WI';

// Create Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Uploads a base64 image to Supabase Storage and returns the public URL.
 * @param {string} base64 - Base64 image string
 * @param {string} prefix - Folder prefix (e.g., 'front/', 'back/', 'front_source/', 'back_source/')
 * @returns {Promise<string>} - Public image URL or 'No design uploaded'
 */
async function uploadImageToSupabase(base64, prefix = '') {
  // Early return if no valid base64 string is provided
  if (!base64 || typeof base64 !== 'string' || base64 === 'No design uploaded') {
    console.warn('No valid base64 image provided for upload.');
    return 'No design uploaded';
  }

  try {
    // Validate that the string is a base64 data URL
    if (!base64.startsWith('data:image/')) {
      throw new Error('Invalid base64 image format');
    }

    // Extract MIME type from base64 string
    const mimeType = base64.split(',')[0].split(':')[1].split(';')[0];
    
    // Convert base64 to Blob without any alteration
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ia], { type: mimeType });

    // Generate unique filename with original extension
    const fileExtension = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1];
    const filename = `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;

    // Upload to Supabase Storage without compression or resizing
    const { data, error } = await supabase.storage
      .from('egymerch_designs')
      .upload(filename, blob, {
        contentType: mimeType,
        upsert: false
      });

    if (error) throw error;

    // ✅ MANUALLY BUILD PUBLIC URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/egymerch_designs/${encodeURIComponent(filename)}`;

    return publicUrl;

  } catch (error) {
    console.error('Supabase upload failed:', error);
    return 'No design uploaded';
  }
}

/**
 * Uploads the original design image without any compression or resizing.
 * @param {string} base64 - The base64 image string (original upload)
 * @param {string} prefix - Folder prefix for storage
 * @returns {Promise<string>} - Public URL of the uploaded image
 */
async function uploadOriginalImage(base64, prefix = '') {
  // Early return for invalid inputs
  if (!base64 || typeof base64 !== 'string' || base64 === 'No design uploaded') {
    return base64;
  }
  
  // Simply upload without any processing
  return await uploadImageToSupabase(base64, prefix);
}

/**
 * Generates a base64 data URL of the final mockup by calling the shared function from download.js.
 * This ensures perfect consistency with what the user sees and what gets downloaded.
 * @param {string} side - 'front' or 'back'
 * @returns {Promise<string>} - Base64 data URL of the mockup image, or 'No design uploaded' if no design is present
 */
async function generateMockupFromDownloadPreview(side) {
  try {
    const layerId = side === 'front' ? 'front-layer' : 'back-layer';
    const designLayer = document.getElementById(layerId);
    const designImage = designLayer?.querySelector('.design-image');

    if (!designImage) {
      return 'No design uploaded';
    }

    // ✅ Call the function exposed by download.js — IT RETURNS A PROMISE!
    if (typeof window.generateMockupCanvas === 'function') {
      // 🚨 AWAIT the Promise to resolve to the actual canvas
      const canvas = await window.generateMockupCanvas(side);
      if (canvas) {
        // Convert canvas to base64 JPEG with maximum quality (1.0)
        const base64Data = canvas.toDataURL('image/jpeg', 1.0);
        return base64Data;
      } else {
        console.error(`Failed to generate canvas for ${side}.`);
        return 'No design uploaded';
      }
    } else {
      console.error('generateMockupCanvas function is not available. Ensure download.js is loaded.');
      return 'No design uploaded';
    }
  } catch (error) {
    console.error('Error in generateMockupFromDownloadPreview:', error);
    return 'No design uploaded';
  }
}

/**
 * Sends order data via EmailJS, including links to uploaded designs and final mockups.
 * @param {Object} data - Order form data
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
async function sendOrderEmail(data) {
  try {
    // Ensure numeric values default to 0 if undefined or null
    const totalPrice = (data.totalPrice != null ? parseFloat(data.totalPrice) : 0);
    const shippingCost = (data.shippingCost != null ? parseFloat(data.shippingCost) : 0);

    // Default values for design links
    let frontLinkHtml = 'No design uploaded';
    let backLinkHtml = 'No design uploaded';
    let frontSourceLinkHtml = 'No design uploaded';
    let backSourceLinkHtml = 'No design uploaded';

    // ✅ Generate and handle front PRODUCT PREVIEW using the download.js function
    // Upload with maximum quality (no compression)
    if (data.has_front_design) {
      const frontMockupUrl = await generateMockupFromDownloadPreview('front');
      if (frontMockupUrl && frontMockupUrl !== 'No design uploaded') {
        const frontUrl = await uploadImageToSupabase(frontMockupUrl, 'front/');
        if (frontUrl && frontUrl !== 'No design uploaded') {
          frontLinkHtml = `<a href="${frontUrl}" target="_blank" style="color: #3498db; text-decoration: underline;">Download Front Product Preview</a>`;
        }
      }
    }

    // ✅ Generate and handle back PRODUCT PREVIEW using the download.js function
    // Upload with maximum quality (no compression)
    if (data.has_back_design) {
      const backMockupUrl = await generateMockupFromDownloadPreview('back');
      if (backMockupUrl && backMockupUrl !== 'No design uploaded') {
        const backUrl = await uploadImageToSupabase(backMockupUrl, 'back/');
        if (backUrl && backUrl !== 'No design uploaded') {
          backLinkHtml = `<a href="${backUrl}" target="_blank" style="color: #3498db; text-decoration: underline;">Download Back Product Preview</a>`;
        }
      }
    }

    // ✅ Handle front SOURCE design (Raw Upload) - Upload original without compression
    if (data.has_front_design && data.front_design_url && data.front_design_url !== 'No design uploaded') {
      const frontSourceUrl = await uploadOriginalImage(data.front_design_url, 'front_source/');
      if (frontSourceUrl && frontSourceUrl !== 'No design uploaded') {
        frontSourceLinkHtml = `<a href="${frontSourceUrl}" target="_blank" style="color: #3498db; text-decoration: underline;">Download/View Front Source Image</a>`;
      }
    }

    // ✅ Handle back SOURCE design (Raw Upload) - Upload original without compression
    if (data.has_back_design && data.back_design_url && data.back_design_url !== 'No design uploaded') {
      const backSourceUrl = await uploadOriginalImage(data.back_design_url, 'back_source/');
      if (backSourceUrl && backSourceUrl !== 'No design uploaded') {
        backSourceLinkHtml = `<a href="${backSourceUrl}" target="_blank" style="color: #3498db; text-decoration: underline;">Download/View Back Source Image</a>`;
      }
    }

    // Use the correct property names from formData
    const templateParams = {
      to_email: "hassanwaelhh@proton.me",
      from_name: data.name,
      subject: `New Order - ${data.productType}`,

      customer_name: data.name,
      phone: data.phone,
      secondary_phone: data.secondaryPhone || 'Not provided',
      governorate: data.governorate,
      address: data.address,
      delivery_notes: data.deliveryNotes || 'Not provided',

      product_type: data.productType,
      color: data.color || 'Not specified',
      size: data.size || 'Not selected',
      quantity: data.quantity || 1,

      total_price: totalPrice.toFixed(2),
      shipping_cost: shippingCost.toFixed(2),

      has_front_design: data.has_front_design ? 'Yes' : 'No',
      has_back_design: data.has_back_design ? 'Yes' : 'No',

      // ✅ Send clickable text links for Product Previews (Final Mockups)
      front_design_link: frontLinkHtml,
      back_design_link: backLinkHtml,

      // ✅ Send clickable text links for Source Designs (Raw Uploads)
      front_source_design_link: frontSourceLinkHtml,
      back_source_design_link: backSourceLinkHtml,

      // Add warning if low stock size was selected
      warning_message: data.size && data.size.toLowerCase() !== data.size
        ? "Customer selected a LOW STOCK size. Fulfill quickly."
        : "No stock warnings."
    };

    // Log size — should now be under 5KB!
    const totalSizeKB = new Blob([JSON.stringify(templateParams)]).size / 1024;
    console.log('📦 Template size:', totalSizeKB.toFixed(1), 'KB');

    const response = await emailjs.send(
      "service_f0illrv",
      "template_em0s82a",
      templateParams
    );

    console.log('✅ Sent:', response.status, response.text);
    alert('Order submitted successfully!');
    return true;

  } catch (error) {
    console.error('❌ Failed:', error);
    alert('There was an error sending your order. Please contact support.');
    return false;
  }
}

/**
 * Checks if any design (front or back) has been uploaded.
 * @returns {boolean} - True if at least one design is uploaded
 */
function hasDesignUploaded() {
  const frontLayer = document.getElementById('front-layer');
  const backLayer = document.getElementById('back-layer');
  return frontLayer?.querySelector('.design-image') !== null ||
         backLayer?.querySelector('.design-image') !== null;
}

/**
 * Confirms with user if they want to submit without any designs.
 * @returns {Promise<boolean>} - True if user confirms, false otherwise
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

// Export functions for potential module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sendOrderEmail,
    hasDesignUploaded,
    confirmNoDesignSubmission
  };
}
