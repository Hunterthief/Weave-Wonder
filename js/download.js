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
  const hasFrontDesign = frontLayer.querySelector('.design-image');
  const hasBackDesign = backLayer.querySelector('.design-image');

  // Create canvas for front
  const frontCanvas = document.createElement('canvas');
  const frontCtx = frontCanvas.getContext('2d');
  setCanvasSize(frontCtx, frontBaseImage);

  // Draw front design
  drawDesign(frontCtx, frontBaseImage, frontLayer);

  // Create canvas for back
  const backCanvas = document.createElement('canvas');
  const backCtx = backCanvas.getContext('2d');
  setCanvasSize(backCtx, backBaseImage);

  // Draw back design
  drawDesign(backCtx, backBaseImage, backLayer);

  // Download logic
  if (hasFrontDesign && hasBackDesign) {
    // Download both as separate files
    downloadImage(frontCanvas, 'front-preview.png');
    downloadImage(backCanvas, 'back-preview.png');
  } else if (hasFrontDesign) {
    // Download only front
    downloadImage(frontCanvas, 'front-preview.png');
  } else if (hasBackDesign) {
    // Download only back
    downloadImage(backCanvas, 'back-preview.png');
  } else {
    alert("No design uploaded. Please upload a design first.");
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

  // ✅ Parse transform: translate(x, y)
  const style = window.getComputedStyle(designImage);
  const transform = style.transform;

  let translateX = 0;
  let translateY = 0;

  if (transform !== 'none') {
    // Extract translate values from "translate(50px, 100px)"
    const match = transform.match(/translate\(([^)]+)\)/);
    if (match && match[1]) {
      const values = match[1].split(',').map(v => parseFloat(v.trim()));
      if (values.length >= 2) {
        translateX = values[0];
        translateY = values[1];
      }
    }
  }

  // Use original size (before scaling)
  const width = designImage.naturalWidth || designImage.offsetWidth;
  const height = designImage.naturalHeight || designImage.offsetHeight;

  // Draw the image at the correct position and size
  ctx.drawImage(
    designImage,
    translateX,
    translateY,
    width,
    height
  );
}

function downloadImage(canvas, filename) {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  link.click();
}
