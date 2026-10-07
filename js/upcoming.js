/* upcoming.js - the upcoming strip beside the week button: future items with week, date and countdown. */
(function () {
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function countdown(left) {
    if (left === 0) return 'today';
    if (left === 1) return '1 day left';
    return left + ' days left';
  }

  function Upcoming() {}

  // Everything coming up, soonest first. With the week set: only items from today on. Without it: by week number.
  Upcoming.build = function (mine) {
    var me = Store.me();
    var rows = [];
    mine.forEach(function (m) {
      (m.cls.items || []).forEach(function (it) {
        var date = Time.dateOf(me, it.weekNo, it.day);
        var left = date ? Time.daysUntil(date) : null;
        if (left !== null && left < 0) return; // already past
        rows.push({ m: m, it: it, date: date, left: left });
      });
    });
    rows.sort(function (a, b) {
      return (a.it.weekNo - b.it.weekNo) || (a.it.day - b.it.day) || (a.it.startMin - b.it.startMin);
    });
    return rows;
  };

  Upcoming.text = function (r) {
    var name = DayView.itemName(r.it);
    if (r.date) return { head: name, tail: r.m.cls.name + ' · Week ' + r.it.weekNo + ', ' + Time.fmtDate(r.date) + ' · ' + countdown(r.left) };
    return { head: 'In week ' + r.it.weekNo + ', you have a ' + name.toLowerCase(), tail: r.m.cls.name };
  };

  Upcoming.render = function (el, mine) {
    var rows = Upcoming.build(mine);
    var keep = el.scrollLeft; // keep the scroll position when the strip is redrawn
    el.classList.toggle('has-items', rows.length > 0);
    if (!rows.length) { el.innerHTML = '<span class="up-empty">Nothing upcoming</span>'; return; }
    el.innerHTML = rows.map(function (r) {
      var t = Upcoming.text(r);
      return '<span class="up-item"><i class="up-dot" style="background:' + Carve.complement(r.m.colour) + '"></i><b>' + esc(t.head) + '</b> ' + esc(t.tail) + '</span>';
    }).join('');
    el.scrollLeft = keep;
  };

  // The strip scrolls sideways: the mouse wheel moves it left and right.
  var strip = document.getElementById('upcoming');
  strip.addEventListener('wheel', function (e) {
    if (strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollLeft += e.deltaY + e.deltaX;
    e.preventDefault();
  }, { passive: false });

  window.Upcoming = Upcoming;
})();
