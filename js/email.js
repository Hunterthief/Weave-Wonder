// Disable EmailJS completely
// emailjs.init("vob8IbRr130DYlPqt"); // DELETE THIS LINE

/**
 * Sends order data to Formspree for automated email delivery
 * @param {Object} data - Order data object
 * @returns {Promise<boolean>} - Resolves to true if sent successfully
 */
async function sendOrderEmail(data) {
  try {
    console.log('🔥 Sending order data to Formspree:', data);

    const response = await fetch('https://formspree.io/f/xovnzbwl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log('✅ Formspree received data and will send email');
      return true;
    } else {
      throw new Error(`Formspree responded with ${response.status}`);
    }

  } catch (error) {
    console.error('❌ Failed to send to Formspree:', error);
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
