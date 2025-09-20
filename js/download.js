// download.js
// Updated: consistent scaling & mapping to BOUNDARY; FORCE_FIT test flag supported.
// Exposes: window.generateMockupCanvas(side)
// Usage: side = 'front' or 'back'

(function () {
  'use strict';

  // ---------- Config ----------
  const EDITOR_CONTAINER_WIDTH = 150;
  const EDITOR_CONTAINER_HEIGHT = 150;

  // Toggle for the debugging experiment:
  // If true -> ignore user-resize and force-fit original image inside 150x150.
  // Set window.FORCE_FIT_TO_150 = true from console for testing.
  window.FORCE_FIT_TO_150 = window.FORCE_FIT_TO_150 || false;

  // ---------- Utilities ----------
  function safeInt(v, fallback = 0) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  }

  function getBoundary() {
    // Prefer globally defined BOUNDARY (from script.js)
    if (typeof window.BOUNDARY === 'object' && window.BOUNDARY !== null) {
      return {
        TOP: safeInt(window.BOUNDARY.TOP, 101),
        LEFT: safeInt(window.BOUNDARY.LEFT, 125),
        WIDTH: safeInt(window.BOUNDARY.WIDTH, 150),
        HEIGHT: safeInt(window.BOUNDARY.HEIGHT, 150)
      };
    }

    // Try reading CSS custom properties if present (--boundary-top etc.)
    try {
      const styles = getComputedStyle(document.documentElement);
      const t = parseFloat(styles.getPropertyValue('--boundary-top')) || 101;
      const l = parseFloat(styles.getPropertyValue('--boundary-left')) || 125;
      const w = parseFloat(styles.getPropertyValue('--boundary-width')) || 150;
      const h = parseFloat(styles.getPropertyValue('--boundary-height')) || 150;
      return { TOP: t, LEFT: l, WIDTH: w, HEIGHT: h };
    } catch (e) {
      // Fallback defaults
      return { TOP: 101, LEFT: 125, WIDTH: 150, HEIGHT: 150 };
    }
  }

  function setCanvasSize(ctx, baseImage) {
    ctx.canvas.width = baseImage.naturalWidth || baseImage.width || 1;
    ctx.canvas.height = baseImage.naturalHeight || baseImage.height || 1;
  }

  // ---------- Core drawing function ----------
  /**
   * Draws the design (user-resized or forced-fit) into the base image canvas inside the boundary.
   * @param {CanvasRenderingContext2D} ctx
   * @param {HTMLImageElement} baseImage
   * @param {HTMLElement} designLayer  // the .design-layer element that contains .design-container
   * @returns {boolean} true on success
   */
  function drawDesign(ctx, baseImage, designLayer) {
    if (!ctx || !baseImage || !designLayer) {
      console.error('drawDesign: missing args', { ctxExists: !!ctx, baseImage: !!baseImage, designLayer: !!designLayer });
      return false;
    }

    // Draw base image first (full mockup)
    try {
      ctx.drawImage(baseImage, 0, 0);
    } catch (e) {
      console.error('drawDesign: error drawing base image', e);
      return false;
    }

    const designContainer = designLayer.querySelector('.design-container');
    if (!designContainer) {
      // No design — that's valid; nothing to draw.
      console.info('drawDesign: no .design-container found; only base mockup will be exported.');
      return true;
    }

    const designImage = designContainer.querySelector('.design-image');
    if (!designImage) {
      console.info('drawDesign: design container exists but no .design-image inside it.');
      return true;
    }

    // Best-effort to ensure the image is ready
    if (!(designImage.complete || designImage.naturalWidth)) {
      console.warn('drawDesign: design image not fully loaded; proceeding may produce empty result.');
      // still attempt; browser may still have data
    }

    // Boundary mapping (where the 150x150 editor box maps on the base image)
    const B = getBoundary();

    // We'll map coordinates and size from the editor's coordinate space (EDITOR_CONTAINER_WIDTH/HEIGHT)
    // into the final canvas area defined by B (B.WIDTH x B.HEIGHT), offset at B.LEFT, B.TOP.
    const boundaryScaleX = (B.WIDTH / EDITOR_CONTAINER_WIDTH) || 1;
    const boundaryScaleY = (B.HEIGHT / EDITOR_CONTAINER_HEIGHT) || 1;

    // Determine the product view & container positions in the editor UI so we can compute relative offsets.
    const productView = designLayer.closest('.product-view') || designLayer.parentElement;
    if (!productView) {
      console.warn('drawDesign: could not find product-view ancestor; defaulting offsets to 0.');
    }

    // compute container offsets relative to productView (in page pixels)
    let containerOffsetX = 0, containerOffsetY = 0;
    try {
      if (productView) {
        const viewRect = productView.getBoundingClientRect();
        const containerRect = designContainer.getBoundingClientRect();
        containerOffsetX = containerRect.left - viewRect.left; // typically 0 in your setup
        containerOffsetY = containerRect.top - viewRect.top;   // typically 0
      }
    } catch (e) {
      console.warn('drawDesign: error computing bounding rects', e);
    }

    // ---------- Two modes ----------
    // MODE A (default): Use user's resized image (exact offsetWidth/offsetHeight and style left/top)
    // MODE B (force-fit test): Resize original image so both dims <= 150 and center it inside the editor boundary
    const FORCE = !!window.FORCE_FIT_TO_150;

    const naturalW = designImage.naturalWidth || designImage.width || 1;
    const naturalH = designImage.naturalHeight || designImage.height || 1;

    // Editor-relative position & sizes (in pixels in editor coordinate space)
    let imgXInEditor = 0, imgYInEditor = 0, imgWidthInEditor = 0, imgHeightInEditor = 0;

    if (FORCE) {
      // Force-fit natural image to 150x150 while maintaining aspect ratio
      const scaleToFit = Math.min(EDITOR_CONTAINER_WIDTH / naturalW, EDITOR_CONTAINER_HEIGHT / naturalH, 1);
      imgWidthInEditor = naturalW * scaleToFit;
      imgHeightInEditor = naturalH * scaleToFit;
      // center inside 150x150 editor boundary
      imgXInEditor = (EDITOR_CONTAINER_WIDTH - imgWidthInEditor) / 2;
      imgYInEditor = (EDITOR_CONTAINER_HEIGHT - imgHeightInEditor) / 2;
      console.log('drawDesign(FORCE): natural', naturalW, 'x', naturalH, '-> fit', imgWidthInEditor, 'x', imgHeightInEditor);
    } else {
      // Use the user's final rendered size and position
      // designImage.offsetWidth/offsetHeight are the current rendered dimensions inside the container.
      imgWidthInEditor = designImage.offsetWidth || parseFloat(designImage.style.width) || naturalW;
      imgHeightInEditor = designImage.offsetHeight || parseFloat(designImage.style.height) || naturalH;

      // style.left/top may be 'px' values — could be numeric strings; fallback to dataset attributes if present
      const s = getComputedStyle(designImage);
      imgXInEditor = parseFloat(s.left) || parseFloat(designImage.style.left) || parseFloat(designImage.getAttribute('data-left')) || parseFloat(designImage.getAttribute('data-initial-left')) || 0;
      imgYInEditor = parseFloat(s.top) || parseFloat(designImage.style.top) || parseFloat(designImage.getAttribute('data-top')) || parseFloat(designImage.getAttribute('data-initial-top')) || 0;

      // If the image was resized using data attributes (some older flows), prefer those as they reflect user interactions
      const storedW = parseFloat(designImage.getAttribute('data-width'));
      const storedH = parseFloat(designImage.getAttribute('data-height'));
      if (storedW && storedH) {
        // If offsets stored too, use them
        imgWidthInEditor = storedW;
        imgHeightInEditor = storedH;
        const storedLeft = parseFloat(designImage.getAttribute('data-left'));
        const storedTop = parseFloat(designImage.getAttribute('data-top'));
        if (!Number.isNaN(storedLeft)) imgXInEditor = storedLeft;
        if (!Number.isNaN(storedTop)) imgYInEditor = storedTop;
      }

      // safety floor/ceiling
      imgWidthInEditor = Math.max(1, imgWidthInEditor);
      imgHeightInEditor = Math.max(1, imgHeightInEditor);

      console.log('drawDesign(USER): img size (editor):', imgWidthInEditor.toFixed(1), 'x', imgHeightInEditor.toFixed(1), 'at', imgXInEditor.toFixed(1), imgYInEditor.toFixed(1));
    }

    // ---------- Map editor coordinates into base image canvas coordinates (the BOUNDARY on the canvas) ----------
    // Final top-left on canvas = B.LEFT + (containerOffsetX + imgXInEditor) * boundaryScaleX
    // Final size on canvas = imgWidthInEditor * boundaryScaleX
    const finalX = B.LEFT + (containerOffsetX + imgXInEditor) * boundaryScaleX;
    const finalY = B.TOP + (containerOffsetY + imgYInEditor) * boundaryScaleY;
    const finalWidth = imgWidthInEditor * boundaryScaleX;
    const finalHeight = imgHeightInEditor * boundaryScaleY;

    // Draw final image
    try {
      ctx.drawImage(designImage, finalX, finalY, finalWidth, finalHeight);
      console.log(`drawDesign: drew design at canvas coords (${finalX.toFixed(1)}, ${finalY.toFixed(1)}) size ${finalWidth.toFixed(1)}x${finalHeight.toFixed(1)} (BOUNDARY ${B.WIDTH}x${B.HEIGHT})`);
      return true;
    } catch (e) {
      console.error('drawDesign: failed to draw design image onto canvas', e);
      return false;
    }
  }

  // ---------- Exposed function: generateMockupCanvas(side) ----------
  // side: 'front' or 'back'
  window.generateMockupCanvas = function (side) {
    try {
      if (side !== 'front' && side !== 'back') {
        console.warn('generateMockupCanvas: invalid side requested:', side);
        return null;
      }

      const viewId = side === 'front' ? 'front-view' : 'back-view';
      const layerId = side === 'front' ? 'front-layer' : 'back-layer';

      const viewElement = document.getElementById(viewId);
      const designLayer = document.getElementById(layerId);
      if (!viewElement) {
        console.error('generateMockupCanvas: view element not found:', viewId);
        return null;
      }
      if (!designLayer) {
        console.error('generateMockupCanvas: design layer not found:', layerId);
        return null;
      }

      const baseImage = viewElement.querySelector('.base-image');
      if (!baseImage) {
        console.error('generateMockupCanvas: base image not found inside view:', viewId);
        return null;
      }

      // Ensure base image is loaded
      if (!(baseImage.complete || baseImage.naturalWidth)) {
        console.warn('generateMockupCanvas: base image not fully loaded; returning null.');
        return null;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      setCanvasSize(ctx, baseImage);

      // Draw design (draws base image first)
      const ok = drawDesign(ctx, baseImage, designLayer);
      if (!ok) {
        console.warn('generateMockupCanvas: drawDesign reported failure, but canvas will still be returned with base image.');
      }
      return canvas;
    } catch (e) {
      console.error('generateMockupCanvas: unexpected error', e);
      return null;
    }
  };

  // ---------- Download handler (single listener, replace old listeners) ----------
  (function setupDownloadButton() {
    const original = document.getElementById('download-design');
    if (!original) {
      console.warn('setupDownloadButton: download button with id "download-design" not found.');
      return;
    }

    // Replace node to remove old listeners
    const btn = original.cloneNode(true);
    original.parentNode.replaceChild(btn, original);

    let downloadInProgress = false;

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (downloadInProgress) {
        console.log('Download requested while one is in progress, ignoring.');
        return;
      }
      downloadInProgress = true;
      btn.disabled = true;

      // micro-delay to allow UI to settle if needed
      setTimeout(async () => {
        try {
          const frontLayer = document.getElementById('front-layer');
          const backLayer = document.getElementById('back-layer');

          const frontHas = frontLayer && frontLayer.querySelector('.design-container');
          const backHas = backLayer && backLayer.querySelector('.design-container');

          if (!frontHas && !backHas) {
            alert('No design uploaded.');
            return;
          }

          // Generate and trigger downloads sequentially (to avoid browser blocking)
          if (frontHas) {
            const frontCanvas = window.generateMockupCanvas('front');
            if (frontCanvas) {
              downloadImage(frontCanvas, 'front-preview.png');
            } else {
              console.error('setupDownloadButton: failed to generate front canvas.');
            }
          }

          if (backHas) {
            const backCanvas = window.generateMockupCanvas('back');
            if (backCanvas) {
              downloadImage(backCanvas, 'back-preview.png');
            } else {
              console.error('setupDownloadButton: failed to generate back canvas.');
            }
          }
        } catch (err) {
          console.error('Download handler caught error:', err);
          alert('An error occurred during download. Check console for details.');
        } finally {
          // Small grace period before re-enabling
          setTimeout(() => {
            downloadInProgress = false;
            btn.disabled = false;
            console.log('Download process finished and button re-enabled.');
          }, 800);
        }
      }, 50);
    }, { passive: false });
  })();

  // ---------- Download helper ----------
  function downloadImage(canvas, filename) {
    try {
      const link = document.createElement('a');
      // Use PNG for lossless preview; email uploader might use toDataURL('image/jpeg', quality)
      link.href = canvas.toDataURL('image/png');
      link.download = filename || 'download.png';
      document.body.appendChild(link);

      // Trigger click (some browsers require link to be in DOM)
      link.click();

      document.body.removeChild(link);
      console.log('downloadImage: triggered download for', filename);
    } catch (e) {
      console.error('downloadImage: failed', e);
      alert('Failed to prepare download. See console for details.');
    }
  }

  // Optional: small convenience helper used by older code paths
  window.generateMockupFromDownloadPreview = async function (side) {
    const canv = window.generateMockupCanvas(side);
    if (!canv) return 'No design uploaded';
    try {
      return canv.toDataURL('image/jpeg', 0.9);
    } catch (e) {
      console.error('generateMockupFromDownloadPreview: toDataURL failed', e);
      return 'No design uploaded';
    }
  };

  // Expose drawDesign for debugging via console if needed
  window.__drawDesignImpl = drawDesign;

  console.log('download.js initialized. FORCE_FIT_TO_150=', !!window.FORCE_FIT_TO_150);
})();
