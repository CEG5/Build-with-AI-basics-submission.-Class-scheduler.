/* chip.js - chipped stone outlines: a rectangle whose corners are chamfered and whose edges are slightly broken,
   like the edges of a chiselled stone slab. Used for the front slab and for the background blocks. */
(function () {
  function seeded(str) {
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

  var Chip = {};

  // o: { seed, amp (how far edges break inward, px), step (px between break points), corner (max chamfer, px) }
  Chip.points = function (w, h, o) {
    o = o || {};
    var r = seeded(String(o.seed === undefined ? 'x' : o.seed));
    var amp = o.amp === undefined ? 4 : o.amp, step = o.step || 40, cmax = o.corner || 10;
    var c = [0, 0, 0, 0].map(function () { return cmax * (0.35 + 0.65 * r()); }); // TL, TR, BR, BL
    var pts = [];
    function edge(x0, y0, x1, y1, nx, ny) {
      var len = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
      var n = Math.max(1, Math.round(len / step));
      for (var i = 1; i < n; i++) {
        var t = i / n + (r() - 0.5) * 0.5 / n;
        var d = r() < 0.2 ? amp * (0.8 + r() * 1.4) : amp * r() * 0.55; // now and then a bigger chip
        pts.push([x0 + (x1 - x0) * t + nx * d, y0 + (y1 - y0) * t + ny * d]);
      }
    }
    pts.push([c[0], 0]); edge(c[0], 0, w - c[1], 0, 0, 1); pts.push([w - c[1], 0]);
    pts.push([w, c[1]]); edge(w, c[1], w, h - c[2], -1, 0); pts.push([w, h - c[2]]);
    pts.push([w - c[2], h]); edge(w - c[2], h, c[3], h, 0, -1); pts.push([c[3], h]);
    pts.push([0, h - c[3]]); edge(0, h - c[3], 0, c[0], 1, 0); pts.push([0, c[0]]);
    return pts;
  };

  // CSS clip-path polygon in pixels
  Chip.css = function (pts) {
    return 'polygon(' + pts.map(function (p) { return p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px'; }).join(',') + ')';
  };

  // Canvas path (offset by x, y)
  Chip.path = function (ctx, x, y, pts) {
    ctx.beginPath();
    ctx.moveTo(x + pts[0][0], y + pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(x + pts[i][0], y + pts[i][1]);
    ctx.closePath();
  };

  window.Chip = Chip;
})();
