/* calas-nav.js (2026-10-27): behaviour for the shared header menu.
   - "More tools" dropdown: button toggles it, Esc closes it and returns focus, a click outside
     or tabbing out closes it, ArrowDown from the button moves into the list.
   - Menu button (under 760px) opens and closes the whole menu.
   Works without this file too: every link is a plain link and the dropdown list is in the page. */
(function () {
  function init(root) {
    var header = root.closest('header') || root.parentNode;
    var toggle = header.querySelector('.nav-toggle');
    if (toggle && !toggle.__bound) {
      toggle.__bound = true;
      toggle.addEventListener('click', function () {
        var open = header.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        var lab = toggle.querySelector('.nt-lab'); if (lab) lab.textContent = open ? 'Close' : 'Menu';
      });
    }
    var more = root.querySelector('.nav-more'), btn = more && more.querySelector('.more-btn');
    if (!more || !btn || btn.__bound) return;
    btn.__bound = true;
    function setOpen(on, refocus) {
      more.classList.toggle('open', on);
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      if (!on && refocus) btn.focus();
    }
    btn.addEventListener('click', function () { setOpen(!more.classList.contains('open')); });
    more.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && more.classList.contains('open')) { e.preventDefault(); setOpen(false, true); }
      if (e.key === 'ArrowDown' && e.target === btn) {
        e.preventDefault(); setOpen(true);
        var a = more.querySelector('.more-menu a'); if (a) a.focus();
      }
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && e.target.closest && e.target.closest('.more-menu')) {
        var items = [].slice.call(more.querySelectorAll('.more-menu a')), i = items.indexOf(e.target);
        if (i > -1) { e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus(); }
      }
    });
    more.addEventListener('focusout', function (e) { if (!more.contains(e.relatedTarget)) setOpen(false); });
    document.addEventListener('click', function (e) { if (!more.contains(e.target)) setOpen(false); });
  }
  function run() { [].forEach.call(document.querySelectorAll('nav.site-nav'), init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  window.__calasNavInit = run;
})();
