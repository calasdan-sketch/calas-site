/* pay.js - Calas Automations, zero-backend payments layer.
 *
 * On load: fetch /pay/links.json, then for every element with data-pay="<key>":
 *   - if links[key] is a non-empty https:// URL  -> set href and show the element
 *   - otherwise                                  -> hide it
 * No dependencies. Never throws. If the fetch fails, every data-pay element is hidden.
 *
 * Elements are hidden with both the `hidden` attribute and an inline display:none,
 * because some pages style .btn with display:inline-block, which would beat `hidden`.
 */
(function () {
  'use strict';

  function isHttps(v) {
    return typeof v === 'string' && /^https:\/\/[^\s"'<>]+$/i.test(v.trim());
  }

  function hide(el) {
    try { el.hidden = true; el.setAttribute('hidden', ''); el.style.display = 'none'; } catch (e) {}
  }

  function show(el) {
    try { el.hidden = false; el.removeAttribute('hidden'); el.style.display = ''; } catch (e) {}
  }

  function apply(links) {
    var els;
    try { els = document.querySelectorAll('[data-pay]'); } catch (e) { return; }
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      try {
        var key = (el.getAttribute('data-pay') || '').trim();
        var url = links && Object.prototype.hasOwnProperty.call(links, key) ? links[key] : '';
        if (key && isHttps(url)) {
          el.setAttribute('href', url.trim());
          if (!el.getAttribute('rel')) el.setAttribute('rel', 'noopener');
          show(el);
        } else {
          hide(el);
        }
      } catch (e) {
        hide(el);
      }
    }
  }

  function run() {
    if (typeof window.fetch !== 'function') { apply(null); return; }
    var p;
    try {
      p = window.fetch('/pay/links.json', { cache: 'no-cache', credentials: 'omit' });
    } catch (e) { apply(null); return; }
    p.then(function (r) {
      if (!r || !r.ok) throw new Error('links.json ' + (r && r.status));
      return r.json();
    }).then(function (json) {
      apply(json && typeof json === 'object' ? json : null);
    }).catch(function () {
      apply(null);
    });
  }

  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run, { once: true });
    } else {
      run();
    }
  } catch (e) {
    try { apply(null); } catch (e2) {}
  }
})();
