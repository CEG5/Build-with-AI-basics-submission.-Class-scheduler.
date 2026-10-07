/* animations.js - the join animation: the new card slides in and the block morphs from muted to bright with a glow. */
(function () {
  var Animations = {};

  Animations.joined = function (classId) {
    // bring the joined class into view: its first day with a block
    var cls = Store.classById(classId);
    if (cls && cls.forks && cls.forks[0] && cls.forks[0].days[0]) {
      DayView.selectedDay = cls.forks[0].days[0].day;
      App.render();
      Array.prototype.forEach.call(document.querySelectorAll('[data-class-id="' + classId + '"]'), function (el) {
        el.classList.add('joining');
        setTimeout(function () { el.classList.remove('joining'); }, 2200);
      });
    }
  };

  window.Animations = Animations;
})();
