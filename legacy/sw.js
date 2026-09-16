const CACHE_NAME = 'edualgorithm-cache-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/courses.html',
  '/about.html',
  '/contact.html',
  '/internships.html',
  '/outcomes.html',
  '/css/chatbot.css',
  '/css/dark-theme.css',
  '/assets/chatbot.js',
  '/assets/theme-toggle.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(event.request.url);
  const path = url.pathname.toLowerCase();

  // Explicitly NEVER cache authenticated clean-URL app pages or dynamic endpoints (ISSUE 20 FIX)
  const isAuthOrDynamic = 
    path.endsWith('.php') || 
    path.includes('/uploads/') || 
    path.includes('api-') || 
    path.includes('stream-') ||
    path.includes('download-') ||
    path.includes('chatbot-') ||
    path.startsWith('/dashboard') ||
    path.startsWith('/profile') ||
    path.startsWith('/certificates') ||
    path.startsWith('/code-arena') ||
    path.startsWith('/assignments') ||
    path.startsWith('/instructor') ||
    path.startsWith('/admin') ||
    path.startsWith('/quiz') ||
    path.startsWith('/live') ||
    path.startsWith('/login') ||
    path.startsWith('/logout');

  if (isAuthOrDynamic) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first for static pages, Cache-first for assets
  const isStaticAsset = path.match(/\.(css|js|woff2?|ttf|png|jpg|jpeg|svg|ico|webmanifest|json)$/i);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  } else {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});