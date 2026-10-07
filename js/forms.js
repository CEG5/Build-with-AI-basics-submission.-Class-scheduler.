/* forms.js - plus menu, create class, join class (add-item, class panel, end class come in later slices). */
(function () {
  var Forms = { onChange: function () {} };
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
  modal.addEventListener('close', function () { Forms.currentPanel = null; });
  Forms.open = open;
  Forms.close = close;
  Forms.esc = esc;

  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });

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
      '<label>Class code<input name="code" maxlength="6" autocomplete="off" autocapitalize="characters" placeholder="e.g. K7Q2MX" required></label>' +
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
    function daysHtml(p, defStart, defEnd) {
      return '<div class="day-rows">' + Time.DAY_NAMES.map(function (n, i) {
        return '<div class="day-row" data-day="' + i + '"><label class="chip"><input type="checkbox" name="' + p + '-day" value="' + i + '"><span>' + n + '</span></label>' +
          '<input type="time" name="' + p + '-start-' + i + '" value="' + defStart + '" disabled>' +
          '<em>to</em>' +
          '<input type="time" name="' + p + '-end-' + i + '" value="' + defEnd + '" disabled></div>';
      }).join('') + '</div>';
    }
    open('<form method="dialog" class="form" id="create-form">' +
      '<h2>Create a class</h2>' +
      '<label>Class name<input name="name" maxlength="40" placeholder="Whatever you remember it by" required></label>' +
      '<div class="field"><span class="lbl">Colour</span>' + swatches('colour', 'violet') + '</div>' +
      '<label class="toggle"><input type="checkbox" name="forks"> <span>It has a lecture and a practical</span></label>' +
      '<div id="fork-plain"><div class="field"><span class="lbl">Days and times</span>' + daysHtml('p0', '09:00', '10:40') + '</div></div>' +
      '<div id="fork-split" hidden>' +
        '<div class="fork-box"><div class="lbl big">Lecture</div>' +
        '<label>Short note<input name="note-0" maxlength="20" placeholder="e.g. Lecture"></label>' + daysHtml('f0', '09:00', '10:40') + '</div>' +
        '<div class="fork-box"><div class="lbl big">Practical</div>' +
        '<label>Short note<input name="note-1" maxlength="20" placeholder="e.g. Lab"></label>' + daysHtml('f1', '13:00', '14:40') + '</div>' +
      '</div>' +
      '<p class="error" id="create-error" hidden></p>' +
      '<div class="actions"><button type="button" class="ghost" data-close>Cancel</button><button type="submit" class="primary">Create</button></div>' +
      '</form>');
    var form = document.getElementById('create-form');
    form.querySelector('[data-close]').addEventListener('click', close);
    form.name.focus();

    // a day's time boxes only work once the day is ticked
    form.addEventListener('change', function (e) {
      var t = e.target;
      if (t.type === 'checkbox' && /-day$/.test(t.name)) {
        var row = t.closest('.day-row');
        Array.prototype.forEach.call(row.querySelectorAll('input[type=time]'), function (x) { x.disabled = !t.checked; });
      }
      if (t.name === 'forks') {
        document.getElementById('fork-plain').hidden = t.checked;
        document.getElementById('fork-split').hidden = !t.checked;
      }
    });

    // Reads one group of day rows. Returns {days} or {error}.
    function readDays(p) {
      var out = [];
      var boxes = form.querySelectorAll('input[name=' + p + '-day]:checked');
      for (var i = 0; i < boxes.length; i++) {
        var d = parseInt(boxes[i].value, 10);
        var s = Time.parse(form.elements[p + '-start-' + d].value), en = Time.parse(form.elements[p + '-end-' + d].value);
        if (isNaN(s) || isNaN(en)) return { error: 'Fill in the times for ' + Time.DAY_LONG[d] + '.' };
        if (!(en > s)) return { error: 'On ' + Time.DAY_LONG[d] + ' the end time must be after the start time.' };
        out.push({ day: d, startMin: s, endMin: en });
      }
      if (!out.length) return { error: 'Pick at least one day.' };
      return { days: out };
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = document.getElementById('create-error');
      var name = form.name.value.trim();
      if (!name) { err.textContent = 'Give the class a name.'; err.hidden = false; return; }
      var forks = [];
      if (form.elements.forks.checked) {
        var labels = ['Lecture', 'Practical'];
        for (var k = 0; k < 2; k++) {
          var r = readDays('f' + k);
          if (r.error) { err.textContent = labels[k] + ': ' + r.error; err.hidden = false; return; }
          forks.push({ label: labels[k], note: form.elements['note-' + k].value.trim() || labels[k], days: r.days });
        }
      } else {
        var r0 = readDays('p0');
        if (r0.error) { err.textContent = r0.error; err.hidden = false; return; }
        forks.push({ label: '', note: '', days: r0.days });
      }
      var cls = Store.createClass({ name: name, colour: form.querySelector('input[name=colour]:checked').value, forks: forks });
      Forms.showCode(cls);
      Forms.onChange({ created: cls.id });
    });
  };

  Forms.showCode = function (cls) {
    open('<div class="form"><h2>Class created</h2><p>Share this code with your classmates:</p>' +
      '<div class="code-big" id="code-big">' + esc(cls.code) + '</div>' +
      '<div class="actions"><button type="button" class="primary" data-close>Done</button></div></div>');
    modal.querySelector('[data-close]').addEventListener('click', close);
  };

  // ---- class panel (add item here; delete item / end class are added in a later slice) ----
  Forms.classPanel = function (classId) {
    var cls = Store.classById(classId);
    if (!cls) { close(); return; }
    var isAuthor = Store.roleOf(classId) === 'author';
    Forms.currentPanel = null;
    var html = '<div class="form panel-form"><h2>' + esc(cls.name) + '</h2>' +
      '<p class="muted">Code: <b class="code-inline">' + esc(cls.code) + '</b> • ' + (isAuthor ? "You're the rep" : "You're a member") + '</p>';
    html += '<div class="field"><span class="lbl">Your colour (only changes it for you)</span>' + swatches('mycolour', (Store.me().memberships[classId] || {}).colour || cls.colour) + '</div>';
    if (isAuthor) html += Forms.itemFormHtml();
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
      return '<li><span><b>' + esc(DayView.itemName(it)) + '</b> • week ' + it.weekNo + ', ' + Time.DAY_NAMES[it.day] + ' ' + Time.fmt(it.startMin) + '</span>' +
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

  Forms.itemFormHtml = function () {
    var dayOpts = Time.DAY_LONG.map(function (n, i) { return '<option value="' + i + '">' + n + '</option>'; }).join('');
    return '<form id="item-form" class="item-form">' +
      '<div class="lbl big">Add an item</div>' +
      '<div class="row"><label>Type<select name="type"><option value="quiz">Quiz</option><option value="midterm">Midterm</option>' +
      '<option value="final">Final</option><option value="other">Other</option></select></label>' +
      '<label>Week<input type="number" name="week" min="1" max="60" value="' + WeekNav.viewedWeek() + '" required></label></div>' +
      '<div class="row"><label>Day<select name="day">' + dayOpts + '</select></label>' +
      '<label>Time<input type="time" name="time" value="09:00" required></label></div>' +
      '<label id="title-wrap" hidden>Title<input name="title" maxlength="40" placeholder="e.g. Expo"></label>' +
      '<label id="desc-wrap">Description<textarea name="desc" rows="2" maxlength="200" placeholder="Material covered, details..."></textarea></label>' +
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
    form.type.addEventListener('change', sync);
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
