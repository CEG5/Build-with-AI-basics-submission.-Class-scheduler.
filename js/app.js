/* app.js - start-up and re-render wiring. */
(function () {
  var knownItems = null; // ids of items this window has already seen

  function itemIds(mine) {
    var ids = [];
    mine.forEach(function (m) { (m.cls.items || []).forEach(function (it) { ids.push({ id: it.id, it: it }); }); });
    return ids;
  }

  // When another window adds an item, bring this window to that item's week and day so the carve is visible.
  function followNewItems(mine) {
    var all = itemIds(mine);
    if (knownItems === null) { knownItems = {}; all.forEach(function (o) { knownItems[o.id] = true; }); return; }
    var fresh = all.filter(function (o) { return !knownItems[o.id]; });
    all.forEach(function (o) { knownItems[o.id] = true; });
    if (fresh.length) {
      var it = fresh[fresh.length - 1].it;
      var me = Store.me(); me.viewedWeek = it.weekNo; Store.saveMe(me);
      DayView.selectedDay = it.day;
    }
  }

  function render() {
    var mine = Store.myClasses();
    followNewItems(mine);
    var weekNo = WeekNav.viewedWeek();
    document.getElementById('week-label').textContent = 'Week ' + weekNo;
    DayView.renderTabs(document.getElementById('day-tabs'), render);
    DayView.render(document.getElementById('day-view'), mine, weekNo);
    WeekView.render(document.getElementById('week-view'), mine, weekNo);
    Upcoming.render(document.getElementById('upcoming'), mine);
    Background.setCalm(mine.length > 0);
    var my = document.getElementById('my-classes');
    my.innerHTML = '';
    mine.forEach(function (m) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'class-pill';
      b.style.setProperty('--pill', m.colour);
      b.textContent = m.cls.name + (m.role === 'author' ? ' • ' + m.cls.code : '');
      b.addEventListener('click', function () { if (Forms.classPanel) Forms.classPanel(m.cls.id); });
      my.appendChild(b);
    });
    if (Store.saveFailed) Forms.toast("Couldn't save. Your browser may be blocking storage.");
  }

  Forms.onChange = function (info) {
    render();
    if (info && info.joined) Animations.joined(info.joined);
  };
  Store.onChange(render); // another window changed the shared classes

  render();
  document.getElementById("week-view").scrollTop = 6.5 * WeekView.HOUR; // start the view around 6:30 a.m.
  window.App = { render: render };
})();
