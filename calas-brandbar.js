/* calas-brandbar.js — drops the Calas crest masthead onto app/utility screens
   that don't already have the marketing masthead. Self-gating and self-styled
   (carries its own CSS) so it renders correctly even if a page's own stylesheet
   is cached or missing. Does nothing on pages that already show .mast/.lockup. */
(function () {
  var CSS =
    '.cbar{position:sticky;top:0;z-index:1000;background:#fff;border-bottom:1px solid #DCE6ED;font-family:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
    '.cbar::after{content:"";display:block;height:2px;background:linear-gradient(90deg,transparent,#F0C171,transparent)}' +
    '.cbar .cbar-in{max-width:1060px;margin:0 auto;padding:12px 22px;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;box-sizing:border-box}' +
    '.cbar .lock{display:flex;align-items:center;gap:12px;text-decoration:none}' +
    '.cbar .crest{width:26px;height:36px;flex:none;display:inline-block;background:#155F87;' +
      '-webkit-mask:url(/favicon.png) center/contain no-repeat;mask:url(/favicon.png) center/contain no-repeat;' +
      'animation:cbarflip 6s linear infinite}' +
    '@keyframes cbarflip{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}' +
    '@media(prefers-reduced-motion:reduce){.cbar .crest{animation:none}}' +
    '.cbar .name{font-family:"Libre Baskerville",Georgia,serif;font-size:19px;font-weight:700;color:#155F87;line-height:1;letter-spacing:-.01em}' +
    '.cbar .sub{display:block;font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:8px;letter-spacing:.24em;color:#6B7883;margin-top:3px;border-top:1.5px solid #155F87;padding-top:3px}' +
    '.cbar nav{display:flex;align-items:center;gap:14px;font-size:13px;flex-wrap:wrap}' +
    '.cbar nav a{text-decoration:none;color:#4E5B66}' +
    '.cbar nav a:hover{color:#155F87}' +
    '.cbar .nav-cta{background:#155F87;color:#fff;padding:9px 16px;border-radius:6px;font-weight:600}' +
    '.cbar .nav-cta:hover{background:#0E4A6B}' +
    '@media(max-width:760px){.cbar .cbar-in{padding:10px 16px}.cbar nav{gap:12px;font-size:12.5px}}';

  function inject() {
    if (!document.body) return;
    if (document.querySelector('.mast, .lockup, .cbar')) return; // already branded

    if (!document.getElementById('cbar-style')) {
      var s = document.createElement('style');
      s.id = 'cbar-style';
      s.textContent = CSS;
      document.head.appendChild(s);
    }

    var bar = document.createElement('header');
    bar.className = 'cbar';
    bar.innerHTML =
      '<div class="cbar-in">' +
        '<a class="lock" href="/" aria-label="Calas Automations home">' +
          '<span class="crest" aria-hidden="true"></span>' +
          '<span><span class="name">Calas</span><span class="sub">AUTOMATIONS</span></span>' +
        '</a>' +
        '<nav>' +
          '<a href="/">Home</a>' +
          '<a href="/accounting/">On File</a>' +
          '<a href="/leadme/">Lead Me</a>' +
          '<a href="/quote-me/">Quote Me</a>' +
          '<a href="/haul-me/">Haul Me</a>' +
          '<a href="/watchpost/">Watchpost</a>' +
          '<a href="/dispatchme/">Dispatch Me</a>' +
          '<a href="/receiptsort/">ReceiptSort</a>' +
          '<a href="/guardian/">Guardian</a>' +
          '<a href="/pay/">Pricing</a>' +
          '<a class="nav-cta" href="mailto:dan@calasautomations.com?subject=Calas%20Automations%20%E2%80%94%2015%20minutes">Book 15 minutes</a>' +
        '</nav>' +
      '</div>';
    document.body.insertBefore(bar, document.body.firstChild);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();
