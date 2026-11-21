// Service Worker der Morgengold-Tour-App.
// Er wird gebraucht, damit sich die App auf dem Startbildschirm installieren lässt.
// v=180 (beide Versionen): Er hebt die Kartenteile von OpenFreeMap (Kartenkacheln, Schriften, Symbole) und das Kartenprogramm
// auf dem Handy auf. Einmal geladene Gegenden kommen dann ohne Internet vom Handy: weniger Datenvolumen, weniger Akku, auch im Funkloch.
// Es werden nur Kartendaten gespeichert, keine Kunden- oder Standortdaten. Höchstens ca. 12000 Teile, die ältesten fliegen raus.
// Das frühere Android-Teilen-Ziel ist entfernt; alte geteilte Dateien werden gelöscht.
const MAP_CACHE = "navi-vkarte", MAP_MAX = 12000;
let puts = 0;
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil((async () => { await caches.delete("geteilte-dateien"); await self.clients.claim(); })()));

// Kartenkacheln haben eine Versionsnummer im Pfad (/planet/<Version>/z/x/y.pbf), Schriften und Symbole ändern sich kaum:
// erst auf dem Handy nachsehen, sonst laden und merken. Der Kartenstil (/styles/…) und die Kachel-Liste (/planet ohne Kachel)
// zeigen auf die neueste Version: erst aus dem Netz, ohne Netz die gemerkte Fassung.
function kind(u) {
  if (u.hostname === "tiles.openfreemap.org") {
    if (/^\/(fonts|sprites)\//.test(u.pathname) || /^\/[^/]+\/[^/]+\/\d+\/\d+\/\d+\.pbf$/.test(u.pathname)) return "fest";
    return "neu";
  }
  if (u.hostname === "cdnjs.cloudflare.com" && /\/maplibre-gl\//.test(u.pathname)) return "fest"; // Kartenprogramm mit fester Versionsnummer
  return "";
}
async function trim(c) {
  if (++puts % 300) return;
  const k = await c.keys(); if (k.length > MAP_MAX) await Promise.all(k.slice(0, k.length - MAP_MAX + 1000).map(q => c.delete(q)));
}
async function store(c, req, res) { if (res && res.ok && res.type !== "opaque") { await c.put(req, res); await trim(c); } }
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  let u; try { u = new URL(req.url); } catch (x) { return; }
  const k = kind(u); if (!k) return;
  e.respondWith((async () => {
    const c = await caches.open(MAP_CACHE);
    if (k === "fest") {
      const hit = await c.match(req); if (hit) return hit;
      const res = await fetch(req); e.waitUntil(store(c, req, res.clone()).catch(() => {})); return res;
    }
    try { const res = await fetch(req); e.waitUntil(store(c, req, res.clone()).catch(() => {})); return res; }
    catch (x) { const hit = await c.match(req); if (hit) return hit; throw x; }
  })());
});
