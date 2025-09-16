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

    // Convert base64 to Blob
    const byteString = atob(base64.split(',')[1]);
    const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ia], { type: mimeString });

    // Generate unique filename
    const filename = `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('egymerch_designs')
      .upload(filename, blob, {
        contentType: 'image/jpeg',
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
 * Compresses and resizes a base64 image to reduce its size.
 * @param {string} base64 - The base64 image string
 * @param {number} maxWidth - Max width to resize to (default: 300)
 * @param {number} quality - JPEG quality 0-1 (default: 0.7)
 * @returns {Promise<string>} - Compressed base64 string
 */
async function compressImage(base64, maxWidth = 300, quality = 0.7) {
  // Early return for invalid inputs
  if (!base64 || typeof base64 !== 'string' || base64 === 'No design uploaded') {
    return base64;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      // Calculate new dimensions
      const scale = maxWidth / img.width;
      const newWidth = maxWidth;
      const newHeight = img.height * scale;

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');

      // Draw and compress
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      const compressed = canvas.toDataURL('image/jpeg', quality);

      resolve(compressed);
    };
    img.onerror = () => {
      console.error('Failed to load image for compression:', base64);
      resolve(base64); // fallback if error
    };
  });
}

/**
 * Generates a base64 data URL of the final mockup by calling the existing downloadPreview function.
 * This ensures perfect consistency with what the user sees.
 * @param {string} side - 'front' or 'back'
 * @returns {Promise<string>} - Base64 data URL of the mockup image, or 'No design uploaded' if no design is present
 */
async function generateMockupFromDownloadPreview(side) {
  return new Promise((resolve) => {
    const viewId = side === 'front' ? 'front-view' : 'back-view';
    const layerId = side === 'front' ? 'front-layer' : 'back-layer';

    const viewContainer = document.getElementById(viewId);
    const designLayer = document.getElementById(layerId);
    const designImage = designLayer.querySelector('.design-image');

    if (!designImage) {
      resolve('No design uploaded');
      return;
    }

    // Save the original downloadPreview function if it exists
    const originalDownloadPreview = window.downloadPreview;

    // Override downloadPreview to capture the base64 data
    window.downloadPreview = function(base64Data, filename) {
      // Restore the original function immediately
      if (originalDownloadPreview) {
        window.downloadPreview = originalDownloadPreview;
      }
      // Resolve with the captured base64 data (THIS IS THE FIX)
      resolve(base64Data);
      // Do NOT trigger actual download
    };

    // Get the base image
    const baseImage = viewContainer.querySelector('.base-image');
    const boundary = { TOP: 101, LEFT: 125, WIDTH: 150, HEIGHT: 150 };

    // Get design image's current style and transform
    const computedStyle = window.getComputedStyle(designImage);
    const left = parseFloat(computedStyle.left) || 0;
    const top = parseFloat(computedStyle.top) || 0;
    let translateX = 0, translateY = 0;

    const transform = computedStyle.transform;
    if (transform && transform !== 'none') {
      const matrix = new DOMMatrix(transform);
      translateX = matrix.e;
      translateY = matrix.f;
    }

    // Calculate final position
    const finalX = left + translateX;
    const finalY = top + translateY;

    // Get size
    const width = parseFloat(designImage.style.width) || designImage.offsetWidth;
    const height = parseFloat(designImage.style.height) || designImage.offsetHeight;

    // Call downloadPreview with the captured parameters
    downloadPreview(baseImage, designImage, finalX, finalY, width, height, boundary, `${side}-preview.jpg`);

    // Fallback timeout
    setTimeout(() => {
      if (window.downloadPreview !== originalDownloadPreview) {
        if (originalDownloadPreview) {
          window.downloadPreview = originalDownloadPreview;
        }
        console.warn('Fallback: Mockup generation timed out.');
        resolve('No design uploaded');
      }
    }, 5000);
  });
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

    // ✅ Generate and handle front PRODUCT PREVIEW using the downloadPreview function
    if (data.has_front_design) {
      const frontMockupUrl = await generateMockupFromDownloadPreview('front');
      if (frontMockupUrl && frontMockupUrl !== 'No design uploaded') {
        const frontCompressed = await compressImage(frontMockupUrl);
        const frontUrl = await uploadImageToSupabase(frontCompressed, 'front/');
        if (frontUrl && frontUrl !== 'No design uploaded') {
          frontLinkHtml = `<a href="${frontUrl}" target="_blank" style="color: #3498db; text-decoration: underline;">Download Front Product Preview</a>`;
        }
      }
    }

    // ✅ Generate and handle back PRODUCT PREVIEW using the downloadPreview function
    if (data.has_back_design) {
      const backMockupUrl = await generateMockupFromDownloadPreview('back');
      if (backMockupUrl && backMockupUrl !== 'No design uploaded') {
        const backCompressed = await compressImage(backMockupUrl);
        const backUrl = await uploadImageToSupabase(backCompressed, 'back/');
        if (backUrl && backUrl !== 'No design uploaded') {
          backLinkHtml = `<a href="${backUrl}" target="_blank" style="color: #3498db; text-decoration: underline;">Download Back Product Preview</a>`;
        }
      }
    }

    // ✅ Handle front SOURCE design (Raw Upload) - TEXT LINK ONLY
    if (data.has_front_design && data.front_design_url && data.front_design_url !== 'No design uploaded') {
      const frontSourceCompressed = await compressImage(data.front_design_url);
      const frontSourceUrl = await uploadImageToSupabase(frontSourceCompressed, 'front_source/');
      if (frontSourceUrl && frontSourceUrl !== 'No design uploaded') {
        frontSourceLinkHtml = `<a href="${frontSourceUrl}" target="_blank" style="color: #3498db; text-decoration: underline;">Download/View Front Source Image</a>`;
      }
    }

    // ✅ Handle back SOURCE design (Raw Upload) - TEXT LINK ONLY
    if (data.has_back_design && data.back_design_url && data.back_design_url !== 'No design uploaded') {
      const backSourceCompressed = await compressImage(data.back_design_url);
      const backSourceUrl = await uploadImageToSupabase(backSourceCompressed, 'back_source/');
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
