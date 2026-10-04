// Service Worker der Morgengold-Tour-App.
// Er wird nur gebraucht, damit sich die App auf dem Startbildschirm installieren lässt. Er speichert nichts.
// Das frühere Android-Teilen-Ziel ist entfernt; alte geteilte Dateien werden gelöscht.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil((async () => { await caches.delete("geteilte-dateien"); await self.clients.claim(); })()));
self.addEventListener("fetch", () => {});
