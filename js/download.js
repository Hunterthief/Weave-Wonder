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

  if (!frontBaseImage.complete || !backBaseImage.complete) {
    alert("Please wait for product images to load before downloading.");
    return;
  }

  const hasFront = frontLayer.querySelector('.design-image');
  const hasBack = backLayer.querySelector('.design-image');

  if (!hasFront && !hasBack) {
    alert("No design uploaded.");
    return;
  }

  // Front canvas
  const frontCanvas = document.createElement('canvas');
  const frontCtx = frontCanvas.getContext('2d');
  setCanvasSize(frontCtx, frontBaseImage);
  drawDesign(frontCtx, frontBaseImage, frontLayer);

  // Back canvas
  const backCanvas = document.createElement('canvas');
  const backCtx = backCanvas.getContext('2d');
  setCanvasSize(backCtx, backBaseImage);
  drawDesign(backCtx, backBaseImage, backLayer);

  // Download separately
  if (hasFront && hasBack) {
    downloadImage(frontCanvas, 'front-preview.png');
    downloadImage(backCanvas, 'back-preview.png');
  } else if (hasFront) {
    downloadImage(frontCanvas, 'front-preview.png');
  } else {
    downloadImage(backCanvas, 'back-preview.png');
  }
}

function setCanvasSize(ctx, baseImage) {
  ctx.canvas.width = baseImage.naturalWidth || baseImage.width;
  ctx.canvas.height = baseImage.naturalHeight || baseImage.height;
}

function drawDesign(ctx, baseImage, designLayer) {
  // Draw base image
  ctx.drawImage(baseImage, 0, 0);

  // Draw design image if exists
  const designImage = designLayer.querySelector('.design-image');
  if (!designImage || !designImage.src) return;

  // Get product view (the container of the design layer)
  const productView = designLayer.closest('.product-view');
  
  // Get position of design layer inside product view
  const layerRect = designLayer.getBoundingClientRect();
  const viewRect = productView.getBoundingClientRect();
  const layerOffsetX = layerRect.left - viewRect.left;
  const layerOffsetY = layerRect.top - viewRect.top;

  // Get style and transform of design image
  const style = window.getComputedStyle(designImage);
  const transform = style.transform;

  // Parse transform to get position and scale
  const parsed = parseTransform(transform);

  // Calculate final position and size
  const finalX = layerOffsetX + parsed.x;
  const finalY = layerOffsetY + parsed.y;
  const finalWidth = designImage.offsetWidth * parsed.scaleX;
  const finalHeight = designImage.offsetHeight * parsed.scaleY;

  // Draw the image
  ctx.drawImage(
    designImage,
    finalX,
    finalY,
    finalWidth,
    finalHeight
  );
}

function parseTransform(transformString) {
  if (transformString === 'none') {
    return { x: 0, y: 0, scaleX: 1, scaleY: 1 };
  }
  
  // Try to match translate(x, y)
  const translateMatch = transformString.match(/translate\(\s*([-\d.]+)px\s*,\s*([-\d.]+)px\s*\)/);
  if (translateMatch) {
    return {
      x: parseFloat(translateMatch[1]),
      y: parseFloat(translateMatch[2]),
      scaleX: 1,
      scaleY: 1
    };
  }
  
  // Try to match matrix(a, b, c, d, tx, ty)
  const matrixMatch = transformString.match(/matrix\(([^)]+)\)/);
  if (matrixMatch) {
    const values = matrixMatch[1].split(',').map(n => parseFloat(n.trim()));
    if (values.length >= 6) {
      return {
        x: values[4],
        y: values[5],
        scaleX: values[0],
        scaleY: values[3]
      };
    }
  }
  
  // Default to identity transform
  return { x: 0, y: 0, scaleX: 1, scaleY: 1 };
}

function downloadImage(canvas, filename) {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  link.click();
}
