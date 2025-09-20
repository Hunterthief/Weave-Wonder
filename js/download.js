// download.js

// --- Setup download button to prevent multiple clicks ---
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
                // Check for the container element itself, as the image might not be loaded yet if dropped
                const hasFront = frontLayer?.querySelector('.design-container') !== null;
                const hasBack = backLayer?.querySelector('.design-container') !== null;

                if (!hasFront && !hasBack) {
                    alert("No design uploaded.");
                    return;
                }

                console.log(`Found designs - Front: ${hasFront}, Back: ${hasBack}`);

                // --- Logic to generate and download ---
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


// 🚀 Expose a function to generate the mockup canvas for a specific side
window.generateMockupCanvas = function(side) {
  console.log(`Generating canvas for ${side}`);
  const viewId = side === 'front' ? 'front-view' : 'back-view';
  const layerId = side === 'front' ? 'front-layer' : 'back-layer';

  // Use optional chaining and explicit checks
  const viewElement = document.getElementById(viewId);
  const baseImage = viewElement?.querySelector?.('.base-image');
  const designLayer = document.getElementById(layerId);

  if (!viewElement || !baseImage || !designLayer) {
    console.error(`Elements for ${side} not found. View: ${!!viewElement}, BaseImg: ${!!baseImage}, Layer: ${!!designLayer}`);
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

  // Set canvas size to match base image dimensions using the robust setCanvasSize
  setCanvasSize(ctx, baseImage);
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


  // --- Now, call the EXISTING drawDesign function ---
  // It will read the user's final offsetWidth/offsetHeight and computed styles
  // and draw the image correctly onto the full-size canvas based on the BOUNDARY
  try {
      drawDesign(ctx, baseImage, designLayer);
      console.log("--- drawDesign executed ---");
  } catch (drawError) {
      console.error("Error in drawDesign function:", drawError);
  }

  return canvas;
};

// --- Keep the setCanvasSize function for potential future use or other functions ---
function setCanvasSize(ctx, baseImage) {
  ctx.canvas.width = baseImage.naturalWidth || baseImage.width;
  ctx.canvas.height = baseImage.naturalHeight || baseImage.height;
}


// --- Corrected drawDesign function ---
// This function correctly maps the 150x150 editor design area to the BOUNDARY on the base image.
function drawDesign(ctx, baseImage, designLayer) {
  // 1. Draw the base image first
  ctx.drawImage(baseImage, 0, 0);

  // 2. Find the design container and image
  const designContainer = designLayer.querySelector('.design-container');
  const designImage = designContainer?.querySelector('.design-image');
  if (!designContainer || !designImage || !designImage.complete) {
    console.log("Design elements not ready in drawDesign.");
    return;
  }

  // 3. Get the final rendered size and position of the image AS SET BY THE USER
  //    within the 150x150 editor container.
  const imgStyle = window.getComputedStyle(designImage);
  const imgX = parseFloat(imgStyle.left) || 0; // Position relative to container
  const imgY = parseFloat(imgStyle.top) || 0;  // Position relative to container
  const imgWidth = designImage.offsetWidth;     // Final user-set width
  const imgHeight = designImage.offsetHeight;   // Final user-set height

  console.log(`User final design size: ${imgWidth} x ${imgHeight} at (${imgX}, ${imgY})`);

  // --- THE CORE FIX: Calculate scale and position based on the KNOWN 150x150 editor area ---

  // 4. Define the known size of the editor container area (from script.js reader.onload)
  const EDITOR_CONTAINER_SIZE = 150;

  // 5. Get the dimensions of the final canvas (which matches the base image)
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;

  // 6. Calculate the scale factor between the editor container (150x150) and the final canvas area (BOUNDARY size)
  //    We assume BOUNDARY.WIDTH and BOUNDARY.HEIGHT are also 150.
  const scaleFromEditorToCanvas = BOUNDARY.WIDTH / EDITOR_CONTAINER_SIZE; // Should be 1.0 if both are 150

  // 7. Calculate the final drawing size: user's size * scale factor
  //    This correctly maps the user's resize actions from the 150x150 editor to the BOUNDARY area.
  const finalWidth = imgWidth * scaleFromEditorToCanvas;
  const finalHeight = imgHeight * scaleFromEditorToCanvas;

  // 8. Calculate the final drawing position:
  //    a. User's position within the editor container (imgX, imgY)
  //    b. Map that position to the canvas using the same scale factor
  //    c. Add the BOUNDARY's top-left offset to place it in the correct area on the mockup
  const finalX = BOUNDARY.LEFT + (imgX * scaleFromEditorToCanvas);
  const finalY = BOUNDARY.TOP + (imgY * scaleFromEditorToCanvas);

  console.log(`Final draw coords: (${finalX.toFixed(2)}, ${finalY.toFixed(2)}) size ${finalWidth.toFixed(2)}x${finalHeight.toFixed(2)}`);

  // 9. Draw the image onto the canvas at the calculated final position and size
  try {
    ctx.drawImage(
      designImage,
      finalX,
      finalY,
      finalWidth,
      finalHeight
    );
    console.log(`Successfully drew design.`);
  } catch (drawError) {
      console.error("Failed to draw design image:", drawError);
  }
}


// --- Function to trigger the download ---
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

// --- Keep the old generateAndDownloadDesign for reference (but it's not used in the new flow) ---
/*
function generateAndDownloadDesign() {
  const frontLayer = document.getElementById('front-layer');
  const backLayer = document.getElementById('back-layer');
  const hasFront = frontLayer.querySelector('.design-image');
  const hasBack = backLayer.querySelector('.design-image');

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
*/
