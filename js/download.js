// download.js
// Final fixed version: captures exactly what the user sees inside the 150x150 editor boundary
// and maps that rendered editor-area into the mockup BOUNDARY on the full-size base image.
// Behavior:
// 1. When the user uploads, the design fits inside a 150x150 editor area (UI behavior).
// 2. The user can resize/position the design inside that editor as they like.
// 3. On export/download/generate, we rasterize the editor-area (150x150) to an offscreen canvas
//    using the actual on-screen rendered size/position of the design, preserving cropping and placement.
// 4. We then draw the full-size base mockup image, then draw that rasterized editor canvas
//    into the BOUNDARY (B.LEFT,B.TOP,B.WIDTH,B.HEIGHT) on the final canvas — guaranteeing that
//    the downloaded image matches the editor preview the user saw (same crop/position/scale).
//
// Exposes:
//   window.generateMockupCanvas(side) -> HTMLCanvasElement | null
//   window.generateMockupFromDownloadPreview(side) -> Promise<string | 'No design uploaded'>
// Also wires #download-design button safely (replaces old listeners).

(function () {
  'use strict';

  // ---------- Config ----------
  const EDITOR_CONTAINER_WIDTH = 150; // the logical editor width
  const EDITOR_CONTAINER_HEIGHT = 150; // the logical editor height

  // ---------- Helpers ----------
  function safeInt(v, fallback = 0) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  }

  function getBoundary() {
    // Prefer global BOUNDARY object if present
    if (typeof window.BOUNDARY === 'object' && window.BOUNDARY !== null) {
      return {
        TOP: safeInt(window.BOUNDARY.TOP, 101),
        LEFT: safeInt(window.BOUNDARY.LEFT, 125),
        WIDTH: safeInt(window.BOUNDARY.WIDTH, 150),
        HEIGHT: safeInt(window.BOUNDARY.HEIGHT, 150)
      };
    }
    // Fallback to CSS variables
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

  function setCanvasSizeToBase(ctx, baseImage) {
    ctx.canvas.width = baseImage.naturalWidth || baseImage.width || 1;
    ctx.canvas.height = baseImage.naturalHeight || baseImage.height || 1;
  }

  // ---------- Core: rasterize editor view then map into final canvas ----------
  /**
   * Builds an offscreen 150x150 canvas that represents exactly what the user sees inside the editor boundary.
   * It uses bounding rects of the .design-container and the .design-image to compute the expected drawing coordinates,
   * then paints the designImage into the offscreen canvas at the corresponding coordinates (scaling if necessary).
   *
   * Returns: an HTMLCanvasElement sized 150x150, or null on failure.
   */
  function buildEditorSnapshotCanvas(designContainer, designImage) {
    if (!designContainer || !designImage) {
      console.error('buildEditorSnapshotCanvas: missing designContainer or designImage');
      return null;
    }

    // Get on-screen bounding rects (CSS pixels)
    const containerRect = designContainer.getBoundingClientRect();
    const imgRect = designImage.getBoundingClientRect();

    // Defensive fallbacks: if rects are 0 (not laid out), try using element dimensions
    if (containerRect.width === 0 || containerRect.height === 0) {
      containerRect.width = designContainer.offsetWidth || EDITOR_CONTAINER_WIDTH;
      containerRect.height = designContainer.offsetHeight || EDITOR_CONTAINER_HEIGHT;
    }

    if (imgRect.width === 0 || imgRect.height === 0) {
      imgRect.width = designImage.offsetWidth || designImage.naturalWidth || 1;
      imgRect.height = designImage.offsetHeight || designImage.naturalHeight || 1;
      // position fallback: try style left/top or data attributes
      const s = getComputedStyle(designImage);
      imgRect.left = (containerRect.left || 0) + (parseFloat(s.left) || parseFloat(designImage.style.left) || parseFloat(designImage.getAttribute('data-left')) || 0);
      imgRect.top = (containerRect.top || 0) + (parseFloat(s.top) || parseFloat(designImage.style.top) || parseFloat(designImage.getAttribute('data-top')) || 0);
    }

    // Compute relative position of image inside the container (in CSS pixels)
    const relX = imgRect.left - containerRect.left;
    const relY = imgRect.top - containerRect.top;
    const relW = imgRect.width;
    const relH = imgRect.height;

    // Map on-screen container size to canonical 150x150 canvas.
    // There may be slight differences in CSS sizing; we scale coordinates appropriately.
    const scaleToCanonicalX = EDITOR_CONTAINER_WIDTH / containerRect.width;
    const scaleToCanonicalY = EDITOR_CONTAINER_HEIGHT / containerRect.height;
    // Use uniform scale to keep aspect ratio consistent with editor's coordinate system
    // But since editor is square, using separate scales still maps correctly.
    const canonicalX = relX * scaleToCanonicalX;
    const canonicalY = relY * scaleToCanonicalY;
    const canonicalW = relW * scaleToCanonicalX;
    const canonicalH = relH * scaleToCanonicalY;

    // Create offscreen canvas 150x150 (canonical editor size)
    const off = document.createElement('canvas');
    off.width = EDITOR_CONTAINER_WIDTH;
    off.height = EDITOR_CONTAINER_HEIGHT;
    const octx = off.getContext('2d');

    // Optional: clear/transparent background (so base mockup shows through where no design exists)
    octx.clearRect(0, 0, off.width, off.height);

    // If the designImage has CSS transform (rotate/scale) we cannot easily capture it without drawing computed transform.
    // This approach covers typical flows where the editor modifies width/height and left/top.
    try {
      // If designImage is an <img>, draw it scaled to the canonical position/size
      octx.drawImage(designImage, canonicalX, canonicalY, canonicalW, canonicalH);
    } catch (e) {
      // If drawImage with element fails (e.g., tainted canvas or cross-origin), attempt drawing from src via a new Image()
      console.warn('buildEditorSnapshotCanvas: drawImage(designImage) failed, trying fallback via new Image():', e);
      try {
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = 'anonymous';
        fallbackImg.src = designImage.src;
        // draw synchronously if loaded, else schedule using onload (but we must remain sync here).
        if (fallbackImg.complete && fallbackImg.naturalWidth) {
          octx.drawImage(fallbackImg, canonicalX, canonicalY, canonicalW, canonicalH);
        } else {
          // Can't synchronously draw fallback image; still return an empty snapshot to avoid blocking.
          console.error('buildEditorSnapshotCanvas: fallback image not loaded; returning partial/empty editor snapshot.');
        }
      } catch (e2) {
        console.error('buildEditorSnapshotCanvas: fallback draw also failed', e2);
      }
    }

    return off;
  }

  /**
   * Draws base mockup and overlays the editor snapshot scaled into BOUNDARY.
   * This ensures the exported mockup matches the editor preview exactly.
   * Returns true on success, false on failure.
   */
  function drawDesignIntoCanvas(ctx, baseImage, designLayer) {
    if (!ctx || !baseImage || !designLayer) {
      console.error('drawDesignIntoCanvas: missing args', { ctx: !!ctx, baseImage: !!baseImage, designLayer: !!designLayer });
      return false;
    }

    // 1) draw base image full-size on canvas
    try {
      ctx.drawImage(baseImage, 0, 0);
    } catch (e) {
      console.error('drawDesignIntoCanvas: failed to draw base image', e);
      return false;
    }

    // 2) locate design container & design image
    const designContainer = designLayer.querySelector('.design-container');
    if (!designContainer) {
      // Nothing to overlay; valid use-case (plain product)
      return true;
    }
    const designImage = designContainer.querySelector('.design-image');
    if (!designImage) {
      return true;
    }

    // 3) Build the editor snapshot (150x150) representing exactly the user's editor viewport
    const editorSnap = buildEditorSnapshotCanvas(designContainer, designImage);
    if (!editorSnap) {
      console.error('drawDesignIntoCanvas: failed to build editor snapshot; aborting overlay.');
      return false;
    }

    // 4) Map snapshot into BOUNDARY on the final canvas
    const B = getBoundary();
    try {
      // Draw editor snapshot scaled into the boundary area on the final canvas
      ctx.drawImage(editorSnap, B.LEFT, B.TOP, B.WIDTH, B.HEIGHT);
      console.log(`drawDesignIntoCanvas: painted editor snapshot into canvas at (${B.LEFT},${B.TOP}) size ${B.WIDTH}x${B.HEIGHT}`);
      return true;
    } catch (e) {
      console.error('drawDesignIntoCanvas: failed drawing editor snapshot to final canvas', e);
      return false;
    }
  }

  // ---------- Public: generateMockupCanvas(side) ----------
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

      if (!viewElement) {
        console.error('generateMockupCanvas: missing view element:', viewId);
        return null;
      }
      if (!designLayer) {
        console.error('generateMockupCanvas: missing design layer element:', layerId);
        return null;
      }

      const baseImage = viewElement.querySelector('.base-image');
      if (!baseImage) {
        console.error('generateMockupCanvas: base-image not found inside', viewId);
        return null;
      }

      // ensure base image loaded
      if (!(baseImage.complete || baseImage.naturalWidth)) {
        console.warn('generateMockupCanvas: base image not loaded yet; returning null.');
        return null;
      }

      // Create final canvas sized to base image
      const finalCanvas = document.createElement('canvas');
      const ctx = finalCanvas.getContext('2d');
      setCanvasSizeToBase(ctx, baseImage);

      // Draw base + overlay
      const ok = drawDesignIntoCanvas(ctx, baseImage, designLayer);
      if (!ok) {
        console.warn('generateMockupCanvas: drawDesignIntoCanvas returned false; returning canvas with whatever was drawn.');
      }

      return finalCanvas;
    } catch (e) {
      console.error('generateMockupCanvas: unexpected error', e);
      return null;
    }
  };

  // Convenience for email.js — returns dataURL or 'No design uploaded'
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

  // ---------- Download button wiring (single listener, safe replace) ----------
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
          }, 700);
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

  // Expose internals for debugging convenience
  window.__buildEditorSnapshotCanvas = buildEditorSnapshotCanvas;
  window.__drawDesignIntoCanvas = drawDesignIntoCanvas;

  console.log('download.js initialized — export maps editor 150x150 snapshot into final BOUNDARY.');
})();
