/* carve.js - colour helpers and (from slice 2) the carve shape. */
(function () {
  var Carve = {};

  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }
  function hslToHex(h, s, l) {
    function f(p, q, t) {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    var r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
      r = f(p, q, h + 1 / 3); g = f(p, q, h); b = f(p, q, h - 1 / 3);
    }
    function x(v) { var s2 = Math.round(v * 255).toString(16); return s2.length < 2 ? '0' + s2 : s2; }
    return '#' + x(r) + x(g) + x(b);
  }

  // Same hue, lighter (amount > 0) or darker (amount < 0).
  Carve.shade = function (hex, amount) {
    var c = hexToRgb(hex), hsl = rgbToHsl(c[0], c[1], c[2]);
    return hslToHex(hsl[0], hsl[1], Math.max(0.08, Math.min(0.92, hsl[2] + amount)));
  };

  // Complement: rotate the hue 180 degrees (computed, not hand-picked).
  Carve.complement = function (hex) {
    var c = hexToRgb(hex), hsl = rgbToHsl(c[0], c[1], c[2]);
    return hslToHex((hsl[0] + 0.5) % 1, hsl[1], hsl[2]);
  };

  // ---- the carve itself ----
  // A piece is an organic blob whose top edge sits on the item's start-time line. Its size is fitted
  // (binary search on the scale) so the part inside the block covers the target fraction of the block.
  // The block is drawn with the blob subtracted via an SVG <mask>; the blob is drawn in the complement colour.

  Carve.fractionOf = function (item) {
    if (item.type === 'midterm') return 1 / 3;
    if (item.type === 'final') return 1 / 2;
    var imp = Math.max(0, Math.min(1, item.importance === undefined ? 0.3 : item.importance));
    return 0.2 + imp * 0.3; // quiz / other: 20% .. 50%
  };

  function seededRandom(str) {
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    var a = h >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var N_POINTS = 12;

  // ~12 points around an ellipse with seeded radius wobble (stable per item id).
  function basePoints(seedKey, aspect) {
    var rnd = seededRandom(String(seedKey));
    var pts = [];
    for (var i = 0; i < N_POINTS; i++) {
      var th = (i / N_POINTS) * Math.PI * 2;
      var r = 0.78 + rnd() * 0.44;
      if (i === 9) r = 1;                 // the point at the very top sits exactly on the start-time line
      if (i === 8 || i === 10) r = Math.min(r, 1.08); // so the shoulders never rise above it
      pts.push([Math.cos(th) * r * aspect, Math.sin(th) * r]);
    }
    return pts;
  }

  // Closed Catmull-Rom spline through pts, as cubic Bezier segments.
  function segments(pts) {
    var n = pts.length, segs = [];
    for (var i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      segs.push([p1,
        [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
        [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6],
        p2]);
    }
    return segs;
  }

  function polygon(pts) {
    var poly = [];
    segments(pts).forEach(function (s) {
      for (var k = 0; k < 8; k++) {
        var t = k / 8, u = 1 - t;
        poly.push([
          u * u * u * s[0][0] + 3 * u * u * t * s[1][0] + 3 * u * t * t * s[2][0] + t * t * t * s[3][0],
          u * u * u * s[0][1] + 3 * u * u * t * s[1][1] + 3 * u * t * t * s[2][1] + t * t * t * s[3][1]
        ]);
      }
    });
    return poly;
  }

  function pathOf(pts) {
    var segs = segments(pts);
    var d = 'M' + segs[0][0][0].toFixed(1) + ' ' + segs[0][0][1].toFixed(1);
    segs.forEach(function (s) {
      d += 'C' + s[1][0].toFixed(1) + ' ' + s[1][1].toFixed(1) + ' ' + s[2][0].toFixed(1) + ' ' + s[2][1].toFixed(1) +
           ' ' + s[3][0].toFixed(1) + ' ' + s[3][1].toFixed(1);
    });
    return d + 'Z';
  }

  function inside(poly, x, y) {
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }

  var GRID = 36;
  var cache = {};

  // g = {x,y,w,h}: the block rectangle. y0 = the start-time line (absolute y). Returns {d, scale, coverage}.
  Carve.fit = function (g, y0, item) {
    var fraction = Carve.fractionOf(item);
    var key = [item.id, g.x.toFixed(1), g.y.toFixed(1), g.w.toFixed(1), g.h.toFixed(1), y0.toFixed(1), fraction.toFixed(3)].join('|');
    if (cache[key]) return cache[key];

    var aspect = Math.max(0.7, Math.min(2.0, (g.w / g.h) * 0.9));
    var base = basePoints(item.id || 'x', aspect);
    var poly0 = polygon(base);
    var ymin = Infinity;
    poly0.forEach(function (p) { if (p[1] < ymin) ymin = p[1]; });
    var cx = g.x + g.w / 2;

    function place(s) {
      return base.map(function (p) { return [cx + s * p[0], y0 + s * (p[1] - ymin)]; });
    }
    function coverage(s) {
      var poly = polygon(place(s)), hit = 0;
      for (var i = 0; i < GRID; i++) {
        for (var j = 0; j < GRID; j++) {
          if (inside(poly, g.x + (i + 0.5) / GRID * g.w, g.y + (j + 0.5) / GRID * g.h)) hit++;
        }
      }
      return hit / (GRID * GRID);
    }

    // Scan upward for the first scale that reaches the target, then refine. Scanning (not a plain
    // binary search) keeps this correct even if coverage is not perfectly monotonic.
    var hi = Math.max(g.w, g.h) * 3, steps = 40, prev = 1, found = -1, best = 1, bestCov = -1;
    for (var k = 0; k <= steps; k++) {
      var sk = 1 * Math.pow(hi, k / steps);
      var ck = coverage(sk);
      if (ck > bestCov) { bestCov = ck; best = sk; }
      if (ck >= fraction) { found = k; break; }
      prev = sk;
    }
    var s;
    if (found < 0) { s = best; }               // clipped by the block edge: falls short of target (accepted)
    else {
      var lo2 = prev, hi2 = 1 * Math.pow(hi, found / steps);
      for (var it = 0; it < 22; it++) {
        var mid = (lo2 + hi2) / 2;
        if (coverage(mid) < fraction) lo2 = mid; else hi2 = mid;
      }
      s = (lo2 + hi2) / 2;
    }
    var res = { d: pathOf(place(s)), scale: s, coverage: coverage(s), target: fraction };
    cache[key] = res;
    return res;
  };

  function esc(str) { return String(str).replace(/[^A-Za-z0-9_-]/g, '_'); }

  // Does the item's start time sit inside this block's time range?
  Carve.inBlock = function (item, startMin, endMin) {
    return item.startMin >= startMin && item.startMin < endMin;
  };

  // Carves for one block. g = block rect in the target svg; startMin/endMin = the block's time range.
  // Returns {defs, maskId, carves}; maskId is '' when no item belongs to this block.
  Carve.blockCarves = function (g, startMin, endMin, items, colour, id) {
    var mine = items.filter(function (it) { return Carve.inBlock(it, startMin, endMin); });
    if (!mine.length) return { defs: '', maskId: '', carves: '', count: 0 };
    var comp = Carve.complement(colour);
    var maskId = 'm-' + esc(id), clipId = 'k-' + esc(id);
    var dur = endMin - startMin;
    var holes = '', pieces = '';
    mine.forEach(function (it) {
      var y0 = g.y + ((it.startMin - startMin) / dur) * g.h;
      var f = Carve.fit(g, y0, it);
      holes += '<path d="' + f.d + '" fill="black"/>';
      pieces += '<path d="' + f.d + '" fill="' + comp + '" class="carve-piece" clip-path="url(#' + clipId + ')" data-item="' + esc(it.id) +
                '" data-coverage="' + f.coverage.toFixed(3) + '"/>';
    });
    var defs = '<mask id="' + maskId + '" maskUnits="userSpaceOnUse" x="' + (g.x - 2) + '" y="' + (g.y - 2) + '" width="' + (g.w + 4) + '" height="' + (g.h + 4) + '">' +
               '<rect x="' + (g.x - 2) + '" y="' + (g.y - 2) + '" width="' + (g.w + 4) + '" height="' + (g.h + 4) + '" fill="white"/>' + holes + '</mask>' +
               '<clipPath id="' + clipId + '"><rect x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h + '" rx="10"/></clipPath>';
    return { defs: defs, maskId: maskId, carves: pieces, count: mine.length };
  };

  Carve.forBlock = function (g, b, items, colour, id) {
    return Carve.blockCarves(g, b.startMin, b.endMin, items, colour, id);
  };

  // An item whose time is outside every class block: drawn alone on a reference area (100-minute block at column width).
  Carve.orphan = function (g, y0, item, colour) {
    var f = Carve.fit(g, y0, item);
    return '<path d="' + f.d + '" fill="' + Carve.complement(colour) + '" class="carve-piece orphan" data-item="' + esc(item.id) +
           '" data-coverage="' + f.coverage.toFixed(3) + '"/>';
  };

  // Mini block with its carves, for a day card.
  Carve.cardSvg = function (c, items, colour, id) {
    var dur = c.d.endMin - c.d.startMin;
    var H = Math.max(60, Math.min(130, dur * 0.7));
    var g = { x: 0, y: 0, w: 300, h: H };
    var res = Carve.blockCarves(g, c.d.startMin, c.d.endMin, items, colour, id);
    var fill = c.forks > 1 ? 'url(#cf-' + esc(id) + ')' : colour;
    var grad = c.forks > 1
      ? '<linearGradient id="cf-' + esc(id) + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' +
        Carve.shade(colour, c.fi % 2 === 0 ? -0.18 : 0.18) + '"/><stop offset="1" stop-color="' +
        Carve.shade(colour, c.fi % 2 === 0 ? 0.18 : -0.18) + '"/></linearGradient>'
      : '';
    return '<svg viewBox="0 0 300 ' + H + '" width="100%" class="card-svg"><defs>' + grad + res.defs + '</defs>' +
      '<rect x="0" y="0" width="300" height="' + H + '" rx="16" fill="' + fill + '"' + (res.maskId ? ' mask="url(#' + res.maskId + ')"' : '') + ' stroke="rgba(0,0,0,.25)"/>' +
      res.carves + '</svg>';
  };

  window.Carve = Carve;
})();
