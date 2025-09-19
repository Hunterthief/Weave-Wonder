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

  // --- Force-fit image to 150x150px ---
  const MAX_DIMENSION = 150;
  const naturalWidth = designImage.naturalWidth || designImage.width;
  const naturalHeight = designImage.naturalHeight || designImage.height;

  // Calculate scale to fit within 150px max dimension
  const scaleToFit = Math.min(MAX_DIMENSION / naturalWidth, MAX_DIMENSION / naturalHeight);
  const scaledWidth = naturalWidth * scaleToFit;
  const scaledHeight = naturalHeight * scaleToFit;

  // Center the image in the 150x150 container
  const leftOffset = (MAX_DIMENSION - scaledWidth) / 2;
  const topOffset = (MAX_DIMENSION - scaledHeight) / 2;

  // --- Now draw it at the scaled size ---
  // We assume the .product-view is exactly 150x150px
  const productView = designLayer.closest('.product-view');
  if (!productView) return;

  const viewRect = productView.getBoundingClientRect();

  // Position: center of the container
  const finalX = (viewRect.width / 2 - scaledWidth / 2);
  const finalY = (viewRect.height / 2 - scaledHeight / 2);

  // Size: use the scaled size directly
  const finalWidth = scaledWidth;
  const finalHeight = scaledHeight;

  // Draw the image at the correct size and position
  ctx.drawImage(
    designImage,
    finalX,
    finalY,
    finalWidth,
    finalHeight
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












