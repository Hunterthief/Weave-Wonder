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
  ctx.drawImage(baseImage, 0, 0);

  const designImage = designLayer.querySelector('.design-image');
  if (!designImage || !designImage.src) return;

  // ✅ Get rendered size (what user sees after resize)
  const width = designImage.offsetWidth;
  const height = designImage.offsetHeight;

  // ✅ Get transform value — MUST be "translate(50px, 67px)"
  const style = window.getComputedStyle(designImage);
  const transform = style.transform;

  let x = 0, y = 0;

  // ✅ PARSE TRANSFORM CORRECTLY — REGEX FOR "translate(a px, b px)"
  if (transform !== 'none') {
    const match = transform.match(/translate\(\s*([-\d.]+)px\s*,\s*([-\d.]+)px\s*\)/);
    if (match) {
      x = parseFloat(match[1]);
      y = parseFloat(match[2]);
    }
  }

  // ✅ Get layer position inside .product-view
  const productView = designLayer.closest('.product-view');
  const layerRect = designLayer.getBoundingClientRect();
  const viewRect = productView.getBoundingClientRect();

  const layerOffsetX = layerRect.left - viewRect.left;
  const layerOffsetY = layerRect.top - viewRect.top;

  // ✅ Final position = layer offset + transform offset
  const finalX = layerOffsetX + x;
  const finalY = layerOffsetY + y;

  // ✅ Draw it — size and position now match EXACTLY what user sees
  ctx.drawImage(designImage, finalX, finalY, width, height);
}

function downloadImage(canvas, filename) {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  link.click();
}
