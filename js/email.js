emailjs.init("kMkCJJdFsA9rILDiO");

async function sendOrderEmail(data) {
  try {
    const templateParams = {
      to_email: "hassanwaelhh@proton.me",
      from_name: data.name,
      subject: `New Order - ${data.product_type}`,

      customer_name: data.name,
      phone: data.phone,
      secondary_phone: data.secondary_phone || null,
      governorate: data.governorate,
      address: data.address,
      delivery_notes: data.delivery_notes || null,

      product_type: data.product_type,
      color: data.color || 'Not specified',
      size: data.size || 'Not selected',
      quantity: data.quantity,

      total_price: data.total_price.toFixed(2),
      shipping_cost: data.shipping_cost.toFixed(2),

      has_front_design: data.has_front_design,
      has_back_design: data.has_back_design,
      front_design_url: data.front_design_url || '',
      back_design_url: data.back_design_url || ''
    };

    console.log('Sending:', templateParams);

    const response = await emailjs.send(
      "service_f0illrv",
      "template_em0s82a", // ✅ NEW ID
      templateParams
    );

    console.log('✅ Sent:', response.status, response.text);
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
