import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Congrats — Animated greetings & wedding invitations',
    short_name: 'Congrats',
    description:
      'Personalized animated greeting cards and one-page wedding invitations, shared with a single link. Arabic & English.',
    start_url: '/',
    display: 'standalone',
    // The product ships dark (see globals.css): splash + browser chrome match
    // the page surface so launching from the home screen doesn't flash cream.
    background_color: '#0C0A0B',
    theme_color: '#0C0A0B',
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/brand/logomark.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
