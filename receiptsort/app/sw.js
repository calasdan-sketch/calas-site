// ReceiptSort offline support: its own page, rules and the reading engine are kept
// on the device after the first use. Receipts themselves are never stored or sent.
const CACHE = 'receiptsort-v2';
const OWN = ['/receiptsort/app/', '/receiptsort/app/index.html', '/receiptsort/app/parse.js', '/receiptsort/app/manifest.json'];
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
  e.respondWith(fetch(e.request).then((r) => {
    if (r && (r.ok || r.type === 'opaque')) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request)));
});
