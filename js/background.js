/* background.js - the living background: columns of connected grey blocks that slide like a conveyor, with light
   rays falling across them from outside. When one block slides down, everything stacked in its column slides with it
   (a chain reaction), and a block leaving one end re-enters at the other, so blocks never overlap.
   Once the window has classes the sliding becomes slow and rare. The light rays sit behind the schedule and never
   touch it. */
(function () {
  var canvas = document.getElementById('bg');
  var ctx = canvas.getContext && canvas.getContext('2d');
  var GAP = 3;
  var COL_W = [64, 84, 84, 110, 150, 200];
  var BLOCK_H = [34, 46, 60, 60, 84, 110, 140];
  var MAX_H = 140;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var STONES = ['granite', 'slate', 'basalt', 'marble', 'granite', 'slate'];
  var patterns = {};
  var cols = [], calm = false, W = 0, H = 0, ease = 0, last = 0;

  // load the stone textures (tiles); until a texture has loaded its blocks are drawn in a plain grey
  ['granite', 'slate', 'basalt', 'marble'].forEach(function (name) {
    var img = new Image();
    img.onload = function () { if (ctx) patterns[name] = ctx.createPattern(img, 'repeat'); };
    img.src = 'css/stone-' + name + '.svg';
  });

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = [];
    var x = 0;
    while (x < W) {
      var cw = pick(COL_W);
      if (W - x - cw < 50) cw = W - x;
      // a column's base shade: cool greys from graphite to light stone
      var stone = pick(STONES), base = rand(15, 36);
      var blocks = [], total = 0;
      while (total < H + 720) { // long enough that blocks only wrap while out of view
        var h = pick(BLOCK_H);
        // each block is its own cut of stone: a random window onto the texture, and a little lighter or darker
        blocks.push({ h: h, l: base + rand(-6, 6), ox: Math.floor(rand(0, 512)), oy: Math.floor(rand(0, 512)), dark: rand(0, 0.38) });
        total += h;
      }
      cols.push({
        x: x, w: cw, blocks: blocks, stone: stone, y0: -MAX_H - rand(0, 80),
        dir: Math.random() < 0.5 ? 1 : -1,           // some columns fall, some rise
        wait: rand(0.5, 6), anim: null
      });
      x += cw;
    }
  }

  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // advance one column's slide: wait, then slide the whole stack by one block, then re-order the stack
  function step(c, dt) {
    if (!c.anim) {
      c.wait -= dt;
      if (c.wait > 0) return 0;
      var d = c.dir === 1 ? c.blocks[c.blocks.length - 1].h : c.blocks[0].h;
      c.anim = { t: 0, d: d, dur: rand(0.9, 1.5) * (reduce ? 2 : 1) };
    }
    c.anim.t += dt / c.anim.dur;
    if (c.anim.t >= 1) {
      // done: move the block that left one end to the other end, and wait before the next slide
      if (c.dir === 1) { var b = c.blocks.pop(); c.blocks.unshift(b); }
      else { var f = c.blocks.shift(); c.blocks.push(f); }
      c.anim = null;
      c.wait = rand(2, 7) * (1 + ease * 4); // calm: much rarer
      return 0;
    }
    return c.dir * c.anim.d * easeInOut(c.anim.t);
  }

  function rays(now) {
    var t = now / 1000;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var shafts = [
      { x: 0.10, w: 160, a: 0.055, s: 0.0 }, { x: 0.30, w: 70, a: 0.04, s: 1.7 },
      { x: 0.58, w: 220, a: 0.05, s: 3.1 }, { x: 0.82, w: 90, a: 0.04, s: 4.6 }
    ];
    shafts.forEach(function (r) {
      var sway = Math.sin(t * 0.12 + r.s) * 26;
      var x0 = r.x * W + sway, skew = H * 0.55;
      var g = ctx.createLinearGradient(x0, 0, x0 + skew, H);
      g.addColorStop(0, 'rgba(235,240,247,' + r.a + ')');
      g.addColorStop(0.7, 'rgba(235,240,247,' + (r.a * 0.35) + ')');
      g.addColorStop(1, 'rgba(235,240,247,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x0, 0); ctx.lineTo(x0 + r.w, 0); ctx.lineTo(x0 + r.w + skew, H); ctx.lineTo(x0 + skew, H); ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
  }

  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
    ease += ((calm ? 1 : 0) - ease) * Math.min(1, dt * 1.2);
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < cols.length; i++) {
      var c = cols[i];
      var off = step(c, dt);
      var y = c.y0 + off;
      for (var j = 0; j < c.blocks.length; j++) {
        var b = c.blocks[j];
        if (y + b.h > -4 && y < H + 4) {
          var bx = c.x + GAP / 2, by = y + GAP / 2, bw = c.w - GAP, bh = b.h - GAP;
          var pat = patterns[c.stone];
          if (pat) {
            // the stone texture moves with the block (it is clipped to the block, offset by its own window)
            ctx.save();
            roundRect(bx, by, bw, bh, 3); ctx.clip();
            ctx.translate(bx - b.ox, by - b.oy);
            ctx.fillStyle = pat; ctx.fillRect(b.ox, b.oy, bw, bh);
            ctx.restore();
            ctx.fillStyle = 'rgba(0,0,0,' + b.dark.toFixed(2) + ')';
            roundRect(bx, by, bw, bh, 3); ctx.fill();
          } else {
            ctx.fillStyle = 'hsl(214,7%,' + b.l.toFixed(1) + '%)';
            roundRect(bx, by, bw, bh, 3); ctx.fill();
          }
          // a soft gradient within the block: lighter at the top, darker at the bottom
          ctx.fillStyle = 'rgba(255,255,255,.045)'; ctx.fillRect(bx, by, bw, bh * 0.5);
          ctx.fillStyle = 'rgba(0,0,0,.10)'; ctx.fillRect(bx, by + bh * 0.5, bw, bh * 0.5);
          ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(bx + 2, by, Math.max(0, bw - 4), 1);
        }
        y += b.h;
      }
    }
    rays(now);
    requestAnimationFrame(frame);
  }

  window.Background = { setCalm: function (isCalm) { calm = !!isCalm; } };

  if (ctx) {
    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);
  }
})();
