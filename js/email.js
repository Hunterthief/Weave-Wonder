// Disable EmailJS completely
// emailjs.init("vob8IbRr130DYlPqt"); // DELETE THIS LINE

/**
 * Sends order data to webhook.site instead of EmailJS
 * @param {Object} data - Order data object
 * @returns {Promise<boolean>} - Resolves to true if sent successfully
 */
async function sendOrderEmail(data) {
  try {
    console.log('🔥 Sending order data to webhook.site:', data);

    const response = await fetch('https://webhook.site/b7a8c138-4717-4daa-a05a-6348b4ce888d', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log('✅ Webhook received data successfully');
      return true;
    } else {
      throw new Error(`Webhook responded with ${response.status}`);
    }

  } catch (error) {
    console.error('❌ Failed to send to webhook:', error);
    alert('There was an error sending your order. Please contact support.');
    return false;
  }
}

// Keep these functions unchanged — they’re fine
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
