/* calas-brandbar.js — shared Calas chrome.
   1) Crest masthead on app/utility screens that lack the marketing masthead (self-gating).
   2) One unified footer on every page.
   Self-styled (carries its own CSS) so it renders correctly even if a page's own
   stylesheet is cached or missing. */
(function () {
  var CSS =
    /* masthead */
    '.cbar{position:sticky;top:0;z-index:1000;background:#fff;border-bottom:1px solid #DCE6ED;font-family:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
    '.cbar::after{content:"";display:block;height:2px;background:linear-gradient(90deg,transparent,#F0C171,transparent)}' +
    '.cbar .cbar-in{max-width:1240px;margin:0 auto;padding:12px 30px;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;box-sizing:border-box}' +
    '.cbar .lock{display:flex;align-items:center;gap:12px;text-decoration:none}' +
    '.cbar .crest{width:26px;height:36px;flex:none;display:inline-block;background:#155F87;' +
      '-webkit-mask:url(/favicon.png) center/contain no-repeat;mask:url(/favicon.png) center/contain no-repeat;' +
      'animation:cbarflip 6s linear infinite}' +
    '@keyframes cbarflip{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}' +
    '@media(prefers-reduced-motion:reduce){.cbar .crest,.cfoot .crest{animation:none}}' +
    '.cbar .name{font-family:"Libre Baskerville",Georgia,serif;font-size:19px;font-weight:700;color:#155F87;line-height:1;letter-spacing:-.01em}' +
    '.cbar .sub{display:block;font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:8px;letter-spacing:.24em;color:#6B7883;margin-top:3px;border-top:1.5px solid #155F87;padding-top:3px}' +
    '.cbar nav{display:flex;align-items:center;gap:15px;font-size:15.5px;flex-wrap:wrap}' +
    '.cbar nav a{text-decoration:none;color:#4E5B66}' +
    '.cbar nav a:hover{color:#155F87}' +
    '.cbar .nav-cta{background:#155F87;color:#fff;padding:9px 16px;border-radius:6px;font-weight:600}' +
    '.cbar .nav-cta:hover{background:#0E4A6B}' +
    '@media(max-width:760px){.cbar .cbar-in{padding:10px 16px}.cbar nav{gap:14px;font-size:15px}}' +
    /* footer */
    '.cfoot{margin-top:48px;background:#fff;border-top:2px solid #F0C171;font-family:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#4E5B66}' +
    '.cfoot .cfoot-in{max-width:1240px;margin:0 auto;padding:30px 30px 34px;box-sizing:border-box}' +
    '.cfoot .lock{display:flex;align-items:center;gap:11px;text-decoration:none;margin-bottom:14px}' +
    '.cfoot .crest{width:22px;height:30px;flex:none;display:inline-block;background:#155F87;' +
      '-webkit-mask:url(/favicon.png) center/contain no-repeat;mask:url(/favicon.png) center/contain no-repeat;' +
      'animation:cbarflip 6s linear infinite}' +
    '.cfoot .name{font-family:"Libre Baskerville",Georgia,serif;font-size:16px;font-weight:700;color:#155F87;line-height:1}' +
    '.cfoot .sub{display:block;font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:7.5px;letter-spacing:.22em;color:#6B7883;margin-top:2px}' +
    '.cfoot nav{display:flex;flex-wrap:wrap;gap:10px 18px;font-size:13.5px;margin:6px 0 16px}' +
    '.cfoot nav a{text-decoration:none;color:#4E5B66}' +
    '.cfoot nav a:hover{color:#155F87}' +
    '.cfoot .fine{font-size:12.5px;color:#6B7883;line-height:1.6}' +
    '.cfoot .fine a{color:#4E5B66}' +
    '.cfoot .tag{font-family:"Libre Baskerville",Georgia,serif;font-size:14px;color:#12212C;margin:0 0 10px}';

  function ensureStyle() {
    if (document.getElementById('cbar-style')) return;
    var s = document.createElement('style');
    s.id = 'cbar-style';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  var NAV =
    '<a href="/">Home</a>' +
    '<a href="/accounting/">On File</a>' +
    '<a href="/leadme/">Lead Me</a>' +
    '<a href="/quote-me/">Quote Me</a>' +
    '<a href="/haul-me/">Haul Me</a>' +
    '<a href="/watchpost/">Watchpost</a>' +
    '<a href="/dispatchme/">Dispatch Me</a>' +
    '<a href="/receiptsort/">ReceiptSort</a>' +
    '<a href="/guardian/">Guardian</a>' +
    '<a href="/pay/">Pricing</a>';

  function injectMasthead() {
    if (document.querySelector('.mast, .lockup, .cbar')) return; // already branded
    var bar = document.createElement('header');
    bar.className = 'cbar';
    bar.innerHTML =
      '<div class="cbar-in">' +
        '<a class="lock" href="/" aria-label="Calas Automations home">' +
          '<span class="crest" aria-hidden="true"></span>' +
          '<span><span class="name">Calas</span><span class="sub">AUTOMATIONS</span></span>' +
        '</a>' +
        '<nav>' + NAV +
          '<a class="nav-cta" href="mailto:dan@calasautomations.com?subject=Calas%20Automations%20%E2%80%94%2015%20minutes">Book 15 minutes</a>' +
        '</nav>' +
      '</div>';
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function footerHTML() {
    return '<div class="cfoot-in">' +
      '<a class="lock" href="/" aria-label="Calas Automations home">' +
        '<span class="crest" aria-hidden="true"></span>' +
        '<span><span class="name">Calas</span><span class="sub">AUTOMATIONS</span></span>' +
      '</a>' +
      '<p class="tag">Small automations, built properly.</p>' +
      '<nav>' + NAV + '<a href="/signin/">Sign in</a></nav>' +
      '<p class="fine">Winnipeg, Manitoba &middot; prices in CAD plus GST/RST where applicable &middot; 30 days’ notice to cancel, always.<br>' +
      '&copy; ' + (new Date().getFullYear()) + ' Calas Automations Inc. &middot; ' +
      '<a href="mailto:dan@calasautomations.com">dan@calasautomations.com</a> &middot; (431) 244-9026</p>' +
    '</div>';
  }

  function injectFooter() {
    if (document.querySelector('.cfoot')) return;
    var existing = document.querySelector('footer');
    if (existing) {
      existing.classList.add('cfoot');
      existing.innerHTML = footerHTML();
    } else {
      var f = document.createElement('footer');
      f.className = 'cfoot';
      f.innerHTML = footerHTML();
      document.body.appendChild(f);
    }
  }

  function run() {
    if (!document.body) return;
    ensureStyle();
    injectMasthead();
    injectFooter();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
