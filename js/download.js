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

  // Offset of layer within the product view (mockup container)
  const layerOffsetX = layerRect.left - viewRect.left;
  const layerOffsetY = layerRect.top - viewRect.top;

  // Size of the layer (always 150x150px as defined in CSS)
  const layerWidth = designLayer.offsetWidth;
  const layerHeight = designLayer.offsetHeight;

  // --- STEP 3: Get the DESIGN IMAGE'S actual rendered position and scale ---
  const style = window.getComputedStyle(designImage);
  const transform = style.transform;

  let translateX = 0;
  let translateY = 0;
  let scaleX = 1;
  let scaleY = 1;

  // Parse transform: translate(x, y)
  if (transform !== 'none') {
    const match = transform.match(/translate\(\s*([-\d.]+)px\s*,\s*([-\d.]+)px\s*\)/);
    if (match) {
      translateX = parseFloat(match[1]);
      translateY = parseFloat(match[2]);
    }

    // Parse scale: scale(s)
    const scaleMatch = transform.match(/scale\(([\d.]+)\)/);
    if (scaleMatch) {
      const scaleVal = parseFloat(scaleMatch[1]);
      scaleX = scaleVal;
      scaleY = scaleVal;
    }
  }

  // --- STEP 4: Get original design image size (before any scaling) ---
  const originalWidth = designImage.naturalWidth || designImage.offsetWidth;
  const originalHeight = designImage.naturalHeight || designImage.offsetHeight;

  // Final rendered size after scaling
  const finalWidth = originalWidth * scaleX;
  const finalHeight = originalHeight * scaleY;

  // --- STEP 5: CONVERT FROM LAYER SPACE TO CANVAS SPACE ---
  // The layer is 150x150px, but the mockup is much bigger (e.g., 800x1000)
  // So we need to scale the design's position and size proportionally

  const scaleXRatio = mockupWidth / layerWidth;   // e.g., 800 / 150 = 5.33
  const scaleYRatio = mockupHeight / layerHeight; // e.g., 1000 / 150 = 6.67

  // Position of design within the layer (0,0 = top-left of layer)
  const designInLayerX = translateX;
  const designInLayerY = translateY;

  // Scale that position to canvas space
  const canvasX = layerOffsetX + (designInLayerX * scaleXRatio);
  const canvasY = layerOffsetY + (designInLayerY * scaleYRatio);

  // Scale the design size to canvas space
  const canvasWidth = finalWidth * scaleXRatio;
  const canvasHeight = finalHeight * scaleYRatio;

  // --- STEP 6: LOG FOR DEBUGGING ---
  console.group("🎨 Design Mapping Debug Info");
  console.log("Mockup size:", mockupWidth, "x", mockupHeight);
  console.log("Layer offset (within view):", layerOffsetX, layerOffsetY);
  console.log("Layer size:", layerWidth, "x", layerHeight);
  console.log("Design original size:", originalWidth, "x", originalHeight);
  console.log("Design scale (transform):", scaleX, "x", scaleY);
  console.log("Design final size (after scale):", finalWidth, "x", finalHeight);
  console.log("Scaling ratio (mockup/layer):", scaleXRatio.toFixed(3), "x", scaleYRatio.toFixed(3));
  console.log("Design pos in layer:", designInLayerX, ",", designInLayerY);
  console.log("Design pos on canvas:", Math.round(canvasX), ",", Math.round(canvasY));
  console.log("Design size on canvas:", Math.round(canvasWidth), "x", Math.round(canvasHeight));
  console.groupEnd();

  // --- STEP 7: DRAW THE DESIGN ON THE CANVAS ---
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
