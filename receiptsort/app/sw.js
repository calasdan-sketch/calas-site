// ReceiptSort offline support: its own page, rules and the reading engine are kept
// on the device after the first use. Receipts themselves are never stored or sent.
const CACHE = 'receiptsort-v6';
const OWN = ['/receiptsort/app/', '/receiptsort/app/index.html', '/receiptsort/app/parse.js?v=20261113c', '/receiptsort/app/manifest.json'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(OWN))); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  const mine = u.origin === self.location.origin && u.pathname.startsWith('/receiptsort/app/');
  const engine = u.hostname === 'cdn.jsdelivr.net' && /tesseract|pdfjs-dist/.test(u.pathname);
  if (!mine && !engine) return;
  // Our own files: always ask the server for a newer copy (the site tells browsers to keep files 4h).
  const net = mine ? fetch(e.request.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(e.request);
  e.respondWith(net.then((r) => {
    if (r && (r.ok || r.type === 'opaque')) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request)));
});
