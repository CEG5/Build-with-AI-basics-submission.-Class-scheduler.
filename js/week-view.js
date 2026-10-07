/* week-view.js - the weekly block diagram (SVG). Days across the top, 12 a.m. to midnight down the side. */
(function () {
  var W = 560, HOUR = 32, TOP = 30, LEFT = 44, RIGHT = 6;
  var H = TOP + 24 * HOUR + 6;
  var COLW = (W - LEFT - RIGHT) / 5;
  var SVGNS = 'http://www.w3.org/2000/svg';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // Flatten classes into one entry per block on the grid, with a column lane for overlaps.
  function collectBlocks(mine) {
    var blocks = [];
    mine.forEach(function (m) {
      (m.cls.forks || []).forEach(function (fork, fi) {
        (fork.days || []).forEach(function (d) {
          blocks.push({
            m: m, cls: m.cls, fork: fork, forkIndex: fi, forkCount: m.cls.forks.length,
            day: d.day, startMin: d.startMin, endMin: d.endMin, lane: 0, lanes: 1
          });
        });
      });
    });
    // Overlapping blocks in the same day share the column side by side.
    for (var day = 0; day < 5; day++) {
      var col = blocks.filter(function (b) { return b.day === day; })
        .sort(function (a, b) { return a.startMin - b.startMin; });
      var cluster = [], clusterEnd = -1;
      var flush = function () {
        var n = 0;
        cluster.forEach(function (b) { n = Math.max(n, b.lane + 1); });
        cluster.forEach(function (b) { b.lanes = n; });
        cluster = [];
      };
      col.forEach(function (b) {
        if (cluster.length && b.startMin >= clusterEnd) { flush(); clusterEnd = -1; }
        var used = {};
        cluster.forEach(function (o) { if (o.endMin > b.startMin) used[o.lane] = true; });
        var lane = 0;
        while (used[lane]) lane++;
        b.lane = lane;
        cluster.push(b);
        clusterEnd = Math.max(clusterEnd, b.endMin);
      });
      flush();
    }
    return blocks;
  }

  function geometry(b) {
    var laneW = (COLW - 6) / b.lanes;
    return {
      x: LEFT + b.day * COLW + 3 + b.lane * laneW,
      y: TOP + (b.startMin / 60) * HOUR,
      w: laneW - 2,
      h: Math.max(10, ((b.endMin - b.startMin) / 60) * HOUR)
    };
  }

  var WeekView = { W: W, H: H, HOUR: HOUR, TOP: TOP, LEFT: LEFT, COLW: COLW, collectBlocks: collectBlocks, geometry: geometry };

  WeekView.render = function (el, mine, weekNo) {
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Weekly schedule">';
    s += '<defs>';
    // Fork shade gradients: lecture dark -> light, practical light -> dark (same hue).
    mine.forEach(function (m) {
      s += '<linearGradient id="g-' + m.cls.id + '-0" x1="0" y1="0" x2="0" y2="1">' +
           '<stop offset="0" stop-color="' + Carve.shade(m.colour, -0.18) + '"/>' +
           '<stop offset="1" stop-color="' + Carve.shade(m.colour, 0.18) + '"/></linearGradient>';
      s += '<linearGradient id="g-' + m.cls.id + '-1" x1="0" y1="0" x2="0" y2="1">' +
           '<stop offset="0" stop-color="' + Carve.shade(m.colour, 0.18) + '"/>' +
           '<stop offset="1" stop-color="' + Carve.shade(m.colour, -0.18) + '"/></linearGradient>';
    });
    s += '</defs>';

    // day headers + vertical separators
    for (var d = 0; d < 5; d++) {
      var cx = LEFT + d * COLW + COLW / 2;
      s += '<text x="' + cx + '" y="18" class="wk-day" text-anchor="middle">' + Time.DAY_NAMES[d] + '</text>';
      s += '<rect x="' + (LEFT + d * COLW + 2) + '" y="' + TOP + '" width="' + (COLW - 4) + '" height="' + (24 * HOUR) +
           '" rx="10" class="wk-col"/>';
    }
    // hour guide lines
    for (var h = 0; h <= 24; h += 1) {
      var y = TOP + h * HOUR;
      var major = h % 3 === 0;
      s += '<line x1="' + LEFT + '" x2="' + (W - RIGHT) + '" y1="' + y + '" y2="' + y + '" class="' + (major ? 'wk-line major' : 'wk-line') + '"/>';
      if (major && h < 24) {
        var label = h === 0 ? '12a' : h < 12 ? h + 'a' : h === 12 ? '12p' : (h - 12) + 'p';
        s += '<text x="' + (LEFT - 6) + '" y="' + (y + 4) + '" class="wk-hour" text-anchor="end">' + label + '</text>';
      }
    }

    var blocks = collectBlocks(mine);
    var carves = '';
    blocks.forEach(function (b) {
      var g = geometry(b);
      var fill = b.forkCount > 1 ? 'url(#g-' + b.cls.id + '-' + (b.forkIndex % 2) + ')' : b.m.colour;
      var bodyId = 'blk-' + b.cls.id + '-' + b.forkIndex + '-' + b.day;
      var items = (b.cls.items || []).filter(function (it) { return it.weekNo === weekNo && it.day === b.day; });
      var maskAttr = '';
      var carveSvg = '';
      if (items.length) {
        var res = Carve.forBlock(g, b, items, b.m.colour, bodyId);
        s += res.defs;
        maskAttr = ' mask="url(#' + res.maskId + ')"';
        carveSvg = res.carves;
      }
      s += '<rect x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h + '" rx="10" class="wk-block" fill="' + fill + '"' + maskAttr + '/>';
      // studs (small lego-like details)
      if (g.h > 26 && g.w > 30) {
        for (var k = 0; k < Math.min(3, Math.floor((g.w - 8) / 16)); k++) {
          s += '<circle cx="' + (g.x + 12 + k * 14) + '" cy="' + (g.y + 9) + '" r="3" class="wk-stud"/>';
        }
      }
      carves += carveSvg;
      var maxChars = Math.max(2, Math.floor(g.w / 6.2));
      var nm = b.cls.name.length > maxChars ? b.cls.name.slice(0, maxChars - 1) + '…' : b.cls.name;
      if (g.h > 34) {
        s += '<text x="' + (g.x + 7) + '" y="' + (g.y + 26) + '" class="wk-name">' + esc(nm) + '</text>';
      }
    });
    s += carves;
    s += '</svg>';
    el.innerHTML = s;
  };

  window.WeekView = WeekView;
})();
