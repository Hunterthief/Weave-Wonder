function drawDesign(ctx, baseImage, designLayer) {
  // Draw base image
  ctx.drawImage(baseImage, 0, 0);

  // Find the design container
  const designContainer = designLayer.querySelector('.design-container');
  if (!designContainer) return;

  // Get the design image
  const designImage = designContainer.querySelector('.design-image');
  if (!designImage || !designImage.complete) return;

  // --- Use the BOUNDARY to place the 150x150 design ---
  const finalX = BOUNDARY.LEFT; // e.g., 125
  const finalY = BOUNDARY.TOP;  // e.g., 101
  const finalWidth = 150;
  const finalHeight = 150;

  // Draw the image at the exact 150x150 size
  ctx.drawImage(
    designImage,
    finalX,
    finalY,
    finalWidth,
    finalHeight
  );
}
