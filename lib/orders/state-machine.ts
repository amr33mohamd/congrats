/**
 * SHARED order state machine. BOTH backends call `transitionOrder`:
 *  - B1 (dashboard) drives the `submit` action (user attaches screenshot + ref).
 *  - B2 (admin) drives `approve` / `reject` / `refund`.
 *
 * States:   pending → submitted → approved | rejected ; approved → refunded.
 * Actions:  submit, approve, reject, refund.
 *
 * Side effects (executed by the caller-provided `effects` adapter so this module
 * stays pure and testable):
 *  - approve  → experience.isUnlocked = true, share_link.isActive = true.
 *  - reject   → no unlock; reason recorded; user may resubmit (submitted→pending? no:
 *               reject lands on 'rejected'; a NEW order is created for retries).
 *  - refund   → experience.isUnlocked = false, share_link.isActive = false.
 * Every transition appends an audit_log row.
 */

export const ORDER_STATES = [
  'pending',
  'submitted',
  'approved',
  'rejected',
  'refunded',
] as const;
export type OrderState = (typeof ORDER_STATES)[number];

export const ORDER_ACTIONS = ['submit', 'approve', 'reject', 'refund'] as const;
export type OrderAction = (typeof ORDER_ACTIONS)[number];

export type ActorType = 'user' | 'admin' | 'system';
export interface Actor {
  type: ActorType;
  id?: string; // users.id or admin_users.id
  ip?: string;
  userAgent?: string;
}

/** Allowed (state, action) → nextState transitions. */
const TRANSITIONS: Record<OrderState, Partial<Record<OrderAction, OrderState>>> = {
  pending: { submit: 'submitted' },
  submitted: { approve: 'approved', reject: 'rejected' },
  approved: { refund: 'refunded' },
  rejected: {},
  refunded: {},
};

/** Who is allowed to perform each action. */
const ACTION_ACTORS: Record<OrderAction, ActorType[]> = {
  submit: ['user'],
  approve: ['admin'],
  reject: ['admin'],
  refund: ['admin', 'system'],
};

export function canTransition(from: OrderState, action: OrderAction): boolean {
  return Boolean(TRANSITIONS[from]?.[action]);
}

export function nextState(from: OrderState, action: OrderAction): OrderState | null {
  return TRANSITIONS[from]?.[action] ?? null;
}

export class OrderTransitionError extends Error {
  constructor(
    message: string,
    readonly code: 'INVALID_TRANSITION' | 'FORBIDDEN_ACTOR' | 'MISSING_INPUT',
  ) {
    super(message);
    this.name = 'OrderTransitionError';
  }
}

export interface OrderLike {
  id: string;
  status: OrderState;
  userId: string;
  experienceId: string;
  amountPiastres: number;
}

export interface TransitionInput {
  /** submit: screenshotMediaId + paymentRef required. reject: rejectReason required. */
  screenshotMediaId?: string;
  paymentRef?: string;
  rejectReason?: string;
  reviewedBy?: string; // admin_users.id, for approve/reject
}

/**
 * Effects adapter — the caller (B1/B2) supplies a DB-backed implementation.
 * The state machine never imports the DB so it can be unit-tested in isolation.
 */
export interface OrderEffects {
  persistOrder(
    orderId: string,
    patch: {
      status: OrderState;
      paymentRef?: string;
      screenshotMediaId?: string;
      rejectReason?: string;
      reviewedBy?: string;
      reviewedAt?: Date;
    },
  ): Promise<void>;
  setExperienceUnlocked(experienceId: string, unlocked: boolean): Promise<void>;
  setShareLinkActive(experienceId: string, active: boolean): Promise<void>;
  appendAudit(entry: {
    actorId?: string;
    actorType: ActorType;
    action: string; // e.g. 'order.approve'
    entityType: 'order';
    entityId: string;
    metadata: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
  }): Promise<void>;
}

export interface TransitionResult {
  order: OrderLike;
  from: OrderState;
  to: OrderState;
}

/**
 * THE single entry point both backends call. Validates the transition + actor,
 * runs side effects through `effects`, and writes an audit row.
 */
export async function transitionOrder(
  order: OrderLike,
  action: OrderAction,
  actor: Actor,
  effects: OrderEffects,
  input: TransitionInput = {},
): Promise<TransitionResult> {
  const from = order.status;

  if (!ACTION_ACTORS[action].includes(actor.type)) {
    throw new OrderTransitionError(
      `actor '${actor.type}' may not '${action}'`,
      'FORBIDDEN_ACTOR',
    );
  }

  const to = nextState(from, action);
  if (!to) {
    throw new OrderTransitionError(
      `cannot '${action}' an order in '${from}'`,
      'INVALID_TRANSITION',
    );
  }

  // Per-action input validation.
  if (action === 'submit' && (!input.screenshotMediaId || !input.paymentRef)) {
    throw new OrderTransitionError(
      'submit requires screenshotMediaId and paymentRef',
      'MISSING_INPUT',
    );
  }
  if (action === 'reject' && !input.rejectReason) {
    throw new OrderTransitionError('reject requires rejectReason', 'MISSING_INPUT');
  }

  const reviewedAt = action === 'approve' || action === 'reject' ? new Date() : undefined;

  await effects.persistOrder(order.id, {
    status: to,
    paymentRef: action === 'submit' ? input.paymentRef : undefined,
    screenshotMediaId: action === 'submit' ? input.screenshotMediaId : undefined,
    rejectReason: action === 'reject' ? input.rejectReason : undefined,
    reviewedBy: reviewedAt ? input.reviewedBy : undefined,
    reviewedAt,
  });

  // Unlock / lock side effects.
  if (action === 'approve') {
    await effects.setExperienceUnlocked(order.experienceId, true);
    await effects.setShareLinkActive(order.experienceId, true);
  } else if (action === 'refund') {
    await effects.setExperienceUnlocked(order.experienceId, false);
    await effects.setShareLinkActive(order.experienceId, false);
  }

  await effects.appendAudit({
    actorId: actor.id,
    actorType: actor.type,
    action: `order.${action}`,
    entityType: 'order',
    entityId: order.id,
    metadata: { from, to, ...input },
    ip: actor.ip,
    userAgent: actor.userAgent,
  });

  return { order: { ...order, status: to }, from, to };
}

/** Stable, human-friendly order reference, e.g. CG-7K2M9Q. */
export function makeOrderRef(rand: string): string {
  return `CG-${rand.toUpperCase().slice(0, 6)}`;
}
