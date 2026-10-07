/* animations.js - the "pop": a new class's block rises out of the surface, like a whack-a-mole, changing from
   grey to its colour as it comes up. Played when a class is joined or created. */
(function () {
  var Animations = {};

  Animations.pop = function (classId) {
    var cls = Store.classById(classId);
    var sessions = cls ? Store.sessionsOf(cls) : [];
    if (sessions.length) {
      DayView.selectedDay = sessions[0].day; // bring the class into view
      App.render();
    }
    Array.prototype.forEach.call(document.querySelectorAll('[data-class-id="' + classId + '"]'), function (el) {
      el.classList.remove('popping');
      void el.getBoundingClientRect(); // restart the animation
      el.classList.add('popping');
      setTimeout(function () { el.classList.remove('popping'); }, 1800);
    });
  };

  window.Animations = Animations;
})();
