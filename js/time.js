/* time.js - day / minute / week / date maths. The week runs Sunday to Thursday (5 columns, day 0-4). */
(function () {
  var DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
  var DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAY_MS = 86400000;

  var Time = { DAY_NAMES: DAY_NAMES, DAY_LONG: DAY_LONG, DAY_MIN: 1440 };

  // "14:30" -> 870
  Time.parse = function (hhmm) {
    var p = String(hhmm || '').split(':');
    if (p.length < 2) return NaN;
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  };

  // 870 -> "14:30" (value for <input type=time>)
  Time.toInput = function (min) {
    var h = Math.floor(min / 60), m = min % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  };

  // 870 -> "2:30 PM"
  Time.fmt = function (min) {
    var h = Math.floor(min / 60) % 24, m = min % 60;
    var ap = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + (m ? ':' + (m < 10 ? '0' : '') + m : ':00') + ' ' + ap;
  };

  // 100 -> "1h 40m"
  Time.fmtDuration = function (min) {
    var h = Math.floor(min / 60), m = min % 60;
    if (!h) return m + 'm';
    return h + 'h' + (m ? ' ' + m + 'm' : '');
  };

  // Which of Sun..Thu is today? Friday / Saturday fall back to Sunday (day 0).
  Time.todayIndex = function () {
    var d = new Date().getDay(); // 0 = Sunday
    return d >= 0 && d <= 4 ? d : 0;
  };

  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

  // The Sunday that starts the week containing date d.
  function sundayOf(d) {
    var s = startOfDay(d);
    s.setDate(s.getDate() - s.getDay());
    return s;
  }

  // The week number the device clock says "this week" is, from the number the user set.
  // me.anchorWeek = N as of me.anchorDate (ISO date).
  Time.currentWeek = function (me) {
    if (me.anchorWeek === null || me.anchorWeek === undefined || !me.anchorDate) return null;
    var anchor = sundayOf(new Date(me.anchorDate));
    var now = sundayOf(new Date());
    var weeks = Math.round((now - anchor) / (7 * DAY_MS));
    return me.anchorWeek + weeks;
  };

  // Real date of (week N, day D 0-4). null when the week has not been set.
  Time.dateOf = function (me, weekNo, day) {
    if (me.anchorWeek === null || me.anchorWeek === undefined || !me.anchorDate) return null;
    var anchor = sundayOf(new Date(me.anchorDate));
    var d = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + (weekNo - me.anchorWeek) * 7 + day);
    return d;
  };

  // Whole days from today until date d (0 = today, negative = past).
  Time.daysUntil = function (d) {
    return Math.round((startOfDay(d) - startOfDay(new Date())) / DAY_MS);
  };

  Time.fmtDate = function (d) { return MONTHS[d.getMonth()] + ' ' + d.getDate(); };

  window.Time = Time;
})();
