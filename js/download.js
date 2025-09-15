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

  // ✅ Get the current rendered size (what user sees)
  const renderedWidth = designImage.offsetWidth;
  const renderedHeight = designImage.offsetHeight;

  // ✅ Get the transform string — e.g., "translate(45px, 67px)"
  const transform = window.getComputedStyle(designImage).transform;

  let translateX = 0;
  let translateY = 0;
  let scaleX = 1;
  let scaleY = 1;

  // Parse "translate(45px, 67px)"
  if (transform !== 'none') {
    const match = transform.match(/translate\(\s*([-\d.]+)px\s*,\s*([-\d.]+)px\s*\)/);
    if (match) {
      translateX = parseFloat(match[1]);
      translateY = parseFloat(match[2]);
    }

    // Optional: Handle scale if added later
    const scaleMatch = transform.match(/scale\(([\d.]+)\)/);
    if (scaleMatch) {
      const scaleVal = parseFloat(scaleMatch[1]);
      scaleX = scaleVal;
      scaleY = scaleVal;
    }
  }

  // Apply scale to final size
  const finalWidth = renderedWidth * scaleX;
  const finalHeight = renderedHeight * scaleY;

  // Now we have:
  // - finalWidth/finalHeight: resized + scaled size
  // - translateX/translateY: position relative to top-left of .design-layer

  // But — we need to map this to the CANVAS coordinate system!
  // The .design-layer is positioned at (125, 101) inside the .product-view
  // So we add that offset!

  const productView = designLayer.closest('.product-view');
  const layerRect = designLayer.getBoundingClientRect();
  const viewRect = productView.getBoundingClientRect();

  const layerOffsetX = layerRect.left - viewRect.left;
  const layerOffsetY = layerRect.top - viewRect.top;

  // Final position on canvas = layer offset + design position within layer
  const canvasX = layerOffsetX + translateX;
  const canvasY = layerOffsetY + translateY;

  // ✅ DRAW IT!
  ctx.drawImage(
    designImage,
    canvasX,
    canvasY,
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
