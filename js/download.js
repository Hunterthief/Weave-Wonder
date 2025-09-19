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

  // --- SIMULATE USER RESIZE TO 150x150 ---
  const naturalWidth = designImage.naturalWidth;
  const naturalHeight = designImage.naturalHeight;
  console.log(`Design image natural size: ${naturalWidth} x ${naturalHeight}`);

  // Calculate scale factors to make width=150 and height=150
  // We use the larger scale to ensure at least one dimension hits 150,
  // and the other fills or overflows the 150px boundary (simulating user stretch-to-edge)
  const scaleForWidth = 150 / naturalWidth;
  const scaleForHeight = 150 / naturalHeight;
  const simulatedUserScale = Math.max(scaleForWidth, scaleForHeight);

  // Calculate the simulated final dimensions after user resize
  const simulatedWidth = naturalWidth * simulatedUserScale;
  const simulatedHeight = naturalHeight * simulatedUserScale;
  console.log(`Simulated user-resized dimensions: ${simulatedWidth} x ${simulatedHeight}`);

  // Center this simulated size within the 150x150 container
  const centeredXOffset = (150 - simulatedWidth) / 2;
  const centeredYOffset = (150 - simulatedHeight) / 2;
  console.log(`Simulated user-resized position within container: (${centeredXOffset}, ${centeredYOffset})`);

  // --- Map simulated user state to final canvas coordinates ---
  // Final position is the BOUNDARY's top-left plus the simulated centered offset
  const finalX = BOUNDARY.LEFT + centeredXOffset;
  const finalY = BOUNDARY.TOP + centeredYOffset;
  // Final size is the simulated user-resized dimensions
  const finalWidth = simulatedWidth;
  const finalHeight = simulatedHeight;

  // 5. Draw the design image onto the canvas using the simulated state
  try {
    ctx.drawImage(
      designImage,
      finalX,      // x-coordinate on the final canvas
      finalY,      // y-coordinate on the final canvas
      finalWidth,  // Simulated width (>= 150)
      finalHeight  // Simulated height (>= 150)
    );
    console.log(`--- Drew design (Simulated User Resize) at (${finalX.toFixed(2)}, ${finalY.toFixed(2)}) size ${finalWidth.toFixed(2)}x${finalHeight.toFixed(2)} ---`);
  } catch (drawError) {
      console.error("Failed to draw design image:", drawError);
  }

  return canvas;
};

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
