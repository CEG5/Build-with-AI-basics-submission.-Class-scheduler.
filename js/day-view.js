/* day-view.js - daily cards for the selected day. Each card shows the class block with the same carve as the weekly view. */
(function () {
  var DayView = { selectedDay: Time.todayIndex() };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  var TYPE_NAMES = { midterm: 'Midterm', final: 'Final', quiz: 'Quiz', other: 'Other' };
  DayView.itemName = function (it) { return it.type === 'other' && it.title ? it.title : TYPE_NAMES[it.type] || 'Item'; };

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

  function itemList(items) {
    return '<ul class="card-items">' + items.map(function (it) {
      return '<li><b>' + esc(DayView.itemName(it)) + '</b> <span>' + Time.fmt(it.startMin) + '</span>' +
        (it.description ? '<div class="desc">' + esc(it.description) + '</div>' : '') + '</li>';
    }).join('') + '</ul>';
  }

  DayView.render = function (el, mine, weekNo) {
    var cards = [], loose = [];
    mine.forEach(function (m) {
      var sessions = Store.sessionsOf(m.cls);
      var weekItems = (m.cls.items || []).filter(function (it) { return it.weekNo === weekNo; });
      var assigned = Carve.assignItems(sessions, weekItems);
      sessions.forEach(function (s, i) {
        if (s.day === DayView.selectedDay) cards.push({ m: m, s: s, i: i, items: assigned.bySession[i] || [] });
      });
      assigned.orphans.forEach(function (it) { if (it.day === DayView.selectedDay) loose.push({ m: m, it: it }); });
    });
    cards.sort(function (a, b) { return a.s.startMin - b.s.startMin; });

    if (!mine.length) {
      el.innerHTML = '<div class="empty">Classes you create or join will be tracked here.</div>';
      return;
    }
    if (!cards.length && !loose.length) {
      el.innerHTML = '<div class="empty">Nothing on ' + Time.DAY_LONG[DayView.selectedDay] + '.</div>';
      return;
    }

    el.innerHTML = '';
    cards.forEach(function (c) {
      var cls = c.m.cls;
      var card = document.createElement('article');
      card.className = 'day-card';
      card.dataset.classId = cls.id;
      card.style.setProperty('--accent', c.m.colour);
      var note = c.s.note ? '<span class="note">' + esc(c.s.note) + '</span>' : '';
      card.innerHTML =
        '<div class="card-text">' +
          '<div class="card-time">' + Time.fmt(c.s.startMin) + ' – ' + Time.fmt(c.s.endMin) + ' <span class="dur">' + Time.fmtDuration(c.s.endMin - c.s.startMin) + '</span></div>' +
          '<div class="card-name">' + esc(cls.name) + note + '</div>' +
          (c.items.length ? itemList(c.items) : '') +
        '</div>' +
        '<div class="card-visual">' + Carve.cardSvg(c.s.endMin - c.s.startMin, c.items, c.m.colour, 'dc-' + cls.id + '-' + c.i) + '</div>';
      el.appendChild(card);
    });

    loose.forEach(function (l) {
      var card = document.createElement('article');
      card.className = 'day-card loose';
      card.style.setProperty('--accent', l.m.colour);
      var g = { x: 1, y: 1, w: 120, h: 60 };
      card.innerHTML =
        '<div class="card-text"><div class="card-time">' + Time.fmt(l.it.startMin) + ' • no class this day</div>' +
        '<div class="card-name">' + esc(l.m.cls.name) + '</div>' + itemList([l.it]) + '</div>' +
        '<div class="card-visual"><svg viewBox="0 0 122 62" width="122" height="62" class="card-svg">' + Carve.orphan(g, l.it, l.m.colour) + '</svg></div>';
      el.appendChild(card);
    });
  };

  DayView.itemList = itemList;
  window.DayView = DayView;
})();
