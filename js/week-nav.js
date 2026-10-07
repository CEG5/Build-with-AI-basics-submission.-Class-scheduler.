/* week-nav.js - week indicator, previous/next, and the edge clouds that appear near the left and right edges. */
(function () {
  var WeekNav = {};

  // The week being shown: the user's choice, else this week if it has been set, else week 1.
  WeekNav.viewedWeek = function () {
    var me = Store.me();
    if (me.viewedWeek) return me.viewedWeek;
    var cur = Time.currentWeek(me);
    return cur || 1;
  };

  WeekNav.go = function (weekNo) {
    var me = Store.me();
    me.viewedWeek = Math.max(1, weekNo);
    Store.saveMe(me);
    if (window.App) App.render();
  };

  WeekNav.indicatorText = function () {
    var cur = Time.currentWeek(Store.me());
    return cur ? 'Week ' + cur : 'Set the week';
  };

  // Small box to tell the app which university week it is now. Dates come from the device clock.
  WeekNav.openSetter = function () {
    var cur = Time.currentWeek(Store.me());
    Forms.open('<form method="dialog" class="form" id="week-form">' +
      '<h2>Which week is it?</h2>' +
      '<p class="muted">Use the week number your university calls this week. Dates and countdowns come from your device clock.</p>' +
      '<label>Current week<input type="number" name="week" min="1" max="60" value="' + (cur || '') + '" placeholder="e.g. 6" required></label>' +
      '<div class="actions"><button type="button" class="ghost" data-close>Cancel</button><button type="submit" class="primary">Set</button></div>' +
      '</form>');
    var form = document.getElementById('week-form');
    form.querySelector('[data-close]').addEventListener('click', Forms.close);
    form.week.focus();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = parseInt(form.week.value, 10);
      if (!(n >= 1)) return;
      var me = Store.me();
      me.anchorWeek = n;
      me.anchorDate = Time.todayISO();
      me.viewedWeek = null; // follow the current week again
      Store.saveMe(me);
      Forms.close();
      App.render();
    });
  };

  document.getElementById('week-indicator').addEventListener('click', WeekNav.openSetter);
  document.getElementById('week-prev').addEventListener('click', function () { WeekNav.go(WeekNav.viewedWeek() - 1); });
  document.getElementById('week-next').addEventListener('click', function () { WeekNav.go(WeekNav.viewedWeek() + 1); });
  document.getElementById('week-label').addEventListener('click', function () {
    var me = Store.me(); me.viewedWeek = null; Store.saveMe(me); App.render(); // back to the current week
  });

  // Edge clouds: appear when the mouse nears the left or right edge; clicking one changes the week.
  var left = document.getElementById('edge-left'), right = document.getElementById('edge-right');
  left.innerHTML = '<span>&#8249;</span>';
  right.innerHTML = '<span>&#8250;</span>';
  document.addEventListener('mousemove', function (e) {
    var w = window.innerWidth, zone = Math.min(120, w * 0.1);
    left.classList.toggle('show', e.clientX < zone);
    right.classList.toggle('show', e.clientX > w - zone);
  });
  document.addEventListener('mouseleave', function () { left.classList.remove('show'); right.classList.remove('show'); });
  left.addEventListener('click', function () { WeekNav.go(WeekNav.viewedWeek() - 1); });
  right.addEventListener('click', function () { WeekNav.go(WeekNav.viewedWeek() + 1); });

  window.WeekNav = WeekNav;
})();
