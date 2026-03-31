import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UK Shooting Club SaaS',
    short_name: 'ShootingClub',
    description: 'Mobile-first shooting club operations and compliance platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0f14',
    theme_color: '#10b981',
    icons: [
      {
        src: '/next.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
    ],
  };
}
