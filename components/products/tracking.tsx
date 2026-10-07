'use client';

/**
 * Client bits of the product landing pages: the one-off `product_view` beacon
 * and CTA links that log `product_cta` before navigating. Props carry slugs
 * only (see lib/track-events.ts) — never anything the visitor typed.
 */
import * as React from 'react';
import { Link } from '@/i18n/navigation';
import { track } from '@/lib/track';

export function ProductView({ product }: { product: string }) {
  React.useEffect(() => {
    track('product_view', { product });
  }, [product]);
  return null;
}

type CtaProps = {
  product: string;
  /** Which button: 'hero', 'hero_whatsapp', 'tier', 'sticky', … */
  cta: string;
  className?: string;
  children: React.ReactNode;
  'aria-label'?: string;
};

/** An in-app link (template preview, gallery) that records the click. */
export function ProductCtaLink({ href, product, cta, className, children, ...rest }: CtaProps & { href: string }) {
  return (
    <Link
      href={href}
      className={className}
      aria-label={rest['aria-label']}
      onClick={() => track('product_cta', { product, cta })}
    >
      {children}
    </Link>
  );
}

/** An external link (wa.me) that records the click as a product CTA and a WhatsApp contact. */
export function ProductCtaAnchor({ href, product, cta, className, children, ...rest }: CtaProps & { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={rest['aria-label']}
      onClick={() => {
        track('product_cta', { product, cta });
        track('whatsapp_click', { source: `product:${product}` });
      }}
    >
      {children}
    </a>
  );
}
