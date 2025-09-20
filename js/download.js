// download.js
// Final-preview only export. Single safe download handler.
// Fix: inverted canonical coords (left/right + up/down) corrected.
// - Scale design to fit editor (150x150) canonical -> map to boundary -> apply user's resizing/positioning
// - Move design down by configurable vertical percentage (default 4% of base canvas height)
// - Download only the final preview image: `${side}-preview.png`
//
// Exposes window.generateMockupCanvas(side) (returns a Canvas) and
// window.generateMockupFromDownloadPreview(side) (returns a dataURL or 'No design uploaded').

(function () {
  'use strict';

  const EDITOR_W = 150;
  const EDITOR_H = 150;
  const FALLBACK_BASE_W = 400;
  const FALLBACK_BASE_H = 440;
  window.MAX_FINAL_ON_CANVAS = window.MAX_FINAL_ON_CANVAS || 150;

  // vertical shift percentage (default 4%)
  window.DESIGN_VERTICAL_SHIFT_PCT = (typeof window.DESIGN_VERTICAL_SHIFT_PCT === 'number') ? window.DESIGN_VERTICAL_SHIFT_PCT : 0.04;

  // Toggle if you ever want to revert the flipping behavior (false = old mapping)
  window.FLIP_CANONICAL_COORDS = (typeof window.FLIP_CANONICAL_COORDS === 'boolean') ? window.FLIP_CANONICAL_COORDS : true;

  // small guard (ms) after a download finishes to ignore additional clicks
  const RECENT_FINISH_GUARD_MS = 600;
  let lastFinishTimestamp = 0;

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

  // read user's editor state and map to canonical 150x150 coordinates
  function getUserEditorState(designContainer, designImage) {
    const containerRect = designContainer.getBoundingClientRect();
    const imgRect = designImage.getBoundingClientRect();

    const containerW = containerRect.width || designContainer.offsetWidth || EDITOR_W;
    const containerH = containerRect.height || designContainer.offsetHeight || EDITOR_H;

    const imgW = imgRect.width || designImage.offsetWidth || designImage.naturalWidth || 1;
    const imgH = imgRect.height || designImage.offsetHeight || designImage.naturalHeight || 1;

    // position of image relative to container (screen px)
    let relX = (imgRect.left && containerRect.left) ? (imgRect.left - containerRect.left) : (parseFloat(getComputedStyle(designImage).left) || parseFloat(designImage.getAttribute('data-left')) || 0);
    let relY = (imgRect.top && containerRect.top) ? (imgRect.top - containerRect.top) : (parseFloat(getComputedStyle(designImage).top) || parseFloat(designImage.getAttribute('data-top')) || 0);

    // Map screen container -> canonical 150x150
    const scaleToCanonicalX = EDITOR_W / containerW;
    const scaleToCanonicalY = EDITOR_H / containerH;

    const canonicalX = relX * scaleToCanonicalX;
    const canonicalY = relY * scaleToCanonicalY;
    const canonicalW = imgW * scaleToCanonicalX;
    const canonicalH = imgH * scaleToCanonicalY;

    // initial fit (natural -> editor)
    const naturalW = designImage.naturalWidth || designImage.width || 1;
    const naturalH = designImage.naturalHeight || designImage.height || 1;
    const initialScale = Math.min(EDITOR_W / naturalW, EDITOR_H / naturalH, 1);
    const initialFitW = naturalW * initialScale;
    const initialFitH = naturalH * initialScale;

    // user scale relative to the initial fit (how much they zoomed)
    const userScaleRelativeToInitial = (initialFitW > 0) ? (canonicalW / initialFitW) : 1;

    // prefer stored data attributes if present (editor may persist more accurate transforms)
    const storedW = parseFloat(designImage.getAttribute('data-width'));
    const storedH = parseFloat(designImage.getAttribute('data-height'));
    const storedLeft = parseFloat(designImage.getAttribute('data-left'));
    const storedTop = parseFloat(designImage.getAttribute('data-top'));
    const used = {
      canonicalX,
      canonicalY,
      canonicalW,
      canonicalH,
      initialFitW,
      initialFitH,
      userScaleRelativeToInitial,
      naturalW,
      naturalH,
      containerW,
      containerH
    };
    if (!Number.isNaN(storedW) && !Number.isNaN(storedH)) {
      used.canonicalW = storedW;
      used.canonicalH = storedH;
      used.userScaleRelativeToInitial = (initialFitW > 0) ? (storedW / initialFitW) : used.userScaleRelativeToInitial;
    }
    if (!Number.isNaN(storedLeft) && !Number.isNaN(storedTop)) {
      used.canonicalX = storedLeft;
      used.canonicalY = storedTop;
    }
    return used;
  }

  // Build editor snapshot (150x150) - still exposed if you need it
  function buildEditorSnapshotCanvas(designContainer, designImage) {
    if (!designContainer || !designImage) {
      console.error('buildEditorSnapshotCanvas: missing args');
      return null;
    }
    const containerRect = designContainer.getBoundingClientRect();
    const imgRect = designImage.getBoundingClientRect();

    const containerW = containerRect.width || designContainer.offsetWidth || EDITOR_W;
    const containerH = containerRect.height || designContainer.offsetHeight || EDITOR_H;

    const imgW = imgRect.width || designImage.offsetWidth || designImage.naturalWidth || 1;
    const imgH = imgRect.height || designImage.offsetHeight || designImage.naturalHeight || 1;

    let relX = (imgRect.left && containerRect.left) ? (imgRect.left - containerRect.left) : (parseFloat(getComputedStyle(designImage).left) || parseFloat(designImage.getAttribute('data-left')) || 0);
    let relY = (imgRect.top && containerRect.top) ? (imgRect.top - containerRect.top) : (parseFloat(getComputedStyle(designImage).top) || parseFloat(designImage.getAttribute('data-top')) || 0);

    const scaleToCanonicalX = EDITOR_W / containerW;
    const scaleToCanonicalY = EDITOR_H / containerH;

    const canonicalX = relX * scaleToCanonicalX;
    const canonicalY = relY * scaleToCanonicalY;
    const canonicalW = imgW * scaleToCanonicalX;
    const canonicalH = imgH * scaleToCanonicalY;

    const off = createCanvas(EDITOR_W, EDITOR_H);
    const octx = off.getContext('2d');
    octx.clearRect(0, 0, off.width, off.height);

    try {
      octx.drawImage(designImage, canonicalX, canonicalY, canonicalW, canonicalH);
    } catch (err) {
      console.warn('buildEditorSnapshotCanvas: drawImage failed, fallback via new Image()', err);
      try {
        const fb = new Image();
        fb.crossOrigin = 'anonymous';
        fb.src = designImage.src;
        if (fb.complete && fb.naturalWidth) {
          octx.drawImage(fb, canonicalX, canonicalY, canonicalW, canonicalH);
        } else {
          console.warn('fallback not loaded synchronously; returning partial snapshot');
        }
      } catch (err2) {
        console.error('fallback draw failed', err2);
      }
    }

    try { window.__lastEditorSnapshot = off; window.__lastEditorSnapshotDataUrl = off.toDataURL('image/png'); } catch (e) {}
    return off;
  }

  // Generate final canvas (synchronous) and return it (Canvas or null)
  function generateMockupFinalCanvas(side) {
    try {
      if (side !== 'front' && side !== 'back') {
        console.warn('generateMockupFinalCanvas: invalid side', side);
        return null;
      }
      const viewId = side === 'front' ? 'front-view' : 'back-view';
      const layerId = side === 'front' ? 'front-layer' : 'back-layer';
      const viewEl = document.getElementById(viewId);
      const layerEl = document.getElementById(layerId);
      if (!viewEl || !layerEl) {
        console.error('generateMockupFinalCanvas: missing view or layer', viewId, layerId);
        return null;
      }
      const baseImg = viewEl.querySelector('.base-image');
      if (!baseImg) {
        console.error('generateMockupFinalCanvas: base-image not found inside', viewId);
        return null;
      }
      if (!(baseImg.complete || baseImg.naturalWidth)) {
        console.warn('generateMockupFinalCanvas: base image not loaded yet; aborting.');
        return null;
      }

      // Final canvas sized to base image natural size (or fallback)
      const finalCanvas = createFinalCanvasForBase(baseImg);
      const fctx = finalCanvas.getContext('2d');

      // Draw base mockup full-size
      try {
        fctx.drawImage(baseImg, 0, 0, finalCanvas.width, finalCanvas.height);
      } catch (e) {
        console.error('generateMockupFinalCanvas: failed drawing base image', e);
      }

      // Find design container and design image
      const designContainer = layerEl.querySelector('.design-container');
      if (!designContainer) {
        return finalCanvas; // nothing to overlay
      }
      const designImage = designContainer.querySelector('.design-image');
      if (!designImage || !designImage.src) {
        return finalCanvas;
      }

      // Natural size of design image
      const naturalW = designImage.naturalWidth || designImage.width || 1;
      const naturalH = designImage.naturalHeight || designImage.height || 1;

      // initial editor fit (how the image would fit into 150x150 by default)
      const initialScaleEditor = Math.min(EDITOR_W / naturalW, EDITOR_H / naturalH, 1);
      const initialFitW = naturalW * initialScaleEditor;
      const initialFitH = naturalH * initialScaleEditor;

      // Compute user canonical state (position & displayed size in editor coords)
      const userState = getUserEditorState(designContainer, designImage);

      // Boundary on final canvas
      const B = getBoundary();
      const boundaryScaleX = B.WIDTH / EDITOR_W;
      const boundaryScaleY = B.HEIGHT / EDITOR_H;

      // compute container offset relative to product-view (CRITICAL for correct mapping)
      let containerOffsetX = 0, containerOffsetY = 0;
      try {
        const productView = layerEl.closest('.product-view') || layerEl.parentElement;
        if (productView) {
          const viewRect = productView.getBoundingClientRect();
          const containerRect = designContainer.getBoundingClientRect();
          containerOffsetX = (containerRect.left - viewRect.left) || 0;
          containerOffsetY = (containerRect.top - viewRect.top) || 0;
        }
      } catch (err) {
        // ignore, fall back to zero offsets
      }

      // Apply vertical shift (percentage of final canvas height)
      const verticalShiftPx = Math.round(finalCanvas.height * Number(window.DESIGN_VERTICAL_SHIFT_PCT || 0));

      // Final size on final canvas after applying user scale relative to initial fit
      const userScaleRel = userState.userScaleRelativeToInitial || 1;
      const finalW_onCanvas = (initialFitW * userScaleRel) * boundaryScaleX;
      const finalH_onCanvas = (initialFitH * userScaleRel) * boundaryScaleY;

      // Prepare canonical values (edit-space) with sensible fallbacks
      const cx = (typeof userState.canonicalX === 'number') ? userState.canonicalX : 0;
      const cy = (typeof userState.canonicalY === 'number') ? userState.canonicalY : 0;
      const cw = (typeof userState.canonicalW === 'number' && userState.canonicalW > 0) ? userState.canonicalW : initialFitW;
      const ch = (typeof userState.canonicalH === 'number' && userState.canonicalH > 0) ? userState.canonicalH : initialFitH;

      // Optionally flip canonical coordinates inside editor space (fix inversion)
      let usedCanonicalX = cx;
      let usedCanonicalY = cy;
      if (window.FLIP_CANONICAL_COORDS) {
        usedCanonicalX = EDITOR_W - cx - cw;
        usedCanonicalY = EDITOR_H - cy - ch;
      }

      // Final position on final canvas:
      // base: B.LEFT/B.TOP is the boundary's top-left in the product-view
      // add containerOffset (container inside product-view), then user's canonicalX/Y (inside container)
      const finalX_onCanvas = B.LEFT + (containerOffsetX * boundaryScaleX) + (usedCanonicalX * boundaryScaleX);
      const finalY_onCanvas = B.TOP + (containerOffsetY * boundaryScaleY) + (usedCanonicalY * boundaryScaleY) + verticalShiftPx;

      // Debug log showing original vs used canonical coords
      console.log('mapping debug:',
        { cx, cy, cw, ch, usedCanonicalX, usedCanonicalY, containerOffsetX, containerOffsetY, boundaryScaleX, boundaryScaleY });

      // Draw design onto final canvas
      try {
        fctx.drawImage(designImage, finalX_onCanvas, finalY_onCanvas, finalW_onCanvas, finalH_onCanvas);
        console.log('generateMockupFinalCanvas: drew design at', finalX_onCanvas, finalY_onCanvas, 'size', finalW_onCanvas, finalH_onCanvas, 'userScaleRel', userScaleRel, 'verticalShiftPx', verticalShiftPx, 'containerOffset', containerOffsetX, containerOffsetY);
      } catch (e) {
        console.error('generateMockupFinalCanvas: failed to draw design', e);
      }

      return finalCanvas;
    } catch (ex) {
      console.error('generateMockupFinalCanvas: unexpected error', ex);
      return null;
    }
  }

  // Expose generateMockupCanvas as a function returning the final canvas (synchronous)
  window.generateMockupCanvas = function (side) {
    return generateMockupFinalCanvas(side);
  };

  // Returns dataURL of the final preview (JPEG)
  window.generateMockupFromDownloadPreview = function (side) {
    const canv = generateMockupFinalCanvas(side);
    if (!canv) return 'No design uploaded';
    try {
      return canv.toDataURL('image/jpeg', 0.9);
    } catch (e) {
      console.error('generateMockupFromDownloadPreview: toDataURL failed', e);
      return 'No design uploaded';
    }
  };

  // single safe download handler with recent-finish guard
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

      // guard against immediate re-trigger right after a previous finish
      const now = Date.now();
      if (now - lastFinishTimestamp < RECENT_FINISH_GUARD_MS) {
        console.log('Ignored click due to recent finish guard.');
        return;
      }

      if (running) {
        console.log('Download already in progress; ignoring.');
        return;
      }
      running = true;
      btn.disabled = true;
      try { btn.blur(); } catch (err) { /* ignore */ }

      setTimeout(() => {
        (function () {
          try {
            const frontLayer = document.getElementById('front-layer');
            const backLayer = document.getElementById('back-layer');

            const frontHas = frontLayer && frontLayer.querySelector('.design-container') && frontLayer.querySelector('.design-image');
            const backHas = backLayer && backLayer.querySelector('.design-container') && backLayer.querySelector('.design-image');

            if (!frontHas && !backHas) {
              alert('No design uploaded.');
              return;
            }

            // Sequentially generate and download final previews
            if (frontHas) {
              const canvas = generateMockupFinalCanvas('front');
              if (canvas) downloadCanvas(canvas, 'front-preview.png');
            }

            if (backHas) {
              const canvas2 = generateMockupFinalCanvas('back');
              if (canvas2) downloadCanvas(canvas2, 'back-preview.png');
            }
          } catch (err) {
            console.error('Download handler error', err);
            alert('An error occurred during download. See console for details.');
          } finally {
            running = false;
            btn.disabled = false;
            lastFinishTimestamp = Date.now();
            console.log('Download process finished and button re-enabled.');
          }
        })();
      }, 40);
    }, { passive: false });
  })();

  function downloadCanvas(canvas, filename) {
    try {
      if (!canvas) return;
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = filename || 'download.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      console.log('downloadCanvas: triggered', filename);
    } catch (e) {
      console.error('downloadCanvas error', e);
    }
  }

  // Expose some internals for debugging if needed
  window.__generateMockupFinalCanvas = generateMockupFinalCanvas;
  window.__buildEditorSnapshotCanvas = buildEditorSnapshotCanvas;

  console.log('download.js initialized — final-preview only. MAX_FINAL_ON_CANVAS=', window.MAX_FINAL_ON_CANVAS, 'VERT_SHIFT_PCT=', window.DESIGN_VERTICAL_SHIFT_PCT, 'FLIP_CANONICAL_COORDS=', window.FLIP_CANONICAL_COORDS);
})();
