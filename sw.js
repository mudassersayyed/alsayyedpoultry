/* Al Sayyed Poultry — Service Worker (offline fallback) */
const CACHE = 'poultry-v1.2';
const SDK = ['app', 'auth', 'firestore'].map(n => 'https://www.gstatic.com/firebasejs/10.12.2/firebase-' + n + '-compat.js');
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon.svg'];

/* Cloudflare /index.html ko / par redirect karta hai; redirect wali copy offline ERR_FAILED deti hai */
async function clean(r){
  if(!r || !r.redirected) return r;
  return new Response(await r.blob(), {status: r.status, statusText: r.statusText, headers: r.headers});
}

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(CORE.map(async u => {
      try { const r = await fetch(u, {cache: 'reload'}); if (r && r.ok) await c.put(u, await clean(r)); } catch (err) {}
    }));
    await Promise.all(SDK.map(u => fetch(u, {mode: 'no-cors'}).then(r => c.put(u, r)).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('poultry-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'www.gstatic.com' && url.pathname.indexOf('/firebasejs/') === 0) {
    /* Firebase scripts: mehfooz copy foran (offline mein bhi login/sync code mile) */
    e.respondWith((async () => {
      const c = await caches.open(CACHE), hit = await c.match(req);
      if (hit) return hit;
      try { const r = await fetch(req); c.put(req, r.clone()); return r; } catch (err) { return new Response('', {status: 504}); }
    })());
    return;
  }
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const net = await fetch(req);
        if (net && net.ok) {
          const c = await caches.open(CACHE);
          const ok = await clean(net.clone());
          c.put('./index.html', ok.clone()); c.put('./', ok.clone());
        }
        return net;
      } catch (err) {
        return (await clean(await caches.match('./index.html'))) || (await clean(await caches.match('./'))) ||
          new Response('<h3 style="font-family:sans-serif;padding:20px">Offline — app abhi mehfooz nahi hui. Ek dafa internet par khol kar dobara try karein.</h3>', {headers: {'Content-Type': 'text/html; charset=utf-8'}});
      }
    })());
    return;
  }

  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req, {ignoreSearch: true});
    const refresh = fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    return (hit && await clean(hit)) || (await refresh) || new Response('', {status: 504});
  })());
});
