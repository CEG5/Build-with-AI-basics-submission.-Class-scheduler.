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

  // Replaced with the real carve in slice 2.
  Carve.forBlock = function () { return { defs: '', maskId: '', carves: '' }; };

  Carve.cardSvg = function () { return ''; };

  window.Carve = Carve;
})();
