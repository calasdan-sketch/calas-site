/* Ask Cara - the chat box on every Calas page and app (2026-09-28).
 * Add to any page:  <script src="https://calasautomations.com/cara/cara.js" data-app="leadme" defer></script>
 * data-app: site | onfile | leadme | quoteme | haulme | watchpost | dispatchme
 * Cara answers from what Calas actually sells (see calas-access src/cara-knowledge.js)
 * and hands anything else to the team. The chat stays in this browser tab only.
 */
(function () {
  if (window.__calasCara) return;
  window.__calasCara = true;
  var me = document.currentScript;
  var APP = (me && me.getAttribute('data-app')) || 'site';
  var API = 'https://calas-access.calasdan.workers.dev/api/cara';
  var HELLO = {
    site: "Hi, I'm Cara. Ask me anything about Calas Automations: what each app does, prices, or how to get started.",
    onfile: "Hi, I'm Cara. Ask me how On File chases documents, or anything about your account setup.",
    leadme: "Hi, I'm Cara. Ask me how Lead Me finds and scores leads, or how to get set up in Settings.",
    quoteme: "Hi, I'm Cara. Ask me how Quote Me turns a voice note into a priced quote.",
    haulme: "Hi, I'm Cara. Ask me how Haul Me works out your floor rate.",
    watchpost: "Hi, I'm Cara. Ask me how Watchpost's decoys and alerts work.",
    dispatchme: "Hi, I'm Cara. Ask me how Dispatch Me covers your lots all winter.",
    guardian: "Hi, I'm Cara. Not sure about a message? Tell me what it says and I'll help you think it through."
  };
  var CHIPS = APP === 'guardian'
    ? ['Is Guardian free?', 'What if I already sent money?', 'Is my message private?']
    : ['What does it cost?', 'How do I get started?', 'Is my data private?'];

  var css = '' +
    '.cc-btn{position:fixed;right:18px;left:auto;bottom:18px;width:auto;margin:0;z-index:2147483000;display:flex;align-items:center;gap:10px;background:#fff;color:#12212C;' +
    'border:1px solid #D9E3EA;border-radius:999px;padding:11px 16px;font:500 14.5px "IBM Plex Sans",system-ui,sans-serif;cursor:pointer;' +
    'box-shadow:0 10px 30px -8px rgba(11,46,69,.35)}' +
    '.cc-btn:hover,.cc-btn:focus-visible{border-color:#155F87;outline:none}' +
    '.cc-dot{width:10px;height:10px;border-radius:50%;background:#17794A;box-shadow:0 0 0 3px #E9F5EE}' +
    '.cc-win{position:fixed;right:18px;bottom:74px;z-index:2147483001;width:min(380px,calc(100vw - 36px));height:min(520px,calc(100vh - 110px));' +
    'background:#fff;border:1px solid #D9E3EA;border-radius:12px;box-shadow:0 24px 60px -20px rgba(11,46,69,.45);display:none;flex-direction:column;' +
    'overflow:hidden;font:14.5px/1.5 "IBM Plex Sans",system-ui,sans-serif;color:#12212C}' +
    '.cc-win.on{display:flex}' +
    '.cc-hd{display:flex;align-items:center;gap:11px;padding:11px 14px;background:linear-gradient(135deg,#0B2E45,#123C57);color:#fff;border-bottom:2px solid #B9812E}' +
    '.cc-lg{width:28px;height:28px;border-radius:6px;background:#fff;color:#0B2E45;display:grid;place-items:center;font:700 14px "Libre Baskerville",Georgia,serif;flex:none}' +
    '.cc-hd b{display:block;font-size:14.5px;font-weight:600}.cc-hd span{font-size:12px;opacity:.85}' +
    '.cc-win .cc-x{margin:0 0 0 auto;width:auto;min-width:0;background:transparent;border:0;box-shadow:none;color:#fff;font-size:20px;line-height:1;padding:2px 6px;cursor:pointer;flex:none}' +
    '.cc-hd > div{flex:1;min-width:0}' +
    '.cc-log{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:9px;background:#F4F8FA}' +
    '.cc-m{max-width:85%;padding:9px 12px;border-radius:12px;white-space:pre-wrap;word-wrap:break-word}' +
    '.cc-m.a{background:#fff;border:1px solid #DCE5EB;align-self:flex-start;border-bottom-left-radius:4px}' +
    '.cc-m.u{background:#155F87;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}' +
    '.cc-m.t{color:#7A868F;font-style:italic;background:transparent;border:0;padding:2px 4px}' +
    '.cc-chips{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px 0;background:#F4F8FA}' +
    '.cc-win .cc-chip{width:auto;min-width:0;margin:0;box-shadow:none;text-align:left;border:1px solid #D3E2EF;background:#fff;color:#0E4A6B;border-radius:999px;' +
    'padding:5px 11px;font:500 12.5px/1.3 "IBM Plex Sans",system-ui,sans-serif;cursor:pointer}' +
    // Scoped with the .cc-win prefix and explicit resets so a host page's own
    // input/button rules (e.g. full-width buttons) can't squash the box.
    '.cc-win .cc-in{display:flex;flex-direction:column;align-items:stretch;gap:8px;padding:10px 12px;margin:0;border-top:1px solid #DCE5EB;background:#fff}' +
    '.cc-win .cc-in textarea{display:block;box-sizing:border-box;width:100%;min-height:4.9em;max-height:9em;margin:0;resize:none;' +
    'border:1px solid #D9E3EA;border-radius:8px;padding:9px 10px;font:14.5px/1.45 "IBM Plex Sans",system-ui,sans-serif;color:#12212C;background:#fff}' +
    '.cc-win .cc-in textarea:focus{outline:2px solid #155F87;outline-offset:1px}' +
    '.cc-win .cc-in button{align-self:flex-end;width:auto;min-width:0;margin:0;background:#155F87;color:#fff;border:0;border-radius:8px;' +
    'padding:7px 18px;font:600 14px "IBM Plex Sans",system-ui,sans-serif;cursor:pointer;box-shadow:none}' +
    '@media(max-width:560px){.cc-win{right:8px;left:8px;width:auto;bottom:70px;height:calc(100vh - 90px);height:calc(100dvh - 90px)}}' +
    '.cc-note{font-size:11.5px;color:#7A868F;padding:0 12px 9px;background:#fff}' +
    '@media print{.cc-btn,.cc-win{display:none!important}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var btn = document.createElement('button');
  btn.className = 'cc-btn'; btn.type = 'button';
  btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span class="cc-dot" aria-hidden="true"></span><span><b>Ask Cara</b></span>';
  var win = document.createElement('div');
  win.className = 'cc-win'; win.setAttribute('role', 'dialog'); win.setAttribute('aria-label', 'Chat with Cara');
  win.innerHTML = '<div class="cc-hd"><span class="cc-lg" aria-hidden="true">C</span><div><b>Cara</b><span>Calas Automations assistant</span></div>' +
    '<button class="cc-x" type="button" aria-label="Close chat">&times;</button></div>' +
    '<div class="cc-log" aria-live="polite"></div><div class="cc-chips"></div>' +
    '<form class="cc-in"><textarea rows="3" maxlength="800" placeholder="Type your question…" aria-label="Your question"></textarea><button type="submit">Send</button></form>' +
    '<div class="cc-note">Cara can make mistakes. Anything important, call 431-244-9026.</div>';
  document.body.appendChild(btn); document.body.appendChild(win);

  var log = win.querySelector('.cc-log'), form = win.querySelector('form'), input = form.querySelector('textarea'),
      chips = win.querySelector('.cc-chips'), history = [], busy = false;

  function add(text, who) {
    var d = document.createElement('div'); d.className = 'cc-m ' + who; d.textContent = text;
    log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  function open(on) {
    win.classList.toggle('on', on); btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on) { if (!log.childElementCount) add(HELLO[APP] || HELLO.site, 'a'); setTimeout(function () { input.focus(); }, 50); }
    else btn.focus();
  }
  function ask(q) {
    q = String(q || '').trim(); if (!q || busy) return;
    busy = true; chips.innerHTML = ''; add(q, 'u'); history.push({ role: 'user', content: q });
    var typing = add('Cara is typing…', 't');
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ app: APP, messages: history.slice(-10) }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var reply = (d && d.reply) || "Sorry, I couldn't answer that. Please call 431-244-9026.";
        typing.remove(); add(reply, 'a'); history.push({ role: 'assistant', content: reply });
      })
      .catch(function () { typing.remove(); add("I can't connect right now. Please call 431-244-9026.", 'a'); })
      .then(function () { busy = false; input.focus(); });
  }
  CHIPS.forEach(function (c) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'cc-chip'; b.textContent = c;
    b.addEventListener('click', function () { ask(c); }); chips.appendChild(b);
  });
  btn.addEventListener('click', function () { open(!win.classList.contains('on')); });
  win.querySelector('.cc-x').addEventListener('click', function () { open(false); });
  form.addEventListener('submit', function (e) { e.preventDefault(); var q = input.value; input.value = ''; ask(q); });
  // Enter sends; Shift+Enter starts a new line.
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true })); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && win.classList.contains('on')) open(false); });
  // Contact links (data-cara, or href="#cara") open this chat instead of dialing; phones still dial.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-cara], a[href="#cara"]');
    if (!a || (/^tel:/.test(a.getAttribute('href') || '') && matchMedia('(pointer:coarse)').matches)) return;
    e.preventDefault(); open(true);
  });
  if (location.hash === '#cara') open(true);
})();
