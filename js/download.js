// download.js
// Three-step debug export (STEP1 removed) + final export, single safe download handler.
// Steps now:
// 1) (removed) full-fit debug
// 2) scale design so it fits inside 150x150 (maintaining aspect), position at user's canonical position -> debug-step2-fit150-positioned.png
// 3) apply the user's resize/position instructions relative to the step-2 size -> debug-step3-user-final.png
// Then produce front-preview/back-preview as before.
//
// Exposes window.generateMockupCanvas(side) and window.generateMockupFromDownloadPreview(side).
(function () {
  'use strict';

  const EDITOR_W = 150;
  const EDITOR_H = 150;
  const FALLBACK_BASE_W = 400;
  const FALLBACK_BASE_H = 440;
  window.MAX_FINAL_ON_CANVAS = window.MAX_FINAL_ON_CANVAS || 150;

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

  // Build editor snapshot (150x150)
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

  // core generator implementing the two debug steps + final export (STEP1 removed)
  async function generateMockupForSideWithDebug(side) {
    try {
      if (side !== 'front' && side !== 'back') {
        console.warn('invalid side', side);
        return null;
      }
      const viewId = side === 'front' ? 'front-view' : 'back-view';
      const layerId = side === 'front' ? 'front-layer' : 'back-layer';
      const viewEl = document.getElementById(viewId);
      const layerEl = document.getElementById(layerId);
      if (!viewEl || !layerEl) {
        console.error('missing view or layer', viewId, layerId);
        return null;
      }
      const baseImg = viewEl.querySelector('.base-image');
      if (!baseImg || !(baseImg.complete || baseImg.naturalWidth)) {
        console.warn('base image missing or not loaded');
        return null;
      }

      const finalCanvas = createFinalCanvasForBase(baseImg);
      const fctx = finalCanvas.getContext('2d');

      // draw base
      try { fctx.drawImage(baseImg, 0, 0, finalCanvas.width, finalCanvas.height); } catch (e) { console.error('draw base failed', e); }

      // find design
      const designContainer = layerEl.querySelector('.design-container');
      if (!designContainer) return finalCanvas;
      const designImage = designContainer.querySelector('.design-image');
      if (!designImage || !designImage.src) return finalCanvas;

      // natural size
      const naturalW = designImage.naturalWidth || designImage.width || 1;
      const naturalH = designImage.naturalHeight || designImage.height || 1;

      // --- STEP 2: RESIZE FROM ORIGINAL -> FIT-TO-150, then position at user canonical position ---
      // initial editor fit (natural -> editor)
      const initialScaleEditor = Math.min(EDITOR_W / naturalW, EDITOR_H / naturalH, 1);
      const initialFitW = naturalW * initialScaleEditor;
      const initialFitH = naturalH * initialScaleEditor;

      // compute user canonical state (position & displayed size)
      const userState = getUserEditorState(designContainer, designImage);
      const B = getBoundary();
      const boundaryScaleX = B.WIDTH / EDITOR_W;
      const boundaryScaleY = B.HEIGHT / EDITOR_H;

      // size on final canvas for initial fit (placed using user's canonical X/Y)
      const step2W_onCanvas = initialFitW * boundaryScaleX;
      const step2H_onCanvas = initialFitH * boundaryScaleY;
      const step2X_onCanvas = B.LEFT + (userState.canonicalX * boundaryScaleX);
      const step2Y_onCanvas = B.TOP + (userState.canonicalY * boundaryScaleY);

      const step2 = createCanvas(finalCanvas.width, finalCanvas.height);
      const s2ctx = step2.getContext('2d');
      s2ctx.drawImage(baseImg, 0, 0, step2.width, step2.height);
      try {
        s2ctx.drawImage(designImage, step2X_onCanvas, step2Y_onCanvas, step2W_onCanvas, step2H_onCanvas);
        console.log('STEP2: drew fit-to-150 (initial) positioned at user pos ->', step2X_onCanvas, step2Y_onCanvas, 'size', step2W_onCanvas, step2H_onCanvas);
      } catch (e) {
        console.error('STEP2 draw failed', e);
      }

      downloadCanvas(step2, `debug-${side}-step2-fit150-positioned.png`);
      await delay(160);

      // --- STEP 3: APPLY USER RESIZE INSTRUCTIONS (relative to the initial fit) ---
      const userScaleRel = userState.userScaleRelativeToInitial || 1;

      // final size on final canvas after applying user scale
      const finalW_onCanvas = (initialFitW * userScaleRel) * boundaryScaleX;
      const finalH_onCanvas = (initialFitH * userScaleRel) * boundaryScaleY;

      const finalX_onCanvas = B.LEFT + (userState.canonicalX * boundaryScaleX);
      const finalY_onCanvas = B.TOP + (userState.canonicalY * boundaryScaleY);

      // Compose final canvas (base + user final)
      const step3 = createCanvas(finalCanvas.width, finalCanvas.height);
      const s3ctx = step3.getContext('2d');
      s3ctx.drawImage(baseImg, 0, 0, step3.width, step3.height);
      try {
        s3ctx.drawImage(designImage, finalX_onCanvas, finalY_onCanvas, finalW_onCanvas, finalH_onCanvas);
        console.log('STEP3: drew user-final design at', finalX_onCanvas, finalY_onCanvas, 'size', finalW_onCanvas, finalH_onCanvas, 'userScaleRel', userScaleRel);
      } catch (e) {
        console.error('STEP3 draw failed', e);
      }

      downloadCanvas(step3, `debug-${side}-step3-user-final.png`);
      await delay(160);

      // final export
      downloadCanvas(step3, `${side}-preview.png`);
      await delay(120);

      return step3;
    } catch (err) {
      console.error('generateMockupForSideWithDebug error', err);
      return null;
    }
  }

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // convenience wrappers used elsewhere
  window.generateMockupCanvas = function (side) {
    // non-debug callers expect a canvas; run the full sequence but return the final image's canvas
    return generateMockupForSideWithDebug(side);
  };

  window.generateMockupFromDownloadPreview = async function (side) {
    const canv = await generateMockupForSideWithDebug(side);
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
      try { btn.blur(); } catch (e) {}

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

            if (frontHas) {
              await generateMockupForSideWithDebug('front');
            }
            if (backHas) {
              await generateMockupForSideWithDebug('back');
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

  // Expose some internals for debugging
  window.__generateMockupForSideWithDebug = generateMockupForSideWithDebug;
  window.__buildEditorSnapshotCanvas = buildEditorSnapshotCanvas;

  console.log('download.js initialized — STEP1 removed. debug-step2 & debug-step3 + final export active. MAX_FINAL_ON_CANVAS=', window.MAX_FINAL_ON_CANVAS);
})();
