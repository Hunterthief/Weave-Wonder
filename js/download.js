// download.js
// Enforces that the final drawn size on the mockup never exceeds 150x150 px
// by clamping the user's editor-size values (preserving aspect ratio).
// Exposes window.generateMockupCanvas(side) for email.js and other callers.

(function () {
  'use strict';

  // ---------- Config ----------
  const EDITOR_CONTAINER_WIDTH = 150;
  const EDITOR_CONTAINER_HEIGHT = 150;
  const MAX_FINAL_DIM = 150; // Final drawn size must not exceed 150 x 150 on canvas

  // ---------- Helpers ----------
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
   * Clamp the editor-space width/height so the final drawn size on the canvas
   * does not exceed MAX_FINAL_DIM in either axis. Preserve aspect ratio and
   * adjust the top-left to keep the design visually centered at the same place.
   *
   * @param {number} w Editor-space width (px)
   * @param {number} h Editor-space height (px)
   * @param {number} x Editor-space left/top (px)
   * @param {number} y Editor-space top (px)
   * @param {Object} B Boundary (TOP, LEFT, WIDTH, HEIGHT)
   * @returns {{w:number,h:number,x:number,y:number,scaled:boolean}}
   */
  function clampEditorSizeToFinal(w, h, x, y, B) {
    // Determine scale factors mapping editor -> final canvas for width/height
    const mapScaleX = (B.WIDTH / EDITOR_CONTAINER_WIDTH) || 1;
    const mapScaleY = (B.HEIGHT / EDITOR_CONTAINER_HEIGHT) || 1;

    // Maximum allowed editor-space dimensions so final stays <= MAX_FINAL_DIM
    const maxEditorW = (MAX_FINAL_DIM / mapScaleX); // derived from: finalWidth = imgW_editor * mapScaleX <= MAX_FINAL_DIM
    const maxEditorH = (MAX_FINAL_DIM / mapScaleY);

    // If both dimensions already within allowed, no-op
    if (w <= maxEditorW && h <= maxEditorH) {
      return { w, h, x, y, scaled: false };
    }

    // Compute scale to fit within maxEditorW x maxEditorH while preserving aspect ratio
    const scale = Math.min(maxEditorW / w, maxEditorH / h, 1);

    const newW = Math.max(1, w * scale);
    const newH = Math.max(1, h * scale);

    // Adjust position to keep visual center the same: shift by half the shrink delta
    const deltaW = w - newW;
    const deltaH = h - newH;

    const newX = x + (deltaW / 2);
    const newY = y + (deltaH / 2);

    console.log(`clampEditorSizeToFinal: clamped editor ${w.toFixed(1)}x${h.toFixed(1)} -> ${newW.toFixed(1)}x${newH.toFixed(1)} (scale ${scale.toFixed(3)}). Editor pos ${x.toFixed(1)},${y.toFixed(1)} -> ${newX.toFixed(1)},${newY.toFixed(1)}. maxEditorW=${maxEditorW.toFixed(1)} maxEditorH=${maxEditorH.toFixed(1)}`);

    return { w: newW, h: newH, x: newX, y: newY, scaled: true };
  }

  // ---------- Core drawing routine ----------
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

    // Allow drawing even if not fully complete (browser will scale)
    if (!(designImage.complete || designImage.naturalWidth)) {
      console.warn('drawDesign: design image might not be fully loaded; proceeding.');
    }

    const B = getBoundary();

    // Editor-space dimensions / offsets (these are what the user set in the editor)
    const naturalW = designImage.naturalWidth || designImage.width || 1;
    const naturalH = designImage.naturalHeight || designImage.height || 1;

    let imgWidthInEditor = designImage.offsetWidth || parseFloat(designImage.style.width) || naturalW;
    let imgHeightInEditor = designImage.offsetHeight || parseFloat(designImage.style.height) || naturalH;

    const s = getComputedStyle(designImage);
    let imgXInEditor = parseFloat(s.left) || parseFloat(designImage.style.left) || parseFloat(designImage.getAttribute('data-left')) || 0;
    let imgYInEditor = parseFloat(s.top) || parseFloat(designImage.style.top) || parseFloat(designImage.getAttribute('data-top')) || 0;

    // Use stored attributes if editor logic wrote them (some flows do)
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

    console.log(`drawDesign: user editor size ${imgWidthInEditor.toFixed(1)}x${imgHeightInEditor.toFixed(1)} at (${imgXInEditor.toFixed(1)},${imgYInEditor.toFixed(1)}). natural ${naturalW}x${naturalH}`);

    // Clamp editor size so final drawn size (after mapping to boundary) <= MAX_FINAL_DIM
    const clamped = clampEditorSizeToFinal(imgWidthInEditor, imgHeightInEditor, imgXInEditor, imgYInEditor, B);
    imgWidthInEditor = clamped.w;
    imgHeightInEditor = clamped.h;
    imgXInEditor = clamped.x;
    imgYInEditor = clamped.y;

    // compute container offsets (editor container relative to product-view)
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

    // Map editor coordinates into canvas coordinates using boundary scale
    const boundaryScaleX = (B.WIDTH / EDITOR_CONTAINER_WIDTH) || 1;
    const boundaryScaleY = (B.HEIGHT / EDITOR_CONTAINER_HEIGHT) || 1;

    const finalX = B.LEFT + (containerOffsetX + imgXInEditor) * boundaryScaleX;
    const finalY = B.TOP + (containerOffsetY + imgYInEditor) * boundaryScaleY;
    const finalWidth = imgWidthInEditor * boundaryScaleX;
    const finalHeight = imgHeightInEditor * boundaryScaleY;

    // Safety: ensure final dims do not exceed MAX_FINAL_DIM (numeric safety)
    const safeFinalWidth = Math.min(finalWidth, MAX_FINAL_DIM);
    const safeFinalHeight = Math.min(finalHeight, MAX_FINAL_DIM);

    try {
      ctx.drawImage(designImage, finalX, finalY, safeFinalWidth, safeFinalHeight);
      console.log(`drawDesign: drew design at canvas coords (${finalX.toFixed(1)}, ${finalY.toFixed(1)}) size ${safeFinalWidth.toFixed(1)}x${safeFinalHeight.toFixed(1)} (boundary ${B.WIDTH}x${B.HEIGHT})`);
      return true;
    } catch (e) {
      console.error('drawDesign: failed to draw design', e);
      return false;
    }
  }

  // ---------- Exposed function ----------
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

      if (!viewElement || !designLayer) {
        console.error('generateMockupCanvas: required elements missing:', { viewElement: !!viewElement, designLayer: !!designLayer });
        return null;
      }

      const baseImage = viewElement.querySelector('.base-image');
      if (!baseImage) {
        console.error('generateMockupCanvas: base image missing inside view:', viewId);
        return null;
      }

      if (!(baseImage.complete || baseImage.naturalWidth)) {
        console.warn('generateMockupCanvas: base image not loaded yet; returning null.');
        return null;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      setCanvasSize(ctx, baseImage);

      const ok = drawDesign(ctx, baseImage, designLayer);
      if (!ok) {
        console.warn('generateMockupCanvas: drawDesign returned false; canvas contains what was drawn (likely base only).');
      }
      return canvas;
    } catch (e) {
      console.error('generateMockupCanvas: unexpected error', e);
      return null;
    }
  };

  // ---------- Download button wiring (single safe listener) ----------
  (function setupDownloadButton() {
    const original = document.getElementById('download-design');
    if (!original) {
      console.warn('setupDownloadButton: #download-design not found.');
      return;
    }

    // replace node to clear old listeners
    const btn = original.cloneNode(true);
    original.parentNode.replaceChild(btn, original);

    let downloadInProgress = false;

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (downloadInProgress) {
        console.log('download already in progress; ignoring.');
        return;
      }
      downloadInProgress = true;
      btn.disabled = true;

      // small delay to let UI settle
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
            const frontCanvas = window.generateMockupCanvas('front');
            if (frontCanvas) downloadImage(frontCanvas, 'front-preview.png');
            else console.error('Failed to generate front canvas.');
          }
          if (backHas) {
            const backCanvas = window.generateMockupCanvas('back');
            if (backCanvas) downloadImage(backCanvas, 'back-preview.png');
            else console.error('Failed to generate back canvas.');
          }
        } catch (err) {
          console.error('Download handler error:', err);
          alert('An error occurred during download. See console for details.');
        } finally {
          setTimeout(() => {
            downloadInProgress = false;
            btn.disabled = false;
            console.log('Download process finished and button re-enabled.');
          }, 800);
        }
      }, 40);
    }, { passive: false });
  })();

  function downloadImage(canvas, filename) {
    try {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = filename || 'download.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('downloadImage: triggered download for', filename);
    } catch (e) {
      console.error('downloadImage: failed', e);
      alert('Failed to prepare download. See console for details.');
    }
  }

  // convenience used by email.js
  window.generateMockupFromDownloadPreview = async function (side) {
    const c = window.generateMockupCanvas(side);
    if (!c) return 'No design uploaded';
    try {
      return c.toDataURL('image/jpeg', 0.9);
    } catch (e) {
      console.error('generateMockupFromDownloadPreview: toDataURL failed', e);
      return 'No design uploaded';
    }
  };

  // expose internals for debugging
  window.__drawDesignImpl = drawDesign;
  window.__clampEditorSizeToFinal = clampEditorSizeToFinal;

  console.log('download.js initialized — editor-size clamping active. MAX_FINAL_DIM=', MAX_FINAL_DIM);
})();
