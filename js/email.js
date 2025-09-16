emailjs.init("kMkCJJdFsA9rILDiO");

// 🚀 Initialize Supabase — FIXED: NO TRAILING SPACE!
const SUPABASE_URL = 'https://cfjaaslhkoaxwjpghgbb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamFhc2xoa29heHdqcGdoZ2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDk2NjIsImV4cCI6MjA3MzYyNTY2Mn0.SmjkIejOYcqbB5CSjuA9AvGcDuPu9uzaUcQwf3wy6WI';

// Create Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Uploads a base64 image to Supabase Storage and returns the public URL.
 * @param {string} base64 - Base64 image string
 * @param {string} prefix - Folder prefix (e.g., 'front/', 'back/')
 * @returns {Promise<string>} - Public image URL or 'No design uploaded'
 */
async function uploadImageToSupabase(base64, prefix = '') {
  if (!base64 || base64 === 'No design uploaded') return 'No design uploaded';

  try {
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

    // ✅ MANUALLY BUILD PUBLIC URL — this is the key fix!
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
  if (!base64 || base64 === 'No design uploaded') return base64;

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
    img.onerror = () => resolve(base64); // fallback if error
  });
}

async function sendOrderEmail(data) {
  try {
    // Ensure numeric values default to 0 if undefined or null
    const totalPrice = (data.totalPrice != null ? parseFloat(data.totalPrice) : 0);
    const shippingCost = (data.shippingCost != null ? parseFloat(data.shippingCost) : 0);

    // ✅ COMPRESS IMAGES FIRST
    const frontCompressed = await compressImage(data.front_design_url);
    const backCompressed = await compressImage(data.back_design_url);

    // ✅ UPLOAD TO SUPABASE STORAGE AND GET PUBLIC URL
    const frontUrl = await uploadImageToSupabase(frontCompressed, 'front/');
    const backUrl = await uploadImageToSupabase(backCompressed, 'back/');

    // ✅ Generate HTML image previews for EmailJS template
    const frontDesignHtml = data.has_front_design
      ? `<img src="${frontUrl}" alt="Front Design" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; margin-top: 8px;">`
      : 'No design uploaded';

    const backDesignHtml = data.has_back_design
      ? `<img src="${backUrl}" alt="Back Design" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; margin-top: 8px;">`
      : 'No design uploaded';

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

      // ✅ Send HTML image tags, not just URLs
      front_design_preview: frontDesignHtml,
      back_design_preview: backDesignHtml,

      // Optional: Include raw URLs for reference
      front_design_url: frontUrl,
      back_design_url: backUrl,

      // Add warning if low stock size was selected (optional enhancement)
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
