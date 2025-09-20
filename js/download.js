// download.js
// Implements exact requested export flow:
// 1) final canvas = base mockup (use baseImage.naturalWidth/H, fallback 400x440)
// 2) place full-sized design image "virtually" then scale it so it fits inside 150x150 (maintain aspect ratio)
// 3) apply user's position (relative to the 150x150 editor) and user's resize factors (applied to the already-fit-to-150 source)
// 4) draw the small result into the base canvas boundary (B.LEFT,B.TOP,B.WIDTH,B.HEIGHT)
// 5) single safe download handler attached to #download-design
(function () {
  'use strict';

  // Canonical logical editor boundary dimensions (what uploaded designs are fit into)
  const EDITOR_W = 150;
  const EDITOR_H = 150;

  // Fallback base mockup dims if base image lacks natural size
  const FALLBACK_BASE_W = 400;
  const FALLBACK_BASE_H = 440;

  // Helpers
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

  function createFinalCanvasForBase(baseImage) {
    const w = baseImage.naturalWidth || baseImage.width || FALLBACK_BASE_W;
    const h = baseImage.naturalHeight || baseImage.height || FALLBACK_BASE_H;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  /**
   * Compute how the upload is initially fit into the editor:
   * initialFitScale = min(150 / naturalW, 150 / naturalH, 1)
   * initialFitW/H = naturalW * initialFitScale
   */
  function computeInitialFit(naturalW, naturalH) {
    const scale = Math.min(EDITOR_W / naturalW, EDITOR_H / naturalH, 1);
    return {
      scale,
      fitW: naturalW * scale,
      fitH: naturalH * scale
    };
  }

  /**
   * Read user's current display state from DOM and map to canonical editor coords (150x150)
   * designContainer: the element that represents the 150x150 editor area (on-screen may be diff size)
   * designImage: the user's image element inside it (position / size / style reflect user's edits)
   *
   * Returns object:
   * { canonicalX, canonicalY, canonicalDisplayedW, canonicalDisplayedH, userScaleRelativeToInitial, notes }
   */
  function getUserEditorState(designContainer, designImage, initialFit) {
    // bounding rects (CSS px)
    const containerRect = designContainer.getBoundingClientRect();
    const imgRect = designImage.getBoundingClientRect();

    // defensive fallback if rects are zero
    const containerW = containerRect.width || designContainer.offsetWidth || EDITOR_W;
    const containerH = containerRect.height || designContainer.offsetHeight || EDITOR_H;

    const imgW = imgRect.width || designImage.offsetWidth || initialFit.fitW;
    const imgH = imgRect.height || designImage.offsetHeight || initialFit.fitH;

    // position of image relative to container (screen px)
    const relX = (imgRect.left === 0 && containerRect.left === 0) ?
      (parseFloat(getComputedStyle(designImage).left) || parseFloat(designImage.getAttribute('data-left')) || 0) :
      (imgRect.left - containerRect.left);

    const relY = (imgRect.top === 0 && containerRect.top === 0) ?
      (parseFloat(getComputedStyle(designImage).top) || parseFloat(designImage.getAttribute('data-top')) || 0) :
      (imgRect.top - containerRect.top);

    // Map screen container -> canonical 150x150
    const scaleX = EDITOR_W / containerW;
    const scaleY = EDITOR_H / containerH;

    // canonical coordinates and sizes inside the logical 150x150 editor
    const canonicalX = relX * scaleX;
    const canonicalY = relY * scaleY;
    const canonicalDisplayedW = imgW * scaleX;
    const canonicalDisplayedH = imgH * scaleY;

    // userScaleRelativeToInitial = canonicalDisplayedW / initialFit.fitW
    const userScaleRelativeToInitial = (initialFit.fitW > 0) ? (canonicalDisplayedW / initialFit.fitW) : 1;

    return {
      canonicalX,
      canonicalY,
      canonicalDisplayedW,
      canonicalDisplayedH,
      userScaleRelativeToInitial,
      containerW,
      containerH
    };
  }

  /**
   * Main function that follows requested steps.
   *
   * Steps implemented:
   * A) Final canvas = base mockup (size derived from base image)
   * B) Draw the full-size design on an offscreen intermediate (logical) representation so we can scale to fit 150x150
   * C) Compute initial fit-to-150 for the full original design (preserve aspect)
   * D) Compute user's adjustments in canonical editor coordinates (150x150)
   * E) Starting from the initial-fit size, apply user's relative scale (userScaleRelativeToInitial)
   * F) Place the small scaled result inside the base canvas at the BOUNDARY position + the canonical offsets mapped into base canvas coords
   *
   * Returns the final canvas element (or null on failure)
   */
  function generateMockupForSide(side) {
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
        console.error('generateMockupForSide: missing elements', viewId, layerId);
        return null;
      }

      const baseImg = viewEl.querySelector('.base-image');
      if (!baseImg) {
        console.error('generateMockupForSide: base-image not found in', viewId);
        return null;
      }
      if (!(baseImg.complete || baseImg.naturalWidth)) {
        console.warn('generateMockupForSide: base image not yet loaded; aborting.');
        return null;
      }

      // Build final canvas from base mockup (use natural dims or fallback)
      const finalCanvas = createFinalCanvasForBase(baseImg);
      const fctx = finalCanvas.getContext('2d');

      // Step 1: draw the base mockup as the background (full-size)
      try {
        fctx.drawImage(baseImg, 0, 0, finalCanvas.width, finalCanvas.height);
      } catch (e) {
        console.error('Failed drawing base image onto final canvas', e);
        // continue — might still attempt overlay
      }

      // Step 2: find design container & image
      const designContainer = layerEl.querySelector('.design-container');
      if (!designContainer) {
        // no design uploaded — return base mockup only
        return finalCanvas;
      }
      const designImage = designContainer.querySelector('.design-image');
      if (!designImage || !designImage.src) {
        return finalCanvas;
      }

      // Ensure designImage loaded enough to read natural dims; if not, try fallback
      const naturalW = designImage.naturalWidth || designImage.width || 1;
      const naturalH = designImage.naturalHeight || designImage.height || 1;

      // Step 3: compute initial fit-to-150 for the original design
      const initial = computeInitialFit(naturalW, naturalH);
      // initial.fitW/fitH are the dimensions the original would get when fit into 150x150 while preserving aspect

      // Step 4: read user's editor state and map to canonical 150x150 coordinates
      const userState = getUserEditorState(designContainer, designImage, initial);
      // canonicalDisplayedW/H represent how large the user is currently displaying the design inside the editor (in 150x150 units)

      // Step 5: compute the final small size that should be drawn into the base canvas:
      // finalSmallW/H_in_editor_coords = initial.fitW * userScaleRelativeToInitial
      const finalSmallW_editor = initial.fitW * userState.userScaleRelativeToInitial;
      const finalSmallH_editor = initial.fitH * userState.userScaleRelativeToInitial;

      // Important: the user's position inside the editor is userState.canonicalX/Y — this is where the top-left of the displayed image appears inside the 150x150 box.
      // However, because the original is first fit to initial.fitW/fitH and then the user may have translated/scaled it, we must compute the relative offset of the top-left of the finalSmall image.
      // We'll use canonicalX/Y as the top-left of the currently displayed image inside the editor (which was derived from the DOM).
      const topLeftX_editor = userState.canonicalX;
      const topLeftY_editor = userState.canonicalY;

      // Optionally, if the editor stores data-left/data-top or data-width/data-height that better reflect the user's transforms, prefer them:
      const storedLeft = parseFloat(designImage.getAttribute('data-left'));
      const storedTop = parseFloat(designImage.getAttribute('data-top'));
      const storedW = parseFloat(designImage.getAttribute('data-width'));
      const storedH = parseFloat(designImage.getAttribute('data-height'));
      let useX = topLeftX_editor;
      let useY = topLeftY_editor;
      let useW = finalSmallW_editor;
      let useH = finalSmallH_editor;
      if (!Number.isNaN(storedW) && !Number.isNaN(storedH)) {
        // stored values are likely in editor pixels (150x150 coordinate space)
        useW = storedW;
        useH = storedH;
      }
      if (!Number.isNaN(storedLeft) && !Number.isNaN(storedTop)) {
        useX = storedLeft;
        useY = storedTop;
      }

      // Step 6: Map editor-space (150x150) coords into final canvas coords (BOUNDARY)
      const B = getBoundary();
      // boundaryScale maps canonical editor units -> final canvas boundary units
      const boundaryScaleX = B.WIDTH / EDITOR_W;
      const boundaryScaleY = B.HEIGHT / EDITOR_H;

      // final position on canvas:
      const finalX_onCanvas = B.LEFT + (useX * boundaryScaleX);
      const finalY_onCanvas = B.TOP + (useY * boundaryScaleY);
      const finalW_onCanvas = useW * boundaryScaleX;
      const finalH_onCanvas = useH * boundaryScaleY;

      // Step 7: Draw the design onto the final canvas using these final values.
      // But the user asked: put full-sized design on canvas THEN resize it to fit 150 then position and apply user resize.
      // Drawing with drawImage(originalImage, finalX_onCanvas, finalY_onCanvas, finalW_onCanvas, finalH_onCanvas)
      // has the same visual effect as drawing then resizing. We'll do it directly to avoid unnecessary extra canvas steps.
      try {
        fctx.drawImage(designImage, finalX_onCanvas, finalY_onCanvas, finalW_onCanvas, finalH_onCanvas);
        console.log(`generateMockupForSide: drew design into base canvas at (${finalX_onCanvas.toFixed(1)}, ${finalY_onCanvas.toFixed(1)}) size ${finalW_onCanvas.toFixed(1)}x${finalH_onCanvas.toFixed(1)}`);
      } catch (e) {
        console.error('generateMockupForSide: drawImage failed — possible CORS or bad image', e);
        // Attempt fallback: draw via an Image() instance with crossOrigin anonymous
        try {
          const fallback = new Image();
          fallback.crossOrigin = 'anonymous';
          fallback.src = designImage.src;
          if (fallback.complete && fallback.naturalWidth) {
            fctx.drawImage(fallback, finalX_onCanvas, finalY_onCanvas, finalW_onCanvas, finalH_onCanvas);
            console.log('generateMockupForSide: fallback draw succeeded.');
          } else {
            // Can't synchronously draw fallback — schedule and return base for now
            console.warn('generateMockupForSide: fallback source not loaded synchronously; returning base-only canvas.');
          }
        } catch (e2) {
          console.error('generateMockupForSide: fallback draw failed', e2);
        }
      }

      // Final canvas (400x440 or base image natural size) returned
      return finalCanvas;
    } catch (ex) {
      console.error('generateMockupForSide: unexpected error', ex);
      return null;
    }
  }

  // Expose function used elsewhere
  window.generateMockupCanvas = function (side) {
    return generateMockupForSide(side);
  };

  // Data URL convenience used by email.js
  window.generateMockupFromDownloadPreview = async function (side) {
    const canv = generateMockupForSide(side);
    if (!canv) return 'No design uploaded';
    try {
      return canv.toDataURL('image/jpeg', 0.9);
    } catch (e) {
      console.error('generateMockupFromDownloadPreview: toDataURL failed', e);
      return 'No design uploaded';
    }
  };

  // ---------- Single safe download handler ---------- //
  (function setupDownloadButton() {
    const original = document.getElementById('download-design');
    if (!original) {
      console.warn('setupDownloadButton: #download-design not present.');
      return;
    }
    // Replace node to clear old listeners
    const btn = original.cloneNode(true);
    original.parentNode.replaceChild(btn, original);

    let running = false;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (running) {
        console.log('Download already in progress, ignoring click.');
        return;
      }
      running = true;
      btn.disabled = true;

      // Micro-delay to ensure UI changes settle
      setTimeout(() => {
        try {
          const frontLayer = document.getElementById('front-layer');
          const backLayer = document.getElementById('back-layer');

          const frontHas = frontLayer && frontLayer.querySelector('.design-container') && frontLayer.querySelector('.design-image');
          const backHas = backLayer && backLayer.querySelector('.design-container') && backLayer.querySelector('.design-image');

          if (!frontHas && !backHas) {
            alert('No design uploaded.');
            return;
          }

          // Only run one download action per click; proceed sequentially to avoid pop-up blocking
          (async () => {
            if (frontHas) {
              const c = generateMockupForSide('front');
              if (c) downloadCanvas(c, 'front-preview.png');
              else console.error('Failed generating front mockup canvas.');
              // small pause to help browser process the download
              await new Promise(r => setTimeout(r, 150));
            }
            if (backHas) {
              const c = generateMockupForSide('back');
              if (c) downloadCanvas(c, 'back-preview.png');
              else console.error('Failed generating back mockup canvas.');
            }
          })();
        } catch (err) {
          console.error('Download handler error', err);
          alert('An error occurred during download. See console.');
        } finally {
          setTimeout(() => {
            running = false;
            btn.disabled = false;
            console.log('Download finished, button re-enabled.');
          }, 700);
        }
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
      console.log('downloadCanvas: download triggered', filename);
    } catch (e) {
      console.error('downloadCanvas: failed', e);
      alert('Failed to prepare download. See console for details.');
    }
  }

  // Expose internals for debugging
  window.__generateMockupForSide = generateMockupForSide;
  console.log('download.js initialized — final canvas uses base image (natural or 400x440) and places the design scaled to fit inside 150x150 then positioned per user edits.');
})();
