import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all paths except API, Next internals, static files, and the
  // dot-less metadata routes (opengraph-image, icon, …) which would otherwise
  // be redirected to /<locale>/… and 404.
  matcher: [
    '/((?!api|_next|_vercel|opengraph-image|twitter-image|icon|apple-icon|.*\\..*).*)',
  ],
};
