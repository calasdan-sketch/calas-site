/* neural.js — floating neural-net background for the Dev Tools pages (Calas Automations, 2026-11-05).
   One fixed canvas behind the page content. Nodes drift slowly and link to near neighbours;
   over the dark hero they glow light blue, over the white body they are faint brand blue.
   Respects reduced motion (draws one still frame), pauses when the tab is hidden. */
(function () {
  if (!window.requestAnimationFrame || !document.createElement('canvas').getContext) return;
  var c = document.createElement('canvas');
  c.id = 'neural'; c.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(c, document.body.firstChild);
  var ctx = c.getContext('2d');
  var hero = document.querySelector('.hero');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqDark = window.matchMedia('(prefers-color-scheme: dark)');
  var W = 0, H = 0, dpr = 1, nodes = [], LINK = 150, mouse = null, raf = 0, running = false;

  function darkBody() {
    var t = document.documentElement.getAttribute('data-theme');
    return t === 'dark' || (t !== 'light' && mqDark.matches);
  }
  function seed() {
    var n = Math.round(Math.min(120, Math.max(36, (W * H) / 13000)));
    nodes = [];
    for (var i = 0; i < n; i++) {
      nodes.push({ x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
        r: 1.1 + Math.random() * 1.7, ph: Math.random() * 6.283,
        gold: Math.random() < 0.08 });
    }
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
    if (!running) draw(0);
  }
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    var hb = hero ? hero.getBoundingClientRect().bottom : 0;
    var dark = darkBody();
    var bodyLine = dark ? '124,196,234' : '21,95,135';
    var bodyLineA = dark ? 0.22 : 0.14, bodyNodeA = dark ? 0.55 : 0.32;
    var i, j, a, b, dx, dy, d, al, over;
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j]; dx = a.x - b.x; dy = a.y - b.y;
        if (dx > LINK || dx < -LINK || dy > LINK || dy < -LINK) continue;
        d = Math.sqrt(dx * dx + dy * dy); if (d > LINK) continue;
        al = 1 - d / LINK;
        over = (a.y + b.y) / 2 < hb;
        ctx.strokeStyle = over ? 'rgba(124,196,234,' + (al * 0.6).toFixed(3) + ')'
                               : 'rgba(' + bodyLine + ',' + (al * bodyLineA).toFixed(3) + ')';
        ctx.lineWidth = over ? 1.1 : 0.9;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      if (mouse) {
        dx = a.x - mouse.x; dy = a.y - mouse.y; d = Math.sqrt(dx * dx + dy * dy);
        if (d < 190) {
          al = 1 - d / 190; over = a.y < hb;
          ctx.strokeStyle = over ? 'rgba(240,193,113,' + (al * 0.55).toFixed(3) + ')'
                                 : 'rgba(' + bodyLine + ',' + (al * 0.3).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i]; over = a.y < hb;
      var pulse = 0.65 + 0.35 * Math.sin(t / 900 + a.ph);
      if (a.gold) ctx.fillStyle = 'rgba(240,193,113,' + ((over ? 0.95 : 0.6) * pulse).toFixed(3) + ')';
      else ctx.fillStyle = over ? 'rgba(170,220,245,' + (0.85 * pulse).toFixed(3) + ')'
                                : 'rgba(' + bodyLine + ',' + (bodyNodeA * pulse).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r * (a.gold ? 1.35 : 1), 0, 6.283); ctx.fill();
    }
  }
  function step(t) {
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i]; a.x += a.vx; a.y += a.vy;
      if (a.x < -20) a.x = W + 20; else if (a.x > W + 20) a.x = -20;
      if (a.y < -20) a.y = H + 20; else if (a.y > H + 20) a.y = -20;
    }
    draw(t);
    raf = requestAnimationFrame(step);
  }
  function start() {
    if (running || mqReduce.matches || document.hidden) { if (!running) draw(0); return; }
    running = true; raf = requestAnimationFrame(step);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', function () { if (!running) draw(0); }, { passive: true });
  window.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') mouse = { x: e.clientX, y: e.clientY }; }, { passive: true });
  document.addEventListener('pointerleave', function () { mouse = null; });
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  if (mqReduce.addEventListener) mqReduce.addEventListener('change', function () { mqReduce.matches ? (stop(), draw(0)) : start(); });
  resize(); start();
})();
