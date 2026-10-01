/**
 * The product events we record (see docs/MARKETING_PLAN.md §9). Shared by the
 * browser helper (lib/track.ts) and the collector (POST /api/t) so an event
 * the server doesn't know is never sent.
 *
 * Rule: props carry ids, slugs and amounts only — never names, phone numbers,
 * emails or photos.
 */
export const EVENT_NAMES = [
  'page_view',
  'template_view',
  'signup',
  'create_started',
  'publish',
  'payment_submitted',
  'card_opened',
  'rsvp_click',
  'directions_click',
  'share',
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export type EventProps = Record<string, string | number | boolean>;

/** The funnel, in order, as shown on Admin → Analytics. */
export const FUNNEL: EventName[] = ['page_view', 'template_view', 'signup', 'create_started', 'publish', 'payment_submitted'];

/** Meta Pixel standard event for each of ours; the rest go out as custom events. */
export const PIXEL_EVENTS: Partial<Record<EventName, string>> = {
  page_view: 'PageView',
  template_view: 'ViewContent',
  signup: 'CompleteRegistration',
  create_started: 'Lead',
  publish: 'InitiateCheckout',
  payment_submitted: 'Purchase',
};

/** Card paths carry the couple's chosen slug — keep it out of the log. */
export function scrubPath(path: string): string {
  return path.replace(/^\/(ar|en)\/p\/[^/?#]+/, '/$1/p/:card').replace(/^\/(ar|en)\/(builder|orders)\/[^/?#]+/, '/$1/$2/:id');
}
