/**
 * Admin → Analytics: funnel, traffic sources and daily trend from the
 * anonymous `events` log. Paid revenue per source joins payment_submitted
 * events (props.orderId) to orders the admin actually approved.
 */
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { events, orders } from '@/db/schema';
import type { DbClient } from '@/db';
import { FUNNEL, type EventName } from '@/lib/track-events';

const visitors = (name?: EventName) =>
  name
    ? sql<number>`count(distinct ${events.visitorId}) filter (where ${events.name} = ${name})`.mapWith(Number)
    : sql<number>`count(distinct ${events.visitorId})`.mapWith(Number);

// Where a visitor came from: the ad's utm_source, else the referring site.
const sourceExpr = sql<string>`coalesce(nullif(${events.utmSource}, ''), ${events.referrer}, 'direct')`;
const campaignExpr = sql<string>`coalesce(${events.utmCampaign}, '')`;

export interface SourceRow {
  source: string;
  campaign: string;
  visitors: number;
  signups: number;
  created: number;
  published: number;
  paid: number;
  revenuePiastres: number;
}

export interface Analytics {
  days: number;
  funnel: { name: EventName; visitors: number }[];
  engagement: { name: EventName; count: number }[];
  sources: SourceRow[];
  daily: { day: string; visitors: number; created: number; paid: number }[];
  pages: { path: string; views: number }[];
  devices: { device: string; visitors: number }[];
}

export async function getAnalytics(db: DbClient, days: number): Promise<Analytics> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const inRange = gte(events.createdAt, since);

  const byName = await db
    .select({ name: events.name, visitors: visitors(), count: sql<number>`count(*)`.mapWith(Number) })
    .from(events)
    .where(inRange)
    .groupBy(events.name);
  const get = (n: EventName) => byName.find((r) => r.name === n);

  const sourceRows = await db
    .select({
      source: sourceExpr,
      campaign: campaignExpr,
      visitors: visitors('page_view'),
      signups: visitors('signup'),
      created: visitors('create_started'),
      published: visitors('publish'),
      paid: visitors('payment_submitted'),
    })
    .from(events)
    .where(inRange)
    .groupBy(sourceExpr, campaignExpr)
    .orderBy(desc(visitors('page_view')))
    .limit(40);

  const revenue = await db
    .select({
      source: sourceExpr,
      campaign: campaignExpr,
      piastres: sql<number>`coalesce(sum(${orders.amountPiastres}), 0)`.mapWith(Number),
    })
    .from(events)
    .innerJoin(orders, sql`${orders.id}::text = ${events.props}->>'orderId'`)
    .where(and(inRange, eq(events.name, 'payment_submitted'), eq(orders.status, 'approved')))
    .groupBy(sourceExpr, campaignExpr);

  const dayExpr = sql<string>`to_char(${events.createdAt} at time zone 'Africa/Cairo', 'YYYY-MM-DD')`;
  const daily = await db
    .select({
      day: dayExpr,
      visitors: visitors('page_view'),
      created: visitors('create_started'),
      paid: visitors('payment_submitted'),
    })
    .from(events)
    .where(inRange)
    .groupBy(dayExpr)
    .orderBy(dayExpr);

  const pages = await db
    .select({ path: sql<string>`coalesce(${events.path}, '')`, views: sql<number>`count(*)`.mapWith(Number) })
    .from(events)
    .where(and(inRange, eq(events.name, 'page_view')))
    .groupBy(events.path)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  const devices = await db
    .select({ device: sql<string>`coalesce(${events.device}, 'unknown')`, visitors: visitors() })
    .from(events)
    .where(inRange)
    .groupBy(events.device);

  return {
    days,
    funnel: FUNNEL.map((name) => ({ name, visitors: get(name)?.visitors ?? 0 })),
    engagement: (['card_opened', 'rsvp_click', 'directions_click', 'share', 'card_cta', 'whatsapp_click'] as const).map((name) => ({
      name,
      count: get(name)?.count ?? 0,
    })),
    sources: sourceRows.map((r) => ({
      ...r,
      revenuePiastres:
        revenue.find((v) => v.source === r.source && v.campaign === r.campaign)?.piastres ?? 0,
    })),
    daily,
    pages,
    devices,
  };
}
