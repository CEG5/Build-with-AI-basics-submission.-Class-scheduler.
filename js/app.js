/* app.js - start-up and re-render wiring. */
(function () {
  function render() {
    var mine = Store.myClasses();
    var weekNo = WeekNav.viewedWeek();
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
