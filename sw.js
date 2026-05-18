const CACHE = 'mi-depenses-v29';
const CORE = [
  './', './index.html', './manifest.json', './icon.svg', './favicon.svg', './styles.css',
  './js/constants.js', './js/state.js', './js/storage.js', './js/helpers.js',
  './js/ui.js', './js/lock.js', './js/photo.js', './js/gist.js',
  './js/modal-add.js', './js/modal-detail.js',
  './js/render-dashboard.js', './js/render-list.js', './js/render-cash.js',
  './js/render-remb.js', './js/render-settings.js', './js/render-settings-pay.js',
  './js/gains.js', './js/app.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Network-first for Google Fonts (online), cache-first for local assets
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(resp => {
            if (resp && resp.status === 200) cache.put(e.request, resp.clone());
            return resp;
          }).catch(() => cached);
        })
      )
    );
    return;
  }
  // Cache-first for local assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
        }
        return resp;
      }).catch(() => {
        if (e.request.destination === 'document') return caches.match('./index.html');
      });
    })
  );
});
