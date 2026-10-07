/* week-nav.js - week indicator, prev/next, edge clouds (filled in at slice 4). */
(function () {
  var WeekNav = {};
  // The week being shown: the user's choice, else this week if set, else week 1.
  WeekNav.viewedWeek = function () {
    var me = Store.me();
    if (me.viewedWeek) return me.viewedWeek;
    var cur = Time.currentWeek(me);
    return cur || 1;
  };
  window.WeekNav = WeekNav;
})();
