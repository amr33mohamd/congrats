/**
 * QA — Order state machine (lib/orders/state-machine.ts).
 *
 * Covers, beyond the existing co-located unit test:
 *  - the FULL legal path pending → submitted → approved (and that ONLY approve unlocks)
 *  - every illegal (state, action) pair throws INVALID_TRANSITION
 *  - forbidden actors per action
 *  - MISSING_INPUT for submit/reject
 *  - that EVERY transition appends exactly one audit entry with the right action
 *  - that a paid experience's share link is activated ONLY by approve (never by
 *    submit/reject/refund), and refund reverses it
 *  - makeOrderRef formatting
 */
import { describe, it, expect, vi } from 'vitest';
import {
  transitionOrder,
  canTransition,
  nextState,
  makeOrderRef,
  ORDER_STATES,
  ORDER_ACTIONS,
  OrderTransitionError,
  type OrderEffects,
  type OrderLike,
  type OrderState,
  type OrderAction,
  type ActorType,
} from '@/lib/orders/state-machine';

interface Recorder extends OrderEffects {
  unlocks: boolean[];
  linkStates: boolean[];
  audits: Array<{ action: string; metadata: Record<string, unknown> }>;
  persists: OrderState[];
}

function recorder(): Recorder {
  const r: Recorder = {
    unlocks: [],
    linkStates: [],
    audits: [],
    persists: [],
    persistOrder: vi.fn(async (_id, patch) => {
      r.persists.push(patch.status);
      return true;
    }),
    setExperienceUnlocked: vi.fn(async (_id, v) => {
      r.unlocks.push(v);
    }),
    setShareLinkActive: vi.fn(async (_id, v) => {
      r.linkStates.push(v);
    }),
    appendAudit: vi.fn(async (e) => {
      r.audits.push({ action: e.action, metadata: e.metadata });
    }),
  };
  return r;
}

const order = (status: OrderState): OrderLike => ({
  id: 'o1',
  status,
  userId: 'u1',
  experienceId: 'e1',
  amountPiastres: 4900,
});

const ADMIN = { type: 'admin' as const, id: 'a1' };
const USER = { type: 'user' as const, id: 'u1' };

describe('state machine — full legal path + unlock authority', () => {
  it('pending → submit → submitted → approve → approved, ONLY approve unlocks', async () => {
    const fx = recorder();

    const r1 = await transitionOrder(order('pending'), 'submit', USER, fx, {
      screenshotMediaId: 'm1',
      paymentRef: 'TX-1',
    });
    expect(r1.from).toBe('pending');
    expect(r1.to).toBe('submitted');
    // submit must NOT touch unlock or share-link state.
    expect(fx.unlocks).toEqual([]);
    expect(fx.linkStates).toEqual([]);

    const r2 = await transitionOrder(order('submitted'), 'approve', ADMIN, fx, {
      reviewedBy: 'a1',
    });
    expect(r2.to).toBe('approved');
    // approve is the ONLY path that unlocks + activates the link.
    expect(fx.unlocks).toEqual([true]);
    expect(fx.linkStates).toEqual([true]);
  });

  it('reject does NOT unlock anything', async () => {
    const fx = recorder();
    const r = await transitionOrder(order('submitted'), 'reject', ADMIN, fx, {
      rejectReason: 'blurry screenshot',
    });
    expect(r.to).toBe('rejected');
    expect(fx.unlocks).toEqual([]);
    expect(fx.linkStates).toEqual([]);
  });

  it('refund reverses unlock + link (the only relock path)', async () => {
    const fx = recorder();
    const r = await transitionOrder(order('approved'), 'refund', ADMIN, fx);
    expect(r.to).toBe('refunded');
    expect(fx.unlocks).toEqual([false]);
    expect(fx.linkStates).toEqual([false]);
  });

  it('system may refund (effects fire) but never submit/approve/reject', async () => {
    const fx = recorder();
    const r = await transitionOrder(order('approved'), 'refund', { type: 'system' }, fx);
    expect(r.to).toBe('refunded');
    for (const action of ['submit', 'approve', 'reject'] as OrderAction[]) {
      await expect(
        transitionOrder(order('submitted'), action, { type: 'system' }, recorder()),
      ).rejects.toMatchObject({ code: 'FORBIDDEN_ACTOR' });
    }
  });
});

describe('state machine — every transition writes an audit row', () => {
  const cases: Array<[OrderState, OrderAction, typeof ADMIN | typeof USER, Record<string, unknown>]> = [
    ['pending', 'submit', USER, { screenshotMediaId: 'm', paymentRef: 'r' }],
    ['submitted', 'approve', ADMIN, { reviewedBy: 'a1' }],
    ['submitted', 'reject', ADMIN, { rejectReason: 'no' }],
    ['approved', 'refund', ADMIN, {}],
  ];

  it.each(cases)('%s/%s appends exactly one audit entry', async (state, action, actor, input) => {
    const fx = recorder();
    await transitionOrder(order(state), action, actor, fx, input);
    expect(fx.audits).toHaveLength(1);
    expect(fx.audits[0].action).toBe(`order.${action}`);
    // audit metadata carries from/to for traceability.
    expect(fx.audits[0].metadata).toMatchObject({ from: state });
  });
});

describe('state machine — illegal transitions throw INVALID_TRANSITION', () => {
  // Build the legal set; everything else (with the right actor) must throw.
  const legal = new Set(['pending|submit', 'submitted|approve', 'submitted|reject', 'approved|refund']);
  const actorFor: Record<OrderAction, { type: ActorType; id?: string }> = {
    submit: USER,
    approve: ADMIN,
    reject: ADMIN,
    refund: ADMIN,
  };
  const inputFor: Record<OrderAction, Record<string, unknown>> = {
    submit: { screenshotMediaId: 'm', paymentRef: 'r' },
    approve: {},
    reject: { rejectReason: 'x' },
    refund: {},
  };

  for (const state of ORDER_STATES) {
    for (const action of ORDER_ACTIONS) {
      const key = `${state}|${action}`;
      if (legal.has(key)) continue;
      it(`${state} cannot ${action}`, async () => {
        const fx = recorder();
        await expect(
          transitionOrder(order(state), action, actorFor[action], fx, inputFor[action]),
        ).rejects.toBeInstanceOf(OrderTransitionError);
        // No side effects on a rejected transition.
        expect(fx.persists).toEqual([]);
        expect(fx.audits).toEqual([]);
      });
    }
  }

  it('terminal states (rejected, refunded) accept no action', () => {
    for (const action of ORDER_ACTIONS) {
      expect(canTransition('rejected', action)).toBe(false);
      expect(canTransition('refunded', action)).toBe(false);
      expect(nextState('rejected', action)).toBeNull();
      expect(nextState('refunded', action)).toBeNull();
    }
  });
});

describe('state machine — input validation', () => {
  it('submit without screenshot/ref → MISSING_INPUT', async () => {
    await expect(
      transitionOrder(order('pending'), 'submit', USER, recorder(), { paymentRef: 'r' }),
    ).rejects.toMatchObject({ code: 'MISSING_INPUT' });
    await expect(
      transitionOrder(order('pending'), 'submit', USER, recorder(), { screenshotMediaId: 'm' }),
    ).rejects.toMatchObject({ code: 'MISSING_INPUT' });
  });

  it('reject without reason → MISSING_INPUT', async () => {
    await expect(
      transitionOrder(order('submitted'), 'reject', ADMIN, recorder(), {}),
    ).rejects.toMatchObject({ code: 'MISSING_INPUT' });
  });

  it('actor check fires BEFORE input check (forbidden user submit-as-approve)', async () => {
    await expect(
      transitionOrder(order('submitted'), 'approve', USER, recorder()),
    ).rejects.toMatchObject({ code: 'FORBIDDEN_ACTOR' });
  });
});

describe('makeOrderRef', () => {
  it('formats CG-XXXXXX uppercased, 6 chars', () => {
    expect(makeOrderRef('ab12cd34')).toBe('CG-AB12CD');
    expect(makeOrderRef('xyz')).toBe('CG-XYZ');
  });
});
