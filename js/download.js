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
  
  // Remove the button and create a completely new one to ensure no duplicate listeners
  const parent = downloadBtn.parentNode;
  const newBtn = document.createElement('button');
  
  // Copy all attributes from the original button
  for (let attr of downloadBtn.attributes) {
    newBtn.setAttribute(attr.name, attr.value);
  }
  
  // Copy inner HTML
  newBtn.innerHTML = downloadBtn.innerHTML;
  
  // Replace the button
  parent.replaceChild(newBtn, downloadBtn);
  
  // Use a flag to prevent multiple simultaneous downloads
  let isDownloading = false;
  
  newBtn.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent any default behavior
    
    if (isDownloading) {
      console.log("Download already in progress");
      return; // Prevent multiple triggers
    }
    
    isDownloading = true;
    console.log("Starting download process");
    
    setTimeout(() => {
      try {
        generateAndDownloadDesign();
      } catch (error) {
        console.error("Error during download:", error);
      } finally {
        setTimeout(() => {
          isDownloading = false;
          console.log("Download process completed");
        }, 1000);
      }
    }, 50);
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

  // Get the design image
  const designImage = designContainer.querySelector('.design-image');
  if (!designImage || !designImage.complete) return;

  // Get image position within container
  const imgStyle = window.getComputedStyle(designImage);
  const imgX = parseFloat(imgStyle.left) || 0;
  const imgY = parseFloat(imgStyle.top) || 0;
  const imgWidth = designImage.offsetWidth;
  const imgHeight = designImage.offsetHeight;

  // Calculate scaling factor from screen to canvas
  const scaleX = ctx.canvas.width / viewRect.width;
  const scaleY = ctx.canvas.height / viewRect.height;

  // Calculate container position relative to product view
  const containerX = containerRect.left - viewRect.left;
  const containerY = containerRect.top - viewRect.top;
  const containerWidth = containerRect.width;
  const containerHeight = containerRect.height;

  // APPROACH 1: Direct scaling (current approach)
  // const finalX = (containerX + imgX) * scaleX;
  // const finalY = (containerY + imgY) * scaleY;
  // const finalWidth = imgWidth * scaleX;
  // const finalHeight = imgHeight * scaleY;

  // APPROACH 2: Scale based on container size relative to design area (150x150)
  // const designAreaWidth = 150;
  // const designAreaHeight = 150;
  // const widthRatio = containerWidth / designAreaWidth;
  // const heightRatio = containerHeight / designAreaHeight;
  // const finalX = containerX * scaleX;
  // const finalY = containerY * scaleY;
  // const finalWidth = imgWidth * scaleX * widthRatio;
  // const finalHeight = imgHeight * scaleY * heightRatio;

  // APPROACH 3: Use absolute positioning with boundary calculations
  // const boundaryLeft = 125; // BOUNDARY.LEFT from config
  // const boundaryTop = 101; // BOUNDARY.TOP from config
  // const finalX = ((containerX + imgX) / viewRect.width) * ctx.canvas.width;
  // const finalY = ((containerY + imgY) / viewRect.height) * ctx.canvas.height;
  // const finalWidth = (imgWidth / viewRect.width) * ctx.canvas.width;
  // const finalHeight = (imgHeight / viewRect.height) * ctx.canvas.height;

  // APPROACH 4: Create a temporary canvas to render exactly as seen on screen
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = containerWidth;
  tempCanvas.height = containerHeight;
  
  // Clear with transparent background
  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
  
  // Draw the image on the temporary canvas at its exact position
  tempCtx.drawImage(
    designImage,
    imgX,
    imgY,
    imgWidth,
    imgHeight
  );
  
  // Draw the temporary canvas onto the main canvas at the correct position and scale
  ctx.drawImage(
    tempCanvas,
    containerX * scaleX,
    containerY * scaleY,
    containerWidth * scaleX,
    containerHeight * scaleY
  );
  
  // Return here since we've already drawn the design
  return;

  // APPROACH 5: Calculate based on the actual visible area and aspect ratio preservation
  // const designAreaWidth = 150;
  // const designAreaHeight = 150;
  // const aspectRatio = imgWidth / imgHeight;
  // 
  // // Calculate position
  // const finalX = (containerX + imgX) * scaleX;
  // const finalY = (containerY + imgY) * scaleY;
  // 
  // // Calculate size based on container size relative to design area
  // const sizeRatio = Math.min(containerWidth / designAreaWidth, containerHeight / designAreaHeight);
  // const finalWidth = imgWidth * scaleX * sizeRatio;
  // const finalHeight = imgHeight * scaleY * sizeRatio;
  // 
  // // Draw the image
  // ctx.drawImage(
  //   designImage,
  //   finalX,
  //   finalY,
  //   finalWidth,
  //   finalHeight
  // );
}

function downloadImage(canvas, filename) {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  
  // Add to DOM temporarily to ensure click works
  document.body.appendChild(link);
  
  setTimeout(() => {
    try {
      link.click();
    } catch (error) {
      console.error("Error clicking download link:", error);
    } finally {
      document.body.removeChild(link);
    }
  }, 20);
}
