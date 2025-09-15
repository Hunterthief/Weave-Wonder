// Download Preview Image Functionality
document.addEventListener('DOMContentLoaded', () => {
  const downloadBtn = document.getElementById('download-design');
  if (!downloadBtn) {
    console.error("Download button not found!");
    return;
  }
  downloadBtn.addEventListener('click', () => {
    generateAndDownloadDesign();
  });
});

function generateAndDownloadDesign() {
  const frontLayer = document.getElementById('front-layer');
  const backLayer = document.getElementById('back-layer');
  const frontBaseImage = document.getElementById('front-view').querySelector('.base-image');
  const backBaseImage = document.getElementById('back-view').querySelector('.base-image');

  // Ensure base images are loaded
  if (!frontBaseImage.complete || !backBaseImage.complete) {
    alert("Please wait for product images to load before downloading.");
    return;
  }

  // Check if designs exist
  const hasFrontDesign = frontLayer.querySelector('.design-image') !== null;
  const hasBackDesign = backLayer.querySelector('.design-image') !== null;

  // If no design at all, warn user
  if (!hasFrontDesign && !hasBackDesign) {
    alert("No design uploaded. Please upload a design on front or back first.");
    return;
  }

  // Create canvas for front
  const frontCanvas = document.createElement('canvas');
  const frontCtx = frontCanvas.getContext('2d');
  setCanvasSize(frontCtx, frontBaseImage);
  drawDesign(frontCtx, frontBaseImage, frontLayer);

  // Create canvas for back
  const backCanvas = document.createElement('canvas');
  const backCtx = backCanvas.getContext('2d');
  setCanvasSize(backCtx, backBaseImage);
  drawDesign(backCtx, backBaseImage, backLayer);

  // Download based on what exists
  if (hasFrontDesign && hasBackDesign) {
    // Download both separately
    downloadImage(frontCanvas, 'front-preview.png');
    downloadImage(backCanvas, 'back-preview.png');
  } else if (hasFrontDesign) {
    // Only front
    downloadImage(frontCanvas, 'front-preview.png');
  } else if (hasBackDesign) {
    // Only back
    downloadImage(backCanvas, 'back-preview.png');
  }
}

function setCanvasSize(ctx, baseImage) {
  ctx.canvas.width = baseImage.naturalWidth || baseImage.width;
  ctx.canvas.height = baseImage.naturalHeight || baseImage.height;
}

function drawDesign(ctx, baseImage, designLayer) {
  // Draw the base product image
  ctx.drawImage(baseImage, 0, 0);

  // Find the uploaded design image inside the layer
  const designImage = designLayer.querySelector('.design-image');
  if (!designImage || !designImage.src) return;

  // ✅ Get the position and size of the .design-layer relative to the .product-view
  const productView = designLayer.closest('.product-view');
  const layerRect = designLayer.getBoundingClientRect();
  const viewRect = productView.getBoundingClientRect();

  // Calculate the offset of the layer within the product view
  const layerOffsetX = layerRect.left - viewRect.left;
  const layerOffsetY = layerRect.top - viewRect.top;

  // ✅ Get the transform translate values from the design image
  const style = window.getComputedStyle(designImage);
  const transform = style.transform;

  let translateX = 0;
  let translateY = 0;
  let scaleX = 1;
  let scaleY = 1;

  if (transform !== 'none') {
    const match = transform.match(/translate\(\s*([-\d.]+)px\s*,\s*([-\d.]+)px\s*\)/);
    if (match) {
      translateX = parseFloat(match[1]);
      translateY = parseFloat(match[2]);
    }

    // Also extract scale if present (in case you add scaling later)
    const scaleMatch = transform.match(/scale\(([\d.]+)\)/);
    if (scaleMatch) {
      const scaleVal = parseFloat(scaleMatch[1]);
      scaleX = scaleVal;
      scaleY = scaleVal;
    }
  }

  // ✅ Original size of the design image
  const originalWidth = designImage.naturalWidth || designImage.offsetWidth;
  const originalHeight = designImage.naturalHeight || designImage.offsetHeight;

  // ✅ Apply scale to get final rendered size
  const finalWidth = originalWidth * scaleX;
  const finalHeight = originalHeight * scaleY;

  // ✅ Convert design image position from layer-relative to product-view-relative
  const designX = layerOffsetX + translateX;
  const designY = layerOffsetY + translateY;

  // ✅ Draw the image at the correct position on the canvas
  ctx.drawImage(
    designImage,
    designX,
    designY,
    finalWidth,
    finalHeight
  );
}

function downloadImage(canvas, filename) {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  link.click();
}
