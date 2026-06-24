import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VillaCare',
    short_name: 'VillaCare',
    description: 'VillaCare — trusted villa services on the Costa Blanca',
    start_url: '/admin',
    scope: '/',
    display: 'standalone',
    background_color: '#FAFAF8',
    theme_color: '#C4785A',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
