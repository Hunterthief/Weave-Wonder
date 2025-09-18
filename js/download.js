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
  
  // Remove any existing event listeners to prevent double triggering
  const newBtn = downloadBtn.cloneNode(true);
  downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);
  
  newBtn.addEventListener('click', () => {
    generateAndDownloadDesign();
  });
});

function generateAndDownloadDesign() {
  const frontLayer = document.getElementById('front-layer');
  const backLayer = document.getElementById('back-layer');
  const hasFront = frontLayer.querySelector('.design-image');
  const hasBack = backLayer.querySelector('.design-image');

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

  // Get the product view (the visible area)
  const productView = designLayer.closest('.product-view');
  const viewRect = productView.getBoundingClientRect();
  const layerRect = designLayer.getBoundingClientRect();

  // Get the design container's position and size
  const containerRect = designContainer.getBoundingClientRect();

  // Calculate the container's position relative to the product view
  const containerX = containerRect.left - viewRect.left;
  const containerY = containerRect.top - viewRect.top;
  
  // Get the image's position and size within the container
  const imgStyle = window.getComputedStyle(designImage);
  const imgX = parseFloat(imgStyle.left) || 0;
  const imgY = parseFloat(imgStyle.top) || 0;
  const imgWidth = designImage.offsetWidth;
  const imgHeight = designImage.offsetHeight;

  // Get the container's dimensions
  const containerWidth = designContainer.offsetWidth;
  const containerHeight = designContainer.offsetHeight;

  // Calculate scaling factors based on the actual design area (150x150px) and base image
  const designAreaWidth = 150; // This is the BOUNDARY.WIDTH from your main script
  const designAreaHeight = 150; // This is the BOUNDARY.HEIGHT from your main script
  
  const scaleX = baseImage.naturalWidth / viewRect.width;
  const scaleY = baseImage.naturalHeight / viewRect.height;

  // Calculate final position and size
  // We need to scale based on the container's size relative to the design area
  const widthScaleFactor = containerWidth / designAreaWidth;
  const heightScaleFactor = containerHeight / designAreaHeight;
  
  const finalX = containerX * scaleX;
  const finalY = containerY * scaleY;
  const finalWidth = imgWidth * scaleX * widthScaleFactor;
  const finalHeight = imgHeight * scaleY * heightScaleFactor;

  // Draw the image
  ctx.drawImage(
    designImage,
    finalX + (imgX * scaleX),
    finalY + (imgY * scaleY),
    finalWidth,
    finalHeight
  );
}

function downloadImage(canvas, filename) {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  // Add to DOM temporarily to ensure click works
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
