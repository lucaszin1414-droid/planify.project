// PlaniFy - service worker
// Estratégia: rede primeiro, cache como reserva. Assim, quando você publica uma
// versão nova no GitHub, o app instalado pega a nova versão sem ficar "preso" no cache.
const VERSAO = 'planify-v2';
const ARQUIVOS = [
    './', 'index.html', 'style.css', 'extras.css',
    'script.js', 'extras.js', 'nota-pdf.js', 'landing.js',
    'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'capivara.jpeg'
];

self.addEventListener('install', (evento) => {
    evento.waitUntil(
        caches.open(VERSAO).then((cache) =>
            Promise.all(ARQUIVOS.map((arquivo) => cache.add(arquivo).catch(() => null)))
        )
    );
    self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
    evento.waitUntil(
        caches.keys()
            .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (evento) => {
    const req = evento.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return; // Firebase e CDNs seguem direto pela rede

    evento.respondWith(
        fetch(req)
            .then((resposta) => {
                if (resposta && resposta.ok) {
                    const copia = resposta.clone();
                    caches.open(VERSAO).then((cache) => cache.put(req, copia));
                }
                return resposta;
            })
            .catch(() =>
                caches.match(req).then((cache) => cache || (req.mode === 'navigate' ? caches.match('index.html') : undefined))
            )
    );
});
