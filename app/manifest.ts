import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MTG Color Quiz',
    short_name: 'MTG Colors',
    description: 'Discover your true Magic: The Gathering color combination.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/brand/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/brand/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
