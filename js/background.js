/* background.js - the living background: matte grey blocks of different shapes and sizes drift, rise and fall.
   Once the window has classes they settle into one calm, interlocking grid. */
(function () {
  var canvas = document.getElementById('bg');
  var ctx = canvas.getContext && canvas.getContext('2d');
  var GAP = 3;
  // matte greys, with a few cool, warm and green-grey tints for variety
  var PALETTE = ['#1f2225', '#272b2f', '#2f3439', '#383e44', '#444b52', '#2b3440', '#3a3633', '#2d3733', '#33303a', '#4a525a'];
  var ROW_H = [34, 46, 60, 60, 84, 110];
  var COL_W = [52, 70, 70, 96, 130, 170];
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var blocks = [], calm = false, W = 0, H = 0, last = 0, ease = 0; // ease: 0 = drifting, 1 = grid

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // The calm layout: rows of different heights, each filled with blocks of different widths.
    var cells = [], y = 0;
    while (y < H) {
      var rh = pick(ROW_H), x = 0;
      while (x < W) {
        var cw = pick(COL_W);
        if (W - x - cw < 40) cw = W - x;
        cells.push({ x: x, y: y, w: cw, h: rh });
        x += cw;
      }
      y += rh;
    }
    blocks = cells.slice(0, 1400).map(function (c) {
      var k = rand(0.75, 1.3);
      return {
        x: rand(-40, W), y: rand(-40, H), w: c.w * k, h: c.h * rand(0.75, 1.3),
        vx: rand(-5, 5), vy: rand(-20, 20), // px per second: some rise, some fall
        colour: pick(PALETTE), alpha: rand(0.45, 0.95),
        cell: c
      };
    });
  }

  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function mix(a, b, t) { return a + (b - a) * t; }

  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
    ease += ((calm ? 1 : 0) - ease) * Math.min(1, dt * 1.6);
    ctx.clearRect(0, 0, W, H);
    var speed = reduce ? 0.25 : 1;
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i], c = b.cell;
      b.x += b.vx * dt * speed * (1 - ease);
      b.y += b.vy * dt * speed * (1 - ease);
      if (b.x < -180) b.x = W + 10; if (b.x > W + 180) b.x = -10;
      if (b.y < -120) b.y = H + 10; if (b.y > H + 120) b.y = -10;
      var x = mix(b.x, c.x + GAP / 2, ease), y = mix(b.y, c.y + GAP / 2, ease);
      var w = mix(b.w, c.w - GAP, ease), h = mix(b.h, c.h - GAP, ease);
      ctx.globalAlpha = mix(b.alpha * 0.7, 0.9, ease);
      ctx.fillStyle = b.colour;
      roundRect(x, y, w, h, 3); ctx.fill();
      // a hairline highlight on the top edge: a raised, machined edge
      ctx.globalAlpha *= 0.5;
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      ctx.fillRect(x + 2, y, Math.max(0, w - 4), 1);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  window.Background = { setCalm: function (isCalm) { calm = !!isCalm; } };

  if (ctx) {
    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);
  }
})();
