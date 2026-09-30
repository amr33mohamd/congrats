/**
 * Client-side types for the dashboard, mirroring the FROZEN dashboard API
 * contract (B1 implements under app/api/dashboard/**). These are intentionally
 * permissive where the backend payload shape isn't fully nailed down yet, so the
 * UI is resilient to additive fields.
 */
import type { SceneDef, BoundStep, TemplateTheme, TemplateDefinition, Field } from '@/lib/template-contract';

export type AppLocale = 'ar' | 'en';

/** UI-facing experience status derived from the order/experience flow. */
export type ExperienceStatus =
  | 'draft'
  | 'awaiting_payment'
  | 'locked'
  | 'published'
  | 'rejected';

/** A row in the "My experiences" list (GET /api/dashboard/experiences). */
export interface ExperienceListItem {
  id: string;
  title: string | null;
  recipientName: string | null;
  locale: AppLocale;
  status: ExperienceStatus;
  templateId: string;
  templateName?: string | null;
  isPaid?: boolean;
  isUnlocked?: boolean;
  slug?: string | null;
  shareSlug?: string | null;
  coverImageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  orderId?: string | null;
}

/** A template card in the picker (served by B1/B2 via GET /api/dashboard/... or admin templates). */
export interface TemplateCard {
  id: string;
  name: string;
  description?: string | null;
  categorySlug?: string | null;
  locale: AppLocale;
  direction: 'rtl' | 'ltr';
  isPaid: boolean;
  pricePiastres: number;
  currency: string;
  thumbnailUrl?: string | null;
  palette?: string[];
  /** Parsed template definition, used to render a live preview in the picker. */
  definition?: TemplateDefinition | null;
}

/** Full editor payload (GET /api/dashboard/experiences/:id). */
export interface EditorExperience {
  id: string;
  templateId: string;
  title: string | null;
  recipientName: string | null;
  locale: AppLocale;
  direction: 'rtl' | 'ltr';
  status: ExperienceStatus;
  isPaid: boolean;
  isUnlocked: boolean;
  pricePiastres: number;
  currency: string;
  theme: TemplateTheme;
  scenes: SceneDef[];
  steps: BoundStep[];
  /** Card-level details asked once in the Details step (see TemplateDefinition.fields). */
  fieldDefs?: Field[];
  fields?: Record<string, string>;
  templateName?: string | null;
  shareSlug?: string | null;
  orderId?: string | null;
  /**
   * Comped account (users.all_access). Display only — it picks the review
   * step's label; the server decides entitlement when publishing.
   */
  allAccess?: boolean;
}

/** Step payload for PUT /api/dashboard/experiences/:id/steps. */
export interface StepUpsert {
  templateStepId: string;
  orderIndex: number;
  text: Record<string, string>;
  animationConfig: Record<string, unknown>;
}

export interface OrderInfo {
  id: string;
  orderRef: string;
  instapayHandle: string;
  amountPiastres: number;
  currency: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'refunded';
  rejectReason?: string | null;
  experienceId: string;
}

export interface SignedUploadTarget {
  bucket: string;
  key: string;
  url: string;
  /** Optional fields a presigned POST may include. */
  fields?: Record<string, string>;
  method?: 'PUT' | 'POST';
}

export interface ConfirmedMedia {
  id: string;
  url: string;
  width?: number;
  height?: number;
}
