/* week-view.js - the weekly block diagram (SVG). Days across the top, 12 a.m. to midnight down the side.
   Class blocks stand up from the surface (a darker side face under each block). */
(function () {
  var W = 560, HOUR = 34, TOP = 30, LEFT = 46, RIGHT = 8;
  var H = TOP + 24 * HOUR + 10;
  var COLW = (W - LEFT - RIGHT) / 5;
  var RISE = 5; // how far a block stands above the surface, in px

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // One entry per session on the grid, with a lane so overlapping sessions share the column side by side.
  function collectBlocks(mine) {
    var blocks = [];
    mine.forEach(function (m) {
      Store.sessionsOf(m.cls).forEach(function (s, i) {
        blocks.push({ m: m, cls: m.cls, index: i, session: s, day: s.day, startMin: s.startMin, endMin: s.endMin, lane: 0, lanes: 1 });
      });
    });
    for (var day = 0; day < 5; day++) {
      var col = blocks.filter(function (b) { return b.day === day; }).sort(function (a, b) { return a.startMin - b.startMin; });
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
    var laneW = (COLW - 8) / b.lanes;
    return {
      x: LEFT + b.day * COLW + 4 + b.lane * laneW,
      y: TOP + (b.startMin / 60) * HOUR,
      w: laneW - 3,
      h: Math.max(14, ((b.endMin - b.startMin) / 60) * HOUR - RISE),
      rx: 3, rise: RISE
    };
  }

  // Engraved text: a light copy one pixel lower (the lower lip of the cut) under a dark copy. The size shrinks
  // a little to fit the width, then the text is cut short with an ellipsis if it still does not fit.
  function engraved(x, y, str, avail, size, cls, anchor) {
    var s = size;
    if (str.length * s * 0.58 > avail) s = Math.max(Math.min(size, 8), avail / (str.length * 0.58));
    var max = Math.max(1, Math.floor(avail / (s * 0.58)));
    var txt = str.length > max ? str.slice(0, Math.max(1, max - 1)) + '…' : str;
    if (max < 3 && str.length > max) return '';
    var at = anchor ? ' text-anchor="' + anchor + '"' : '';
    return '<text x="' + x + '" y="' + (y + 0.9) + '" class="' + cls + ' lip" font-size="' + s.toFixed(1) + '"' + at + '>' + esc(txt) + '</text>' +
           '<text x="' + x + '" y="' + y + '" class="' + cls + ' cut" font-size="' + s.toFixed(1) + '"' + at + '>' + esc(txt) + '</text>';
  }

  var WeekView = { W: W, H: H, HOUR: HOUR, TOP: TOP, LEFT: LEFT, COLW: COLW, collectBlocks: collectBlocks, geometry: geometry };

  WeekView.render = function (el, mine, weekNo) {
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Weekly schedule"><defs>';
    mine.forEach(function (m) {
      s += '<linearGradient id="wg-' + m.cls.id + '" x1="0" y1="0" x2="0" y2="1">' + Carve.gemStops(m.colour) + '</linearGradient>';
    });
    s += '</defs>';

    // day headers and column surfaces
    for (var d = 0; d < 5; d++) {
      s += '<text x="' + (LEFT + d * COLW + COLW / 2) + '" y="19" class="wk-day" text-anchor="middle">' + Time.DAY_NAMES[d].toUpperCase() + '</text>';
      s += '<rect x="' + (LEFT + d * COLW + 2) + '" y="' + TOP + '" width="' + (COLW - 4) + '" height="' + (24 * HOUR) + '" rx="2" class="wk-col"/>';
    }
    // hour guide lines
    for (var h = 0; h <= 24; h++) {
      var y = TOP + h * HOUR, major = h % 3 === 0;
      s += '<line x1="' + LEFT + '" x2="' + (W - RIGHT) + '" y1="' + y + '" y2="' + y + '" class="' + (major ? 'wk-line major' : 'wk-line') + '"/>';
      if (major && h < 24) {
        var label = h === 0 ? '12 AM' : h < 12 ? h + ' AM' : h === 12 ? '12 PM' : (h - 12) + ' PM';
        s += '<text x="' + (LEFT - 7) + '" y="' + (y + 4) + '" class="wk-hour" text-anchor="end">' + label + '</text>';
      }
    }

    // each class: which items (this week) are carved from which session
    var assigned = {};
    mine.forEach(function (m) {
      var weekItems = (m.cls.items || []).filter(function (it) { return it.weekNo === weekNo; });
      assigned[m.cls.id] = Carve.assignItems(Store.sessionsOf(m.cls), weekItems);
    });

    collectBlocks(mine).forEach(function (b) {
      var g = geometry(b);
      var items = (assigned[b.cls.id].bySession[b.index]) || [];
      var bodyId = 'blk-' + b.cls.id + '-' + b.index;
      var res = Carve.blockCarves(g, items, b.m.colour, bodyId);
      var mask = res.maskId ? ' mask="url(#' + res.maskId + ')"' : '';
      s += res.defs;
      s += '<g class="wk-blk" data-class-id="' + b.cls.id + '">';
      // side face: the block stands RISE px above the surface
      // (the same carve is cut through the side face, shifted down by RISE, so the raised edge is carved too)
      s += '<g transform="translate(0,' + RISE + ')"' + mask + '><rect x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h + '" rx="3" fill="' + Carve.shade(b.m.colour, -0.28) + '" class="wk-side"/></g>';
      s += res.side; // the carved piece's own raised edge
      s += '<rect x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h + '" rx="3" class="wk-block" fill="url(#wg-' + b.cls.id + ')"' + mask + '/>';
      s += res.carves;
      // lit top and left edges
      s += '<path d="M' + (g.x + 3) + ' ' + (g.y + .5) + 'H' + (g.x + g.w - 3) + 'M' + (g.x + .5) + ' ' + (g.y + 3) + 'V' + (g.y + g.h - 3) + '" class="wk-edge"/>';
      // Text is engraved (dented) into the block: a dark cut with a light lower lip. It is fitted to the space
      // it has, and clipped to the block so it can never run outside.
      var tcid = 'tx-' + bodyId;
      s += '<clipPath id="' + tcid + '"><rect x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h + '" rx="3"/></clipPath><g clip-path="url(#' + tcid + ')">';
      if (g.h > 22) s += engraved(g.x + 8, g.y + 15, b.cls.name, g.w - 14, 11, 'wk-eng');
      if (g.h > 44 && b.session.note) s += engraved(g.x + 8, g.y + 28, b.session.note.toUpperCase(), g.w - 14, 8.5, 'wk-eng small');
      if (items.length) {
        // the name of the quiz, midterm or other, engraved into the carved piece
        var fit = Carve.fit(g, items);
        var pw = fit.a * g.w, ph = fit.b * g.h;
        var label = DayView.itemName(items[0]) + (items.length > 1 ? ' +' + (items.length - 1) : '');
        if (ph >= 15 && pw >= 28) s += engraved(g.x + g.w - pw / 2, g.y + g.h - ph / 2 + 3.5, label, pw - 12, 10, 'wk-eng item', 'middle');
      }
      s += '</g>';
      s += '</g>';
    });

    // items on a day with no class session: carved alone on a dashed reference block
    mine.forEach(function (m) {
      assigned[m.cls.id].orphans.forEach(function (it) {
        var ref = { x: LEFT + it.day * COLW + 4, y: TOP + (it.startMin / 60) * HOUR, w: COLW - 8, h: (100 / 60) * HOUR };
        s += Carve.orphan(ref, it, m.colour);
      });
    });

    s += '</svg>';
    el.innerHTML = s;
  };

  window.WeekView = WeekView;
})();
