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
  
  // Use a flag to prevent multiple simultaneous downloads
  let isDownloading = false;
  
  newBtn.addEventListener('click', () => {
    if (isDownloading) return; // Prevent multiple triggers
    isDownloading = true;
    
    setTimeout(() => {
      generateAndDownloadDesign();
      setTimeout(() => {
        isDownloading = false; // Reset after a short delay
      }, 1000);
    }, 10);
  });
});

function generateAndDownloadDesign() {
  const frontLayer = document.getElementById('front-layer');
  const backLayer = document.getElementById('back-layer');
  const hasFront = frontLayer.querySelector('.design-container');
  const hasBack = backLayer.querySelector('.design-container');

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

  // Find the design container
  const designContainer = designLayer.querySelector('.design-container');
  if (!designContainer) return;

  // Get references to key elements
  const productView = designLayer.closest('.product-view');
  const viewRect = productView.getBoundingClientRect();
  const layerRect = designLayer.getBoundingClientRect();
  const containerRect = designContainer.getBoundingClientRect();

  // Calculate scaling factor from screen to canvas
  const scaleX = ctx.canvas.width / viewRect.width;
  const scaleY = ctx.canvas.height / viewRect.height;

  // Calculate container position relative to product view
  const containerX = containerRect.left - viewRect.left;
  const containerY = containerRect.top - viewRect.top;
  const containerWidth = containerRect.width;
  const containerHeight = containerRect.height;

  // Create a temporary canvas to render the container exactly as it appears
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  
  // Set temp canvas size to match container size
  tempCanvas.width = containerWidth;
  tempCanvas.height = containerHeight;
  
  // Fill with transparent background
  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
  
  // Render the design image within the container
  const designImage = designContainer.querySelector('.design-image');
  if (designImage && designImage.complete) {
    // Get image position within container
    const imgStyle = window.getComputedStyle(designImage);
    const imgX = parseFloat(imgStyle.left) || 0;
    const imgY = parseFloat(imgStyle.top) || 0;
    const imgWidth = designImage.offsetWidth;
    const imgHeight = designImage.offsetHeight;
    
    // Draw the image on the temporary canvas
    tempCtx.drawImage(
      designImage,
      imgX,
      imgY,
      imgWidth,
      imgHeight
    );
  }

  // Now draw the temporary canvas onto the main canvas at the correct position and scale
  ctx.drawImage(
    tempCanvas,
    containerX * scaleX,
    containerY * scaleY,
    containerWidth * scaleX,
    containerHeight * scaleY
  );
}

function downloadImage(canvas, filename) {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  // Add to DOM temporarily to ensure click works
  document.body.appendChild(link);
  setTimeout(() => {
    link.click();
    document.body.removeChild(link);
  }, 10);
}
