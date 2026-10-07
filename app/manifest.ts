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
    ],
  };
}
