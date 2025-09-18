// 🚀 Expose a function to generate the mockup canvas for a specific side
window.generateMockupCanvas = function(side) {
  const viewId = side === 'front' ? 'front-view' : 'back-view';
  const layerId = side === 'front' ? 'front-layer' : 'back-layer';

  const baseImage = document.getElementById(viewId).querySelector('.base-image');
  const designLayer = document.getElementById(layerId);

  if (!baseImage || !designLayer) {
    console.error(`Elements for ${side} not found.`);
    return null;
  }

  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas size to match base image
  setCanvasSize(ctx, baseImage);

  // Draw the design onto the canvas
  drawDesign(ctx, baseImage, designLayer);

  return canvas;
};

// 🚀 Keep the original download functionality, but now it uses the shared function
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
  const hasFront = document.getElementById('front-layer').querySelector('.design-image');
  const hasBack = document.getElementById('back-layer').querySelector('.design-image');

  if (!hasFront && !hasBack) {
    alert("No design uploaded.");
    return;
  }

  // Use the shared function to generate canvases
  if (hasFront) {
    const frontCanvas = window.generateMockupCanvas('front');
    if (frontCanvas) downloadImage(frontCanvas, 'front-preview.png');
  }

  if (hasBack) {
    const backCanvas = window.generateMockupCanvas('back');
    if (backCanvas) downloadImage(backCanvas, 'back-preview.png');
  }
}

function setCanvasSize(ctx, baseImage) {
  ctx.canvas.width = baseImage.naturalWidth || baseImage.width;
  ctx.canvas.height = baseImage.naturalHeight || baseImage.height;
}

function drawDesign(ctx, baseImage, designLayer) {
  // Draw base image
  ctx.drawImage(baseImage, 0, 0);

  // Find the design container (which holds the design image)
  const designContainer = designLayer.querySelector('.design-container');
  if (!designContainer) return;

  const designImage = designLayer.querySelector('.design-image');
  if (!designImage || !designImage.src) return;

  // Get the design container's position and size
  const containerRect = designContainer.getBoundingClientRect();
  const layerRect = designLayer.getBoundingClientRect();

  // Calculate the container's position relative to the design layer
  const containerX = containerRect.left - layerRect.left;
  const containerY = containerRect.top - layerRect.top;
  const containerWidth = containerRect.width;
  const containerHeight = containerRect.height;

  // Get the image's position and size within the container
  const imgStyle = window.getComputedStyle(designImage);
  const imgX = parseFloat(imgStyle.left) || 0;
  const imgY = parseFloat(imgStyle.top) || 0;
  const imgWidth = designImage.offsetWidth;
  const imgHeight = designImage.offsetHeight;

  // Calculate the final position and size for the canvas
  // Convert from design-layer coordinates to base image coordinates
  const scaleX = ctx.canvas.width / layerRect.width;
  const scaleY = ctx.canvas.height / layerRect.height;

  const finalX = (containerX + imgX) * scaleX;
  const finalY = (containerY + imgY) * scaleY;
  const finalWidth = imgWidth * scaleX;
  const finalHeight = imgHeight * scaleY;

  // Draw the image
  ctx.drawImage(
    designImage,
    finalX,
    finalY,
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
