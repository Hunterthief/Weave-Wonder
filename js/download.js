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

  // Get the product view element (the outer wrapper)
  const productView = designLayer.closest('.product-view');
  if (!productView) return;

  // Get dimensions
  const viewRect = productView.getBoundingClientRect();
  const containerRect = designContainer.getBoundingClientRect();
  const baseImageWidth = baseImage.naturalWidth || baseImage.width;
  const baseImageHeight = baseImage.naturalHeight || baseImage.height;

  // Calculate scale factor from visible product view to final canvas
  const scaleX = baseImageWidth / viewRect.width;
  const scaleY = baseImageHeight / viewRect.height;

  // Get container position relative to product view
  const containerX = containerRect.left - viewRect.left;
  const containerY = containerRect.top - viewRect.top;

  // Get image position within container
  const imgStyle = window.getComputedStyle(designImage);
  const imgX = parseFloat(imgStyle.left) || 0;
  const imgY = parseFloat(imgStyle.top) || 0;

  // Get actual rendered size of the image
  const imgWidth = designImage.offsetWidth;
  const imgHeight = designImage.offsetHeight;

  // 🚀 Step 1: Simulate the editor's initial scaling to 150x150
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

  // Now, apply the user's transformations (positioning and resizing)
  // These are stored in the style of .design-image
  const finalImgX = imgX; // This is relative to the container
  const finalImgY = imgY;

  // Final width/height after user resizing
  const finalImgWidth = imgWidth;
  const finalImgHeight = imgHeight;

  // Convert everything to final canvas coordinates
  const finalX = (containerX + finalImgX) * scaleX;
  const finalY = (containerY + finalImgY) * scaleY;

  // Scale the final size by the same factor
  const finalWidth = finalImgWidth * scaleX;
  const finalHeight = finalImgHeight * scaleY;

  // Draw the image
  ctx.drawImage(
    designImage,
    finalX,
    finalY,
    finalWidth,
    finalHeight
  );
  console.log("Original:", naturalWidth, "x", naturalHeight);
console.log("Scaled to fit:", scaledWidth, "x", scaledHeight);
console.log("User resized:", finalImgWidth, "x", finalImgHeight);
console.log("Final drawn:", finalWidth, "x", finalHeight);
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







