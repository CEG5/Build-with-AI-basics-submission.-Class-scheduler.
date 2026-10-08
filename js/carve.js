/* carve.js - colour helpers and the carve shape (fills a class block from its bottom-right corner). */
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

  // ---- the carve ----
  // The carve fills a class block starting from its bottom-right corner. Think of the block as four quarters:
  // the bottom-right quarter fills first (up to 25%); anything more spills into the quarter above it (midterms,
  // finals and some quizzes) or the quarter to its left (other quizzes). The piece is a squarish shape with
  // softened corners and a slight wobble, not a clean cut. Its depth is fitted so the part inside the block
  // covers the target fraction of the block. The block is drawn with the piece subtracted via an SVG <mask>;
  // the piece is drawn in the complement colour.

  Carve.fractionOf = function (item) {
    if (item.type === 'midterm') return 1 / 3;
    if (item.type === 'final') return 1 / 2;
    var imp = Math.max(0, Math.min(1, item.importance === undefined || item.importance === null ? 0.3 : item.importance));
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

  // Midterms and finals always grow up the right side. Quizzes and others pick up or left, stable per item.
  Carve.orientation = function (item) {
    if (item.type === 'midterm' || item.type === 'final') return 'up';
    return seededRandom('o' + (item.id || 'x'))() < 0.5 ? 'up' : 'left';
  };

  // Rectangle (as fractions of the block) anchored at the bottom-right with area phi, filling the
  // bottom-right quarter first and then growing in one direction.
  function dims(phi, orient) {
    var a, b;
    if (phi <= 0.25) { a = b = Math.sqrt(phi); }
    else if (orient === 'up') { if (phi <= 0.5) { a = 0.5; b = phi / 0.5; } else { b = 1; a = phi; } }
    else { if (phi <= 0.5) { b = 0.5; a = phi / 0.5; } else { a = 1; b = phi; } }
    return { a: Math.min(a, 1), b: Math.min(b, 1) };
  }

  var N_POINTS = 32;       // points around the shape (a superellipse centred on the block's bottom-right corner)
  var SQUARENESS = 5;      // 2 = ellipse; higher = more square
  var WOBBLE = 0.05;       // gentle, smooth unevenness (a shallow bulge along the edges) so it is not a clean cut

  function basePoints(seedKey) {
    var rnd = seededRandom(String(seedKey));
    var ph1 = rnd() * 6.28, ph2 = rnd() * 6.28;
    var pts = [], e = 2 / SQUARENESS;
    for (var i = 0; i < N_POINTS; i++) {
      var th = (i / N_POINTS) * Math.PI * 2;
      var c = Math.cos(th), s = Math.sin(th);
      pts.push([(c < 0 ? -1 : 1) * Math.pow(Math.abs(c), e), (s < 0 ? -1 : 1) * Math.pow(Math.abs(s), e), 1 + WOBBLE * (Math.sin(2 * th + ph1) * 0.7 + Math.sin(3 * th + ph2) * 0.4)]);
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
      for (var k = 0; k < 6; k++) {
        var t = k / 6, u = 1 - t;
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

  var GRID = 40;
  var cache = {};

  // g = {x,y,w,h}: the block rectangle. items = the items carved from this block (their fractions add up,
  // capped). Returns {d, coverage, target}.
  Carve.fit = function (g, items) {
    var fraction = 0;
    items.forEach(function (it) { fraction += Carve.fractionOf(it); });
    fraction = Math.min(fraction, 0.85);
    var lead = items[0];
    var orient = Carve.orientation(lead);
    var key = [lead.id, items.length, g.x.toFixed(1), g.y.toFixed(1), g.w.toFixed(1), g.h.toFixed(1), fraction.toFixed(3), orient].join('|');
    if (cache[key]) return cache[key];

    var base = basePoints(lead.id || 'x');
    var cx = g.x + g.w, cy = g.y + g.h; // bottom-right corner of the block

    function place(phi) {
      var d = dims(phi, orient), A = d.a * g.w, B = d.b * g.h;
      return base.map(function (p) { return [cx + A * p[0] * p[2], cy + B * p[1] * p[2]]; });
    }
    function coverage(phi) {
      var poly = polygon(place(phi)), hit = 0;
      for (var i = 0; i < GRID; i++) {
        for (var j = 0; j < GRID; j++) {
          if (inside(poly, g.x + (i + 0.5) / GRID * g.w, g.y + (j + 0.5) / GRID * g.h)) hit++;
        }
      }
      return hit / (GRID * GRID);
    }

    var lo = 0.01, hi = 1, phi;
    if (coverage(hi) <= fraction) { phi = hi; }
    else {
      for (var it = 0; it < 24; it++) {
        var mid = (lo + hi) / 2;
        if (coverage(mid) < fraction) lo = mid; else hi = mid;
      }
      phi = (lo + hi) / 2;
    }
    var dm = dims(phi, orient);
    var res = { d: pathOf(place(phi)), coverage: coverage(phi), target: fraction, orient: orient, a: dm.a, b: dm.b };
    cache[key] = res;
    return res;
  };

  function esc(str) { return String(str).replace(/[^A-Za-z0-9_-]/g, '_'); }

  // Which session (class block) an item is carved from: the session that day containing its time, otherwise
  // the closest session that day. Items on a day with no session are returned as orphans.
  Carve.assignItems = function (sessions, items) {
    var bySession = {}, orphans = [];
    items.forEach(function (it) {
      var best = -1, bestDist = Infinity;
      sessions.forEach(function (s, i) {
        if (s.day !== it.day) return;
        var dist = it.startMin >= s.startMin && it.startMin < s.endMin ? 0 :
          Math.min(Math.abs(it.startMin - s.startMin), Math.abs(it.startMin - s.endMin));
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      if (best < 0) orphans.push(it);
      else (bySession[best] = bySession[best] || []).push(it);
    });
    return { bySession: bySession, orphans: orphans };
  };

  // Mask + piece for one block. Returns {defs, maskId, carves}; maskId is '' when there is nothing to carve.
  Carve.blockCarves = function (g, items, colour, id) {
    if (!items || !items.length) return { defs: '', maskId: '', carves: '', side: '', count: 0 };
    var f = Carve.fit(g, items);
    var comp = Carve.complement(colour);
    var maskId = 'm-' + esc(id), clipId = 'k-' + esc(id), rx = g.rx === undefined ? 3 : g.rx;
    var defs = '<mask id="' + maskId + '" maskUnits="userSpaceOnUse" x="' + (g.x - 2) + '" y="' + (g.y - 2) + '" width="' + (g.w + 4) + '" height="' + (g.h + 4) + '">' +
               '<rect x="' + (g.x - 2) + '" y="' + (g.y - 2) + '" width="' + (g.w + 4) + '" height="' + (g.h + 4) + '" fill="white"/>' +
               '<path d="' + f.d + '" fill="black"/></mask>' +
               '<clipPath id="' + clipId + '"><rect x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h + '" rx="' + rx + '"/></clipPath>';
    var piece = '<path d="' + f.d + '" fill="' + comp + '" class="carve-piece" clip-path="url(#' + clipId + ')" data-item="' + esc(items[0].id) +
                '" data-coverage="' + f.coverage.toFixed(3) + '" data-orient="' + f.orient + '"/>';
    // the piece is raised like the block: its own darker side face, shifted down by g.rise and clipped to the block
    var side = '';
    if (g.rise) {
      side = '<g transform="translate(0,' + g.rise + ')" clip-path="url(#' + clipId + ')"><path d="' + f.d + '" fill="' + Carve.shade(comp, -0.28) + '" class="carve-side"/></g>';
    }
    return { defs: defs, maskId: maskId, carves: piece, side: side, count: items.length };
  };

  // An item on a day with no class: carved alone on a dashed reference block (a 100-minute block at column width).
  Carve.orphan = function (g, item, colour) {
    var f = Carve.fit(g, [item]);
    var clipId = 'ko-' + esc(item.id);
    return '<clipPath id="' + clipId + '"><rect x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h + '" rx="3"/></clipPath>' +
      '<rect x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h + '" rx="3" class="orphan-ref"/>' +
      '<path d="' + f.d + '" fill="' + Carve.complement(colour) + '" class="carve-piece orphan" clip-path="url(#' + clipId + ')" data-item="' + esc(item.id) +
      '" data-coverage="' + f.coverage.toFixed(3) + '"/>';
  };

  // Gem-like body colour: a little lighter on top, darker at the bottom.
  Carve.gemStops = function (hex) {
    return '<stop offset="0" stop-color="' + Carve.shade(hex, 0.07) + '"/><stop offset="1" stop-color="' + Carve.shade(hex, -0.1) + '"/>';
  };

  // A small block with its carve, for a day card. dur = the session length in minutes.
  Carve.cardSvg = function (dur, items, colour, id) {
    var W = 120, H = Math.max(44, Math.min(84, dur * 0.55));
    var g = { x: 1, y: 1, w: W, h: H, rx: 3 };
    var res = Carve.blockCarves(g, items, colour, id);
    var gid = 'cg-' + esc(id);
    return '<svg viewBox="0 0 ' + (W + 2) + ' ' + (H + 2) + '" width="' + (W + 2) + '" height="' + (H + 2) + '" class="card-svg">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' + Carve.gemStops(colour) + '</linearGradient>' + res.defs + '</defs>' +
      '<rect x="' + g.x + '" y="' + g.y + '" width="' + W + '" height="' + H + '" rx="3" fill="url(#' + gid + ')"' +
      (res.maskId ? ' mask="url(#' + res.maskId + ')"' : '') + '/>' + res.carves + '</svg>';
  };

  window.Carve = Carve;
})();
