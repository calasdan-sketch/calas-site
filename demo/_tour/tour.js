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
 *         .then(function () { return t.point(".row", 1); });
 *     }
 *   });
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
    ui.cap = el('div', 'position:fixed;left:-999px;top:-999px;z-index:9999;max-width:360px;pointer-events:none;' +
      'background:#12212C;color:#fff;font:15px/1.45 "IBM Plex Sans",-apple-system,sans-serif;padding:12px 16px;' +
      'border-radius:8px;box-shadow:0 8px 26px rgba(0,0,0,.32);transition:left .6s ease,top .6s ease,opacity .3s ease;opacity:0');
    ui.bar = el('div', 'position:fixed;left:0;bottom:0;height:4px;width:0;z-index:10000;background:#F0C171;transition:width .4s linear;pointer-events:none');
    ui.skip = el('button', BTN + ';bottom:18px;left:18px', 'Skip tour &#10005;');
    ui.voice = el('button', BTN + ';bottom:64px;left:18px;background:#155F87');
    ui.skip.addEventListener('click', stop);
    ui.voice.addEventListener('click', function (e) { e.stopPropagation(); setVoice(!state.voice); });
    [ui.cursor, ui.cap, ui.bar, ui.skip, ui.voice].forEach(function (n) { document.body.appendChild(n); });
    setVoiceLabel();
  }
  function removeOverlay() {
    Object.keys(ui).forEach(function (k) { var n = ui[k]; if (n && n.parentNode) n.parentNode.removeChild(n); });
    ui = {};
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

  function point(target, i, opts) {
    if (state.stopped) return Promise.resolve();
    opts = opts || {};
    var node = q(target);
    if (node) { try { node.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }); } catch (e) {} }
    return sleep(reduceMotion ? 60 : 450).then(function () {
      if (state.stopped || !ui.cursor) return;
      var cx = window.innerWidth / 2, cy = 170;
      if (node) {
        var r = node.getBoundingClientRect();
        cx = r.left + r.width * (opts.px != null ? opts.px : 0.5);
        cy = r.top + r.height * (opts.py != null ? opts.py : 0.5);
        ui.cursor.style.left = (cx - 3) + 'px'; ui.cursor.style.top = (cy - 3) + 'px';
      }
      var w = 360, x = Math.min(Math.max(12, cx - w / 2), window.innerWidth - w - 12);
      var y = cy > 170 ? cy - 104 : cy + 36;
      ui.cap.style.left = x + 'px'; ui.cap.style.top = y + 'px'; ui.cap.style.opacity = '1';
      ui.cap.textContent = cfg.lines[i];
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
    showReplay();
  }
  function stop() {
    if (!state || state.stopped) return;
    state.stopped = true;
    if (state.current) { try { state.current.pause(); } catch (e) {} }
    state.cancel.forEach(function (f) { try { f(); } catch (e) {} });
    removeOverlay();
    showReplay();
  }
  function showReplay() {
    if (ui.replay) return;
    ui.replay = el('button', BTN + ';bottom:18px;left:18px;background:#155F87', '&#9654; Watch the tour again');
    ui.replay.addEventListener('click', function () {
      if (ui.replay && ui.replay.parentNode) ui.replay.parentNode.removeChild(ui.replay);
      ui.replay = null;
      if (cfg.onReplay) try { cfg.onReplay(); } catch (e) {}
      run();
    });
    document.body.appendChild(ui.replay);
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
    replay: function () { stop(); run(); }
  };
})();
