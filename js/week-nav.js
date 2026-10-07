/* week-nav.js - the week button, and the edge zones inside the weekly schedule that move between weeks. */
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

  // Button text: the week being viewed; a hint when the user hasn't set the current week yet.
  WeekNav.renderButton = function (el) {
    var me = Store.me();
    var cur = Time.currentWeek(me);
    var viewed = WeekNav.viewedWeek();
    el.innerHTML = '<span class="wk-num">Week ' + viewed + '</span>' +
      '<span class="wk-sub">' + (cur === null ? 'Set the week' : viewed === cur ? 'This week' : 'Week ' + cur + ' is now') + '</span>';
    el.classList.toggle('away', cur !== null && viewed !== cur);
  };

  // Small box to tell the app which university week it is now. Dates come from the device clock.
  WeekNav.openSetter = function () {
    var cur = Time.currentWeek(Store.me());
    Forms.open('<form method="dialog" class="form" id="week-form">' +
      '<h2>Current week</h2>' +
      '<p class="muted">Enter the week number your university calls this week. Dates and countdowns come from this device\'s clock.</p>' +
      '<label>Week number<input type="number" name="week" min="1" max="60" value="' + (cur || '') + '" placeholder="e.g. 6" required></label>' +
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
  document.getElementById('edge-left').addEventListener('click', function () { WeekNav.go(WeekNav.viewedWeek() - 1); });
  document.getElementById('edge-right').addEventListener('click', function () { WeekNav.go(WeekNav.viewedWeek() + 1); });

  window.WeekNav = WeekNav;
})();
