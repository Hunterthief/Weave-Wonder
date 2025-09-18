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
// Use a more robust approach to ensure only one event listener
(function setupDownloadHandler() {
  const downloadBtn = document.getElementById('download-design');
  if (!downloadBtn) {
    console.error("Download button not found!");
    return;
  }
  
  // Remove ALL previous event listeners by replacing with a new element
  const newBtn = downloadBtn.cloneNode(true);
  downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);
  
  // Single flag to prevent multiple downloads
  let downloadInProgress = false;
  
  // Add the SINGLE event listener
  newBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent multiple downloads
    if (downloadInProgress) {
      console.log("Download already in progress - ignoring additional click");
      return;
    }
    
    downloadInProgress = true;
    console.log("Download initiated");
    
    // Small delay to allow UI to update
    setTimeout(() => {
      try {
        generateAndDownloadDesign();
      } catch (error) {
        console.error("Download error:", error);
      } finally {
        // Reset flag after a reasonable time
        setTimeout(() => {
          downloadInProgress = false;
          console.log("Download process reset");
        }, 2000);
      }
    }, 100);
  }, { once: false });
})();

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

  // Get the design image
  const designImage = designContainer.querySelector('.design-image');
  if (!designImage || !designImage.complete) return;

  // Get references to key elements
  const productView = designLayer.closest('.product-view');
  if (!productView) return;

  // Get dimensions
  const viewRect = productView.getBoundingClientRect();
  const containerRect = designContainer.getBoundingClientRect();
  const baseImageWidth = baseImage.naturalWidth || baseImage.width;
  const baseImageHeight = baseImage.naturalHeight || baseImage.height;

  // Calculate scaling factor from view to canvas
  const scaleX = baseImageWidth / viewRect.width;
  const scaleY = baseImageHeight / viewRect.height;

  // Get container position relative to product view
  const containerX = containerRect.left - viewRect.left;
  const containerY = containerRect.top - viewRect.top;
  
  // Get container's current dimensions
  const containerWidth = designContainer.offsetWidth;
  const containerHeight = designContainer.offsetHeight;

  // Get image position within container
  const imgStyle = window.getComputedStyle(designImage);
  const imgX = parseFloat(imgStyle.left) || 0;
  const imgY = parseFloat(imgStyle.top) || 0;
  const imgWidth = designImage.offsetWidth;
  const imgHeight = designImage.offsetHeight;

  // KEY FIX: Calculate the ratio of current container size to original design area (150x150)
  const designAreaWidth = 150; // From BOUNDARY.WIDTH
  const designAreaHeight = 150; // From BOUNDARY.HEIGHT
  
  // Calculate how much the container has been resized relative to original design area
  const widthRatio = containerWidth / designAreaWidth;
  const heightRatio = containerHeight / designAreaHeight;
  
  // Calculate final position and size
  // Position should be scaled directly
  const finalX = (containerX + imgX) * scaleX;
  const finalY = (containerY + imgY) * scaleY;
  
  // Size should be scaled by the container-to-design-area ratio
  // This is the critical fix - we need to account for how much the container has been resized
  const finalWidth = imgWidth * scaleX * widthRatio;
  const finalHeight = imgHeight * scaleY * heightRatio;

  // Apply an additional correction factor based on the actual visible design area
  // This ensures the downloaded image matches exactly what you see on screen
  const correctionFactor = 1.0; // You can adjust this if needed (try 0.8, 0.9, etc. if still not perfect)
  
  // Draw the image
  ctx.drawImage(
    designImage,
    finalX,
    finalY,
    finalWidth * correctionFactor,
    finalHeight * correctionFactor
  );
}

function downloadImage(canvas, filename) {
  // Create download link
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  
  // Add to document body
  document.body.appendChild(link);
  
  // Trigger download with delay to ensure proper execution
  setTimeout(() => {
    try {
      link.click();
    } catch (error) {
      console.error("Error triggering download:", error);
    } finally {
      // Clean up
      document.body.removeChild(link);
    }
  }, 50);
}
