/* signup.js - Calas Automations sign-up popup (2026-10-05).
 * Pressing any Pay / Subscribe button (a[data-pay] pointing at buy.stripe.com) first asks for an
 * email and a password (with "suggest one" and a show/hide eye), then opens Stripe with the email
 * filled in. The password is saved scrambled by calas-access and never goes to Stripe.
 * Apps with their own sign-in (Quote Me, Watchpost, Cara) only ask for the email here.
 * Loaded by pay.js, so every page with Pay buttons gets it.
 */
(function () {
  'use strict';
  var API = 'https://calas-access.calasdan.workers.dev/api/signup/start';
  var NAMES = { onfile: 'On File', leadme: 'Lead Me', haulme: 'Haul Me', greenmile: 'Haul Me', quoteme: 'Quote Me',
    watchpost: 'Watchpost', textback: 'Cara text-back' };
  var OWN_LOGIN = /^(onfile|leadme|haulme|greenmile)_/;   // calas-access makes these accounts
  var MIN = 10;

  function appName(key) { return NAMES[(key || '').split('_')[0]] || 'Calas Automations'; }

  function suggest() {
    var a = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789', out = '', r = new Uint32Array(16);
    crypto.getRandomValues(r);
    for (var i = 0; i < 16; i++) { out += a[r[i] % a.length]; if (i === 3 || i === 7 || i === 11) out += '-'; }
    return out;
  }

  function withParams(url, email, ref) {
    var u = new URL(url);
    if (email) u.searchParams.set('prefilled_email', email);
    if (ref) u.searchParams.set('client_reference_id', ref);
    return u.toString();
  }

  var CSS = '#cs-modal{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(8,20,30,.6);padding:16px}' +
    '#cs-modal .box{background:#fff;color:#14202b;border-radius:14px;max-width:420px;width:100%;padding:26px 24px;box-shadow:0 20px 60px rgba(0,0,0,.35);border-top:4px solid #F0C171;font-family:inherit;text-align:left}' +
    '#cs-modal h2{margin:0 0 6px;font-size:22px;color:#0B2E45}#cs-modal p{margin:0 0 12px;color:#4a5866;font-size:15px;line-height:1.45}' +
    '#cs-modal label{display:block;font-size:14px;font-weight:600;margin:12px 0 6px;color:#14202b}' +
    '#cs-modal input{width:100%;box-sizing:border-box;font-size:16px;padding:11px 12px;border:1px solid #c9d3dc;border-radius:9px;color:#14202b;background:#fff}' +
    '#cs-modal .sug{background:none;border:0;color:#155F87;font-weight:600;cursor:pointer;padding:6px 0 0;font-size:14px}' +
    '#cs-modal .go{width:100%;margin-top:16px;padding:13px;border:0;border-radius:10px;background:#155F87;color:#fff;font-size:16px;font-weight:700;cursor:pointer}' +
    '#cs-modal .go[disabled]{opacity:.6}#cs-modal .x{float:right;background:none;border:0;font-size:26px;line-height:1;cursor:pointer;color:#6b7a88}' +
    '#cs-modal .err{font-size:14px;margin-top:10px;min-height:1em;color:#B3261E}#cs-modal .err.ok{color:#17794A}' +
    '#cs-modal .fine{font-size:12.5px;color:#6b7a88;margin:12px 0 0}';

  function open(key, url) {
    var own = OWN_LOGIN.test(key);
    var old = document.getElementById('cs-modal');
    if (old) old.remove();
    if (!document.getElementById('cs-modal-css')) {
      var st = document.createElement('style'); st.id = 'cs-modal-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    var m = document.createElement('div');
    m.id = 'cs-modal';
    m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'cs-h');
    m.innerHTML = '<form class="box" novalidate><button type="button" class="x" aria-label="Close">&times;</button>' +
      '<h2 id="cs-h">Create your ' + appName(key) + ' account</h2>' +
      '<p>' + (own ? 'Pick the email and password you’ll sign in with. Next you’ll go to our secure checkout.'
                   : 'Enter your email. Next you’ll go to our secure checkout, and you’ll set your password when you first sign in.') + '</p>' +
      '<label for="cs-email">Email</label><input id="cs-email" type="email" autocomplete="email" required>' +
      (own ? '<label for="cs-pw">Password <span style="font-weight:400;color:#6b7a88">(at least ' + MIN + ' characters)</span></label>' +
             '<input id="cs-pw" type="password" autocomplete="new-password" minlength="' + MIN + '" required>' +
             '<button type="button" class="sug">Suggest a strong password for me</button>' : '') +
      '<div class="err" aria-live="polite"></div>' +
      '<button class="go" type="submit">Continue to checkout</button>' +
      '<p class="fine">Payments are handled by Stripe. We never see your card.' +
      (own ? ' Your password is stored scrambled, so not even we can read it.' : '') + '</p></form>';
    document.body.appendChild(m);
    if (window.calasPwEye) window.calasPwEye.scan(m);

    var f = m.querySelector('form'), err = m.querySelector('.err'), go = m.querySelector('.go');
    function onKey(e) { if (e.key === 'Escape') close(); }
    function close() { m.remove(); document.removeEventListener('keydown', onKey); }
    document.addEventListener('keydown', onKey);
    m.addEventListener('click', function (e) { if (e.target === m) close(); });
    m.querySelector('.x').addEventListener('click', close);

    var sug = m.querySelector('.sug');
    if (sug) sug.addEventListener('click', function () {
      var pw = m.querySelector('#cs-pw');
      pw.value = suggest();
      var eye = m.querySelector('.pw-eye');
      if (eye && pw.type === 'password') eye.click(); else pw.type = 'text';
      err.className = 'err ok';
      err.textContent = 'Save this password in your browser or write it down.';
    });
    m.querySelector('#cs-email').focus();

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      err.className = 'err';
      var email = m.querySelector('#cs-email').value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = 'Please enter a valid email address.'; return; }
      if (!own) { location.href = withParams(url, email, ''); return; }
      var pw = m.querySelector('#cs-pw').value;
      if (pw.length < MIN) { err.textContent = 'Your password needs at least ' + MIN + ' characters.'; return; }
      if (pw.toLowerCase() === email.toLowerCase()) { err.textContent = 'Please don’t use your email as your password.'; return; }
      go.disabled = true; go.textContent = 'One moment…';
      fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: pw, plan: key }) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d.ok) throw new Error(d.error === 'too_short' ? 'Your password needs at least ' + MIN + ' characters.' : 'Something went wrong. Please try again.');
          location.href = withParams(url, email, d.ref);
        })
        .catch(function (x) {
          go.disabled = false; go.textContent = 'Continue to checkout';
          err.textContent = (x && x.message && x.message.indexOf('fetch') < 0) ? x.message : 'Couldn’t reach our server. Please try again.';
        });
    });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-pay]');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var url = a.getAttribute('href') || '';
    if (!/^https:\/\/buy\.stripe\.com\//.test(url)) return;
    e.preventDefault();
    var key = a.getAttribute('data-pay') || '';
    // Quote Me bills inside the app (Settings -> Subscribe), tied to the shop's account.
    // A website Payment Link would take money without unlocking anything, so sign up first.
    if (/^quoteme_/.test(key)) { location.href = '/quote-me/app/#/login'; return; }
    open(key, url);
  });

  if (!window.calasPwEye && !document.querySelector('script[src*="pw-eye.js"]')) {
    var s = document.createElement('script'); s.src = '/pw-eye.js'; s.defer = true; document.head.appendChild(s);
  }
})();
