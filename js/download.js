// download.js
// Final-preview only export. Single safe download handler.
// - Scale design to fit editor (150x150) canonical -> map to boundary -> apply user's resizing/positioning
// - Move design down by configurable vertical percentage (default 4% of base canvas height)
// - Download only the final preview image: `${side}-preview.png`
//
// Exposes window.generateMockupCanvas(side) (returns a Promise resolving to a canvas)
// and window.generateMockupFromDownloadPreview(side) (returns a Promise resolving to a dataURL or 'No design uploaded').

(function () {
  'use strict';

  const EDITOR_W = 150;
  const EDITOR_H = 150;
  const FALLBACK_BASE_W = 400;
  const FALLBACK_BASE_H = 440;
  window.MAX_FINAL_ON_CANVAS = window.MAX_FINAL_ON_CANVAS || 150;

  // vertical shift percentage (default 4%)
  window.DESIGN_VERTICAL_SHIFT_PCT =
    typeof window.DESIGN_VERTICAL_SHIFT_PCT === 'number'
      ? window.DESIGN_VERTICAL_SHIFT_PCT
      : 0.04;

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
        HEIGHT: safeInt(window.BOUNDARY.HEIGHT, EDITOR_H),
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
    const w =
      baseImage.naturalWidth || baseImage.width || FALLBACK_BASE_W;
    const h =
      baseImage.naturalHeight || baseImage.height || FALLBACK_BASE_H;
    return createCanvas(w, h);
  }

  // read user's editor state and map to canonical 150x150 coordinates
  function getUserEditorState(designContainer, designImage) {
    const containerRect = designContainer.getBoundingClientRect();
    const imgRect = designImage.getBoundingClientRect();

    const containerW =
      containerRect.width || designContainer.offsetWidth || EDITOR_W;
    const containerH =
      containerRect.height || designContainer.offsetHeight || EDITOR_H;

    const imgW =
      imgRect.width ||
      designImage.offsetWidth ||
      designImage.naturalWidth ||
      1;
    const imgH =
      imgRect.height ||
      designImage.offsetHeight ||
      designImage.naturalHeight ||
      1;

    // position relative to container
    let relX = imgRect.left - containerRect.left;
    let relY = imgRect.top - containerRect.top;

    if (Number.isNaN(relX) || Number.isNaN(relY)) {
      relX =
        parseFloat(getComputedStyle(designImage).left) ||
        parseFloat(designImage.getAttribute('data-left')) ||
        0;
      relY =
        parseFloat(getComputedStyle(designImage).top) ||
        parseFloat(designImage.getAttribute('data-top')) ||
        0;
    }

    // map into canonical 150x150
    const scaleToCanonicalX = EDITOR_W / containerW;
    const scaleToCanonicalY = EDITOR_H / containerH;

    const canonicalX = relX * scaleToCanonicalX;
    const canonicalY = relY * scaleToCanonicalY;
    const canonicalW = imgW * scaleToCanonicalX;
    const canonicalH = imgH * scaleToCanonicalY;

    // initial fit
    const naturalW =
      designImage.naturalWidth || designImage.width || 1;
    const naturalH =
      designImage.naturalHeight || designImage.height || 1;
    const initialScale = Math.min(
      EDITOR_W / naturalW,
      EDITOR_H / naturalH,
      1
    );
    const initialFitW = naturalW * initialScale;
    const initialFitH = naturalH * initialScale;

    const userScaleRelativeToInitial =
      initialFitW > 0 ? canonicalW / initialFitW : 1;

    // stored attributes override
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
      containerH,
    };
    if (!Number.isNaN(storedW) && !Number.isNaN(storedH)) {
      used.canonicalW = storedW;
      used.canonicalH = storedH;
      used.userScaleRelativeToInitial =
        initialFitW > 0 ? storedW / initialFitW : used.userScaleRelativeToInitial;
    }
    if (!Number.isNaN(storedLeft) && !Number.isNaN(storedTop)) {
      used.canonicalX = storedLeft;
      used.canonicalY = storedTop;
    }
    return used;
  }

  // Generate final canvas (single final image)
  async function generateMockupFinalCanvas(side) {
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
        console.error(
          'generateMockupFinalCanvas: missing view or layer',
          viewId,
          layerId
        );
        return null;
      }
      const baseImg = viewEl.querySelector('.base-image');
      if (!baseImg) {
        console.error(
          'generateMockupFinalCanvas: base-image not found inside',
          viewId
        );
        return null;
      }
      if (!(baseImg.complete || baseImg.naturalWidth)) {
        console.warn(
          'generateMockupFinalCanvas: base image not loaded yet; aborting.'
        );
        return null;
      }

      const finalCanvas = createFinalCanvasForBase(baseImg);
      const fctx = finalCanvas.getContext('2d');

      // draw base
      try {
        fctx.drawImage(
          baseImg,
          0,
          0,
          finalCanvas.width,
          finalCanvas.height
        );
      } catch (e) {
        console.error('draw base failed', e);
      }

      // find design
      const designContainer = layerEl.querySelector('.design-container');
      if (!designContainer) return finalCanvas;
      const designImage = designContainer.querySelector('.design-image');
      if (!designImage || !designImage.src) return finalCanvas;

      const naturalW =
        designImage.naturalWidth || designImage.width || 1;
      const naturalH =
        designImage.naturalHeight || designImage.height || 1;

      const initialScaleEditor = Math.min(
        EDITOR_W / naturalW,
        EDITOR_H / naturalH,
        1
      );
      const initialFitW = naturalW * initialScaleEditor;
      const initialFitH = naturalH * initialScaleEditor;

      const userState = getUserEditorState(designContainer, designImage);

      const B = getBoundary();
      const boundaryScaleX = B.WIDTH / EDITOR_W;
      const boundaryScaleY = B.HEIGHT / EDITOR_H;

      // container offset relative to product-view
      let containerOffsetX = 0,
        containerOffsetY = 0;
      try {
        const productView =
          designContainer.closest('.product-view') || layerEl.parentElement;
        if (productView) {
          const viewRect = productView.getBoundingClientRect();
          const containerRect = designContainer.getBoundingClientRect();
          containerOffsetX = containerRect.left - viewRect.left;
          containerOffsetY = containerRect.top - viewRect.top;
        }
      } catch (e) {}

      const verticalShiftPx = Math.round(
        finalCanvas.height * Number(window.DESIGN_VERTICAL_SHIFT_PCT || 0)
      );

      const userScaleRel = userState.userScaleRelativeToInitial || 1;
      const finalW_onCanvas =
        (initialFitW * userScaleRel) * boundaryScaleX;
      const finalH_onCanvas =
        (initialFitH * userScaleRel) * boundaryScaleY;

      const finalX_onCanvas =
        B.LEFT +
        (containerOffsetX + userState.canonicalX) * boundaryScaleX;
      const finalY_onCanvas =
        B.TOP +
        (containerOffsetY + userState.canonicalY) * boundaryScaleY +
        verticalShiftPx;

      try {
        fctx.drawImage(
          designImage,
          finalX_onCanvas,
          finalY_onCanvas,
          finalW_onCanvas,
          finalH_onCanvas
        );
        console.log(
          'generateMockupFinalCanvas: drew design at',
          finalX_onCanvas,
          finalY_onCanvas,
          'size',
          finalW_onCanvas,
          finalH_onCanvas
        );
      } catch (e) {
        console.error('draw design failed', e);
      }

      return finalCanvas;
    } catch (ex) {
      console.error('generateMockupFinalCanvas: unexpected error', ex);
      return null;
    }
  }

  // Expose generateMockupCanvas as Promise<canvas>
  window.generateMockupCanvas = function (side) {
    return generateMockupFinalCanvas(side);
  };

  window.generateMockupFromDownloadPreview = async function (side) {
    const canv = await generateMockupFinalCanvas(side);
    if (!canv) return 'No design uploaded';
    try {
      return canv.toDataURL('image/jpeg', 0.9);
    } catch (e) {
      console.error(
        'generateMockupFromDownloadPreview: toDataURL failed',
        e
      );
      return 'No design uploaded';
    }
  };

  // single safe download handler
  (function setupDownloadButton() {
    const original = document.getElementById('download-design');
    if (!original) {
      console.warn('setupDownloadButton: #download-design not found.');
      return;
    }
    const btn = original.cloneNode(true);
    original.parentNode.replaceChild(btn, original);

    let running = false;
    btn.addEventListener(
      'click',
      function (e) {
        e.preventDefault();
        e.stopPropagation();

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
        try {
          btn.blur();
        } catch (err) {}

        setTimeout(() => {
          (async () => {
            try {
              const frontLayer = document.getElementById('front-layer');
              const backLayer = document.getElementById('back-layer');

              const frontHas =
                frontLayer &&
                frontLayer.querySelector('.design-container') &&
                frontLayer.querySelector('.design-image');
              const backHas =
                backLayer &&
                backLayer.querySelector('.design-container') &&
                backLayer.querySelector('.design-image');

              if (!frontHas && !backHas) {
                alert('No design uploaded.');
                return;
              }

              if (frontHas) {
                const canvas = await generateMockupFinalCanvas('front');
                if (canvas) downloadCanvas(canvas, 'front-preview.png');
              }

              if (backHas) {
                const canvas2 = await generateMockupFinalCanvas('back');
                if (canvas2) downloadCanvas(canvas2, 'back-preview.png');
              }
            } catch (err) {
              console.error('Download handler error', err);
              alert(
                'An error occurred during download. See console for details.'
              );
            } finally {
              running = false;
              btn.disabled = false;
              lastFinishTimestamp = Date.now();
              console.log('Download finished.');
            }
          })();
        }, 40);
      },
      { passive: false }
    );
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

  console.log(
    'download.js initialized — final-preview only. MAX_FINAL_ON_CANVAS=',
    window.MAX_FINAL_ON_CANVAS,
    'VERT_SHIFT_PCT=',
    window.DESIGN_VERTICAL_SHIFT_PCT
  );
})();
