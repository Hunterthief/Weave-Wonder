// --- Assuming BOUNDARY is defined in your main script ---
// const BOUNDARY = { TOP: 101, LEFT: 125, WIDTH: 150, HEIGHT: 150 };
// Make sure this line exists in your main script file.

// 🚀 Expose a function to generate the mockup canvas for a specific side
window.generateMockupCanvas = function (side) {
  console.log(`Generating canvas for ${side}`);
  const viewId = side === 'front' ? 'front-view' : 'back-view';
  const layerId = side === 'front' ? 'front-layer' : 'back-layer';

  // Use optional chaining and explicit checks
  const viewElement = document.getElementById(viewId);
  const baseImage = viewElement?.querySelector?.('.base-image');
  const designLayer = document.getElementById(layerId);

  if (!viewElement || !baseImage || !designLayer) {
    console.error(`Elements for ${side} not found. View: ${viewElement}, BaseImg: ${baseImage}, Layer: ${designLayer}`);
    return null;
  }

  // Ensure base image is loaded before proceeding
  if (!baseImage.complete) {
      console.error("Base image is not loaded yet.");
      // Consider returning a Promise that resolves when the image loads,
      // or handling this case upstream.
      return null;
  }

  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas size to match base image dimensions
  canvas.width = baseImage.naturalWidth || baseImage.width;
  canvas.height = baseImage.naturalHeight || baseImage.height;
  console.log(`Canvas size set to ${canvas.width} x ${canvas.height}`);

  // 1. Draw the base mockup image onto the canvas FIRST
  try {
      ctx.drawImage(baseImage, 0, 0);
      console.log("Base image drawn successfully.");
  } catch (imgError) {
      console.error("Failed to draw base image:", imgError);
      return canvas; // Return canvas even if base image failed, but log the error
  }

  // 2. Find the design elements
  const designContainer = designLayer.querySelector('.design-container');
  if (!designContainer) {
      console.log("No design container found for this side.");
      return canvas; // Return canvas with just the base image
  }

  const designImage = designContainer.querySelector('.design-image');
  // More robust check for image readiness
  if (!designImage || !designImage.src || designImage.src === '') {
      console.log("Design image element found but no valid source.");
      return canvas;
  }

  // Wait for the design image to load if it's not complete
  if (!designImage.complete) {
      console.log("Design image is not loaded yet, waiting...");
      // Returning canvas here means the design won't be drawn if it's not ready.
      // A more advanced solution would involve Promises.
      return canvas;
  }

  if (designImage.naturalWidth === 0 || designImage.naturalHeight === 0) {
       console.log("Design image loaded but reports 0 natural dimensions.");
       return canvas;
  }


  // --- Force-fit the design image within the BOUNDARY area ---
  const MAX_BOUNDARY_DIMENSION = BOUNDARY.WIDTH; // Assuming WIDTH == HEIGHT == 150
  const naturalWidth = designImage.naturalWidth;
  const naturalHeight = designImage.naturalHeight;
  console.log(`Design image natural size: ${naturalWidth} x ${naturalHeight}`);

  // Calculate scale to fit within the BOUNDARY dimensions while preserving aspect ratio
  const scaleToFit = Math.min(MAX_BOUNDARY_DIMENSION / naturalWidth, MAX_BOUNDARY_DIMENSION / naturalHeight);
  const scaledWidth = naturalWidth * scaleToFit;
  const scaledHeight = naturalHeight * scaleToFit;
  console.log(`Design scaled to fit: ${scaledWidth} x ${scaledHeight}`);

  // Center the scaled image within the BOUNDARY area
  const leftOffsetWithinBoundary = (BOUNDARY.WIDTH - scaledWidth) / 2;
  const topOffsetWithinBoundary = (BOUNDARY.HEIGHT - scaledHeight) / 2;
  console.log(`Design offset within boundary: left=${leftOffsetWithinBoundary}, top=${topOffsetWithinBoundary}`);

  // --- Calculate final position and size on the full base image canvas ---
  // Final position is the BOUNDARY's top-left plus the centered offset within that boundary
  const finalX = BOUNDARY.LEFT + leftOffsetWithinBoundary;
  const finalY = BOUNDARY.TOP + topOffsetWithinBoundary;
  const finalWidth = scaledWidth;
  const finalHeight = scaledHeight;

  // 5. Draw the design image onto the canvas at the calculated position and size
  try {
    ctx.drawImage(
      designImage,
      finalX,
      finalY,
      finalWidth,
      finalHeight
    );
    console.log(`Drew design at (${finalX.toFixed(2)}, ${finalY.toFixed(2)}) size ${finalWidth.toFixed(2)}x${finalHeight.toFixed(2)}`);
  } catch (drawError) {
      console.error("Failed to draw design image:", drawError);
  }

  return canvas;
};

// --- Setup download button to prevent multiple clicks ---
let downloadButtonSetupComplete = false;
document.addEventListener('DOMContentLoaded', () => {
    // Ensure this setup only runs once
    if (downloadButtonSetupComplete) {
        console.log("Download button setup already completed, skipping.");
        return;
    }

    const downloadBtn = document.getElementById('download-design');
    if (!downloadBtn) {
        console.error("Download button with ID 'download-design' not found in the DOM.");
        return;
    }

    // Safety check: remove any existing listeners by cloning (standard practice)
    const newBtn = downloadBtn.cloneNode(true);
    downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);

    let downloadInProgress = false;

    newBtn.addEventListener('click', function (e) {
        console.log("Download button clicked.");
        e.preventDefault();
        e.stopPropagation();

        if (downloadInProgress) {
            console.log("Download is already in progress. Ignoring click.");
            return;
        }

        downloadInProgress = true;
        newBtn.disabled = true; // Visually disable the button
        console.log("Download process started.");

        // Use a short timeout to allow UI updates (like disabling the button) to render
        setTimeout(() => {
             try {
                // --- Logic to generate and download ---
                const frontLayer = document.getElementById('front-layer');
                const backLayer = document.getElementById('back-layer');
                // Check for the container, not the image directly
                const hasFront = frontLayer?.querySelector('.design-container') !== null;
                const hasBack = backLayer?.querySelector('.design-container') !== null;

                if (!hasFront && !hasBack) {
                    alert("No design uploaded.");
                    return;
                }

                console.log(`Found designs - Front: ${hasFront}, Back: ${hasBack}`);

                // --- Generate and trigger downloads ---
                if (hasFront) {
                    console.log("Generating front canvas...");
                    const frontCanvas = window.generateMockupCanvas('front');
                    if (frontCanvas) {
                        console.log("Downloading front preview...");
                        downloadImage(frontCanvas, 'front-preview.png');
                    }
                }

                if (hasBack) {
                    console.log("Generating back canvas...");
                    const backCanvas = window.generateMockupCanvas('back');
                    if (backCanvas) {
                        console.log("Downloading back preview...");
                        downloadImage(backCanvas, 'back-preview.png');
                    }
                }

            } catch (error) {
                console.error("An error occurred during the download process:", error);
            } finally {
                // Re-enable the button and reset the flag after a short delay
                // to prevent accidental double clicks
                setTimeout(() => {
                    downloadInProgress = false;
                    const btn = document.getElementById('download-design');
                    if (btn) {
                        btn.disabled = false;
                    }
                    console.log("Download process finished and button re-enabled.");
                }, 1000); // Adjust delay as needed
            }
        }, 50); // Short delay
    });

    downloadButtonSetupComplete = true;
    console.log("Download button event listener attached.");
});

function downloadImage(canvas, filename) {
  console.log(`Initiating download for ${filename}`);
  // Create download link
  const link = document.createElement('a');
  try {
      link.href = canvas.toDataURL('image/png');
  } catch (canvasError) {
      console.error("Failed to generate data URL from canvas:", canvasError);
      alert("Sorry, an error occurred preparing the image for download.");
      return;
  }
  link.download = filename;
  console.log(`Download link created for ${filename}`);

  // Add to document body
  document.body.appendChild(link);

  // Trigger download
  try {
    console.log(`Triggering click for ${filename}`);
    link.click();
  } catch (clickError) {
    console.error("Error triggering download click:", clickError);
    alert("Sorry, an error occurred triggering the download.");
  } finally {
    // Clean up immediately
    document.body.removeChild(link);
    console.log(`Download link removed for ${filename}`);
  }
}

// --- Keep the setCanvasSize function for potential future use or other functions ---
function setCanvasSize(ctx, baseImage) {
  ctx.canvas.width = baseImage.naturalWidth || baseImage.width;
  ctx.canvas.height = baseImage.naturalHeight || baseImage.height;
}

// --- Keep the old drawDesign for reference (but it's not used in the new flow) ---
/*
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
*/
