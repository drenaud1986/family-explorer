// Service worker : application disponible hors connexion
const VERSION = 'fe-v3';
const SHELL = `shell-${VERSION}`;
const RUNTIME = 'runtime-v1';
const TILES = 'tiles-v1';
const MAX_TILES = 600;

const FILES = [
  './', './index.html', './manifest.webmanifest', './css/app.css',
  './js/app.js', './js/data.js', './js/data-extra.js', './js/generator.js', './js/store.js', './js/souvenir.js', './js/art.js', './js/photos.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png',
];
const EXTRA = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    await c.addAll(FILES);
    try { const r = await caches.open(RUNTIME); await r.addAll(EXTRA); } catch { /* hors ligne à l'installation */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('shell-') && k !== SHELL) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function trimTiles() {
  const c = await caches.open(TILES); const keys = await c.keys();
  for (let i = 0; i < keys.length - MAX_TILES; i++) await c.delete(keys[i]);
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Météo : toujours en ligne
  if (url.hostname === 'api.open-meteo.com') return;

  // Tuiles de carte : cache d'abord
  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    e.respondWith((async () => {
      const c = await caches.open(TILES);
      const hit = await c.match(req); if (hit) return hit;
      try { const res = await fetch(req); if (res.ok) { c.put(req, res.clone()); trimTiles(); } return res; }
      catch { return new Response('', { status: 504 }); }
    })());
    return;
  }

  // Application : réseau d'abord (délai court), sinon cache -> toujours à jour, et fonctionne hors connexion
  if (url.origin === location.origin) {
    e.respondWith((async () => {
      const c = await caches.open(SHELL);
      try {
        const res = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000))]);
        if (res.ok) c.put(req, res.clone());
        return res;
      } catch {
        return (await c.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? await c.match('./index.html') : null) || new Response('Hors connexion', { status: 503 });
      }
    })());
    return;
  }

  // Polices et bibliothèques : périmé-pendant-revalidation
  if (['fonts.googleapis.com', 'fonts.gstatic.com', 'unpkg.com', 'upload.wikimedia.org', 'thumb.wikimedia.org'].includes(url.hostname)) {
    e.respondWith((async () => {
      const c = await caches.open(RUNTIME);
      const hit = await c.match(req);
      const net = fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => null);
      return hit || (await net) || new Response('', { status: 504 });
    })());
  }
});
