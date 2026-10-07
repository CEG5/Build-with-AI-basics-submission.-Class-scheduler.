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

  var TYPE_NAMES = { midterm: 'Midterm', final: 'Final', quiz: 'Quiz', other: 'Other' };
  DayView.itemName = function (it) { return it.type === 'other' && it.title ? it.title : TYPE_NAMES[it.type] || 'Item'; };
  DayView.itemList = function (items) {
    return '<ul class="card-items">' + items.map(function (it) {
      return '<li><b>' + esc(DayView.itemName(it)) + '</b> <span>' + Time.fmt(it.startMin) + '</span>' +
        (it.description ? '<div class="desc">' + esc(it.description) + '</div>' : '') + '</li>';
    }).join('') + '</ul>';
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

    // items on this day whose time is outside every block of their class get their own small card
    var loose = [];
    mine.forEach(function (m) {
      (m.cls.items || []).forEach(function (it) {
        if (it.weekNo !== weekNo || it.day !== DayView.selectedDay) return;
        var inAny = false;
        (m.cls.forks || []).forEach(function (fk) {
          (fk.days || []).forEach(function (d) {
            if (d.day === it.day && Carve.inBlock(it, d.startMin, d.endMin)) inAny = true;
          });
        });
        if (!inAny) loose.push({ m: m, it: it });
      });
    });

    if (!mine.length) {
      el.innerHTML = '<div class="empty">Classes you create or join will be tracked here.</div>';
      return;
    }
    if (!cards.length && !loose.length) {
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
      var items = (cls.items || []).filter(function (it) {
        return it.weekNo === weekNo && it.day === DayView.selectedDay && Carve.inBlock(it, c.d.startMin, c.d.endMin);
      });
      var svgId = 'dc-' + cls.id + '-' + idx;
      if (items.length) {
        body += '<div class="card-carve">' + Carve.cardSvg(c, items, c.m.colour, svgId) + '</div>';
      }
      if (items.length) body += DayView.itemList(items);
      card.innerHTML = body;
      el.appendChild(card);
    });

    loose.forEach(function (l) {
      var card = document.createElement('article');
      card.className = 'day-card loose';
      card.style.setProperty('--card', 'var(--g2)');
      card.style.setProperty('--glow', Carve.complement(l.m.colour));
      var g = { x: 0, y: 0, w: 300, h: 70 };
      card.innerHTML = '<div class="card-time">' + Time.fmt(l.it.startMin) + '</div><div class="card-name">' + esc(l.m.cls.name) + '</div>' +
        '<div class="card-carve"><svg viewBox="0 0 300 70" width="100%" class="card-svg">' + Carve.orphan(g, 0, l.it, l.m.colour) + '</svg></div>' +
        DayView.itemList([l.it]);
      el.appendChild(card);
    });
  };

  window.DayView = DayView;
})();
