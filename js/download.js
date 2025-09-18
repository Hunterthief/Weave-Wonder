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

// 🚀 Completely re-engineered download setup to prevent double triggering
(function setupSingleDownloadHandler() {
  // Wait for DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDownloadHandler);
  } else {
    initDownloadHandler();
  }

  function initDownloadHandler() {
    const downloadBtn = document.getElementById('download-design');
    if (!downloadBtn) {
      console.error("Download button not found!");
      return;
    }

    // Remove ALL previous event listeners by replacing with a completely new element
    const parent = downloadBtn.parentNode;
    const newBtn = document.createElement('button');
    
    // Copy all attributes
    for (let i = 0; i < downloadBtn.attributes.length; i++) {
      const attr = downloadBtn.attributes[i];
      newBtn.setAttribute(attr.name, attr.value);
    }
    
    // Copy classes and innerHTML
    newBtn.className = downloadBtn.className;
    newBtn.innerHTML = downloadBtn.innerHTML;
    newBtn.id = downloadBtn.id;
    
    // Replace the button
    parent.replaceChild(newBtn, downloadBtn);
    
    // Single flag to prevent multiple downloads
    let isDownloading = false;
    
    // Add the event listener with comprehensive prevention measures
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Double-check if already downloading
      if (isDownloading) {
        console.log("Download already in progress - ignoring click");
        return false;
      }
      
      isDownloading = true;
      console.log("Download process started");
      
      // Small delay to allow UI to update
      setTimeout(() => {
        try {
          generateAndDownloadDesign();
        } catch (error) {
          console.error("Error during download:", error);
        } finally {
          // Reset flag after completion
          setTimeout(() => {
            isDownloading = false;
            console.log("Download process completed and reset");
          }, 1500);
        }
      }, 100);
      
      return false;
    }, false);
  }
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
  
  // Get container's CURRENT dimensions (this is critical - we need the resized dimensions)
  const containerWidth = designContainer.offsetWidth;
  const containerHeight = designContainer.offsetHeight;

  // Get image position within container
  const imgStyle = window.getComputedStyle(designImage);
  const imgX = parseFloat(imgStyle.left) || 0;
  const imgY = parseFloat(imgStyle.top) || 0;
  const imgWidth = designImage.offsetWidth;
  const imgHeight = designImage.offsetHeight;

  // FORCE CORRECT SCALING - This is the key fix
  // Calculate the ratio of current container size to original design area (150x150)
  const designAreaWidth = 150; // From BOUNDARY.WIDTH
  const designAreaHeight = 150; // From BOUNDARY.HEIGHT
  
  const widthScale = containerWidth / designAreaWidth;
  const heightScale = containerHeight / designAreaHeight;
  
  // Calculate final position and size
  const finalX = (containerX * scaleX) + (imgX * scaleX);
  const finalY = (containerY * scaleY) + (imgY * scaleY);
  const finalWidth = imgWidth * scaleX * widthScale;
  const finalHeight = imgHeight * scaleY * heightScale;

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
  // Create download link
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  
  // Add to document body
  document.body.appendChild(link);
  
  // Trigger download with delay
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
