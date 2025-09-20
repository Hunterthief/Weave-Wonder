// download.js
// - Rasterize editor (150x150) -> snapshot canvas
// - Paste snapshot into base mockup canvas (400x440 default or base natural size)
// - Clamp the drawn snapshot on final canvas to window.MAX_FINAL_ON_CANVAS (default 150px)
// - Expose preview + generate functions and attach a single safe download handler

(function () {
  'use strict';

  // ---------- Config / globals ----------
  const EDITOR_W = 150;
  const EDITOR_H = 150;
  const FALLBACK_BASE_W = 400;
  const FALLBACK_BASE_H = 440;

  // You can override this in console if you want a different clamp:
  // e.g. window.MAX_FINAL_ON_CANVAS = 120;
  window.MAX_FINAL_ON_CANVAS = window.MAX_FINAL_ON_CANVAS || 150;

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
        WIDTH: safeInt(window.BOUNDARY.WIDTH, EDITOR_W),
        HEIGHT: safeInt(window.BOUNDARY.HEIGHT, EDITOR_H)
      };
    }
    try {
      const s = getComputedStyle(document.documentElement);
      const t = parseFloat(s.getPropertyValue('--boundary-top')) || 101;
      const l = parseFloat(s.getPropertyValue('--boundary-left')) || 125;
      const w = parseFloat(s.getPropertyValue('--boundary-width')) || EDITOR_W;
      const h = parseFloat(s.getPropertyValue('--boundary-height')) || EDITOR_H;
      return { TOP: t, LEFT: l, WIDTH: w, HEIGHT: h };
    } catch (e) {
      return { TOP: 101, LEFT: 125, WIDTH: EDITOR_W, HEIGHT: EDITOR_H };
    }
  }

  function createCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return c;
  }

  function createFinalCanvasForBase(baseImage) {
    const w = baseImage.naturalWidth || baseImage.width || FALLBACK_BASE_W;
    const h = baseImage.naturalHeight || baseImage.height || FALLBACK_BASE_H;
    return createCanvas(w, h);
  }

  // ---------- Editor snapshot rasterization ----------
  // Builds a 150x150 canvas representing exactly what user sees inside the editor boundary.
  // Returns an HTMLCanvasElement (150x150) or null on failure.
  function buildEditorSnapshotCanvas(designContainer, designImage) {
    if (!designContainer || !designImage) {
      console.error('buildEditorSnapshotCanvas: missing args');
      return null;
    }

    // On-screen bounding rectangles (CSS pixels)
    const containerRect = designContainer.getBoundingClientRect();
    const imgRect = designImage.getBoundingClientRect();

    // defensive fallbacks
    const containerW = containerRect.width || designContainer.offsetWidth || EDITOR_W;
    const containerH = containerRect.height || designContainer.offsetHeight || EDITOR_H;

    const imgW = imgRect.width || designImage.offsetWidth || designImage.naturalWidth || 1;
    const imgH = imgRect.height || designImage.offsetHeight || designImage.naturalHeight || 1;

    // position of image relative to container (screen px)
    // If getBoundingClientRect returned 0 (rare inside hidden/off-DOM), attempt style/data attributes
    let relX = (imgRect.left && containerRect.left) ? (imgRect.left - containerRect.left) : (parseFloat(getComputedStyle(designImage).left) || parseFloat(designImage.getAttribute('data-left')) || 0);
    let relY = (imgRect.top && containerRect.top) ? (imgRect.top - containerRect.top) : (parseFloat(getComputedStyle(designImage).top) || parseFloat(designImage.getAttribute('data-top')) || 0);

    // Map screen container -> canonical 150x150
    const scaleToCanonicalX = EDITOR_W / containerW;
    const scaleToCanonicalY = EDITOR_H / containerH;

    // canonical coordinates and displayed size inside 150x150
    const canonicalX = relX * scaleToCanonicalX;
    const canonicalY = relY * scaleToCanonicalY;
    const canonicalW = imgW * scaleToCanonicalX;
    const canonicalH = imgH * scaleToCanonicalY;

    // Create offscreen canonical canvas
    const off = createCanvas(EDITOR_W, EDITOR_H);
    const octx = off.getContext('2d');

    // Clear transparent background
    octx.clearRect(0, 0, off.width, off.height);

    // Try drawing designImage into canonical coords.
    // This assumes the editor applied transforms via width/height/left/top (not CSS rotate).
    try {
      octx.drawImage(designImage, canonicalX, canonicalY, canonicalW, canonicalH);
    } catch (err) {
      // Fallback: try loading a new Image() with crossOrigin if possible
      console.warn('buildEditorSnapshotCanvas: drawImage failed, trying fallback via new Image():', err);
      try {
        const fallback = new Image();
        fallback.crossOrigin = 'anonymous';
        fallback.src = designImage.src;
        if (fallback.complete && fallback.naturalWidth) {
          octx.drawImage(fallback, canonicalX, canonicalY, canonicalW, canonicalH);
        } else {
          // Can't synchronously load fallback -> still return partial snapshot (maybe empty)
          console.error('buildEditorSnapshotCanvas: fallback image not loaded synchronously; returning partial snapshot.');
        }
      } catch (err2) {
        console.error('buildEditorSnapshotCanvas: fallback draw also failed', err2);
      }
    }

    // Expose last snapshot for debugging
    try {
      window.__lastEditorSnapshot = off;
      window.__lastEditorSnapshotDataUrl = off.toDataURL('image/png');
    } catch (e) {
      // ignore if toDataURL fails (CORS)
    }

    return off;
  }

  // Convenience: preview function that returns dataURL or null
  window.previewEditorSnapshot = function (side) {
    try {
      const layerId = side === 'front' ? 'front-layer' : 'back-layer';
      const layer = document.getElementById(layerId);
      if (!layer) return null;
      const container = layer.querySelector('.design-container');
      const img = container ? container.querySelector('.design-image') : null;
      if (!container || !img) return null;
      const snap = buildEditorSnapshotCanvas(container, img);
      if (!snap) return null;
      try {
        return snap.toDataURL('image/png');
      } catch (e) {
        // CORS may prevent dataURL; still return null gracefully
        console.warn('previewEditorSnapshot: toDataURL failed', e);
        return null;
      }
    } catch (e) {
      console.error('previewEditorSnapshot error', e);
      return null;
    }
  };

  // ---------- Generate final mockup by pasting rasterized editor snapshot ----------

  /**
   * Generates final canvas for the requested side.
   * Options:
   *   clampMaxPx: number | undefined  -> if set, the drawn snapshot on final canvas will be clamped so width/height <= clampMaxPx
   * Returns final canvas or null.
   */
  function generateMockupForSide(side, options = {}) {
    try {
      if (side !== 'front' && side !== 'back') {
        console.warn('generateMockupForSide: invalid side', side);
        return null;
      }
      const viewId = side === 'front' ? 'front-view' : 'back-view';
      const layerId = side === 'front' ? 'front-layer' : 'back-layer';
      const viewEl = document.getElementById(viewId);
      const layerEl = document.getElementById(layerId);
      if (!viewEl || !layerEl) {
        console.error('generateMockupForSide: missing view or layer', viewId, layerId);
        return null;
      }

      const baseImg = viewEl.querySelector('.base-image');
      if (!baseImg) {
        console.error('generateMockupForSide: base-image not found inside', viewId);
        return null;
      }
      if (!(baseImg.complete || baseImg.naturalWidth)) {
        console.warn('generateMockupForSide: base image not loaded yet; aborting.');
        return null;
      }

      // Final canvas sized to base image natural size (or fallback 400x440)
      const finalCanvas = createFinalCanvasForBase(baseImg);
      const fctx = finalCanvas.getContext('2d');

      // Draw base mockup full-size
      try {
        fctx.drawImage(baseImg, 0, 0, finalCanvas.width, finalCanvas.height);
      } catch (e) {
        console.error('generateMockupForSide: failed drawing base image', e);
      }

      // Find editor container and design image
      const designContainer = layerEl.querySelector('.design-container');
      if (!designContainer) {
        return finalCanvas; // nothing to overlay
      }
      const designImage = designContainer.querySelector('.design-image');
      if (!designImage || !designImage.src) {
        return finalCanvas;
      }

      // Build canonical 150x150 snapshot
      const snapshot = buildEditorSnapshotCanvas(designContainer, designImage);
      if (!snapshot) {
        console.error('generateMockupForSide: failed to build editor snapshot');
        return finalCanvas;
      }

      // Map snapshot into BOUNDARY
      const B = getBoundary();

      // baseScale maps canonical 150x150 -> boundary size
      const baseScaleX = B.WIDTH / EDITOR_W;
      const baseScaleY = B.HEIGHT / EDITOR_H;

      // final snapshot drawing size on final canvas before clamp
      let drawW = EDITOR_W * baseScaleX;
      let drawH = EDITOR_H * baseScaleY;

      // If user requested clamp or global clamp configured, enforce it
      const clampPx = (typeof options.clampMaxPx === 'number') ? options.clampMaxPx : window.MAX_FINAL_ON_CANVAS;
      if (clampPx && clampPx > 0) {
        // compute uniform extraScale so neither axis exceeds clampPx
        const extraScale = Math.min(1, clampPx / Math.max(drawW, drawH));
        if (extraScale < 1) {
          drawW = drawW * extraScale;
          drawH = drawH * extraScale;
        }
      }

      // final drawing origin on canvas: keep top-left at B.LEFT,B.TOP to preserve user's position mapping
      const finalX = B.LEFT;
      const finalY = B.TOP;

      // Draw the snapshot scaled into final canvas
      try {
        fctx.drawImage(snapshot, finalX, finalY, drawW, drawH);
        console.log(`generateMockupForSide: drew snapshot into final canvas at (${finalX},${finalY}) size ${drawW}x${drawH}`);
      } catch (e) {
        console.error('generateMockupForSide: failed to draw snapshot to final canvas', e);
        // fallback attempt via new Image()
        try {
          const fallback = new Image();
          fallback.crossOrigin = 'anonymous';
          fallback.src = snapshot.toDataURL(); // might fail under CORS but attempt
          if (fallback.complete && fallback.naturalWidth) {
            fctx.drawImage(fallback, finalX, finalY, drawW, drawH);
          } else {
            console.warn('generateMockupForSide: fallback snapshot not loaded synchronously; returning canvas with base image only.');
          }
        } catch (e2) {
          console.error('generateMockupForSide: fallback draw failed', e2);
        }
      }

      // Return final composed canvas
      return finalCanvas;
    } catch (ex) {
      console.error('generateMockupForSide: unexpected error', ex);
      return null;
    }
  }

  // Expose for other modules (email.js etc.)
  window.generateMockupCanvas = function (side) {
    return generateMockupForSide(side, { clampMaxPx: window.MAX_FINAL_ON_CANVAS });
  };

  window.generateMockupFromDownloadPreview = async function (side) {
    const canv = generateMockupForSide(side, { clampMaxPx: window.MAX_FINAL_ON_CANVAS });
    if (!canv) return 'No design uploaded';
    try {
      return canv.toDataURL('image/jpeg', 0.9);
    } catch (e) {
      console.error('generateMockupFromDownloadPreview: toDataURL failed', e);
      return 'No design uploaded';
    }
  };

  // Preview helper: returns dataURL string of editor snapshot or null
  window.previewEditorSnapshotDataUrl = function (side) {
    try {
      const layerId = side === 'front' ? 'front-layer' : 'back-layer';
      const layer = document.getElementById(layerId);
      if (!layer) return null;
      const container = layer.querySelector('.design-container');
      const img = container ? container.querySelector('.design-image') : null;
      if (!container || !img) return null;
      const snap = buildEditorSnapshotCanvas(container, img);
      if (!snap) return null;
      try {
        const url = snap.toDataURL('image/png');
        window.__lastEditorSnapshotDataUrl = url;
        return url;
      } catch (e) {
        console.warn('previewEditorSnapshotDataUrl: toDataURL failed (likely CORS)', e);
        return null;
      }
    } catch (e) {
      console.error('previewEditorSnapshotDataUrl error', e);
      return null;
    }
  };

  // ---------- Single safe download handler ----------
  (function setupDownloadButton() {
    const original = document.getElementById('download-design');
    if (!original) {
      console.warn('setupDownloadButton: #download-design not found.');
      return;
    }
    const btn = original.cloneNode(true);
    original.parentNode.replaceChild(btn, original);

    let running = false;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (running) {
        console.log('Download already in progress; ignoring.');
        return;
      }
      running = true;
      btn.disabled = true;

      setTimeout(() => {
        (async () => {
          try {
            const frontLayer = document.getElementById('front-layer');
            const backLayer = document.getElementById('back-layer');

            const frontHas = frontLayer && frontLayer.querySelector('.design-container') && frontLayer.querySelector('.design-image');
            const backHas = backLayer && backLayer.querySelector('.design-container') && backLayer.querySelector('.design-image');

            if (!frontHas && !backHas) {
              alert('No design uploaded.');
              return;
            }

            // Sequentially generate/download to minimize blocking/pop-up issues
            if (frontHas) {
              const c = generateMockupForSide('front', { clampMaxPx: window.MAX_FINAL_ON_CANVAS });
              if (c) downloadCanvas(c, 'front-preview.png');
              else console.error('Failed to generate front preview canvas.');
              await new Promise(r => setTimeout(r, 140));
            }

            if (backHas) {
              const c2 = generateMockupForSide('back', { clampMaxPx: window.MAX_FINAL_ON_CANVAS });
              if (c2) downloadCanvas(c2, 'back-preview.png');
              else console.error('Failed to generate back preview canvas.');
            }
          } catch (err) {
            console.error('Download handler error', err);
            alert('An error occurred during download. See console for details.');
          } finally {
            setTimeout(() => {
              running = false;
              btn.disabled = false;
              console.log('Download process finished and button re-enabled.');
            }, 700);
          }
        })();
      }, 40);
    }, { passive: false });
  })();

  function downloadCanvas(canvas, filename) {
    try {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = filename || 'download.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      console.log('downloadCanvas: download triggered for', filename);
    } catch (e) {
      console.error('downloadCanvas: failed', e);
      alert('Failed to prepare download. See console for details.');
    }
  }

  // Expose internals for debugging
  window.__buildEditorSnapshotCanvas = buildEditorSnapshotCanvas;
  window.__generateMockupForSide = generateMockupForSide;
  window.__lastEditorSnapshotDataUrl = window.__lastEditorSnapshotDataUrl || null;

  console.log('download.js initialized — rasterize editor -> snapshot (150x150) -> paste into base canvas. MAX_FINAL_ON_CANVAS=', window.MAX_FINAL_ON_CANVAS);
})();
