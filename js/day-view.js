/* day-view.js - daily cards for the selected day, same colours as the weekly view. */
(function () {
  var DayView = { selectedDay: Time.todayIndex() };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  DayView.renderTabs = function (el, onPick) {
    el.innerHTML = '';
    Time.DAY_NAMES.forEach(function (n, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = n;
      b.className = 'day-tab' + (i === DayView.selectedDay ? ' active' : '');
      b.addEventListener('click', function () { DayView.selectedDay = i; onPick(); });
      el.appendChild(b);
    });
  };

  DayView.render = function (el, mine, weekNo) {
    var cards = [];
    mine.forEach(function (m) {
      (m.cls.forks || []).forEach(function (fork, fi) {
        (fork.days || []).forEach(function (d) {
          if (d.day === DayView.selectedDay) {
            cards.push({ m: m, fork: fork, fi: fi, forks: m.cls.forks.length, d: d });
          }
        });
      });
    });
    cards.sort(function (a, b) { return a.d.startMin - b.d.startMin; });

    if (!mine.length) {
      el.innerHTML = '<div class="empty">Classes you create or join will be tracked here.</div>';
      return;
    }
    if (!cards.length) {
      el.innerHTML = '<div class="empty">Nothing on ' + Time.DAY_LONG[DayView.selectedDay] + '.</div>';
      return;
    }

    el.innerHTML = '';
    cards.forEach(function (c, idx) {
      var cls = c.m.cls;
      var card = document.createElement('article');
      card.className = 'day-card';
      card.dataset.classId = cls.id;
      var fill = c.forks > 1
        ? 'linear-gradient(' + (c.fi % 2 === 0 ? '180deg' : '0deg') + ',' + Carve.shade(c.m.colour, -0.18) + ',' + Carve.shade(c.m.colour, 0.18) + ')'
        : c.m.colour;
      card.style.setProperty('--card', fill);
      card.style.setProperty('--glow', c.m.colour);
      var dur = c.d.endMin - c.d.startMin;
      var note = c.fork.note ? ' <span class="note">' + esc(c.fork.note) + '</span>' : '';
      var body = '<div class="card-time">' + Time.fmt(c.d.startMin) + ' - ' + Time.fmt(c.d.endMin) +
                 ' <span class="dur">' + Time.fmtDuration(dur) + '</span></div>' +
                 '<div class="card-name">' + esc(cls.name) + note + '</div>';

      // carve items for the displayed week on this day
      var items = (cls.items || []).filter(function (it) { return it.weekNo === weekNo && it.day === DayView.selectedDay; });
      var svgId = 'dc-' + cls.id + '-' + idx;
      if (items.length) {
        body += '<div class="card-carve">' + Carve.cardSvg(c, items, c.m.colour, svgId) + '</div>';
      }
      card.innerHTML = body;
      el.appendChild(card);
    });
  };

  window.DayView = DayView;
})();
