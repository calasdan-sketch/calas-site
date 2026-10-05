/* pw-eye.js - Calas Automations. Adds a show/hide "eye" button to every password box on the
 * page, including ones added later (sign-in steps, React apps). One <script> tag, no setup.
 *   <script src="https://calasautomations.com/pw-eye.js" defer></script>
 */
(function () {
  'use strict';
  var OPEN = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var SHUT = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c7 0 11 7 11 7a18 18 0 0 1-3.2 4.1M6.6 6.6A18 18 0 0 0 1 12s4 7 11 7a10.6 10.6 0 0 0 5.4-1.4"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';

  function style() {
    if (document.getElementById('pw-eye-css')) return;
    var s = document.createElement('style');
    s.id = 'pw-eye-css';
    s.textContent = '.pw-eye-wrap{position:relative;display:block}' +
      '.pw-eye-wrap>input{padding-right:46px!important;width:100%;box-sizing:border-box}' +
      '.pw-eye{position:absolute;top:50%;right:6px;transform:translateY(-50%);width:36px;height:36px;display:flex;' +
      'align-items:center;justify-content:center;border:0;background:transparent;color:#6b7a88;cursor:pointer;border-radius:8px;padding:0;margin:0}' +
      '.pw-eye:hover{color:#155F87;background:rgba(21,95,135,.08)}.pw-eye:focus-visible{outline:2px solid #155F87}';
    document.head.appendChild(s);
  }

  function add(input) {
    if (input.dataset.pwEye) return;
    input.dataset.pwEye = '1';
    var wrap = document.createElement('span');
    wrap.className = 'pw-eye-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pw-eye';
    b.innerHTML = OPEN;
    b.setAttribute('aria-label', 'Show password');
    b.addEventListener('click', function () {
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      b.innerHTML = show ? SHUT : OPEN;
      b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      input.focus();
    });
    wrap.appendChild(b);
  }

  function scan(root) {
    var list = (root.querySelectorAll ? root : document).querySelectorAll('input[type="password"]');
    for (var i = 0; i < list.length; i++) add(list[i]);
  }

  function start() {
    style();
    scan(document);
    if (window.MutationObserver) {
      new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          for (var j = 0; j < muts[i].addedNodes.length; j++) {
            var n = muts[i].addedNodes[j];
            if (n.nodeType !== 1) continue;
            if (n.matches && n.matches('input[type="password"]')) add(n); else scan(n);
          }
        }
      }).observe(document.body, { childList: true, subtree: true });
    }
  }

  window.calasPwEye = { add: add, scan: scan };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
