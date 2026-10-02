// Guardian offline support. Network first (so updates always arrive), saved copy when offline.
// Only Guardian's own files are handled; scam-database lookups go straight to the network.
const CACHE = 'guardian-v8';
const ASSETS = ['/guardian/', '/guardian/index.html', '/guardian/manifest.json', '/guardian/scamcheck.js'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
  self.skipWaiting();
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
// "Share to Guardian" (Android): the phone POSTs the shared text, link or picture
// here. Keep it in this phone's cache only and open Guardian to read it.
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'POST' || u.pathname !== '/guardian/share') return;
  e.respondWith(e.request.formData().then(function (f) {
    var text = [f.get('title'), f.get('text'), f.get('url')].filter(Boolean).join('\n');
    var img = f.get('image');
    return caches.open('guardian-share').then(function (c) {
      var puts = [c.put('/guardian/_shared-text', new Response(text))];
      if (img && img.size) puts.push(c.put('/guardian/_shared-image', new Response(img, { headers: { 'Content-Type': img.type || 'image/png' } })));
      else puts.push(c.delete('/guardian/_shared-image'));
      return Promise.all(puts);
    });
  }).then(function () { return Response.redirect('/guardian/?shared=1', 303); },
          function () { return Response.redirect('/guardian/', 303); }));
});
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.indexOf('/guardian/') !== 0) return;
  e.respondWith(fetch(e.request).then(function (r) {
    if (r && r.ok) { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
    return r;
  }).catch(function () { return caches.match(e.request); }));
});
