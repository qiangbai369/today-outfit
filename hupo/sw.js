'use strict';
importScripts('./offline-assets.js');
const SCOPE = self.registration.scope;
const PREFIX = 'outfit-pwa:' + new URL(SCOPE).pathname + ':';
const CACHE = PREFIX + self.OUTFIT_OFFLINE.version;
const INDEX = new URL('index.html', SCOPE).href;
const MARKER = new URL('__offline_complete__', SCOPE).href;
const ASSETS = new Map(self.OUTFIT_OFFLINE.assets.map(entry => [new URL(entry.url, SCOPE).href, entry]));
const canonical = value => { const url = new URL(value); url.search = ''; url.hash = ''; return url.href; };
async function digest(response) {
  const hash = await crypto.subtle.digest('SHA-256', await response.clone().arrayBuffer());
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2,'0')).join('');
}
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE), queue = [...ASSETS.entries()];
  try {
    const results = await Promise.allSettled(Array.from({length:6}, async () => {
      while (queue.length) {
        const [url, entry] = queue.shift();
        const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 45000);
        let response;
        try { response = await fetch(new Request(url, {cache:'reload', credentials:'same-origin'}), {signal:controller.signal}); }
        finally { clearTimeout(timer); }
        if (!response.ok || await digest(response) !== entry.sha256) throw new Error('Incomplete offline release');
        await cache.put(url, response);
      }
    }));
    if (results.some(result => result.status === 'rejected')) throw new Error('Incomplete offline release');
    await cache.put(MARKER, new Response(self.OUTFIT_OFFLINE.version));
    if (!self.registration.active) await self.skipWaiting();
  } catch (error) { await caches.delete(CACHE); throw error; }
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  if (!await cache.match(MARKER)) throw new Error('Offline release is not complete');
  await self.clients.claim();
  const names = await caches.keys();
  await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE).map(name => caches.delete(name)));
})()));
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') event.waitUntil(self.skipWaiting());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url), scope = new URL(SCOPE);
  if (url.origin !== scope.origin) return;
  let key = canonical(url.href);
  if (event.request.mode === 'navigate' && (url.pathname === scope.pathname || key === INDEX)) key = INDEX;
  if (!ASSETS.has(key)) return;
  event.respondWith((async () => {
    const cached = await (await caches.open(CACHE)).match(key);
    if (cached) return cached;
    // Never store an unverified network response in this version's release cache.
    return fetch(event.request);
  })());
});
