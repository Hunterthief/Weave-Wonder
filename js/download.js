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
                // - Logic to generate and download -
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
      return null;
  }

  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas size to match base image dimensions
  setCanvasSize(ctx, baseImage);
  console.log(`Canvas size set to ${canvas.width} x ${canvas.height}`);

  // 1. Draw the base mockup image onto the canvas FIRST
  try {
      ctx.drawImage(baseImage, 0, 0);
      console.log("Base image drawn successfully.");
  } catch (imgError) {
      console.error("Failed to draw base image:", imgError);
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
      return canvas;
  }

  if (designImage.naturalWidth === 0 || designImage.naturalHeight === 0) {
       console.log("Design image loaded but reports 0 natural dimensions.");
       return canvas;
  }


  // --- Now, call the EXISTING drawDesign function ---
  try {
      drawDesign(ctx, baseImage, designLayer);
      console.log("--- drawDesign executed ---");
  } catch (drawError) {
      console.error("Error in drawDesign function:", drawError);
  }

  return canvas;
};

// --- Keep the setCanvasSize function ---
function setCanvasSize(ctx, baseImage) {
  ctx.canvas.width = baseImage.naturalWidth || baseImage.width;
  ctx.canvas.height = baseImage.naturalHeight || baseImage.height;
}


// --- THE FIX: Define the BOUNDARY constant ---
// This must match the CSS variables and the area in script.js
const BOUNDARY = {
  TOP: 101,   // var(--boundary-top)
  LEFT: 125,  // var(--boundary-left)
  WIDTH: 150, // var(--boundary-width)
  HEIGHT: 150 // var(--boundary-height)
};

// --- FINAL drawDesign function ---
// This function reads the user's final actions within the 150x150 editor container
// and applies them directly to the 150x150 BOUNDARY area on the full-size canvas.
function drawDesign(ctx, baseImage, designLayer) {
  // 1. Draw the base image first (already done in generateMockupCanvas, but safe to call again)
  // ctx.drawImage(baseImage, 0, 0); // Removed as base is drawn before calling drawDesign

  // 2. Find the design container and image
  const designContainer = designLayer.querySelector('.design-container');
  const designImage = designContainer?.querySelector('.design-image');
  if (!designContainer || !designImage || !designImage.complete) {
    console.log("Design elements not ready in drawDesign.");
    return;
  }

  // --- THE FINAL FIX: Map Editor Actions Directly to BOUNDARY ---

  // 3. Get the final rendered size and position of the image AS SET BY THE USER
  //    within the 150x150px editor container (.design-container).
  const imgStyle = window.getComputedStyle(designImage);
  const imgX_inContainer = parseFloat(imgStyle.left) || 0; // Position relative to container left
  const imgY_inContainer = parseFloat(imgStyle.top) || 0;  // Position relative to container top
  const imgWidth_inContainer = designImage.offsetWidth;     // Final user-set width (<= 150)
  const imgHeight_inContainer = designImage.offsetHeight;   // Final user-set height (<= 150)

  console.log(`User final design size in editor: ${imgWidth_inContainer} x ${imgHeight_inContainer} at (${imgX_inContainer}, ${imgY_inContainer})`);

  // 4. Define the known size of the editor container area
  //    This is hardcoded in script.js reader.onload as 150x150px.
  const EDITOR_CONTAINER_WIDTH = 150;
  const EDITOR_CONTAINER_HEIGHT = 150;

  // 5. Define the target area on the final canvas (BOUNDARY)
  //    This is defined in script.js and matched by the CSS variables.
  // const BOUNDARY = { TOP: 101, LEFT: 125, WIDTH: 150, HEIGHT: 150 }; // Defined above
  const BOUNDARY_WIDTH = BOUNDARY.WIDTH; // Should be 150
  const BOUNDARY_HEIGHT = BOUNDARY.HEIGHT; // Should be 150

  // 6. Calculate the scale factors between the editor container and the BOUNDARY area.
  //    Since both are 150x150, these factors are 1.0. This is the key simplification.
  const scaleX = BOUNDARY_WIDTH / EDITOR_CONTAINER_WIDTH; // 150 / 150 = 1.0
  const scaleY = BOUNDARY_HEIGHT / EDITOR_CONTAINER_HEIGHT; // 150 / 150 = 1.0

  // 7. Calculate the final drawing size on the canvas: user's size * scale factor (1.0)
  //    This ensures the physical size on the canvas matches the editor size.
  const finalWidth = imgWidth_inContainer * scaleX; // width * 1.0
  const finalHeight = imgHeight_inContainer * scaleY; // height * 1.0

  // 8. Calculate the final drawing position on the canvas:
  //    a. User's position within the editor container (imgX_inContainer, imgY_inContainer)
  //    b. Scale that position (by 1.0)
  //    c. Add the BOUNDARY's absolute top-left offset to place it correctly on the mockup
  const finalX = BOUNDARY.LEFT + (imgX_inContainer * scaleX); // LEFT + (x * 1.0)
  const finalY = BOUNDARY.TOP + (imgY_inContainer * scaleY);  // TOP + (y * 1.0)

  console.log(`Final draw coords on canvas: (${finalX.toFixed(2)}, ${finalY.toFixed(2)}) size ${finalWidth.toFixed(2)}x${finalHeight.toFixed(2)}`);

  // 9. Draw the image onto the canvas at the calculated final position and size
  //    The size will be the same as in the editor (e.g., 150x150 if that's what the user made it).
  try {
    ctx.drawImage(
      designImage,
      finalX,
      finalY,
      finalWidth,
      finalHeight
    );
    console.log(`Successfully drew design at final size ${finalWidth}x${finalHeight}.`);
  } catch (drawError) {
      console.error("Failed to draw design image:", drawError);
  }
}


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
