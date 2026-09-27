/* scamcheck.js — Guardian's link to the shared scam database and Watchpost Family.
 * Served at calasautomations.com/guardian/scamcheck.js. Canonical copy: watchpost/cloud/web/.
 *
 * Privacy, in plain words:
 *   - The message text never leaves the phone.
 *   - To check a number/link/wallet/handle, the phone makes a scrambled fingerprint (SHA-256) and
 *     sends only its first 6 characters. The server answers with every reported fingerprint that
 *     starts that way; the phone does the final comparison. The server can't tell what was checked.
 *   - Reporting sends the number/link itself, and only when the person taps "Warn others".
 *   - A family alert goes out only if this person joined a family and switched alerts on.
 *
 * normalize() MUST match cloud/src/normalize.js exactly (test/normalize.test.mjs checks).
 */
(function () {
  'use strict';
  var API = 'https://watchpost-api.calasdan.workers.dev';

  // ---- same rules as the server (cloud/src/normalize.js) ----
  var SHARED_HOSTS = ['bit.ly', 't.co', 'tinyurl.com', 'linktr.ee', 'forms.gle', 'docs.google.com', 'drive.google.com', 'sites.google.com',
    'wa.me', 't.me', 'facebook.com', 'm.facebook.com', 'instagram.com', 'tiktok.com', 'x.com', 'twitter.com', 'youtube.com', 'youtu.be',
    'linkedin.com', 'github.com', 'dropbox.com', 'onedrive.live.com', '1drv.ms', 'wetransfer.com', 'telegram.me', 'discord.gg', 'discord.com'];

  function normalize(kind, value) {
    var v = String(value == null ? '' : value).trim();
    if (!v) return null;
    if (kind === 'phone') {
      var d = v.replace(/\D/g, '');
      if (d.length === 10) d = '1' + d;
      if (d.length < 3 || d.length > 15) return null;
      return 'phone:' + d;
    }
    if (kind === 'link') {
      var s = v.replace(/[)\].,;!?'"]+$/, '');
      if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = 'https://' + s;
      var m = s.match(/^[a-z][a-z0-9+.-]*:\/\/(?:[^@\/?#]*@)?([^\/?#:]+)(?::\d+)?([^?#]*)/i);
      if (!m) return null;
      var host = m[1].toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
      if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) return null;
      if (SHARED_HOSTS.indexOf(host) >= 0) {
        var path = (m[2] || '').replace(/\/+$/, '').split('/').slice(0, 3).join('/');
        if (!path) return null;
        return 'link:' + host + path;
      }
      return 'link:' + host;
    }
    if (kind === 'wallet') {
      var w = v.replace(/\s/g, '');
      if (/^0x[a-fA-F0-9]{40}$/.test(w) || /^bc1[a-zA-Z0-9]{20,60}$/.test(w)) return 'wallet:' + w.toLowerCase();
      if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(w)) return 'wallet:' + w;
      return null;
    }
    if (kind === 'handle') {
      var h = v.replace(/^@+/, '').toLowerCase();
      return /^[a-z0-9_.]{2,40}$/.test(h) ? 'handle:' + h : null;
    }
    if (kind === 'email') {
      var e = v.toLowerCase();
      return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(e) ? 'email:' + e : null;
    }
    return null;
  }

  // Pull out what a scammer gave away, as {kind, value}.
  function extract(t) {
    t = String(t || '');
    var out = [], seen = {};
    function add(kind, list) {
      (list || []).forEach(function (x) {
        var key = normalize(kind, x);
        if (key && !seen[key]) { seen[key] = 1; out.push({ kind: kind, value: x.trim(), key: key }); }
      });
    }
    var emails = t.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];
    add('email', emails);
    var noEmails = t.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, ' ');
    add('link', noEmails.match(/\bhttps?:\/\/[^\s<>"]+/gi));
    add('link', noEmails.replace(/\bhttps?:\/\/[^\s<>"]+/gi, ' ').match(/\b(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|io|co|ca|info|xyz|top|app|site|online|live|vip|shop|club|me)\b(?:\/[^\s<>"]*)?/gi));
    add('wallet', t.match(/\b(0x[a-fA-F0-9]{40}|bc1[a-z0-9]{20,60}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/g));
    add('phone', t.match(/\+?\d[\d\s().-]{7,}\d/g));
    var handles = [], hre = /(?:^|[^A-Za-z0-9._%+\/-])@([A-Za-z0-9_.]{2,40})/g, hm;
    while ((hm = hre.exec(noEmails))) handles.push('@' + hm[1].replace(/\.+$/, ''));
    add('handle', handles);
    return out.slice(0, 10);
  }

  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function sha256(s) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(hex); }
  function session() { try { return localStorage.getItem('wp_session') || ''; } catch (e) { return ''; } }
  function post(path, body) {
    var h = { 'Content-Type': 'application/json' }, s = session();
    if (s) h.Authorization = 'Bearer ' + s;
    return fetch(API + path, { method: 'POST', headers: h, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }

  // -> Promise<[{kind, value, reporters}]> for identifiers other Guardian users reported
  function check(items) {
    if (!items.length || !window.crypto || !crypto.subtle) return Promise.resolve([]);
    return Promise.all(items.map(function (it) { return sha256(it.key); })).then(function (hashes) {
      var prefixes = hashes.map(function (h) { return h.slice(0, 6); });
      return fetch(API + '/api/scam/lookup?p=' + prefixes.join(','))
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var found = [];
          (d.matches || []).forEach(function (m) {
            var i = hashes.indexOf(m.h);
            if (i >= 0) found.push({ kind: items[i].kind, value: items[i].value, reporters: m.reporters });
          });
          return found;
        });
    }).catch(function () { return []; }); // offline or server trouble: Guardian still works on its own
  }

  function report(items, score) {
    return post('/api/scam/report', { score: score, items: items.map(function (i) { return { kind: i.kind, value: i.value }; }) });
  }

  // Only for signed-in family members who switched alerts on. The short piece of the message is
  // sent only if they also chose "share a short piece" — otherwise no text leaves the phone.
  function alertFamily(result, text) {
    if (!session() || result.lvl < 3) return Promise.resolve(null);
    return fetch(API + '/api/me', { headers: { Authorization: 'Bearer ' + session() } }).then(function (r) { return r.json(); }).then(function (me) {
      var f = me && me.family;
      if (!f || f.role !== 'member' || !f.alerts_ok) return null;
      return sha256(String(text || '').slice(0, 2000)).then(function (fp) {
        var body = { level: result.lvl, score: result.score, signals: result.signals, fingerprint: fp.slice(0, 32) };
        if (f.share_text) body.excerpt = String(text || '').slice(0, 140);
        return post('/api/family/alert', body);
      });
    }).then(function (d) { return d && d.ok && !d.duplicate ? d : null; }).catch(function () { return null; });
  }

  window.WPScam = { normalize: normalize, extract: extract, check: check, report: report, alertFamily: alertFamily };
})();
