/* gate.js - Calas Automations access-code lock.
 *
 * Put on any app page:  <script src="/access/gate.js" data-app="quoteme"></script>
 * The page is covered until the visitor enters a good code. The code is remembered on
 * this device and re-checked every time the page opens (and every 30 minutes).
 * When a code runs out, the visitor sees the paywall: subscribe, or type a new code.
 * A link like  ...?code=CALAS-XXXX-XXXX  fills the code in for them (used in emails).
 */
(function () {
  'use strict';
  var API = 'https://calas-access.calasdan.workers.dev';
  var me = document.currentScript;
  var APP = (me && me.getAttribute('data-app')) || 'all';
  var NAMES = { onfile: 'On File', leadme: 'Lead Me', quoteme: 'Quote Me', dispatchme: 'Dispatch Me',
    watchpost: 'Watchpost', haulme: 'Haul Me', cara: 'Cara', all: 'Calas apps' };
  var NAME = NAMES[APP] || 'this app';
  var KEY = 'calas_access_' + APP;

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }

  var css = '#calas-gate{position:fixed;inset:0;z-index:2147483647;background:#0B2E45;color:#fff;display:flex;align-items:center;justify-content:center;padding:16px;font:16px/1.5 "IBM Plex Sans",-apple-system,Segoe UI,Roboto,sans-serif}' +
    '#calas-gate .card{width:100%;max-width:420px;background:#0E3A55;border:1px solid #1E4A66;border-radius:14px;padding:26px 22px;box-shadow:0 20px 60px rgba(0,0,0,.35)}' +
    '#calas-gate h1{font:700 22px/1.25 "Libre Baskerville",Georgia,serif;margin:0 0 6px}' +
    '#calas-gate p{margin:0 0 14px;color:#B9CFDD}' +
    '#calas-gate input{width:100%;box-sizing:border-box;font:600 20px "IBM Plex Mono",monospace;letter-spacing:2px;text-transform:uppercase;padding:13px;border-radius:10px;border:1px solid #1E4A66;background:#0B2E45;color:#fff;text-align:center}' +
    '#calas-gate button,#calas-gate a.btn{display:block;width:100%;box-sizing:border-box;margin-top:10px;padding:13px;border:0;border-radius:10px;font:600 16px "IBM Plex Sans",sans-serif;cursor:pointer;text-align:center;text-decoration:none}' +
    '#calas-gate button{background:#4FA3D1;color:#0B2E45}#calas-gate a.btn{background:#fff;color:#0B2E45}' +
    '#calas-gate .msg{min-height:22px;margin-top:10px;font-size:14px;color:#FFB4A8}#calas-gate .small{font-size:13px;margin-top:14px;color:#8FB0C4}' +
    '#calas-gate .small a{color:#B9CFDD}';

  var gate, input, msg, busy = false;

  function build() {
    if (gate) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    gate = document.createElement('div'); gate.id = 'calas-gate';
    gate.innerHTML = '<div class="card" role="dialog" aria-modal="true" aria-labelledby="cg-h">' +
      '<h1 id="cg-h"></h1><p id="cg-p"></p>' +
      '<form id="cg-f" autocomplete="off"><input id="cg-i" placeholder="CALAS-XXXX-XXXX" aria-label="Access code" maxlength="20" spellcheck="false">' +
      '<button type="submit">Unlock</button></form>' +
      '<a class="btn" id="cg-pay" href="/pay/#' + APP + '" hidden>Subscribe to keep using ' + NAME + '</a>' +
      '<div class="msg" id="cg-m" aria-live="polite"></div>' +
      '<div class="small">No code? <a href="/pay/#' + APP + '">See plans</a> or email <a href="tel:+14312449026" data-cara>(431) 244-9026</a>.</div></div>';
    (document.body || document.documentElement).appendChild(gate);
    input = gate.querySelector('#cg-i'); msg = gate.querySelector('#cg-m');
    gate.querySelector('#cg-f').addEventListener('submit', function (e) { e.preventDefault(); check(input.value, true); });
  }

  function show(mode, extra) {
    build();
    var h = gate.querySelector('#cg-h'), p = gate.querySelector('#cg-p'), pay = gate.querySelector('#cg-pay');
    pay.hidden = true;
    if (mode === 'paywall') {
      h.textContent = 'Your ' + NAME + ' access has ended';
      p.textContent = (extra || 'Your access code is no longer active.') + ' Subscribe to keep going, and we’ll email you a new code right away. Already have a new code? Type it below.';
      pay.hidden = false;
    } else {
      h.textContent = 'Enter your ' + NAME + ' access code';
      p.textContent = 'Type the code you were given. You only need to do this once on this device.';
    }
    gate.style.display = 'flex';
    setTimeout(function () { try { input.focus(); } catch (e) {} }, 50);
  }

  function hide() { if (gate) gate.style.display = 'none'; }

  function fmt(ms) { try { return new Date(ms).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }); } catch (e) { return ''; } }

  function check(code, typed) {
    code = String(code || '').trim().toUpperCase();
    if (!code) { show('code'); if (typed) msg.textContent = 'Please type your code.'; return; }
    if (busy) return; busy = true;
    if (typed && msg) msg.textContent = 'Checking…';
    fetch(API + '/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code, app: APP }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        busy = false;
        if (d.ok) { store(KEY, code); if (msg) msg.textContent = ''; hide(); return; }
        if (d.reason === 'expired' || d.reason === 'revoked') {
          store(KEY, null);
          show('paywall', d.reason === 'expired' ? 'Your code ended on ' + fmt(d.expired_on) + '.' : 'This code has been turned off.');
          if (typed) msg.textContent = d.reason === 'expired' ? 'That code has ended.' : 'That code is turned off.';
          return;
        }
        store(KEY, null);
        show('code');
        msg.textContent = d.reason === 'wrong_app' ? 'That code is for ' + d.code_app + ', not ' + NAME + '.' : 'That code wasn’t found. Check the letters and try again.';
      })
      .catch(function () {
        busy = false;
        // Network trouble: don't lock out someone who already unlocked on this device.
        if (store(KEY) === code && !typed) { hide(); return; }
        show('code'); msg.textContent = 'Couldn’t reach the server. Check your internet and try again.';
      });
  }

  function start() {
    var fromUrl = null;
    try {
      var u = new URL(location.href);
      fromUrl = u.searchParams.get('code');
      if (fromUrl) { u.searchParams.delete('code'); history.replaceState(null, '', u.pathname + u.search + u.hash); }
    } catch (e) {}
    var saved = fromUrl || store(KEY);
    show('code');           // cover the page right away; lifted as soon as the code checks out
    if (saved) { input.value = saved; check(saved, false); }
    setInterval(function () { var c = store(KEY); if (c) check(c, false); else show('code'); }, 30 * 60 * 1000);
  }

  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
