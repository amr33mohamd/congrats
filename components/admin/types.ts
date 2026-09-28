/**
 * Defensive view-model types for admin client components. The admin API
 * (B2) owns exact shapes; we accept supersets of the DB rows and treat most
 * relational fields as optional so the UI degrades gracefully if a backend
 * envelope omits a join. Money is integer piastres; currency EGP.
 */
import type { BoundExperience, TemplateDefinition } from '@/lib/template-contract';

export interface OrderRow {
  id: string;
  orderRef: string;
  status: string;
  amountPiastres: number;
  currency?: string;
  instapayHandle?: string | null;
  paymentRef?: string | null;
  rejectReason?: string | null;
  createdAt?: string | null;
  reviewedAt?: string | null;
  // Joined/optional context the backend may include:
  recipientName?: string | null;
  experienceId?: string | null;
  experienceTitle?: string | null;
  templateTitleEn?: string | null;
  templateTitleAr?: string | null;
  buyerEmail?: string | null;
  // Payment proof: either a ready-to-render URL or a media id to resolve.
  screenshotUrl?: string | null;
  screenshotMediaId?: string | null;
  // Optional pre-bound experience for in-drawer preview.
  experience?: BoundExperience | null;
}

export interface TemplateRow {
  id: string;
  slug: string;
  titleEn?: string | null;
  titleAr?: string | null;
  locale: string;
  direction: string;
  isPaid: boolean;
  pricePiastres: number;
  currency?: string;
  status: string;
  categoryId?: string | null;
  categoryNameEn?: string | null;
  categoryNameAr?: string | null;
  definition?: TemplateDefinition | unknown;
  createdAt?: string | null;
}

export interface CategoryRow {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string | null;
}

export interface UserRow {
  id: string;
  email: string;
  displayName?: string | null;
  locale: string;
  isBlocked: boolean;
  /** Comped: publishes paid templates without an order. */
  allAccess?: boolean;
  createdAt?: string | null;
}

export interface AuditRow {
  id: string;
  actorId?: string | null;
  actorType?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: unknown;
  createdAt?: string | null;
}
