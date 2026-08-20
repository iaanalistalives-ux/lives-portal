/* ============================================================
   Portal LIVES — Service Worker
   Estrategia:
     - Navegación (el HTML del portal): RED PRIMERO, SALTANDO LA CACHE DEL NAVEGADOR.
       Antes se pedía a la red con fetch normal, y el navegador respondía con su copia
       guardada (GitHub marca las paginas como validas por varios minutos). En Chrome eso
       se arregla con Ctrl+Shift+R, pero en la app instalada no existe ese atajo: por eso
       la app se quedaba con la version vieja. Con cache:'reload' la peticion ignora esa
       copia y va de verdad al servidor.
       Si no hay internet, se sirve la copia guardada.
     - Iconos y manifest: CACHE PRIMERO (no cambian casi nunca).
     - Todo lo demas (Apps Script, Sheets, dashboards de otros repos, CDNs): NO se
       intercepta. Pasa directo a la red.
   Para forzar que todos los celulares tomen una version nueva, cambia el numero de
   VERSION de abajo (v2 -> v3) y vuelve a subir.
   ============================================================ */

const VERSION    = 'lives-portal-v2';
const CACHE_HTML = VERSION + '-html';
const CACHE_EST  = VERSION + '-estaticos';

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-64.png',
  './icons/favicon-64-dark.png'
];

/* ---------- INSTALACION ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_EST);
    // Se cachea uno por uno: si un archivo falta, no tumba la instalacion completa.
    await Promise.all(SHELL.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (res && res.ok) await cache.put(url, res.clone());
      } catch (e) { /* archivo opcional, se ignora */ }
    }));
    self.skipWaiting();
  })());
});

/* ---------- ACTIVACION: borra versiones viejas ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const nombres = await caches.keys();
    await Promise.all(
      nombres
        .filter((n) => !n.startsWith(VERSION))
        .map((n) => caches.delete(n))
    );
    await self.clients.claim();
  })());
});

/* ---------- INTERCEPCION DE PEDIDOS ---------- */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Solo GET. Nada de POST (formularios a Apps Script pasan intactos).
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Solo lo que vive en este mismo dominio y dentro de la carpeta del portal.
  const enScope = url.origin === self.location.origin &&
                  url.pathname.startsWith(new URL('./', self.location).pathname);
  if (!enScope) return; // dashboards de otros repos, Sheets, CDNs: directo a la red.

  // 1) El HTML del portal -> red de verdad (sin copia del navegador), cache de respaldo.
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith((async () => {
      try {
        // cache:'reload' obliga a ir al servidor e ignora la copia guardada del navegador.
        const fresca = await fetch(req, { cache: 'reload' });
        if (fresca && fresca.ok) {
          const cache = await caches.open(CACHE_HTML);
          cache.put(req, fresca.clone());
        }
        return fresca;
      } catch (e) {
        const cache = await caches.open(CACHE_HTML);
        const guardada = await cache.match(req) ||
                         await cache.match('./index.html') ||
                         await caches.match('./index.html') ||
                         await caches.match('./');
        return guardada || new Response(
          '<!doctype html><meta charset="utf-8">' +
          '<meta name="viewport" content="width=device-width,initial-scale=1">' +
          '<div style="font-family:Calibri,system-ui,sans-serif;background:#F1F6F4;' +
          'color:#0E3B36;min-height:100vh;display:flex;align-items:center;' +
          'justify-content:center;text-align:center;padding:24px">' +
          '<div><h1 style="margin:0 0 8px;font-size:20px">Sin conexion</h1>' +
          '<p style="margin:0;color:#4b5f5b">Conectate a internet y vuelve a abrir el Portal LIVES.</p>' +
          '</div></div>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    })());
    return;
  }

  // 2) Iconos, manifest y estaticos del portal -> cache primero, refresca por detras.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_EST);
    const guardada = await cache.match(req);
    const enRed = fetch(req).then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    return guardada || (await enRed) || Response.error();
  })());
});

/* ---------- Permite actualizar sin cerrar la app ---------- */
self.addEventListener('message', (event) => {
  if (event.data === 'ACTUALIZAR_YA') self.skipWaiting();
});
