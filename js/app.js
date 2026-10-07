/* app.js - start-up and re-render wiring. */
(function () {
  var knownItems = null; // ids of items this window has already seen

  // When another window adds an item, bring this window to that item's week and day so the carve is visible.
  function followNewItems(mine) {
    var all = [];
    mine.forEach(function (m) { (m.cls.items || []).forEach(function (it) { all.push(it); }); });
    if (knownItems === null) { knownItems = {}; all.forEach(function (it) { knownItems[it.id] = true; }); return; }
    var fresh = all.filter(function (it) { return !knownItems[it.id]; });
    all.forEach(function (it) { knownItems[it.id] = true; });
    if (fresh.length) {
      var it = fresh[fresh.length - 1];
      var me = Store.me(); me.viewedWeek = it.weekNo; Store.saveMe(me);
      DayView.selectedDay = it.day;
    }
  }

  function render() {
    var mine = Store.myClasses();
    followNewItems(mine);
    var weekNo = WeekNav.viewedWeek();
    DayView.renderTabs(document.getElementById('day-tabs'), render);
    DayView.render(document.getElementById('day-view'), mine, weekNo);
    WeekView.render(document.getElementById('week-view'), mine, weekNo);
    Upcoming.render(document.getElementById('upcoming'), mine);
    WeekNav.renderButton(document.getElementById('week-indicator'));
    Background.setCalm(mine.length > 0);

    var my = document.getElementById('my-classes');
    my.innerHTML = '';
    mine.forEach(function (m) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'class-pill';
      b.style.setProperty('--pill', m.colour);
      b.textContent = m.cls.name + (m.role === 'author' ? ' · ' + m.cls.code : '');
      b.addEventListener('click', function () { Forms.classPanel(m.cls.id); });
      my.appendChild(b);
    });

    // an open class panel for a class that was ended elsewhere closes; otherwise keep its item list fresh
    if (Forms.currentPanel) {
      if (!Store.classById(Forms.currentPanel)) Forms.close(); else Forms.renderPanelItems(Forms.currentPanel);
    }
    if (Store.saveFailed) Forms.toast("Couldn't save. Your browser may be blocking storage.");
  }

  Forms.onChange = function (info) {
    render();
    if (info && (info.joined || info.created)) Animations.pop(info.joined || info.created);
  };
  Store.onChange(render); // another window changed the shared classes

  render();
  document.getElementById('week-view').scrollTop = 6.5 * WeekView.HOUR; // start the view around 6:30 a.m.
  window.App = { render: render };
})();
