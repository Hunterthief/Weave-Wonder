// Download Preview Image Functionality
document.addEventListener('DOMContentLoaded', () => {
  const downloadBtn = document.getElementById('download-design');
  if (!downloadBtn) {
    console.error("Download button not found!");
    return;
  }
  downloadBtn.addEventListener('click', () => {
    generateAndDownloadDesign();
  });
});

function generateAndDownloadDesign() {
  const frontLayer = document.getElementById('front-layer');
  const backLayer = document.getElementById('back-layer');
  const frontBaseImage = document.getElementById('front-view').querySelector('.base-image');
  const backBaseImage = document.getElementById('back-view').querySelector('.base-image');

  // Ensure base images are loaded
  if (!frontBaseImage.complete || !backBaseImage.complete) {
    alert("Please wait for product images to load before downloading.");
    return;
  }

  // Check if designs exist
  const hasFrontDesign = frontLayer.querySelector('.design-image') !== null;
  const hasBackDesign = backLayer.querySelector('.design-image') !== null;

  // If no design at all, warn user
  if (!hasFrontDesign && !hasBackDesign) {
    alert("No design uploaded. Please upload a design on front or back first.");
    return;
  }

  // Create canvas for front
  const frontCanvas = document.createElement('canvas');
  const frontCtx = frontCanvas.getContext('2d');
  setCanvasSize(frontCtx, frontBaseImage);
  drawDesign(frontCtx, frontBaseImage, frontLayer);

  // Create canvas for back
  const backCanvas = document.createElement('canvas');
  const backCtx = backCanvas.getContext('2d');
  setCanvasSize(backCtx, backBaseImage);
  drawDesign(backCtx, backBaseImage, backLayer);

  // Download based on what exists
  if (hasFrontDesign && hasBackDesign) {
    // Download both separately
    downloadImage(frontCanvas, 'front-preview.png');
    downloadImage(backCanvas, 'back-preview.png');
  } else if (hasFrontDesign) {
    // Only front
    downloadImage(frontCanvas, 'front-preview.png');
  } else if (hasBackDesign) {
    // Only back
    downloadImage(backCanvas, 'back-preview.png');
  }
}

function setCanvasSize(ctx, baseImage) {
  ctx.canvas.width = baseImage.naturalWidth || baseImage.width;
  ctx.canvas.height = baseImage.naturalHeight || baseImage.height;
  console.log(`Canvas size set to: ${ctx.canvas.width}x${ctx.canvas.height}`);
}

function drawDesign(ctx, baseImage, designLayer) {
  // Draw the base product image
  ctx.drawImage(baseImage, 0, 0);

  // Find the uploaded design image inside the layer
  const designImage = designLayer.querySelector('.design-image');
  if (!designImage || !designImage.src) {
    console.log("No design image found in layer");
    return;
  }

  // --- STEP 1: Get the BASE IMAGE dimensions (mockup) ---
  const mockupWidth = baseImage.naturalWidth || baseImage.width;
  const mockupHeight = baseImage.naturalHeight || baseImage.height;

  // --- STEP 2: Get the DESIGN-LAYER's position and size RELATIVE TO THE MOCKUP ---
  const productView = designLayer.closest('.product-view');
  const layerRect = designLayer.getBoundingClientRect();
  const viewRect = productView.getBoundingClientRect();

  const layerOffsetX = layerRect.left - viewRect.left;
  const layerOffsetY = layerRect.top - viewRect.top;

  const layerWidth = designLayer.offsetWidth;   // 150px
  const layerHeight = designLayer.offsetHeight; // 150px

  // --- STEP 3: Get the DESIGN IMAGE'S current rendered position and size ---
  // ✅ USE left/top — THIS IS WHAT YOU SET IN script.js!
  const computedStyle = window.getComputedStyle(designImage);
  const left = parseFloat(computedStyle.left);  // e.g., 39px
  const top = parseFloat(computedStyle.top);    // e.g., 34px
  const width = designImage.offsetWidth;        // e.g., 120px (user-resized)
  const height = designImage.offsetHeight;      // e.g., 121px (user-resized)

  // --- STEP 4: CONVERT FROM LAYER SPACE TO CANVAS SPACE ---
  const scaleXRatio = mockupWidth / layerWidth;   // e.g., 400 / 150 = 2.667
  const scaleYRatio = mockupHeight / layerHeight; // e.g., 440 / 150 = 2.933

  // Map design position from layer-relative to canvas-relative
  const canvasX = layerOffsetX + (left * scaleXRatio);
  const canvasY = layerOffsetY + (top * scaleYRatio);

  // Map design size from layer-relative to canvas-relative
  const canvasWidth = width * scaleXRatio;
  const canvasHeight = height * scaleYRatio;

  // --- STEP 5: DEBUG LOG ---
  console.group("🎨 Design Mapping Debug Info");
  console.log("Mockup size:", mockupWidth, "x", mockupHeight);
  console.log("Layer offset (within view):", Math.round(layerOffsetX), Math.round(layerOffsetY));
  console.log("Layer size:", layerWidth, "x", layerHeight);
  console.log("Design rendered size (on screen):", Math.round(width), "x", Math.round(height));
  console.log("Design position in layer (left/top):", Math.round(left), "px,", Math.round(top), "px");
  console.log("Scaling ratio (mockup/layer):", scaleXRatio.toFixed(3), "x", scaleYRatio.toFixed(3));
  console.log("Design pos on canvas:", Math.round(canvasX), ",", Math.round(canvasY));
  console.log("Design size on canvas:", Math.round(canvasWidth), "x", Math.round(canvasHeight));
  console.groupEnd();

  // --- STEP 6: DRAW THE DESIGN ON THE CANVAS ---
  ctx.drawImage(
    designImage,
    canvasX,
    canvasY,
    canvasWidth,
    canvasHeight
  );
}

function downloadImage(canvas, filename) {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  link.click();
}
