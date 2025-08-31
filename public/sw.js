self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return
  event.respondWith(
    (async () => {
      try {
        const cache = await caches.open("app-swr-v1")
        const cached = await cache.match(req)
        const network = fetch(req)
          .then(async (res) => {
            try {
              await cache.put(req, res.clone())
            } catch {}
            return res
          })
          .catch(() => undefined)
        return cached || (await network) || fetch(req)
      } catch {
        return fetch(req)
      }
    })(),
  )
})
