const CACHE='inner-demon-v1';
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/','/manifest.json','/favicon.ico']))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
self.addEventListener('push',e=>{const data=e.data?.text()||'INNER DEMON'; e.waitUntil(self.registration.showNotification('Inner Demon',{body:data}));});
