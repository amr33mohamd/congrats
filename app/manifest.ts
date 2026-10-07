import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    // Arabic is the main language (i18n/routing defaultLocale).
    name: 'Congrats — تهاني متحركة ودعوات أفراح',
    short_name: 'Congrats',
    description: 'كروت تهنئة متحركة ودعوات أفراح باسمهم وصورك، تبعتها لينك واحد على واتساب.',
    lang: 'ar',
    dir: 'rtl',
    start_url: '/ar',
    display: 'standalone',
    // The product ships dark (see globals.css): splash + browser chrome match
    // the page surface so launching from the home screen doesn't flash cream.
    background_color: '#0C0A0B',
    theme_color: '#0C0A0B',
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/brand/logomark.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      // Full-bleed PNGs (public/brand/app-icon.svg) for installers that skip SVG.
      { src: '/brand/png/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/png/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/brand/png/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
