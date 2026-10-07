/* background.js - the living background: rounded blocks drift, rise and fall like time passing at university.
   Once the window has classes they ease into one calm, interlocking grid. */
(function () {
  var canvas = document.getElementById('bg');
  var ctx = canvas.getContext && canvas.getContext('2d');
  var CELL_W = 96, CELL_H = 60, GAP = 6;
  var PALETTE = ['#163832', '#235347', '#1b4339', '#2d6a5a', '#8EB69B', '#0f302b'];
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var blocks = [], calm = false, W = 0, H = 0, cols = 0, rows = 0, last = 0, ease = 0; // ease: 0 = drifting, 1 = grid

  function rand(a, b) { return a + Math.random() * (b - a); }

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / CELL_W) + 1; rows = Math.ceil(H / CELL_H) + 1;
    var n = Math.min(cols * rows, 900);
    blocks = [];
    for (var i = 0; i < n; i++) {
      var col = i % cols, row = Math.floor(i / cols);
      var w = rand(44, 120), h = rand(26, 74);
      blocks.push({
        x: rand(0, W), y: rand(0, H), w: w, h: h, fw: w, fh: h,
        vx: rand(-6, 6), vy: rand(-22, 22), // px per second: some rise, some fall
        colour: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        alpha: rand(0.35, 0.8),
        gx: col * CELL_W + GAP / 2, gy: row * CELL_H + GAP / 2,
        gc: PALETTE[(col + row * 2) % PALETTE.length]
      });
    }
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
    // ease the whole field toward the grid (or away from it)
    var target = calm ? 1 : 0;
    ease += (target - ease) * Math.min(1, dt * 1.6);
    ctx.clearRect(0, 0, W, H);
    var speed = reduce ? 0.25 : 1;
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      b.x += b.vx * dt * speed * (1 - ease);
      b.y += b.vy * dt * speed * (1 - ease);
      if (b.x < -130) b.x = W + 10; if (b.x > W + 130) b.x = -10;
      if (b.y < -90) b.y = H + 10; if (b.y > H + 90) b.y = -10;
      // while calm the free position also relaxes to the grid cell so the change is smooth both ways
      var gw = CELL_W - GAP, gh = CELL_H - GAP;
      var x = mix(b.x, b.gx, ease), y = mix(b.y, b.gy, ease);
      var w = mix(b.w, gw, ease), h = mix(b.h, gh, ease);
      if (calm) { b.x += (b.gx - b.x) * Math.min(1, dt * 0.8); b.y += (b.gy - b.y) * Math.min(1, dt * 0.8); }
      ctx.globalAlpha = mix(b.alpha * 0.55, 0.5, ease);
      ctx.fillStyle = ease > 0.5 ? b.gc : b.colour;
      roundRect(x, y, w, h, 10); ctx.fill();
      // a soft top highlight and two studs, like a building block
      ctx.globalAlpha *= 0.5;
      ctx.fillStyle = 'rgba(218,241,222,.35)';
      ctx.beginPath(); ctx.arc(x + 14, y + 11, 3, 0, 6.2832); ctx.arc(x + 28, y + 11, 3, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  var Background = {
    setCalm: function (isCalm) { calm = !!isCalm; }
  };

  if (ctx) {
    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);
  }
  window.Background = Background;
})();
