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

  // ✅ Get actual position and size from style properties
  const rect = designImage.getBoundingClientRect();
  const layerRect = designLayer.getBoundingClientRect();

  // Calculate position relative to the layer
  const x = rect.left - layerRect.left;
  const y = rect.top - layerRect.top;
  const width = rect.width;
  const height = rect.height;

  // Draw the design image at the correct position and size
  ctx.drawImage(
    designImage,
    x,
    y,
    width,
    height
  );
}
