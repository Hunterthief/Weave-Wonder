emailjs.init("kMkCJJdFsA9rILDiO");

async function sendOrderEmail(data) {
  try {
    // Safely handle potential undefined values
    const totalPrice = data.totalPrice !== undefined && data.totalPrice !== null ? data.totalPrice : 0;
    const shippingCost = data.shippingCost !== undefined && data.shippingCost !== null ? data.shippingCost : 0;

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
      front_design_url: data.front_design_url || 'No design uploaded',
      back_design_url: data.back_design_url || 'No design uploaded'
    };

    console.log('Sending:', templateParams);

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
