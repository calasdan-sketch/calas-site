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
    '.cbar .cbar-in{max-width:1400px;margin:0 auto;padding:16px 40px;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;box-sizing:border-box}' +
    '.cbar .lock{display:flex;align-items:center;gap:12px;text-decoration:none}' +
    '.cbar .crest{width:26px;height:36px;flex:none;display:inline-block;background:#155F87;' +
      '-webkit-mask:url(/favicon.png) center/contain no-repeat;mask:url(/favicon.png) center/contain no-repeat;' +
      'animation:cbarflip 6s linear infinite}' +
    '@keyframes cbarflip{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}' +
    '@media(prefers-reduced-motion:reduce){.cbar .crest,.cfoot .crest{animation:none}}' +
    '.cbar .name{font-family:"Libre Baskerville",Georgia,serif;font-size:19px;font-weight:700;color:#155F87;line-height:1;letter-spacing:-.01em}' +
    '.cbar .sub{display:block;font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:8px;letter-spacing:.24em;color:#6B7883;margin-top:3px;border-top:1.5px solid #155F87;padding-top:3px}' +
    '.cbar nav{display:flex;align-items:center;gap:16px;font-size:17.5px;flex-wrap:wrap}' +
    '.cbar nav a{white-space:nowrap}' +
    '.cbar nav{flex:1}.cbar nav>a:first-child{margin-left:auto}.cbar .nav-signin{margin-left:auto;font-weight:600;color:#12212C;border:1px solid currentColor;padding:8px 14px;border-radius:6px}' +
    '.cbar nav a{text-decoration:none;color:#4E5B66}' +
    '.cbar nav a:hover{color:#155F87}' +
    '.cbar .nav-cta{background:#155F87;color:#fff;padding:9px 16px;border-radius:6px;font-weight:600;font-size:16px}' +
    '.cbar .nav-cta:hover{background:#0E4A6B}' +
    '@media(max-width:1400px){.cbar .cbar-in{padding:16px 22px;gap:14px}.cbar nav{gap:11px}.cbar .nav-cta{padding:9px 12px}}' +
    '@media(max-width:760px){.cbar .cbar-in{padding:10px 16px}.cbar nav{gap:14px;font-size:16px}}' +
    '@media(max-width:760px){.cbar{position:static}}' +
    '@media(max-width:760px){.calas-in-app .cbar,.calas-in-app .cfoot{display:none}}' +
    /* inside an app the site bar scrolls away and the footer is dropped, so neither covers the app's own screens/bottom bar */
    '.calas-in-app .cbar{position:static}.calas-in-app .cfoot{display:none}' +
    '.calas-skip{position:absolute;left:-9999px;top:0;background:#155F87;color:#fff;padding:10px 16px;z-index:2147483647;text-decoration:none}.calas-skip:focus{left:0}' +
    /* footer */
    '.cfoot{margin-top:48px;background:#fff;border-top:2px solid #F0C171;font-family:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#4E5B66}' +
    '.cfoot .cfoot-in{max-width:1240px;margin:0 auto;padding:30px 30px 34px;box-sizing:border-box}' +
    '.cfoot .lock{display:flex;align-items:center;gap:11px;text-decoration:none;margin-bottom:14px}' +
    '.cfoot .crest{width:22px;height:30px;flex:none;display:inline-block;background:#155F87;' +
      '-webkit-mask:url(/favicon.png) center/contain no-repeat;mask:url(/favicon.png) center/contain no-repeat;' +
      'animation:cbarflip 6s linear infinite}' +
    '.cfoot .name{font-family:"Libre Baskerville",Georgia,serif;font-size:16px;font-weight:700;color:#155F87;line-height:1}' +
    '.cfoot .sub{display:block;font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:9px;letter-spacing:.22em;color:#566370;margin-top:2px}' +
    '.cfoot nav{display:flex;flex-wrap:wrap;gap:0 6px;font-size:15px;margin:6px 0 12px}' +
    '.cfoot nav a,.cfoot .fine a{display:inline-flex;align-items:center;min-height:44px;padding:0 8px;box-sizing:border-box}' +
    '.cfoot nav a{text-decoration:none;color:#3F4C57;font-size:15px}' +
    '.cfoot nav a:hover{color:#155F87}' +
    '.cfoot .fine{font-size:14px;color:#4E5B66;line-height:1.5}' +
    '.cfoot .fine a{color:#0E4A6B;text-decoration:underline;padding:0 6px}' +
    '.cfoot .tag{font-family:"Libre Baskerville",Georgia,serif;font-size:14px;color:#12212C;margin:0 0 10px}';

  function ensureStyle() {
    if (document.getElementById('cbar-style')) return;
    var s = document.createElement('style');
    s.id = 'cbar-style';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  // Footer list: every product, so nothing is only reachable through the "More tools" menu.
  var FOOTNAV =
    '<a href="/accounting/">On File</a>' +
    '<a href="/quote-me/">Quote Me</a>' +
    '<a href="/leadme/">Lead Me</a>' +
    '<a href="/haul-me/">Haul Me</a>' +
    '<a href="/watchpost/">Watchpost</a>' +
    '<a href="/dispatchme/">Dispatch Me</a>' +
    '<a href="/receiptsort/">ReceiptSort</a>' +
    '<a href="/guardian/">ScamCatch</a>' +
    '<a href="/dropwatch/">Dropwatch</a>' +
    '<a href="/tools/">All tools</a>' +
    '<a href="/pay/">Pricing</a>' +
    '<a href="/demo/">Demo</a>' +
    '<a href="/about/">About</a>';

  // Header list for pages that have no menu of their own (same markup as the static pages).
  var MORE = [['/trades/','On File for trades','Sub insurance and WCB tracking'],['/leadme/','Lead Me','B2B lead finder and first emails'],['/haul-me/','Haul Me','Cost per mile for owner-operators'],['/watchpost/','Watchpost','Intrusion decoys and alerts'],['/dispatchme/','Dispatch Me','Snow and lawn crews, Winnipeg'],['/receiptsort/','ReceiptSort','Free receipts to spreadsheet'],['/guardian/','ScamCatch','Free scam message checker'],['/dropwatch/','Dropwatch','Free card and sneaker price tracker']];
  function headNav() {
    var p = location.pathname;
    function a(h, l) { var cur = p.indexOf(h) === 0 ? ' class="on" aria-current="page"' : ''; return '<a href="' + h + '"' + cur + '>' + l + '</a>'; }
    var items = MORE.map(function (m) { return '<a href="' + m[0] + '">' + m[1] + '<small>' + m[2] + '</small></a>'; }).join('');
    return a('/accounting/', 'On File') + a('/quote-me/', 'Quote Me') + a('/pay/', 'Pricing') + a('/demo/', 'Demo') + a('/about/', 'About') +
      '<div class="nav-more"><button class="more-btn" type="button" aria-expanded="false" aria-controls="more-menu">More tools</button><span class="more-label">More tools</span>' +
      '<div class="more-menu" id="more-menu">' + items + '<a class="all" href="/tools/">All tools and prices</a></div></div>' +
      '<a href="/signin/" class="nav-signin">Sign in</a><a class="nav-cta" href="/quote-me/app/">Start free</a>';
  }
  function loadNavAssets() {
    if (!document.querySelector('link[href*="calas-nav.css"]')) {
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/calas-nav.css?v=20261027a'; document.head.appendChild(l);
    }
    if (window.__calasNavInit) { window.__calasNavInit(); return; }
    var s = document.createElement('script'); s.src = '/calas-nav.js?v=20261027a'; document.head.appendChild(s);
  }

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
        '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="nt-bars" aria-hidden="true"></span><span class="nt-lab">Menu</span></button>' +
        '<nav class="site-nav" id="site-nav" aria-label="Primary">' + headNav() + '</nav>' +
      '</div>';
    document.body.insertBefore(bar, document.body.firstChild);
    // a11y: skip-to-content link as the very first focusable element
    var main = document.querySelector('main') || bar.nextElementSibling;
    if (main && !main.id) main.id = 'main';
    if (!document.querySelector('.skip-link,.calas-skip')) {
      var skip = document.createElement('a');
      skip.className = 'calas-skip';
      skip.href = '#' + ((main && main.id) || 'main');
      skip.textContent = 'Skip to content';
      document.body.insertBefore(skip, document.body.firstChild);
    }
    loadNavAssets(); // the menu button and dropdown behaviour live in calas-nav.js
  }

  function footerHTML() {
    return '<div class="cfoot-in">' +
      '<a class="lock" href="/" aria-label="Calas Automations home">' +
        '<span class="crest" aria-hidden="true"></span>' +
        '<span><span class="name">Calas</span><span class="sub">AUTOMATIONS</span></span>' +
      '</a>' +
      '<p class="tag">Small automations, built properly.</p>' +
      '<nav aria-label="Footer">' + FOOTNAV + '<a href="/signin/">Sign in</a></nav>' +
      '<p class="fine">Winnipeg, Manitoba &middot; prices in CAD plus GST/RST where applicable &middot; cancel any time, never billed again.<br>' +
      '&copy; ' + (new Date().getFullYear()) + ' Calas Automations Inc. &middot; ' + '<a href="/terms/">Terms</a> &middot; <a href="/privacy/">Privacy</a> &middot; ' +
      '<a href="tel:+14312449026" data-cara>Ask Cara</a> &middot; <a href="tel:+14312449026">Call (431) 244-9026</a> &middot; <a href="mailto:office@calasautomations.com">office@calasautomations.com</a></p>' +
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

  // On a product's own page, "Sign in" should drop the customer straight into
  // that app's login — not back to the /signin/ app-picker (owner, 2026-10-11).
  // Each product's real login (from /signin/ cards):
  var APP_LOGIN = [
    ['/accounting', 'https://onfile.calasautomations.com/'],
    ['/leadme',     'https://leadme.calasautomations.com/'],
    ['/quote-me',   '/quote-me/app/'],
    ['/haul-me',    'https://haulme.calasautomations.com/'],
    ['/watchpost',  '/watchpost/account/']
  ];
  function routeSignin() {
    var path = location.pathname, login = null;
    for (var i = 0; i < APP_LOGIN.length; i++) {
      var p = APP_LOGIN[i][0];
      if (path === p || path.indexOf(p + '/') === 0) { login = APP_LOGIN[i][1]; break; }
    }
    if (!login) return; // non-app pages (home, pricing, about...) keep the picker
    var links = document.querySelectorAll('a.nav-signin');
    for (var j = 0; j < links.length; j++) links[j].setAttribute('href', login);
  }

  function run() {
    if (!document.body) return;
    // Inside a working app (Quote Me, ReceiptSort...) the app has its own
    // header and menu; on a phone the Calas bar and footer only take room
    // from it (2026-09-29, owner). Desktop keeps them.
    if (/^\/[a-z-]+\/app\//.test(location.pathname)) document.documentElement.classList.add('calas-in-app');
    ensureStyle();
    injectMasthead();
    injectFooter();
    routeSignin();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
