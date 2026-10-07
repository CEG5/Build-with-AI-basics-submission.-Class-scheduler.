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
    var dayBoxes = Time.DAY_NAMES.map(function (n, i) {
      return '<label class="chip"><input type="checkbox" name="day" value="' + i + '"><span>' + n + '</span></label>';
    }).join('');
    open('<form method="dialog" class="form" id="create-form">' +
      '<h2>Create a class</h2>' +
      '<label>Class name<input name="name" maxlength="40" placeholder="Whatever you remember it by" required></label>' +
      '<div class="field"><span class="lbl">Days</span><div class="chips">' + dayBoxes + '</div></div>' +
      '<div class="row"><label>Starts<input type="time" name="start" value="09:00" required></label>' +
      '<label>Ends<input type="time" name="end" value="10:40" required></label></div>' +
      '<div class="field"><span class="lbl">Colour</span>' + swatches('colour', 'violet') + '</div>' +
      '<p class="error" id="create-error" hidden></p>' +
      '<div class="actions"><button type="button" class="ghost" data-close>Cancel</button><button type="submit" class="primary">Create</button></div>' +
      '</form>');
    var form = document.getElementById('create-form');
    form.querySelector('[data-close]').addEventListener('click', close);
    form.name.focus();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = document.getElementById('create-error');
      var days = Array.prototype.map.call(form.querySelectorAll('input[name=day]:checked'), function (x) { return parseInt(x.value, 10); });
      var s = Time.parse(form.start.value), en = Time.parse(form.end.value);
      var problem = '';
      if (!form.name.value.trim()) problem = 'Give the class a name.';
      else if (!days.length) problem = 'Pick at least one day.';
      else if (!(en > s)) problem = 'The end time must be after the start time.';
      if (problem) { err.textContent = problem; err.hidden = false; return; }
      var cls = Store.createClass({
        name: form.name.value.trim(),
        colour: form.querySelector('input[name=colour]:checked').value,
        forks: [{ label: '', note: '', days: days.map(function (d) { return { day: d, startMin: s, endMin: en }; }) }]
      });
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

  window.Forms = Forms;
})();
