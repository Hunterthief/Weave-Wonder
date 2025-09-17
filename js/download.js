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
  downloadBtn.addEventListener('click', () => {
    generateAndDownloadDesign();
  });
});

function generateAndDownloadDesign() {
  const hasFront = document.getElementById('front-layer').querySelector('.design-image');
  const hasBack = document.getElementById('back-layer').querySelector('.design-image');

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
  let finalY = layerOffsetY + parsed.y; // Start with original Y

  // 🚨 Apply 4% downward offset to match script.js visual positioning
  const baseHeight = baseImage.naturalHeight || baseImage.height;
  finalY += baseHeight * 0.04; // Shift down by 4%

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
