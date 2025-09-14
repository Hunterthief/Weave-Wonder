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

  // Combine both designs side by side
  const combinedCanvas = document.createElement('canvas');
  const combinedCtx = combinedCanvas.getContext('2d');
  combinedCanvas.width = frontCanvas.width * 2;
  combinedCanvas.height = frontCanvas.height;

  combinedCtx.drawImage(frontCanvas, 0, 0);
  combinedCtx.drawImage(backCanvas, frontCanvas.width, 0);

  // Trigger download
  const link = document.createElement('a');
  link.href = combinedCanvas.toDataURL('image/png');
  link.download = 'design-preview.png';
  link.click();
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
  const { x, y, width, height } = getTransformedDimensions(designImage);

  // Draw the image at the correct position and size
  ctx.drawImage(
    designImage,
    x,
    y,
    width,
    height
  );
}

function getTransformedDimensions(element) {
  const style = window.getComputedStyle(element);
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
  const width = element.naturalWidth || element.offsetWidth;
  const height = element.naturalHeight || element.offsetHeight;

  return {
    x: translateX,
    y: translateY,
    width,
    height
  };
  console.log("Drawing design at:", { translateX, translateY, width, height });
}
