
const CACHE_NAME = "educamente-v1";

const ARQUIVOS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Salva os arquivos essenciais para uso offline.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ARQUIVOS);
    })
  );
  self.skipWaiting();
});

// Remove versões antigas do cache.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(async (nomes) => {
      await Promise.all(
        nomes
          .filter((nome) => nome !== CACHE_NAME)
          .map((nome) => caches.delete(nome))
      );
      await self.clients.claim();
    })
  );
});

// Usa a internet quando disponível e o cache como alternativa.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  // Nunca armazena respostas da IA no cache.
  if (url.pathname.includes("/.netlify/functions/")) return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
