const CACHE='inner-demon-v2';
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/','/manifest.json','/favicon.ico']))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
self.addEventListener('message', async (event) => {
  if (event.data?.type !== 'SCHEDULE_DEMON_NOTIFS') return;
  const reg = await self.registration;
  reg.showNotification('⚔️ Your Demon Awakens', { body: 'Today decides who you become.' });
  reg.showNotification('🌑 Night Review', { body: 'Face your failures. Evolve tomorrow.' });
});
