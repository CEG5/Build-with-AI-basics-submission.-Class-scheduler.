/* forms.js - plus menu, create and join, the class panel (schedule, add item, items, end class). */
(function () {
  var Forms = { onChange: function () {}, currentPanel: null };
  var modal = document.getElementById('modal');

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function open(html) {
    modal.innerHTML = html;
    if (!modal.open) modal.showModal();
  }
  function close() { if (modal.open) modal.close(); }
  Forms.open = open;
  Forms.close = close;
  Forms.esc = esc;

  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  modal.addEventListener('close', function () { Forms.currentPanel = null; });

  Forms.toast = function (text) {
    var t = document.getElementById('toast');
    t.textContent = text;
    t.hidden = false;
    clearTimeout(Forms._tt);
    Forms._tt = setTimeout(function () { t.hidden = true; }, 2600);
  };

  function swatches(name, selected) {
    return '<div class="swatches" role="radiogroup">' + Store.COLOURS.map(function (c) {
      return '<label class="swatch" title="' + c.key + '"><input type="radio" name="' + name + '" value="' + c.key + '"' +
             (c.key === selected ? ' checked' : '') + '><span style="background:' + c.hex + '"></span></label>';
    }).join('') + '</div>';
  }
  Forms.swatches = swatches;

  // ---- session editor: one row per weekly session (day, start, end, optional note), plus an add button ----
  var Sessions = {
    row: function (s) {
      var opts = Time.DAY_LONG.map(function (n, i) { return '<option value="' + i + '"' + (i === s.day ? ' selected' : '') + '>' + n + '</option>'; }).join('');
      return '<div class="s-row">' +
        '<select class="s-day" aria-label="Day">' + opts + '</select>' +
        '<input type="time" class="s-start" aria-label="Starts" value="' + Time.toInput(s.startMin) + '">' +
        '<span class="s-to">to</span>' +
        '<input type="time" class="s-end" aria-label="Ends" value="' + Time.toInput(s.endMin) + '">' +
        '<button type="button" class="s-del" aria-label="Remove this day">&times;</button>' +
        '<input class="s-note" maxlength="24" placeholder="Note, e.g. Lecture or Lab (optional)" value="' + esc(s.note || '') + '">' +
        '</div>';
    },
    html: function (sessions) {
      return '<div class="s-list">' + sessions.map(Sessions.row).join('') + '</div>' +
        '<button type="button" class="s-add">+ Add another day</button>';
    },
    wire: function (root) {
      var list = root.querySelector('.s-list');
      function sync() {
        var rows = list.querySelectorAll('.s-row');
        Array.prototype.forEach.call(rows, function (r) { r.querySelector('.s-del').hidden = rows.length < 2; });
      }
      root.querySelector('.s-add').addEventListener('click', function () {
        var rows = list.querySelectorAll('.s-row');
        var last = rows[rows.length - 1];
        var s = { day: 0, startMin: 540, endMin: 640, note: '' };
        if (last) { // start from the previous row: next day, same times
          s.day = Math.min(4, parseInt(last.querySelector('.s-day').value, 10) + 1);
          s.startMin = Time.parse(last.querySelector('.s-start').value) || s.startMin;
          s.endMin = Time.parse(last.querySelector('.s-end').value) || s.endMin;
        }
        list.insertAdjacentHTML('beforeend', Sessions.row(s));
        sync();
      });
      list.addEventListener('click', function (e) {
        var del = e.target.closest('.s-del');
        if (del && list.querySelectorAll('.s-row').length > 1) { del.closest('.s-row').remove(); sync(); }
      });
      sync();
    },
    // Returns {sessions} or {error}.
    read: function (root) {
      var out = [], rows = root.querySelectorAll('.s-row');
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var day = parseInt(r.querySelector('.s-day').value, 10);
        var s = Time.parse(r.querySelector('.s-start').value), e = Time.parse(r.querySelector('.s-end').value);
        if (isNaN(s) || isNaN(e)) return { error: 'Fill in the times for ' + Time.DAY_LONG[day] + '.' };
        if (!(e > s)) return { error: 'On ' + Time.DAY_LONG[day] + ' the end time must be after the start time.' };
        out.push({ day: day, startMin: s, endMin: e, note: r.querySelector('.s-note').value.trim() });
      }
      if (!out.length) return { error: 'Add at least one day.' };
      return { sessions: out };
    }
  };

  // ---- plus menu ----
  var plusBtn = document.getElementById('plus-btn');
  var plusMenu = document.getElementById('plus-menu');
  plusBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    plusMenu.hidden = !plusMenu.hidden;
    plusBtn.classList.toggle('open', !plusMenu.hidden);
  });
  document.addEventListener('click', function () { plusMenu.hidden = true; plusBtn.classList.remove('open'); });
  plusMenu.addEventListener('click', function (e) {
    var a = e.target.getAttribute('data-action');
    if (a === 'join') Forms.joinForm();
    if (a === 'create') Forms.createForm();
  });

  // ---- join ----
  Forms.joinForm = function () {
    open('<form method="dialog" class="form" id="join-form">' +
      '<h2>Join a class</h2>' +
      '<label>Class code<input name="code" maxlength="6" autocomplete="off" autocapitalize="characters" placeholder="Enter the six-character code" required></label>' +
      '<p class="error" id="join-error" hidden></p>' +
      '<div class="actions"><button type="button" class="ghost" data-close>Cancel</button><button type="submit" class="primary">Join</button></div>' +
      '</form>');
    var form = document.getElementById('join-form');
    form.querySelector('[data-close]').addEventListener('click', close);
    form.code.focus();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var res = Store.joinClass(form.code.value);
      var err = document.getElementById('join-error');
      if (!res.ok) { err.textContent = res.error; err.hidden = false; return; }
      close();
      Forms.onChange({ joined: res.cls.id });
    });
  };

  // ---- create ----
  Forms.createForm = function () {
    open('<form method="dialog" class="form" id="create-form">' +
      '<h2>Create a class</h2>' +
      '<label>Course title<input name="name" maxlength="40" placeholder="Course title" required></label>' +
      '<div class="field"><span class="lbl">Colour</span>' + swatches('colour', 'sapphire') + '</div>' +
      '<div class="field" id="schedule-field"><span class="lbl">Schedule</span>' +
        Sessions.html([{ day: 0, startMin: 540, endMin: 640, note: '' }]) + '</div>' +
      '<p class="error" id="create-error" hidden></p>' +
      '<div class="actions"><button type="button" class="ghost" data-close>Cancel</button><button type="submit" class="primary">Create</button></div>' +
      '</form>');
    var form = document.getElementById('create-form');
    form.querySelector('[data-close]').addEventListener('click', close);
    Sessions.wire(document.getElementById('schedule-field'));
    form.name.focus();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = document.getElementById('create-error');
      var name = form.name.value.trim();
      if (!name) { err.textContent = 'Enter the course title.'; err.hidden = false; return; }
      var r = Sessions.read(document.getElementById('schedule-field'));
      if (r.error) { err.textContent = r.error; err.hidden = false; return; }
      var cls = Store.createClass({ name: name, colour: form.querySelector('input[name=colour]:checked').value, sessions: r.sessions });
      Forms.showCode(cls);
      Forms.onChange({ created: cls.id });
    });
  };

  Forms.showCode = function (cls) {
    open('<div class="form"><h2>Class created</h2><p class="muted">Share this code with your classmates.</p>' +
      '<div class="code-big" id="code-big">' + esc(cls.code) + '</div>' +
      '<div class="actions"><button type="button" class="primary" data-close>Done</button></div></div>');
    modal.querySelector('[data-close]').addEventListener('click', close);
  };

  // ---- class panel ----
  Forms.classPanel = function (classId) {
    var cls = Store.classById(classId);
    if (!cls) { close(); return; }
    var isAuthor = Store.roleOf(classId) === 'author';
    Forms.currentPanel = null;
    var html = '<div class="form panel-form"><h2>' + esc(cls.name) + '</h2>' +
      '<p class="muted">Code <b class="code-inline">' + esc(cls.code) + '</b> · ' + (isAuthor ? "You're the rep" : "You're a member") + '</p>';
    html += '<div class="field"><span class="lbl">Your colour (only changes it for you)</span>' + swatches('mycolour', (Store.me().memberships[classId] || {}).colour || cls.colour) + '</div>';
    if (isAuthor) {
      html += '<div class="section" id="schedule-section"><div class="lbl big">Schedule</div>' + Sessions.html(Store.sessionsOf(cls)) +
        '<p class="error" id="schedule-error" hidden></p>' +
        '<div class="actions"><button type="button" class="ghost" id="save-schedule">Save schedule</button></div></div>';
      html += Forms.itemFormHtml(cls);
    }
    html += '<div id="panel-items"></div>';
    html += '<div class="actions">' + (isAuthor ? '<button type="button" class="danger" id="end-class">End class</button>' : '') +
      '<button type="button" class="ghost" data-close>Close</button></div></div>';
    open(html);
    Forms.currentPanel = classId;
    modal.querySelector('[data-close]').addEventListener('click', close);
    modal.querySelector('.swatches').addEventListener('change', function (e) {
      Store.recolour(classId, e.target.value);
      Forms.onChange({ recoloured: classId });
    });
    if (isAuthor) {
      var sec = document.getElementById('schedule-section');
      Sessions.wire(sec);
      document.getElementById('save-schedule').addEventListener('click', function () {
        var err = document.getElementById('schedule-error');
        var r = Sessions.read(sec);
        if (r.error) { err.textContent = r.error; err.hidden = false; return; }
        err.hidden = true;
        Store.updateClass(classId, { sessions: r.sessions });
        Forms.onChange({ scheduleChanged: classId });
        Forms.toast('Schedule saved.');
      });
      Forms.wireItemForm(classId);
      document.getElementById('end-class').addEventListener('click', function () { Forms.confirmEnd(classId); });
    }
    Forms.renderPanelItems(classId);
  };

  // Red "end class" asks first; ending deletes the class for everyone who has the code.
  Forms.confirmEnd = function (classId) {
    var cls = Store.classById(classId);
    if (!cls) return;
    open('<div class="form"><h2>End "' + esc(cls.name) + '"?</h2>' +
      '<p>This will delete it for everyone who has the code. Are you sure?</p>' +
      '<div class="actions"><button type="button" class="ghost" id="end-no">Cancel</button>' +
      '<button type="button" class="danger" id="end-yes">End class</button></div></div>');
    document.getElementById('end-no').addEventListener('click', function () { Forms.classPanel(classId); });
    document.getElementById('end-yes').addEventListener('click', function () {
      Store.endClass(classId);
      close();
      Forms.onChange({ ended: classId });
    });
  };

  Forms.renderPanelItems = function (classId) {
    var el = document.getElementById('panel-items');
    var cls = Store.classById(classId);
    if (!el || !cls) return;
    var isAuthor = Store.roleOf(classId) === 'author';
    var items = (cls.items || []).slice().sort(function (a, b) { return a.weekNo - b.weekNo || a.day - b.day || a.startMin - b.startMin; });
    if (!items.length) { el.innerHTML = '<p class="muted">No items yet.</p>'; return; }
    el.innerHTML = '<div class="lbl">Items</div><ul class="item-list">' + items.map(function (it) {
      return '<li><span><b>' + esc(DayView.itemName(it)) + '</b> · week ' + it.weekNo + ', ' + Time.DAY_NAMES[it.day] + ' ' + Time.fmt(it.startMin) + '</span>' +
        (isAuthor ? '<button type="button" class="del" data-item="' + it.id + '" aria-label="Delete item">&times;</button>' : '') + '</li>';
    }).join('') + '</ul>';
    Array.prototype.forEach.call(el.querySelectorAll('.del'), function (b) {
      b.addEventListener('click', function () {
        Store.deleteItem(classId, b.getAttribute('data-item'));
        Forms.onChange({ itemDeleted: true });
        Forms.renderPanelItems(classId);
      });
    });
  };

  // ---- add item ----
  Forms.itemFormHtml = function (cls) {
    var sessions = Store.sessionsOf(cls);
    var first = sessions[0] || { day: 0, startMin: 540 };
    var dayOpts = Time.DAY_LONG.map(function (n, i) { return '<option value="' + i + '"' + (i === first.day ? ' selected' : '') + '>' + n + '</option>'; }).join('');
    return '<form id="item-form" class="item-form section">' +
      '<div class="lbl big">Add an item</div>' +
      '<div class="row"><label>Type<select name="type"><option value="quiz">Quiz</option><option value="midterm">Midterm</option>' +
      '<option value="final">Final</option><option value="other">Other</option></select></label>' +
      '<label>Week<input type="number" name="week" min="1" max="60" value="' + WeekNav.viewedWeek() + '" required></label></div>' +
      '<div class="row"><label>Day<select name="day">' + dayOpts + '</select></label>' +
      '<label>Time<input type="time" name="time" value="' + Time.toInput(first.startMin) + '" required></label></div>' +
      '<p class="hint" id="day-hint" hidden>There is no class on this day, so the item will appear on its own.</p>' +
      '<label id="title-wrap" hidden>Title<input name="title" maxlength="40" placeholder="e.g. Expo"></label>' +
      '<label id="desc-wrap">Description<textarea name="desc" rows="2" maxlength="200" placeholder="Material covered, details"></textarea></label>' +
      '<div class="field" id="imp-wrap"><span class="lbl">How important is it?</span>' +
      '<div class="slider-wrap"><input type="range" name="importance" min="0" max="100" value="40">' +
      '<div class="marker" style="left:44.4%"><i></i><span>typical midterm</span></div></div>' +
      '<div class="slider-ends"><span>Assignment</span><span>As important as a final</span></div></div>' +
      '<p class="error" id="item-error" hidden></p>' +
      '<div class="actions"><button type="submit" class="primary">Apply</button></div></form>';
  };

  Forms.wireItemForm = function (classId) {
    var form = document.getElementById('item-form');
    function sync() {
      var t = form.type.value;
      document.getElementById('imp-wrap').hidden = !(t === 'quiz' || t === 'other');
      document.getElementById('title-wrap').hidden = t !== 'other';
      document.getElementById('desc-wrap').hidden = t === 'midterm' || t === 'final';
    }
    // Picking a day fills in that day's class time, so the item lines up with the class by default.
    function syncDay() {
      var cls = Store.classById(classId);
      var day = parseInt(form.day.value, 10), match = null;
      Store.sessionsOf(cls).forEach(function (s) { if (!match && s.day === day) match = s; });
      if (match) form.time.value = Time.toInput(match.startMin);
      document.getElementById('day-hint').hidden = !!match;
    }
    form.type.addEventListener('change', sync);
    form.day.addEventListener('change', syncDay);
    sync();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = document.getElementById('item-error');
      var t = form.type.value;
      var week = parseInt(form.week.value, 10);
      var start = Time.parse(form.time.value);
      if (!(week >= 1) || isNaN(start)) { err.textContent = 'Pick a week and a time.'; err.hidden = false; return; }
      if (t === 'other' && !form.title.value.trim()) { err.textContent = 'Give it a title.'; err.hidden = false; return; }
      err.hidden = true;
      Store.addItem(classId, {
        type: t, weekNo: week, day: parseInt(form.day.value, 10), startMin: start,
        importance: (t === 'quiz' || t === 'other') ? parseInt(form.importance.value, 10) / 100 : null,
        title: t === 'other' ? form.title.value.trim() : '',
        description: (t === 'quiz' || t === 'other') ? form.desc.value.trim() : ''
      });
      // jump this window's views to the item's week and day so the carve is visible right away
      var me = Store.me(); me.viewedWeek = week; Store.saveMe(me);
      DayView.selectedDay = parseInt(form.day.value, 10);
      Forms.onChange({ itemAdded: true });
      Forms.renderPanelItems(classId);
      Forms.toast('Applied.');
    });
  };

  window.Forms = Forms;
})();
