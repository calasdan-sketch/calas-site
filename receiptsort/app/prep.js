/* ReceiptSort photo clean-up, as plain functions on grey pixels so they can be tested
 * without a browser. An "img" is { width, height, data: Uint8Array|Uint8ClampedArray } (1 byte per pixel, 0 = black).
 * Runs in the browser (window.RSPrep) and in Node (tests and the accuracy check in /eval).
 */
(function (root) {
  'use strict';
  function clone(img) { return { width: img.width, height: img.height, data: new Uint8ClampedArray(img.data) }; }

  // Stretch so the darkest ink ~ 0 and the paper ~ 255. Uses the 1st/99th percentile so a speck can't ruin it.
  function stretch(img) {
    var d = img.data, n = d.length, h = new Uint32Array(256), i;
    for (i = 0; i < n; i++) h[d[i]]++;
    var lo = 0, hi = 255, acc = 0, cut = n * 0.01;
    for (i = 0; i < 256; i++) { acc += h[i]; if (acc >= cut) { lo = i; break; } }
    acc = 0;
    for (i = 255; i >= 0; i--) { acc += h[i]; if (acc >= cut) { hi = i; break; } }
    var span = Math.max(1, hi - lo), out = clone(img), o = out.data;
    for (i = 0; i < n; i++) { var v = (d[i] - lo) * 255 / span; o[i] = v < 0 ? 0 : v > 255 ? 255 : v; }
    return out;
  }

  // 3x3 average: calms speckle/grain from a noisy phone sensor before reading.
  function smooth(img) {
    var w = img.width, h = img.height, d = img.data, o = new Uint8ClampedArray(w * h), x, y, dx, dy;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      var a = 0, c = 0;
      for (dy = -1; dy <= 1; dy++) { var yy = y + dy; if (yy < 0 || yy >= h) continue; for (dx = -1; dx <= 1; dx++) { var xx = x + dx; if (xx < 0 || xx >= w) continue; a += d[yy * w + xx]; c++; } }
      o[y * w + x] = a / c;
    }
    return { width: w, height: h, data: o };
  }

  // Local-average threshold (Bradley): each pixel is compared with the average of its neighbourhood, so a shadow or a
  // faded patch on one side of the receipt doesn't turn the whole area black or white. Uses an integral image: fast.
  function adaptive(img, win, t) {
    var w = img.width, h = img.height, d = img.data;
    win = win || Math.max(15, Math.round(Math.min(w, h) / 12)); t = t === undefined ? 0.12 : t;
    var half = win >> 1, W1 = w + 1, I = new Float64Array(W1 * (h + 1)), x, y;
    for (y = 0; y < h; y++) { var row = 0; for (x = 0; x < w; x++) { row += d[y * w + x]; I[(y + 1) * W1 + x + 1] = I[y * W1 + x + 1] + row; } }
    var out = { width: w, height: h, data: new Uint8ClampedArray(w * h) }, o = out.data;
    for (y = 0; y < h; y++) {
      var y0 = Math.max(0, y - half), y1 = Math.min(h - 1, y + half);
      for (x = 0; x < w; x++) {
        var x0 = Math.max(0, x - half), x1 = Math.min(w - 1, x + half);
        var cnt = (x1 - x0 + 1) * (y1 - y0 + 1);
        var sum = I[(y1 + 1) * W1 + x1 + 1] - I[y0 * W1 + x1 + 1] - I[(y1 + 1) * W1 + x0] + I[y0 * W1 + x0];
        o[y * w + x] = d[y * w + x] * cnt < sum * (1 - t) ? 0 : 255;
      }
    }
    return out;
  }

  // Variance of the Laplacian: low = blurry. Measured on a copy no bigger than ~800 px so the number doesn't depend on camera size.
  function downscale(img, maxSide) {
    var s = Math.max(img.width, img.height) / maxSide;
    if (s <= 1) return img;
    var w = Math.floor(img.width / s), h = Math.floor(img.height / s), o = new Uint8ClampedArray(w * h), x, y;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      var sx0 = Math.floor(x * s), sx1 = Math.max(sx0 + 1, Math.floor((x + 1) * s)), sy0 = Math.floor(y * s), sy1 = Math.max(sy0 + 1, Math.floor((y + 1) * s)), a = 0, c = 0, xx, yy;
      for (yy = sy0; yy < sy1 && yy < img.height; yy++) for (xx = sx0; xx < sx1 && xx < img.width; xx++) { a += img.data[yy * img.width + xx]; c++; }
      o[y * w + x] = a / c;
    }
    return { width: w, height: h, data: o };
  }
  function quality(img) {
    var g = downscale(stretch(img), 800), w = g.width, h = g.height, d = g.data, x, y, sum = 0, sq = 0, n = 0, mean = 0;
    for (y = 1; y < h - 1; y++) for (x = 1; x < w - 1; x++) {
      var l = d[(y - 1) * w + x] + d[(y + 1) * w + x] + d[y * w + x - 1] + d[y * w + x + 1] - 4 * d[y * w + x];
      sum += l; sq += l * l; n++;
    }
    var sharp = n ? sq / n - Math.pow(sum / n, 2) : 0;
    var raw = downscale(img, 400), lo = 255, hi = 0, i, m = 0;
    for (i = 0; i < raw.data.length; i++) { var v = raw.data[i]; m += v; if (v < lo) lo = v; if (v > hi) hi = v; }
    mean = m / raw.data.length;
    return { sharpness: Math.round(sharp), contrast: hi - lo, brightness: Math.round(mean), width: img.width, height: img.height };
  }
  // Plain-words advice, or null when the photo looks fine. Thresholds were set from the synthetic set in /eval (see eval/README.md).
  function advice(q) {
    if (Math.max(q.width, q.height) < 700) return 'The photo is small. Move closer so the receipt fills the picture.';
    if (q.sharpness < 250) return 'The photo looks blurry. Hold steady, let the camera focus, and retake it if the numbers look wrong.';
    if (q.contrast < 60) return 'The photo is very faint. Try more light, or lay the receipt on a dark table.';
    if (q.brightness < 130) return 'The photo is dark or grainy. More light helps a lot: move near a window or turn on a lamp.';
    return null;
  }


  // Otsu: the brightness that best splits a picture into dark (ink, table) and light (paper). Ported from the live site (2026-11-13).
  function otsu(img) {
    var d = img.data, n = d.length, hist = new Array(256).fill(0), i, t;
    for (i = 0; i < n; i++) hist[d[i] | 0]++;
    var sum = 0, sB = 0, wB = 0, best = 0, th = 128;
    for (t = 0; t < 256; t++) sum += t * hist[t];
    for (t = 0; t < 256; t++) {
      wB += hist[t]; if (!wB) continue;
      var wF = n - wB; if (!wF) break;
      sB += t * hist[t];
      var mB = sB / wB, mF = (sum - sB) / wF, between = wB * wF * (mB - mF) * (mB - mF);
      if (between > best) { best = between; th = t; }
    }
    return th;
  }
  // Black-and-white copy at the Otsu threshold: clears paper grain and soft shadows that make the reader garble digits.
  function binarize(img) {
    var th = otsu(img), out = clone(img), o = out.data;
    for (var i = 0; i < o.length; i++) o[i] = o[i] > th ? 255 : 0;
    return out;
  }
  // Where is the receipt in the photo? The paper is the big bright area; a desk or table around it is darker. Works on a small copy
  // (any size; the page passes ~300 px) and returns the box as fractions of the picture, with a generous margin, because a crop that
  // trims off the totals is worse than a loose one. null = could not tell the paper from the background (use the whole photo).
  var PAPER_EDGE = 0.3, PAPER_PAD = 0.06, MIN_PAPER = 0.08;
  function findPaper(img) {
    var w = img.width, h = img.height, d = img.data, th = otsu(img), cols = new Array(w).fill(0), rows = new Array(h).fill(0), x, y;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) if (d[y * w + x] > th) { cols[x]++; rows[y]++; }
    function span(a) {
      var max = Math.max.apply(null, a), lo = -1, hi = -1;
      for (var j = 0; j < a.length; j++) if (a[j] >= max * PAPER_EDGE) { if (lo < 0) lo = j; hi = j; }
      return [lo, hi];
    }
    var sx = span(cols), sy = span(rows);
    if (sx[0] < 0 || sy[0] < 0) return null;
    var bw = sx[1] - sx[0] + 1, bh = sy[1] - sy[0] + 1;
    if (bw * bh < MIN_PAPER * w * h) return null;
    // 2026-11-19: a side is only cut where the paper ends with a clear step down to a darker desk. A shadow across the receipt fades
    // gradually, and cutting there lost the shop name and date (found on the synthetic "shadow" receipts). Such a side keeps the full photo.
    function mean(xa, xb, ya, yb) { var a = 0, c = 0; for (var yy = Math.max(0, ya); yy < Math.min(h, yb); yy++) for (var xx = Math.max(0, xa); xx < Math.min(w, xb); xx++) { a += d[yy * w + xx]; c++; } return c ? a / c : 255; }
    var sw = Math.max(2, Math.round(w * 0.03)), sh = Math.max(2, Math.round(h * 0.03)), STEP = 0.75;
    var cutL = sx[0] > 0 && mean(sx[0] - sw, sx[0], sy[0], sy[1] + 1) < STEP * mean(sx[0], sx[0] + sw, sy[0], sy[1] + 1);
    var cutR = sx[1] < w - 1 && mean(sx[1] + 1, sx[1] + 1 + sw, sy[0], sy[1] + 1) < STEP * mean(sx[1] + 1 - sw, sx[1] + 1, sy[0], sy[1] + 1);
    var cutT = sy[0] > 0 && mean(sx[0], sx[1] + 1, sy[0] - sh, sy[0]) < STEP * mean(sx[0], sx[1] + 1, sy[0], sy[0] + sh);
    var cutB = sy[1] < h - 1 && mean(sx[0], sx[1] + 1, sy[1] + 1, sy[1] + 1 + sh) < STEP * mean(sx[0], sx[1] + 1, sy[1] + 1 - sh, sy[1] + 1);
    var pad = Math.round(Math.max(bw, bh) * PAPER_PAD);
    var x0 = cutL ? Math.max(0, sx[0] - pad) : 0, y0 = cutT ? Math.max(0, sy[0] - pad) : 0;
    var x1 = cutR ? Math.min(w, sx[1] + 1 + pad) : w, y1 = cutB ? Math.min(h, sy[1] + 1 + pad) : h;
    if ((x1 - x0) >= w * 0.95 && (y1 - y0) >= h * 0.95) return null;   // the paper fills the photo already
    return { x: x0 / w, y: y0 / h, w: (x1 - x0) / w, h: (y1 - y0) / h };
  }

  var api = { smooth: smooth, stretch: stretch, adaptive: adaptive, quality: quality, advice: advice, downscale: downscale, otsu: otsu, binarize: binarize, findPaper: findPaper };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RSPrep = api;
})(this);
