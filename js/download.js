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

  // --- Get the base image dimensions (final canvas size) ---
  const baseImageWidth = baseImage.naturalWidth || baseImage.width;
  const baseImageHeight = baseImage.naturalHeight || baseImage.height;

  // --- Get the editor container dimensions (always 150x150) ---
  // IMPORTANT: This must match the size of the .design-container in your editor
  const EDITOR_CONTAINER_SIZE = 150; // As defined in your reader.onload

  // --- Calculate the mapping scale from editor to final image ---
  const scaleToFinal = baseImageWidth / EDITOR_CONTAINER_SIZE; // Assuming square base image and 150x150 editor area
  // If your base image or editor area isn't perfectly square, you might need separate scaleX and scaleY:
  // const scaleX = baseImageWidth / EDITOR_CONTAINER_SIZE;
  // const scaleY = baseImageHeight / EDITOR_CONTAINER_SIZE;

  // --- Get user-applied position and size from the editor ---

  // 1. Position of the .design-container within the .product-view (editor area)
  //    (This part might be zero if the container itself isn't moved, only the image inside)
  //    But let's get it for completeness.
  const productView = designLayer.closest('.product-view');
  if (!productView) return;
  const viewRect = productView.getBoundingClientRect();
  const containerRect = designContainer.getBoundingClientRect();
  const containerXInView = containerRect.left - viewRect.left; // Should be 0 if container isn't dragged
  const containerYInView = containerRect.top - viewRect.top;   // Should be 0 if container isn't dragged

  // 2. Position and size of the image within the .design-container (150x150px)
  const imgStyle = window.getComputedStyle(designImage);
  const imgXInContainer = parseFloat(imgStyle.left) || 0; // Position relative to container
  const imgYInContainer = parseFloat(imgStyle.top) || 0;  // Position relative to container
  const imgWidthInContainer = designImage.offsetWidth;     // Rendered width in container
  const imgHeightInContainer = designImage.offsetHeight;   // Rendered height in container

  // --- Calculate final position and size on the base image ---
  // Map the user's final actions directly
  const finalX = (containerXInView + imgXInContainer) * scaleToFinal;
  const finalY = (containerYInView + imgYInContainer) * scaleToFinal;
  const finalWidth = imgWidthInContainer * scaleToFinal;
  const finalHeight = imgHeightInContainer * scaleToFinal;

  // --- Draw the image ---
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









