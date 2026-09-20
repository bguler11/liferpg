/* Life RPG — arka plan bildirimleri.
   Firebase SDK'sını yüklemez: FCM'in gönderdiği ham push olayını okur.
   Kapsamı /push-scope/ — PWA'nın kendi service worker'ıyla çakışmaz. */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let d = {};
  try {
    const p = e.data ? e.data.json() : {};
    d = p.data || p; // v1 data mesajı ya da düz gövde
  } catch {
    d = { body: e.data ? e.data.text() : '' };
  }
  const title = d.title || 'Life RPG';
  e.waitUntil(
    self.registration.showNotification(title, {
      body: d.body || 'Bugünün görevleri seni bekliyor.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: d.tag || 'liferpg-reminder',
      renotify: true,
      data: { url: d.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/', self.location.origin).href;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.startsWith(self.location.origin) && 'focus' in c) return c.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
