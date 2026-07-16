// Service Worker — Cache-first for static assets, Network-first for API
const CACHE_VERSION = 'v3'
const STATIC_CACHE = `static-${CACHE_VERSION}`
const API_CACHE    = `api-${CACHE_VERSION}`

// Core app shell assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
]

// ─── Install: pre-cache app shell ───────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// ─── Activate: clean up old caches ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== API_CACHE)
          .map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ─── Fetch: Stale-while-revalidate for API, Cache-first for static ───────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle GET requests
  if (request.method !== 'GET') return

  // Skip chrome-extension and non-http requests
  if (!url.protocol.startsWith('http')) return

  const isApiRequest = url.pathname.startsWith('/api') ||
    url.hostname.includes('onrender.com') ||
    (url.hostname.includes('localhost') && url.pathname.startsWith('/api'))

  const isHtmlRequest = url.pathname === '/' || url.pathname === '/index.html' || request.destination === 'document'

  if (isApiRequest || isHtmlRequest) {
    // ── Network-first with cache fallback for API and HTML ────────────────────────
    event.respondWith(
      fetchWithTimeout(request, 8000)
        .then(response => {
          if (response && response.status === 200) {
            const cloned = response.clone()
            caches.open(API_CACHE).then(cache => cache.put(request, cloned))
          }
          return response
        })
        .catch(() =>
          caches.match(request).then(cached => {
            if (cached) return cached
            
            if (isHtmlRequest) {
              return caches.match('/index.html').then(indexCache => {
                if (indexCache) return indexCache;
                return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/html' } });
              });
            }
            return new Response(
              JSON.stringify({ error: 'You are offline. Please check your internet connection.' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            )
          })
        )
    )
  } else {
    // ── Cache-first for static assets (JS, CSS, images, fonts) ──────────
    event.respondWith(
      caches.match(request).then(cached => {
        const fetchPromise = fetch(request)
          .then(response => {
            if (response && response.status === 200 && response.type !== 'opaque') {
              const cloned = response.clone()
              caches.open(STATIC_CACHE).then(cache => cache.put(request, cloned))
            }
            return response
          })
          .catch(() => new Response('', { status: 503, statusText: 'Service Unavailable' }))

        return cached || fetchPromise
      })
    )
  }
})

// ─── Helper: fetch with timeout ───────────────────────────────────────────────
function fetchWithTimeout(request, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), ms)
    fetch(request)
      .then(response => { clearTimeout(timer); resolve(response) })
      .catch(err  => { clearTimeout(timer); reject(err) })
  })
}

// ─── Background Sync: retry queued POST/PUT/DELETE when back online ─────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'retry-queue') {
    event.waitUntil(retryQueue())
  }
})

async function retryQueue() {
  // Clients will have stored pending requests in IndexedDB; SW notifies them to retry
  const clients = await self.clients.matchAll()
  clients.forEach(client => client.postMessage({ type: 'RETRY_QUEUED_REQUESTS' }))
}
