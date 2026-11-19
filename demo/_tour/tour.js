/* Calas guided tour: one engine shared by every product demo (/demo/<app>/).
 *
 * A demo page builds its own working mock of the app, then calls:
 *
 *   CalasTour.start({
 *     lines: ["...", ...],          // narration, one line per step (also the captions)
 *     durs:  [7.2, ...],            // seconds per clip (fallback timing if audio is blocked)
 *     audioBase: "narration/step-", // step-0.mp3, step-1.mp3, ...
 *     script: function (t) {        // the walkthrough, as a promise chain
 *       return t.point("#send", 0)
 *         .then(function () { t.tap("#send"); return t.sleep(1500); })
 *         .then(function () { return t.point(".row", 1, { avoid: "#total" }); });
 *     },
 *     end: {                        // the card shown when the tour finishes
 *       name: "Quote Me", does: "One line on what it does.", offer: "The price line.",
 *       terms: "Optional second line (trial or refund wording).",
 *       cta: { label: "Start your 14-day free trial", href: "/quote-me/app/?signup=1" }
 *     },
 *     onStart, onReplay, onEnd      // optional hooks (onEnd runs on finish and on skip)
 *   });
 *
 * point(target, i, opts): opts.px / opts.py pick the spot inside the target (0..1),
 * opts.avoid is a selector (or list) of extra elements the caption must not cover.
 *
 * Behaviour (2026-09-29, owner: "you don't have to press play, it doesn't stutter"):
 *  - Starts by itself shortly after the page loads. Browsers never allow sound
 *    before the visitor touches the page, so it starts with captions only and a
 *    "Turn on voice" button; the first click or key press anywhere turns the
 *    voice on from the current step.
 *  - Every clip is fully downloaded before the tour starts, so nothing pauses
 *    mid-sentence waiting for audio.
 *  - "Skip tour" stops it; "Watch again" replays it. The demo stays clickable
 *    after the tour.
 *  - 2026-11-19: the caption is placed only after the page has stopped scrolling,
 *    is always kept inside the window, and moves out of the way of the thing it
 *    describes. A finished tour ends on a card with the offer and the next step.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cfg = null, clips = [], ui = {}, state = null;

  function el(tag, css, html) {
    var e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function q(sel) { return typeof sel === 'string' ? document.querySelector(sel) : sel; }

  /* ---------- audio ---------- */

  function loadClips() {
    clips = cfg.lines.map(function (_, i) {
      var a = new Audio();
      a.preload = 'auto';
      a.volume = 0.55;            // 2026-10-01 Owner: medium volume — audible but won't shock
      a.src = cfg.audioBase + i + '.mp3';
      return a;
    });
    // Resolve once every clip can play through, or after 6s (slow line: start anyway).
    var ready = clips.map(function (a) {
      return new Promise(function (res) {
        if (a.readyState >= 4) return res();
        a.addEventListener('canplaythrough', res, { once: true });
        a.addEventListener('error', res, { once: true });
        try { a.load(); } catch (e) { res(); }
      });
    });
    return Promise.race([Promise.all(ready), wait(6000)]);
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------- overlay ---------- */

  var BTN = 'position:fixed;z-index:10000;pointer-events:auto;background:#12212C;color:#fff;border:0;' +
    'border-radius:20px;padding:9px 16px;font:600 13.5px "IBM Plex Sans",-apple-system,sans-serif;' +
    'cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.3)';

  function buildOverlay() {
    ui.cursor = el('div', 'position:fixed;left:-40px;top:-40px;width:28px;height:28px;z-index:9999;pointer-events:none;' +
      'transition:left .6s cubic-bezier(.4,0,.2,1),top .6s cubic-bezier(.4,0,.2,1),transform .15s ease;' +
      'filter:drop-shadow(0 3px 8px rgba(0,0,0,.35))',
      '<svg viewBox="0 0 24 24" width="28" height="28"><path d="M4 2l16 7-6.5 2.2L11 18z" fill="#155F87" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>');
    ui.cap = el('div', 'position:fixed;left:-999px;top:-999px;z-index:9999;box-sizing:border-box;width:max-content;max-width:360px;pointer-events:none;' +
      'background:#12212C;color:#fff;font:15px/1.45 "IBM Plex Sans",-apple-system,sans-serif;padding:12px 16px;' +
      'border-radius:8px;box-shadow:0 8px 26px rgba(0,0,0,.32);transition:left .6s ease,top .6s ease,opacity .3s ease;opacity:0');
    ui.bar = el('div', 'position:fixed;left:0;bottom:0;height:4px;width:0;z-index:10000;background:#F0C171;transition:width .4s linear;pointer-events:none');
    ui.skip = el('button', BTN + ';bottom:18px;left:18px', 'Skip tour &#10005;');
    ui.voice = el('button', BTN + ';bottom:64px;left:18px;background:#155F87');
    ui.skip.addEventListener('click', stop);
    ui.voice.addEventListener('click', function (e) { e.stopPropagation(); setVoice(!state.voice); });
    ui.cap.id = 'calas-tour-cap';
    ui.cap.setAttribute('role', 'status');
    [ui.cursor, ui.cap, ui.bar, ui.skip, ui.voice].forEach(function (n) { document.body.appendChild(n); });
    setVoiceLabel();
  }
  function removeOverlay() {
    ['cursor', 'cap', 'bar', 'skip', 'voice'].forEach(function (k) {
      var n = ui[k]; if (n && n.parentNode) n.parentNode.removeChild(n);
      ui[k] = null;
    });
  }
  function setVoiceLabel() {
    if (ui.voice) ui.voice.innerHTML = state && state.voice ? '&#128266; Voice on' : '&#128263; Turn on voice';
  }
  function setVoice(on) {
    state.voice = on;
    clips.forEach(function (a) { a.muted = !on; });
    setVoiceLabel();
    // Voice switched on mid-line: start the current line's audio now.
    var a = state.current;
    if (on && a && a.paused && state.speaking) { try { a.currentTime = 0; var p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
  }

  /* ---------- the tour API handed to each demo's script ---------- */

  function sleep(ms) {
    if (state.stopped) return Promise.resolve();
    return new Promise(function (res) {
      var t = setTimeout(res, reduceMotion ? Math.min(ms, 300) : ms);
      state.cancel.push(function () { clearTimeout(t); res(); });
    });
  }

  function say(i) {
    if (state.stopped) return Promise.resolve();
    var a = clips[i], ms = ((cfg.durs[i] || 4) + 0.5) * 1000;
    state.done = i;
    if (ui.bar) ui.bar.style.width = Math.round(((i + 1) / cfg.lines.length) * 100) + '%';
    return new Promise(function (res) {
      var finished = false;
      function fire() { if (finished) return; finished = true; state.speaking = false; res(); }
      state.cancel.push(fire);
      state.current = a; state.speaking = true;
      if (a) {
        a.muted = !state.voice;
        a.onended = fire;
        try { a.currentTime = 0; var p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
      }
      // Muted or blocked audio still paces the tour by the clip's known length.
      setTimeout(fire, ms);
    });
  }

  /* Wait until the target has stopped moving (a smooth scroll can take well over a
     second on a long page or a phone), so the caption is placed where it ends up. */
  function settle(node) {
    var first = reduceMotion ? 60 : 300;
    if (!node) return sleep(reduceMotion ? 60 : 450);
    var last = null, still = 0, tries = 0;
    function sample() {
      var r = node.getBoundingClientRect();
      return Math.round(r.top) + ':' + Math.round(r.left) + ':' + Math.round(window.pageYOffset);
    }
    function poll() {
      if (state.stopped) return;
      var now = sample();
      still = now === last ? still + 1 : 0;
      last = now;
      if (still >= 2 || ++tries > 30) return;
      return sleep(70).then(poll);
    }
    return sleep(first).then(poll);
  }

  function hit(a, b) { return a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t; }
  function area(a, b) {
    var w = Math.min(a.r, b.r) - Math.max(a.l, b.l), h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
    return w > 0 && h > 0 ? w * h : 0;
  }
  function box(n, vw, vh) {
    if (!n || !n.getBoundingClientRect) return null;
    var r = n.getBoundingClientRect();
    if (!r.width && !r.height) return null;
    var b = { l: Math.max(0, r.left), t: Math.max(0, r.top), r: Math.min(vw, r.right), b: Math.min(vh, r.bottom) };
    return b.r > b.l && b.b > b.t ? b : null;   // null when it is off screen
  }

  /* Put the caption near the cursor without covering the target (or anything in
     opts.avoid), inside the window, clear of the tour buttons. Tries above, below,
     right and left of the target; if the target fills the window, the caption goes
     to the opposite edge of the window from the cursor. */
  function placeCaption(node, cx, cy, opts) {
    var vw = window.innerWidth, vh = window.innerHeight, pad = 10, gap = 14;
    ui.cap.style.maxWidth = Math.min(360, vw - 2 * pad) + 'px';
    var w = ui.cap.offsetWidth, h = ui.cap.offsetHeight;
    var keep = [], tb = box(node, vw, vh);
    if (tb) keep.push(tb);
    [].concat(opts.avoid || []).forEach(function (sel) {
      var list = typeof sel === 'string' ? document.querySelectorAll(sel) : [sel];
      for (var k = 0; k < list.length; k++) { var b = box(list[k], vw, vh); if (b) keep.push(b); }
    });
    // the Voice / Skip buttons, bottom left
    var buttons = { l: 0, t: vh - 112, r: 196, b: vh };
    function clampX(x) { return Math.min(Math.max(pad, x), vw - w - pad); }
    function clampY(y) { return Math.min(Math.max(pad, y), vh - h - pad); }
    function rect(x, y) { return { l: x, t: y, r: x + w, b: y + h }; }
    function inside(c) { return c.l >= pad - 1 && c.t >= pad - 1 && c.r <= vw - pad + 1 && c.b <= vh - pad + 1; }
    function clear(c) {
      if (hit(c, buttons)) return false;
      for (var k = 0; k < keep.length; k++) if (hit(c, keep[k])) return false;
      return true;
    }
    var t = tb || { l: cx, t: cy, r: cx, b: cy };
    var above = rect(clampX(cx - w / 2), t.t - h - gap), below = rect(clampX(cx - w / 2), t.b + gap + 8);
    var right = rect(t.r + gap, clampY(cy - h / 2)), left = rect(t.l - w - gap, clampY(cy - h / 2));
    var tries = (cy > 170 ? [above, below] : [below, above]).concat([right, left]);
    for (var i = 0; i < tries.length; i++) if (inside(tries[i]) && clear(tries[i])) return tries[i];
    // Nothing fits beside the target: dock at the top or bottom edge, whichever
    // covers less of it; on a tie, the edge away from the cursor.
    var top = rect(clampX(cx - w / 2), pad), bot = rect(clampX(cx - w / 2), vh - h - pad);
    if (hit(bot, buttons)) {
      if (vw - 196 - pad >= w) bot = rect(Math.max(196, bot.l), bot.t); else bot = rect(bot.l, buttons.t - h - 6);
    }
    function cost(c) { var s = 0; for (var k = 0; k < keep.length; k++) s += area(c, keep[k]); return s; }
    var ct = cost(top), cb = cost(bot);
    if (Math.abs(ct - cb) < 1) return cy < vh / 2 ? bot : top;
    return ct < cb ? top : bot;
  }

  function point(target, i, opts) {
    if (state.stopped) return Promise.resolve();
    opts = opts || {};
    var node = q(target);
    if (node) { try { node.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: opts.block || 'center' }); } catch (e) {} }
    return settle(node).then(function () {
      if (state.stopped || !ui.cursor) return;
      var vw = window.innerWidth, vh = window.innerHeight;
      var cx = vw / 2, cy = 170;
      if (node) {
        var r = node.getBoundingClientRect();
        cx = r.left + r.width * (opts.px != null ? opts.px : 0.5);
        cy = r.top + r.height * (opts.py != null ? opts.py : 0.5);
        // never park the cursor outside the window
        cx = Math.min(Math.max(8, cx), vw - 20); cy = Math.min(Math.max(8, cy), vh - 24);
        ui.cursor.style.left = (cx - 3) + 'px'; ui.cursor.style.top = (cy - 3) + 'px';
      }
      ui.cap.textContent = cfg.lines[i];
      ui.cap.setAttribute('data-step', i);
      var c = placeCaption(node, cx, cy, opts);
      ui.cap.style.left = Math.round(c.l) + 'px'; ui.cap.style.top = Math.round(c.t) + 'px'; ui.cap.style.opacity = '1';
      return say(i);
    });
  }

  function tap(target) {
    if (state.stopped || !ui.cursor) return;
    var node = q(target);
    ui.cursor.style.transform = 'scale(.8)';
    setTimeout(function () { if (ui.cursor) ui.cursor.style.transform = 'scale(1)'; }, 160);
    if (node) { try { node.click(); } catch (e) {} }
  }

  function type(target, text, msPerChar) {
    var node = q(target);
    if (state.stopped || !node) return Promise.resolve();
    var i = 0, step = reduceMotion ? 0 : (msPerChar || 38);
    node.value = '';
    return new Promise(function (res) {
      (function next() {
        if (state.stopped || i >= text.length) { node.value = text; node.dispatchEvent(new Event('input', { bubbles: true })); return res(); }
        node.value = text.slice(0, ++i);
        setTimeout(next, step);
      })();
    });
  }

  /* ---------- run / stop ---------- */

  function run() {
    if (state && !state.stopped) return;
    removeEnd();
    if (ui.replay && ui.replay.parentNode) ui.replay.parentNode.removeChild(ui.replay);
    ui.replay = null;
    state = { stopped: false, voice: true, cancel: [], current: null, speaking: false, done: -1 }; // 2026-10-01 Owner: voice ON by default (browser still needs the first click before sound can play)
    buildOverlay();
    if (cfg.onStart) try { cfg.onStart(); } catch (e) {}
    var api = { point: point, tap: tap, sleep: sleep, type: type, q: q };
    Promise.resolve()
      .then(function () { return cfg.script(api); })
      .then(function () { return sleep(700); })
      .then(finish, finish);
  }
  function finish() {
    if (!state || state.stopped) return;
    state.stopped = true;
    removeOverlay();
    if (cfg.onEnd) try { cfg.onEnd('finished'); } catch (e) {}
    if (cfg.end) showEnd(); else showReplay();
  }
  function stop() {
    if (!state || state.stopped) return;
    state.stopped = true;
    if (state.current) { try { state.current.pause(); } catch (e) {} }
    state.cancel.forEach(function (f) { try { f(); } catch (e) {} });
    removeOverlay();
    if (cfg.onEnd) try { cfg.onEnd('skipped'); } catch (e) {}
    showReplay();
  }
  function again() {
    removeEnd();
    if (ui.replay && ui.replay.parentNode) ui.replay.parentNode.removeChild(ui.replay);
    ui.replay = null;
    if (cfg.onReplay) try { cfg.onReplay(); } catch (e) {}
    run();
  }
  function showReplay() {
    if (ui.replay) return;
    ui.replay = el('button', BTN + ';bottom:18px;left:18px;background:#155F87', '&#9654; Watch the tour again');
    ui.replay.id = 'calas-tour-replay';
    ui.replay.addEventListener('click', again);
    document.body.appendChild(ui.replay);
  }

  /* ---------- end-of-demo card ---------- */

  var END_CSS =
    '#calas-tour-end{position:fixed;inset:0;z-index:10001;display:flex;align-items:center;justify-content:center;' +
      'padding:16px;background:rgba(11,46,69,.5);box-sizing:border-box;animation:cte-in .35s ease both}' +
    '#calas-tour-end *{box-sizing:border-box}' +
    '#calas-tour-end .cte-card{position:relative;width:100%;max-width:500px;max-height:calc(100vh - 32px);overflow:auto;' +
      'background:var(--night,#0B2E45);color:#fff;border-radius:10px;border-top:1px solid var(--gold,#F0C171);' +
      'padding:30px 30px 24px;box-shadow:0 22px 60px rgba(4,20,31,.55);' +
      'font:400 16px/1.5 "IBM Plex Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-align:left}' +
    '#calas-tour-end .cte-eye{margin:0 0 8px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#B9CFDD}' +
    '#calas-tour-end h2{margin:0 0 10px;padding:0;font:700 26px/1.2 "Libre Baskerville",Georgia,serif;color:#fff;letter-spacing:0}' +
    '#calas-tour-end p{margin:0 0 12px;color:#fff;max-width:none}' +
    '#calas-tour-end .cte-does{font-size:16.5px}' +
    '#calas-tour-end .cte-offer{font-weight:600}' +
    '#calas-tour-end .cte-terms{font-size:14.5px;color:#DCE8F0}' +
    '#calas-tour-end .cte-acts{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 16px}' +
    '#calas-tour-end .cte-go,#calas-tour-end .cte-again{display:inline-flex;align-items:center;justify-content:center;' +
      'min-height:46px;padding:11px 20px;border-radius:8px;font:600 15.5px/1.25 "IBM Plex Sans",-apple-system,sans-serif;' +
      'text-decoration:none;cursor:pointer;margin:0;width:auto;text-transform:none;letter-spacing:0;box-shadow:none;text-align:center}' +
    '#calas-tour-end .cte-go{background:#155F87;color:#fff;border:1px solid #2E7FAB}' +
    '#calas-tour-end .cte-go:hover{background:#1A6E9C;color:#fff}' +
    '#calas-tour-end .cte-again{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.55)}' +
    '#calas-tour-end .cte-again:hover{border-color:#fff;background:rgba(255,255,255,.08)}' +
    '#calas-tour-end .cte-go:focus-visible,#calas-tour-end .cte-again:focus-visible,#calas-tour-end .cte-x:focus-visible{outline:2px solid #fff;outline-offset:3px}' +
    '#calas-tour-end .cte-note{margin:0;font-size:13.5px;color:#B9CFDD}' +
    '#calas-tour-end .cte-x{position:absolute;top:8px;right:8px;width:40px;height:40px;padding:0;margin:0;border:0;border-radius:20px;' +
      'background:transparent;color:#B9CFDD;font:400 24px/1 "IBM Plex Sans",-apple-system,sans-serif;cursor:pointer;box-shadow:none;min-height:0}' +
    '#calas-tour-end .cte-x:hover{color:#fff;background:rgba(255,255,255,.08)}' +
    '@keyframes cte-in{from{opacity:0}to{opacity:1}}' +
    '@media(max-width:480px){#calas-tour-end .cte-card{padding:26px 20px 20px}#calas-tour-end h2{font-size:23px}' +
      '#calas-tour-end .cte-go,#calas-tour-end .cte-again{flex:1 1 100%}}' +
    '@media(prefers-reduced-motion:reduce){#calas-tour-end{animation:none}}';

  function showEnd() {
    var e = cfg.end;
    removeEnd();
    if (!document.getElementById('calas-tour-end-css')) {
      var st = document.createElement('style'); st.id = 'calas-tour-end-css'; st.textContent = END_CSS;
      document.head.appendChild(st);
    }
    var wrap = el('div'), card = el('div');
    wrap.id = 'calas-tour-end';
    card.className = 'cte-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-labelledby', 'calas-tour-end-h');
    function add(tag, cls, text) {
      var n = document.createElement(tag); n.className = cls; n.textContent = text; card.appendChild(n); return n;
    }
    var x = add('button', 'cte-x', '×');
    x.type = 'button'; x.setAttribute('aria-label', 'Close and go back to the demo');
    add('p', 'cte-eye', 'End of the demo');
    add('h2', '', e.name).id = 'calas-tour-end-h';
    if (e.does) add('p', 'cte-does', e.does);
    if (e.offer) add('p', 'cte-offer', e.offer);
    if (e.terms) add('p', 'cte-terms', e.terms);
    var acts = el('div'); acts.className = 'cte-acts'; card.appendChild(acts);
    var go = null;
    if (e.cta && e.cta.href) {
      go = document.createElement('a'); go.className = 'cte-go'; go.href = e.cta.href; go.textContent = e.cta.label;
      acts.appendChild(go);
    }
    var ag = document.createElement('button'); ag.type = 'button'; ag.className = 'cte-again'; ag.textContent = 'Watch again';
    acts.appendChild(ag);
    add('p', 'cte-note', 'Demo uses made-up data.');
    wrap.appendChild(card);
    function close() { removeEnd(); showReplay(); }
    x.addEventListener('click', close);
    ag.addEventListener('click', again);
    wrap.addEventListener('click', function (ev) { if (ev.target === wrap) close(); });
    ui.endKey = function (ev) { if (ev.key === 'Escape') close(); };
    document.addEventListener('keydown', ui.endKey);
    document.body.appendChild(wrap);
    ui.end = wrap;
    try { (go || ag).focus({ preventScroll: true }); } catch (err) {}
  }
  function removeEnd() {
    if (ui.endKey) { document.removeEventListener('keydown', ui.endKey); ui.endKey = null; }
    if (ui.end && ui.end.parentNode) ui.end.parentNode.removeChild(ui.end);
    ui.end = null;
  }

  // First real interaction anywhere turns the voice on (browsers require one).
  function armVoice() {
    function on(e) {
      if (ui.skip && (e.target === ui.skip)) return;
      if (state && !state.stopped) {
        if (!state.voice) setVoice(true);
        else { var a = state.current; if (a && a.paused && state.speaking) { try { a.currentTime = 0; var p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (e2) {} } }
      }
      window.removeEventListener('pointerdown', on, true);
      window.removeEventListener('keydown', on, true);
    }
    window.addEventListener('pointerdown', on, true);
    window.addEventListener('keydown', on, true);
  }

  window.CalasTour = {
    start: function (options) {
      cfg = options;
      armVoice();
      var go = function () { loadClips().then(function () { setTimeout(run, cfg.delay != null ? cfg.delay : 900); }); };
      if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
    },
    replay: function () { stop(); again(); },
    running: function () { return !!(state && !state.stopped); }
  };
})();
