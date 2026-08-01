import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Congrats — Animated greetings, made personal',
    short_name: 'Congrats',
    description: 'Craft a step-by-step animated congratulations and share it with a single link.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF8F7',
    theme_color: '#F0436E',
    icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
