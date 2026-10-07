/* upcoming.js - the upcoming row: future items with week, date and countdown. */
(function () {
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // Everything coming up, soonest first. With the week set: only items from today on. Without it: by week number.
  function build(mine) {
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
  }

  function countdown(left) {
    if (left === 0) return 'today';
    if (left === 1) return '1 day left';
    return left + ' days left';
  }

  function Upcoming() {}

  Upcoming.build = build;

  Upcoming.text = function (r) {
    var name = DayView.itemName(r.it);
    if (r.date) return { head: name, tail: r.m.cls.name + ' • Week ' + r.it.weekNo + ', ' + Time.fmtDate(r.date) + ', ' + countdown(r.left) };
    return { head: 'In week ' + r.it.weekNo + ', you have a ' + name.toLowerCase(), tail: r.m.cls.name };
  };

  Upcoming.render = function (el, mine) {
    var rows = build(mine);
    if (!rows.length) {
      el.innerHTML = '<span class="up-empty">' + (mine.length ? 'Nothing coming up.' : 'Upcoming quizzes and exams will show here.') + '</span>';
      return;
    }
    el.innerHTML = rows.slice(0, 6).map(function (r) {
      var t = Upcoming.text(r);
      return '<span class="up-item"><i class="up-dot" style="background:' + Carve.complement(r.m.colour) + '"></i><b>' + esc(t.head) + '</b> ' + esc(t.tail) + '</span>';
    }).join('');
  };

  window.Upcoming = Upcoming;
})();
