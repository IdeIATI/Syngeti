// Service Worker para CONNECT CHAT • Syngeti PWA
const CACHE_NAME = 'connect-chat-v1';
const STATIC_ASSETS = [
  '/branding/connect-chat-192.png',
  '/branding/connect-chat-512.png',
  '/branding/connect-chat-maskable-192.png',
  '/branding/connect-chat-maskable-512.png',
  '/favicon.ico',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignora falhas pontuais de assets estáticos na instalação
      });
    })
  );
});

// Ativação do Service Worker e limpeza de caches obsoletos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de requisições:
// - Para API e navegação HTML: Network-First (dados sempre frescos e em tempo real)
// - Para assets estáticos: Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Não intercepta chamadas de API, autenticação ou endpoints de tempo real
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/auth/') ||
    url.hostname.includes('supabase') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Assets estáticos de branding e ícones
  if (url.pathname.startsWith('/branding/') || url.pathname.endsWith('.ico') || url.pathname.endsWith('.png')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Para rotas de navegação (HTML): Network-First com fallback de rede
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/chat').then((fallback) => {
          return fallback || fetch(event.request);
        });
      })
    );
  }
});

// Tratamento de Web Push Notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || 'CONNECT CHAT';
    const options = {
      body: payload.body || 'Nova mensagem recebida',
      icon: payload.icon || '/branding/connect-chat-192.png',
      badge: '/branding/connect-chat-192.png',
      tag: payload.tag || `connect-${payload.channelId || 'general'}`,
      renotify: true,
      data: {
        url: payload.url || '/chat',
        channelId: payload.channelId,
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.warn('[SW] Erro ao processar push:', err);
  }
});

// Ação de clique na Notificação Desktop
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetChannelId = event.notification.data?.channelId;
  const targetUrl = targetChannelId ? `/chat?channel=${targetChannelId}` : '/chat';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Procura se já existe uma janela aberta do Connect Chat
      for (const client of clientList) {
        if (client.url.includes('/chat') && 'focus' in client) {
          if (targetChannelId) {
            client.postMessage({ type: 'OPEN_CHANNEL', channelId: targetChannelId });
          }
          return client.focus();
        }
      }
      // Se não há janela aberta, abre uma nova
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
