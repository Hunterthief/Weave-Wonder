// --- Assuming BOUNDARY is defined in your main script ---
// const BOUNDARY = { TOP: 101, LEFT: 125, WIDTH: 150, HEIGHT: 150 };
// Make sure this line exists in your main script file.

// 🚀 Expose a function to generate the mockup canvas for a specific side
// This version simulates user resizing the image to fit the 150x150 boundary
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
      // Return canvas even if base image failed, but log the error
      // Returning early here might be better depending on requirements
      // For now, let's continue to see if design drawing reports issues
  }


  // 2. Find the design elements
  const designContainer = designLayer.querySelector('.design-container');
  if (!designContainer) {
      console.log("No design container found for this side.");
      // Return canvas with just the base image if no design
      return canvas;
  }

  const designImage = designContainer.querySelector('.design-image');
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

  // --- SIMULATE USER RESIZING THE IMAGE TO FIT THE 150x150 CONTAINER ---
  const naturalWidth = designImage.naturalWidth;
  const naturalHeight = designImage.naturalHeight;
  console.log(`Design image natural size: ${naturalWidth} x ${naturalHeight}`);

  // The editor container is 150x150
  const CONTAINER_SIZE = 150;

  // Calculate the scale factor to make the image touch both edges of the 150x150 container
  // This mimics the user dragging a corner handle until it fits perfectly
  const scaleToFillContainer = Math.max(CONTAINER_SIZE / naturalWidth, CONTAINER_SIZE / naturalHeight);
  console.log(`Scale factor to fill 150x150 container: ${scaleToFillContainer}`);

  // Calculate the final width and height the image would have after this simulated resize
  // Note: Using 'max' means one dimension will be exactly 150, the other might be larger before clamping
  // But since the container is 150x150, the final drawn size will effectively be <= 150 in both dims,
  // and at least one will be exactly 150. This is how user resizing works too.
  const simulatedUserResizedWidth = naturalWidth * scaleToFillContainer;
  const simulatedUserResizedHeight = naturalHeight * scaleToFillContainer;
  console.log(`Simulated user-resized image size: ${simulatedUserResizedWidth} x ${simulatedUserResizedHeight}`);

  // Calculate the position (left, top) to center this resized image within the 150x150 container
  // This is identical to the initial centering logic in reader.onload
  const simulatedUserLeft = (CONTAINER_SIZE - simulatedUserResizedWidth) / 2;
  const simulatedUserTop = (CONTAINER_SIZE - simulatedUserResizedHeight) / 2;
  console.log(`Simulated user position (centered in 150x150): left=${simulatedUserLeft}, top=${simulatedUserTop}`);

  // --- Temporarily override the image's style to simulate the user's final action ---
  // Store original styles to restore later
  const originalStyleWidth = designImage.style.width;
  const originalStyleHeight = designImage.style.height;
  const originalStyleLeft = designImage.style.left;
  const originalStyleTop = designImage.style.top;

  // Apply the simulated user resize/position
  designImage.style.width = simulatedUserResizedWidth + 'px';
  designImage.style.height = simulatedUserResizedHeight + 'px';
  designImage.style.left = simulatedUserLeft + 'px';
  designImage.style.top = simulatedUserTop + 'px';

  console.log("--- Simulated user resize/position applied ---");

  // --- Now, call the EXISTING drawDesign function ---
  // It will read the new offsetWidth/offsetHeight and computed styles
  // and draw the image correctly onto the full-size canvas based on the BOUNDARY
  try {
      drawDesign(ctx, baseImage, designLayer);
      console.log("--- drawDesign executed with simulated user input ---");
  } catch (drawError) {
      console.error("Error in drawDesign function:", drawError);
  } finally {
      // --- Restore the original styles ---
      designImage.style.width = originalStyleWidth;
      designImage.style.height = originalStyleHeight;
      designImage.style.left = originalStyleLeft;
      designImage.style.top = originalStyleTop;
      console.log("--- Original image styles restored ---");
  }

  return canvas;
};

// --- Keep the existing drawDesign function ---
// This function contains the logic that correctly maps the 150x150 editor
// coordinates/sizes to the full base image canvas coordinates/sizes.
function drawDesign(ctx, baseImage, designLayer) {
  // Draw base image
  ctx.drawImage(baseImage, 0, 0);

  // Find the design container
  const designContainer = designLayer.querySelector('.design-container');
  if (!designContainer) return;

  // Get the design image
  const designImage = designContainer.querySelector('.design-image');
  if (!designImage || !designImage.complete) return; // Or check .src

  // Get references to key elements
  const productView = designLayer.closest('.product-view');
  if (!productView) return;

  // Get dimensions
  const viewRect = productView.getBoundingClientRect();
  const containerRect = designContainer.getBoundingClientRect();
  const baseImageWidth = baseImage.naturalWidth || baseImage.width;
  const baseImageHeight = baseImage.naturalHeight || baseImage.height;

  // Calculate scaling factor from the visible product view to the final canvas (base image)
  // This maps the 150x150 editor view to the full base image size (e.g., 400x440)
  const scaleX = baseImageWidth / viewRect.width;
  const scaleY = baseImageHeight / viewRect.height;

  // Get container position relative to product view
  const containerX = containerRect.left - viewRect.left;
  const containerY = containerRect.top - viewRect.top;

  // Get image position within container
  // These values (imgX, imgY) are already in pixels relative to the container
  const imgStyle = window.getComputedStyle(designImage);
  const imgX = parseFloat(imgStyle.left) || 0;
  const imgY = parseFloat(imgStyle.top) || 0;

  // Get the ACTUAL rendered size of the image element (after our simulation)
  // This is the key part - it reads the size the user *would have set*
  const imgWidth = designImage.offsetWidth;
  const imgHeight = designImage.offsetHeight;

  // Calculate final position:
  // (Container position + Image offset within container) * Scale Factor
  const finalX = (containerX + imgX) * scaleX;
  const finalY = (containerY + imgY) * scaleY;

  // Calculate final size:
  // Image's rendered size * Scale Factor
  // This maps the simulated 150x150 user size to the correct size on the big canvas
  const finalWidth = imgWidth * scaleX;
  const finalHeight = imgHeight * scaleY;

  // Draw the image at its correct, scaled position and size
  ctx.drawImage(
    designImage,
    finalX,
    finalY,
    finalWidth,
    finalHeight
  );
  console.log(`Drew design at (${finalX.toFixed(2)}, ${finalY.toFixed(2)}) size ${finalWidth.toFixed(2)}x${finalHeight.toFixed(2)}`);
}


// --- Setup download button to prevent multiple clicks ---
// (The rest of your download button setup code remains the same)
let downloadButtonSetupComplete = false;
document.addEventListener('DOMContentLoaded', () => {
    if (downloadButtonSetupComplete) {
        console.log("Download button setup already completed, skipping.");
        return;
    }

    const downloadBtn = document.getElementById('download-design');
    if (!downloadBtn) {
        console.error("Download button with ID 'download-design' not found in the DOM.");
        return;
    }

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
        newBtn.disabled = true;
        console.log("Download process started.");

        setTimeout(() => {
             try {
                const frontLayer = document.getElementById('front-layer');
                const backLayer = document.getElementById('back-layer');
                const hasFront = frontLayer?.querySelector('.design-container') !== null;
                const hasBack = backLayer?.querySelector('.design-container') !== null;

                if (!hasFront && !hasBack) {
                    alert("No design uploaded.");
                    return;
                }

                console.log(`Found designs - Front: ${hasFront}, Back: ${hasBack}`);

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
                setTimeout(() => {
                    downloadInProgress = false;
                    const btn = document.getElementById('download-design');
                    if (btn) {
                        btn.disabled = false;
                    }
                    console.log("Download process finished and button re-enabled.");
                }, 1000);
            }
        }, 50);
    });

    downloadButtonSetupComplete = true;
    console.log("Download button event listener attached.");
});

// --- Function to trigger the download ---
function downloadImage(canvas, filename) {
  console.log(`Initiating download for ${filename}`);
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

  document.body.appendChild(link);

  try {
    console.log(`Triggering click for ${filename}`);
    link.click();
  } catch (clickError) {
    console.error("Error triggering download click:", clickError);
    alert("Sorry, an error occurred triggering the download.");
  } finally {
    document.body.removeChild(link);
    console.log(`Download link removed for ${filename}`);
  }
}
