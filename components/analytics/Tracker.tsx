'use client';

/**
 * Records a page_view on every client navigation (not in the admin panel)
 * and loads the Meta Pixel when NEXT_PUBLIC_META_PIXEL_ID is set at build.
 */
import * as React from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/track';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// The standard loader, minus the auto PageView (track() sends it per route)
// and with autoConfig off so Meta doesn't scrape button text — on a card
// page that text is guests' and couples' names.
const pixelBoot = (id: string) => `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('set','autoConfig',false,'${id}');fbq('init','${id}');
if(!window.__cgPixelPv){window.__cgPixelPv=1;fbq('track','PageView');}`;

export function Tracker() {
  const pathname = usePathname();
  const isAdmin = /^\/(ar|en)\/admin(\/|$)/.test(pathname ?? '');

  React.useEffect(() => {
    if (!pathname || isAdmin) return;
    track('page_view');
  }, [pathname, isAdmin]);

  if (!PIXEL_ID || !/^\d{5,20}$/.test(PIXEL_ID) || isAdmin) return null;
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {pixelBoot(PIXEL_ID)}
    </Script>
  );
}
