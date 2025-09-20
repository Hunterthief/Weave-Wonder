// download.js
// Updated: pre-resize design source to max 150x150 (maintain aspect ratio),
// then apply user position/size mapping into final mockup BOUNDARY area.
// Exposes: window.generateMockupCanvas(side)
// Keeps a FORCE flag for testing behavior.

(function () {
  'use strict';

  const EDITOR_CONTAINER_WIDTH = 150;
  const EDITOR_CONTAINER_HEIGHT = 150;
  window.FORCE_FIT_TO_150 = window.FORCE_FIT_TO_150 || false;

  function safeInt(v, fallback = 0) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  }

  function getBoundary() {
    if (typeof window.BOUNDARY === 'object' && window.BOUNDARY !== null) {
      return {
        TOP: safeInt(window.BOUNDARY.TOP, 101),
        LEFT: safeInt(window.BOUNDARY.LEFT, 125),
        WIDTH: safeInt(window.BOUNDARY.WIDTH, 150),
        HEIGHT: safeInt(window.BOUNDARY.HEIGHT, 150)
      };
    }
    try {
      const styles = getComputedStyle(document.documentElement);
      const t = parseFloat(styles.getPropertyValue('--boundary-top')) || 101;
      const l = parseFloat(styles.getPropertyValue('--boundary-left')) || 125;
      const w = parseFloat(styles.getPropertyValue('--boundary-width')) || 150;
      const h = parseFloat(styles.getPropertyValue('--boundary-height')) || 150;
      return { TOP: t, LEFT: l, WIDTH: w, HEIGHT: h };
    } catch (e) {
      return { TOP: 101, LEFT: 125, WIDTH: 150, HEIGHT: 150 };
    }
  }

  function setCanvasSize(ctx, baseImage) {
    ctx.canvas.width = baseImage.naturalWidth || baseImage.width || 1;
    ctx.canvas.height = baseImage.naturalHeight || baseImage.height || 1;
  }

  /**
   * Returns an offscreen canvas containing the source image scaled down so
   * both dimensions are <= maxDim (maintains aspect ratio). If the source is
   * already within maxDim, returns null to indicate original image should be used.
   * @param {HTMLImageElement} img
   * @param {number} maxDim
   * @returns {HTMLCanvasElement|null}
   */
  function createPreResizedSourceCanvas(img, maxDim = 150) {
    const naturalW = img.naturalWidth || img.width || 1;
    const naturalH = img.naturalHeight || img.height || 1;

    // If already within bounds, no pre-resizing required.
    if (naturalW <= maxDim && naturalH <= maxDim) {
      return null;
    }

    const scale = Math.min(maxDim / naturalW, maxDim / naturalH);
    const targetW = Math.max(1, Math.round(naturalW * scale));
    const targetH = Math.max(1, Math.round(naturalH * scale));

    const off = document.createElement('canvas');
    off.width = targetW;
    off.height = targetH;
    const octx = off.getContext('2d');

    // draw scaled-down source into offscreen canvas
    try {
      octx.drawImage(img, 0, 0, targetW, targetH);
      console.log(`createPreResizedSourceCanvas: scaled source ${naturalW}x${naturalH} -> ${targetW}x${targetH}`);
      return off;
    } catch (e) {
      console.error('createPreResizedSourceCanvas: failed to draw scaled source', e);
      return null;
    }
  }

  /**
   * Core drawing routine: draws base mockup and overlays user's design.
   * Uses pre-resized source canvas if necessary (or original img otherwise).
   */
  function drawDesign(ctx, baseImage, designLayer) {
    if (!ctx || !baseImage || !designLayer) {
      console.error('drawDesign: missing args', { ctx: !!ctx, baseImage: !!baseImage, designLayer: !!designLayer });
      return false;
    }

    // Draw base mockup first
    try {
      ctx.drawImage(baseImage, 0, 0);
    } catch (e) {
      console.error('drawDesign: failed to draw base image', e);
      return false;
    }

    const designContainer = designLayer.querySelector('.design-container');
    if (!designContainer) {
      console.info('drawDesign: no design container present — exporting base only.');
      return true;
    }
    const designImage = designContainer.querySelector('.design-image');
    if (!designImage) {
      console.info('drawDesign: design container present but no .design-image inside.');
      return true;
    }

    if (!(designImage.complete || designImage.naturalWidth)) {
      console.warn('drawDesign: design image not fully loaded; proceeding anyway.');
    }

    const B = getBoundary();
    const boundaryScaleX = (B.WIDTH / EDITOR_CONTAINER_WIDTH) || 1;
    const boundaryScaleY = (B.HEIGHT / EDITOR_CONTAINER_HEIGHT) || 1;

    // Determine user's final rendered size & position in editor coordinates
    const naturalW = designImage.naturalWidth || designImage.width || 1;
    const naturalH = designImage.naturalHeight || designImage.height || 1;

    let imgWidthInEditor = designImage.offsetWidth || parseFloat(designImage.style.width) || naturalW;
    let imgHeightInEditor = designImage.offsetHeight || parseFloat(designImage.style.height) || naturalH;

    const s = getComputedStyle(designImage);
    let imgXInEditor = parseFloat(s.left) || parseFloat(designImage.style.left) || parseFloat(designImage.getAttribute('data-left')) || 0;
    let imgYInEditor = parseFloat(s.top) || parseFloat(designImage.style.top) || parseFloat(designImage.getAttribute('data-top')) || 0;

    // Check stored dataset attributes for reliability (some flows store user transforms there)
    const storedW = parseFloat(designImage.getAttribute('data-width'));
    const storedH = parseFloat(designImage.getAttribute('data-height'));
    if (storedW && storedH) {
      imgWidthInEditor = storedW;
      imgHeightInEditor = storedH;
      const storedLeft = parseFloat(designImage.getAttribute('data-left'));
      const storedTop = parseFloat(designImage.getAttribute('data-top'));
      if (!Number.isNaN(storedLeft)) imgXInEditor = storedLeft;
      if (!Number.isNaN(storedTop)) imgYInEditor = storedTop;
    }

    imgWidthInEditor = Math.max(1, imgWidthInEditor);
    imgHeightInEditor = Math.max(1, imgHeightInEditor);

    // If FORCE fit mode is enabled, compute a centered fit in editor coordinates
    if (window.FORCE_FIT_TO_150) {
      const scaleToFit = Math.min(EDITOR_CONTAINER_WIDTH / naturalW, EDITOR_CONTAINER_HEIGHT / naturalH, 1);
      imgWidthInEditor = naturalW * scaleToFit;
      imgHeightInEditor = naturalH * scaleToFit;
      imgXInEditor = (EDITOR_CONTAINER_WIDTH - imgWidthInEditor) / 2;
      imgYInEditor = (EDITOR_CONTAINER_HEIGHT - imgHeightInEditor) / 2;
      console.log('drawDesign(FORCE): forcing editor size to', imgWidthInEditor, imgHeightInEditor);
    }

    // ---------- NEW: pre-resize source so its natural dims <= 150 ----------

    // create pre-resized canvas if needed (if original natural > 150 in any dimension)
    const preResizedSource = createPreResizedSourceCanvas(designImage, 150);

    // If we have an offscreen pre-resized canvas, we must also scale the user's editor dims
    // to remain consistent with using the smaller source as "the original".
    // Important: The user's size/position are in editor pixels (relative to 150x150).
    // Since we use the *resized source* as the new base image, we keep user-specified editor dims unchanged,
    // but note that the source now has smaller intrinsic pixels — final draw will scale the pre-resized source
    // to the finalWidth/finalHeight (just like before). This avoids extremely large texture sources.

    const sourceForDraw = preResizedSource || designImage;

    // compute final canvas coords
    // container offsets (rarely non-zero in this layout) are treated as inside product view
    let containerOffsetX = 0, containerOffsetY = 0;
    try {
      const productView = designLayer.closest('.product-view') || designLayer.parentElement;
      if (productView) {
        const viewRect = productView.getBoundingClientRect();
        const containerRect = designContainer.getBoundingClientRect();
        containerOffsetX = containerRect.left - viewRect.left;
        containerOffsetY = containerRect.top - viewRect.top;
      }
    } catch (e) {
      // ignore bounding rect issues
    }

    const finalX = B.LEFT + (containerOffsetX + imgXInEditor) * boundaryScaleX;
    const finalY = B.TOP + (containerOffsetY + imgYInEditor) * boundaryScaleY;
    const finalWidth = imgWidthInEditor * boundaryScaleX;
    const finalHeight = imgHeightInEditor * boundaryScaleY;

    try {
      ctx.drawImage(sourceForDraw, finalX, finalY, finalWidth, finalHeight);
      console.log(`drawDesign: drew design (source ${preResizedSource ? 'pre-resized' : 'original'}) at (${finalX.toFixed(1)},${finalY.toFixed(1)}) size ${finalWidth.toFixed(1)}x${finalHeight.toFixed(1)}`);
      return true;
    } catch (e) {
      console.error('drawDesign: drawing final image failed', e);
      return false;
    }
  }

  // generateMockupCanvas exported for email.js usage
  window.generateMockupCanvas = function (side) {
    try {
      if (side !== 'front' && side !== 'back') {
        console.warn('generateMockupCanvas: invalid side', side);
        return null;
      }
      const viewId = side === 'front' ? 'front-view' : 'back-view';
      const layerId = side === 'front' ? 'front-layer' : 'back-layer';
      const viewElement = document.getElementById(viewId);
      const designLayer = document.getElementById(layerId);
      if (!viewElement || !designLayer) {
        console.error('generateMockupCanvas: missing elements', { viewElement: !!viewElement, designLayer: !!designLayer });
        return null;
      }
      const baseImage = viewElement.querySelector('.base-image');
      if (!baseImage || !(baseImage.complete || baseImage.naturalWidth)) {
        console.error('generateMockupCanvas: base image missing or not loaded');
        return null;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      setCanvasSize(ctx, baseImage);

      const ok = drawDesign(ctx, baseImage, designLayer);
      if (!ok) {
        console.warn('generateMockupCanvas: drawDesign returned false; returning canvas with whatever was drawn (likely base only).');
      }
      return canvas;
    } catch (e) {
      console.error('generateMockupCanvas: unexpected error', e);
      return null;
    }
  };

  // download button wiring (single safe listener)
  (function setupDownloadButton() {
    const original = document.getElementById('download-design');
    if (!original) {
      console.warn('setupDownloadButton: no #download-design button found');
      return;
    }
    const btn = original.cloneNode(true);
    original.parentNode.replaceChild(btn, original);
    let inProgress = false;
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if (inProgress) return;
      inProgress = true;
      btn.disabled = true;
      setTimeout(() => {
        try {
          const frontLayer = document.getElementById('front-layer');
          const backLayer = document.getElementById('back-layer');
          const frontHas = frontLayer && frontLayer.querySelector('.design-container');
          const backHas = backLayer && backLayer.querySelector('.design-container');
          if (!frontHas && !backHas) {
            alert('No design uploaded.');
            return;
          }
          if (frontHas) {
            const c = window.generateMockupCanvas('front');
            if (c) downloadImage(c, 'front-preview.png');
          }
          if (backHas) {
            const c = window.generateMockupCanvas('back');
            if (c) downloadImage(c, 'back-preview.png');
          }
        } catch (e) {
          console.error('Download handler error', e);
          alert('Error during download. See console.');
        } finally {
          setTimeout(() => {
            inProgress = false;
            btn.disabled = false;
          }, 700);
        }
      }, 40);
    }, { passive: false });
  })();

  function downloadImage(canvas, filename) {
    try {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = filename || 'download.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('downloadImage error', e);
      alert('Failed to prepare download.');
    }
  }

  // small helper used elsewhere in codebase
  window.generateMockupFromDownloadPreview = async function (side) {
    const c = window.generateMockupCanvas(side);
    if (!c) return 'No design uploaded';
    try {
      return c.toDataURL('image/jpeg', 0.9);
    } catch (e) {
      console.error('generateMockupFromDownloadPreview error', e);
      return 'No design uploaded';
    }
  };

  window.__drawDesignImpl = drawDesign;
  console.log('download.js initialized (pre-resize -> max 150px). FORCE_FIT_TO_150=', !!window.FORCE_FIT_TO_150);
})();
