// Service Worker der Morgengold-Tour-App.
// Einzige Aufgabe: Dateien annehmen, die man auf Android über „Teilen“ an die App schickt (Ausfahrliste, Routendatei).
// Die Dateien bleiben nur im Speicher dieses Handys (je eine Ausfahrliste und eine Routendatei, höchstens 18 Stunden
// oder bis „Tour löschen“), damit man PDF und .bcr auch nacheinander teilen kann. Nichts geht ins Internet.
const SHARE_CACHE = "geteilte-dateien";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method === "POST" && url.pathname.endsWith("/teilen")) {
    event.respondWith((async () => {
      const form = await event.request.formData();
      const files = form.getAll("dateien").filter(f => f && typeof f === "object" && "name" in f);
      const cache = await caches.open(SHARE_CACHE);
      for (const f of files) {
        const head = new Uint8Array(await f.slice(0, 5).arrayBuffer());
        const kind = String.fromCharCode(...head) === "%PDF-" ? "pdf" : "bcr"; // neue Datei ersetzt die alte derselben Art
        await cache.put(new Request(`./geteilt/${kind}`), new Response(f, { headers: { "X-Dateiname": encodeURIComponent(f.name || "datei"), "X-Zeit": String(Date.now()), "Content-Type": f.type || "application/octet-stream" } }));
      }
      return Response.redirect(new URL("./?geteilt=1", self.registration.scope).href, 303);
    })());
  }
});
