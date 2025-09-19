// --- Assuming BOUNDARY is defined somewhere in your script like this ---
// Please ensure this matches the actual BOUNDARY definition in your code
const BOUNDARY = { TOP: 101, LEFT: 125, WIDTH: 150, HEIGHT: 150 };

// 🚀 Expose a function to generate the mockup canvas for a specific side
window.generateMockupCanvas = function (side) {
  const viewId = side === 'front' ? 'front-view' : 'back-view';
  const layerId = side === 'front' ? 'front-layer' : 'back-layer';

  const baseImage = document.getElementById(viewId)?.querySelector('.base-image');
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

// 🚀 Setup download functionality to run only once after the page loads
// and prevent multiple clicks
document.addEventListener('DOMContentLoaded', () => {
  const downloadBtn = document.getElementById('download-design');
  if (!downloadBtn) {
    console.error("Download button not found!");
    return;
  }

  // Flag to prevent multiple simultaneous downloads
  let downloadInProgress = false;

  // Remove any existing event listeners (good practice)
  const newBtn = downloadBtn.cloneNode(true);
  downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);

  // Add the single, definitive event listener
  newBtn.addEventListener('click', function (e) {
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
        // Reset flag after download attempt finishes
        downloadInProgress = false;
        console.log("Download process reset");
      }
    }, 100);
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

// --- Updated drawDesign function ---
function drawDesign(ctx, baseImage, designLayer) {
  // 1. Draw the base mockup image onto the canvas
  ctx.drawImage(baseImage, 0, 0);

  // 2. Find the design elements
  const designContainer = designLayer.querySelector('.design-container');
  if (!designContainer) return; // No design to draw

  const designImage = designContainer.querySelector('.design-image');
  if (!designImage || !designImage.complete) return; // Image not ready

  // 3. Force the design image to be 150x150 pixels
  const finalWidth = 150;
  const finalHeight = 150;

  // 4. Position it according to the BOUNDARY defined for the mockup
  //    This places the 150x150 design area correctly on the T-shirt.
  const finalX = BOUNDARY.LEFT;
  const finalY = BOUNDARY.TOP;

  // 5. Draw the design image, stretched or fitted to the 150x150 area.
  //    Note: This will distort the image if its natural aspect ratio is not 1:1.
  //    If you want to fit it without distortion, you'd need to calculate scale/offsets again.
  //    But the request was "force size to 150x150".
  ctx.drawImage(
    designImage,
    finalX,
    finalY,
    finalWidth,
    finalHeight
  );

  // Optional: Add a console log to verify
  console.log(`Drew design at (${finalX}, ${finalY}) size ${finalWidth}x${finalHeight}`);
}

function downloadImage(canvas, filename) {
  // Create download link
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;

  // Add to document body
  document.body.appendChild(link);

  // Trigger download
  try {
    link.click();
  } catch (error) {
    console.error("Error triggering download:", error);
  } finally {
    // Clean up immediately
    document.body.removeChild(link);
  }
}
