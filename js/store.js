/* store.js - shared classes (localStorage) + this window's private note (sessionStorage).
   Every other file reads and writes data only through the Store object. */
(function () {
  var CLASSES_KEY = 'cb.classes';
  var ME_KEY = 'cb.me';
  var CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L: easy to read out loud

  var COLOURS = [
    { key: 'coral',   hex: '#FF5A5F' },
    { key: 'orange',  hex: '#FF9F1C' },
    { key: 'amber',   hex: '#FFD23F' },
    { key: 'lime',    hex: '#B6E92E' },
    { key: 'aqua',    hex: '#2EE6D6' },
    { key: 'sky',     hex: '#3FA9FF' },
    { key: 'violet',  hex: '#8B5CF6' },
    { key: 'magenta', hex: '#FF4FA3' }
  ];

  var Store = {
    COLOURS: COLOURS,
    saveFailed: false,
    listeners: []
  };

  function readJSON(storage, key, fallback) {
    try {
      var raw = storage.getItem(key);
      if (raw === null) return fallback;
      var v = JSON.parse(raw);
      return v === null || v === undefined ? fallback : v;
    } catch (e) {
      return fallback; // blocked or unreadable: start clean instead of crashing
    }
  }

  function writeJSON(storage, key, value) {
    try {
      storage.setItem(key, JSON.stringify(value));
      Store.saveFailed = false;
      return true;
    } catch (e) {
      Store.saveFailed = true;
      return false;
    }
  }

  Store.colourHex = function (key) {
    for (var i = 0; i < COLOURS.length; i++) if (COLOURS[i].key === key) return COLOURS[i].hex;
    return COLOURS[0].hex;
  };

  // ---- shared classes ----
  Store.classes = function () {
    var v = readJSON(localStorage, CLASSES_KEY, []);
    return Array.isArray(v) ? v.filter(function (c) { return c && typeof c === 'object' && c.id; }) : [];
  };
  Store.saveClasses = function (list) { return writeJSON(localStorage, CLASSES_KEY, list); };

  Store.classById = function (id) {
    var list = Store.classes();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  };

  // ---- this window's private note ----
  Store.me = function () {
    var m = readJSON(sessionStorage, ME_KEY, {});
    if (!m || typeof m !== 'object') m = {};
    if (!m.memberships || typeof m.memberships !== 'object') m.memberships = {};
    if (m.anchorWeek === undefined) m.anchorWeek = null;
    if (m.anchorDate === undefined) m.anchorDate = null;
    if (m.viewedWeek === undefined) m.viewedWeek = null;
    return m;
  };
  Store.saveMe = function (me) { return writeJSON(sessionStorage, ME_KEY, me); };

  // Classes this window can see, each with its role and the colour this window uses.
  // Memberships pointing at classes that no longer exist are dropped.
  Store.myClasses = function () {
    var me = Store.me();
    var out = [];
    var changed = false;
    var all = Store.classes();
    var byId = {};
    all.forEach(function (c) { byId[c.id] = c; });
    Object.keys(me.memberships).forEach(function (id) {
      var cls = byId[id];
      if (!cls) { delete me.memberships[id]; changed = true; return; }
      var m = me.memberships[id];
      out.push({
        cls: cls,
        role: m.role,
        colourKey: m.colour || cls.colour,
        colour: Store.colourHex(m.colour || cls.colour)
      });
    });
    if (changed) Store.saveMe(me);
    out.sort(function (a, b) { return (a.cls.createdAt || 0) - (b.cls.createdAt || 0); });
    return out;
  };

  Store.roleOf = function (classId) {
    var m = Store.me().memberships[classId];
    return m ? m.role : null;
  };

  // ---- codes ----
  function randomCode() {
    var s = '';
    for (var i = 0; i < 6; i++) s += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
    return s;
  }
  Store.makeCode = function (existing) {
    var taken = {};
    existing.forEach(function (c) { taken[c.code] = true; });
    var code;
    do { code = randomCode(); } while (taken[code]); // retry until unique
    return code;
  };
  Store.newId = function (prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  };

  // ---- actions ----
  // data: { name, colour, forks: [ {label, note, days:[{day,startMin,endMin}]} ] }
  Store.createClass = function (data) {
    var list = Store.classes();
    var cls = {
      id: Store.newId('c'),
      code: Store.makeCode(list),
      name: data.name,
      colour: data.colour,
      forks: data.forks,
      items: [],
      createdAt: Date.now()
    };
    list.push(cls);
    Store.saveClasses(list);
    var me = Store.me();
    me.memberships[cls.id] = { role: 'author', colour: cls.colour };
    Store.saveMe(me);
    return cls;
  };

  Store.joinClass = function (rawCode) {
    var code = String(rawCode || '').trim().toUpperCase();
    var found = null;
    Store.classes().forEach(function (c) { if (c.code === code) found = c; });
    if (!found) return { ok: false, error: 'Wrong code, please try a different one.' };
    var me = Store.me();
    if (me.memberships[found.id]) return { ok: false, error: "You're already in this class." };
    me.memberships[found.id] = { role: 'attendee', colour: found.colour };
    Store.saveMe(me);
    return { ok: true, cls: found };
  };

  Store.recolour = function (classId, colourKey) {
    var me = Store.me();
    if (me.memberships[classId]) {
      me.memberships[classId].colour = colourKey; // only this window's note
      Store.saveMe(me);
    }
  };

  Store.addItem = function (classId, item) {
    var list = Store.classes();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === classId) {
        item.id = Store.newId('i');
        list[i].items = list[i].items || [];
        list[i].items.push(item);
        Store.saveClasses(list);
        return item;
      }
    }
    return null;
  };

  Store.deleteItem = function (classId, itemId) {
    var list = Store.classes();
    list.forEach(function (c) {
      if (c.id === classId) c.items = (c.items || []).filter(function (it) { return it.id !== itemId; });
    });
    Store.saveClasses(list);
  };

  Store.endClass = function (classId) {
    var list = Store.classes().filter(function (c) { return c.id !== classId; });
    Store.saveClasses(list);
    var me = Store.me();
    delete me.memberships[classId];
    Store.saveMe(me);
  };

  // ---- change notification ----
  Store.onChange = function (fn) { Store.listeners.push(fn); };
  Store.notify = function () { Store.listeners.forEach(function (fn) { fn(); }); };

  // Another window changed the shared classes.
  window.addEventListener('storage', function (e) {
    if (e.key === CLASSES_KEY || e.key === null) Store.notify();
  });

  window.Store = Store;
})();
