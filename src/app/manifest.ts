import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CONNECT CHAT — SYNGETI',
    short_name: 'Connect Chat',
    description: 'Comunicação corporativa e mensageria em tempo real do Syngeti',
    start_url: '/chat',
    scope: '/',
    id: '/chat',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    background_color: '#000000',
    theme_color: '#050D1B',
    orientation: 'any',
    categories: ['business', 'productivity', 'communication'],
    icons: [
      {
        src: '/branding/connect-chat-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/branding/connect-chat-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/branding/connect-chat-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/branding/connect-chat-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Abrir Chat',
        short_name: 'Chat',
        description: 'Abrir conversas do Connect Chat',
        url: '/chat',
        icons: [{ src: '/branding/connect-chat-192.png', sizes: '192x192' }],
      },
      {
        name: 'Ir para o ERP',
        short_name: 'ERP',
        description: 'Acessar painel completo do Syngeti',
        url: '/dashboard',
        icons: [{ src: '/branding/connect-chat-192.png', sizes: '192x192' }],
      },
    ],
  };
}
