import { describe, it, expect, vi } from 'vitest';
import {
  transitionOrder,
  canTransition,
  nextState,
  OrderTransitionError,
  type OrderEffects,
  type OrderLike,
} from './state-machine';

function makeEffects(): OrderEffects & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    persistOrder: vi.fn(async (_id, patch) => {
      calls.push(`persist:${patch.status}`);
      return true;
    }),
    setExperienceUnlocked: vi.fn(async (_id, v) => {
      calls.push(`unlock:${v}`);
    }),
    setShareLinkActive: vi.fn(async (_id, v) => {
      calls.push(`link:${v}`);
    }),
    appendAudit: vi.fn(async (e) => {
      calls.push(`audit:${e.action}`);
    }),
  };
}

const base: OrderLike = {
  id: 'o1',
  status: 'pending',
  userId: 'u1',
  experienceId: 'e1',
  amountPiastres: 4900,
};

describe('order state machine map', () => {
  it('allows valid transitions only', () => {
    expect(canTransition('pending', 'submit')).toBe(true);
    expect(canTransition('submitted', 'approve')).toBe(true);
    expect(canTransition('submitted', 'reject')).toBe(true);
    expect(canTransition('approved', 'refund')).toBe(true);
    expect(canTransition('pending', 'approve')).toBe(false);
    expect(nextState('rejected', 'approve')).toBeNull();
  });
});

describe('transitionOrder', () => {
  it('submit requires screenshot + ref and moves pending → submitted', async () => {
    const fx = makeEffects();
    await expect(
      transitionOrder(base, 'submit', { type: 'user', id: 'u1' }, fx),
    ).rejects.toBeInstanceOf(OrderTransitionError);

    const res = await transitionOrder(
      base,
      'submit',
      { type: 'user', id: 'u1' },
      fx,
      { screenshotMediaId: 'm1', paymentRef: 'TX-1' },
    );
    expect(res.to).toBe('submitted');
    expect(fx.calls).toContain('persist:submitted');
    expect(fx.calls).toContain('audit:order.submit');
  });

  it('approve unlocks experience + activates link', async () => {
    const fx = makeEffects();
    const submitted: OrderLike = { ...base, status: 'submitted' };
    const res = await transitionOrder(
      submitted,
      'approve',
      { type: 'admin', id: 'a1' },
      fx,
      { reviewedBy: 'a1' },
    );
    expect(res.to).toBe('approved');
    expect(fx.calls).toContain('unlock:true');
    expect(fx.calls).toContain('link:true');
  });

  it('rejects a forbidden actor (user cannot approve)', async () => {
    const fx = makeEffects();
    const submitted: OrderLike = { ...base, status: 'submitted' };
    await expect(
      transitionOrder(submitted, 'approve', { type: 'user', id: 'u1' }, fx),
    ).rejects.toMatchObject({ code: 'FORBIDDEN_ACTOR' });
  });

  it('refund re-locks the experience + link', async () => {
    const fx = makeEffects();
    const approved: OrderLike = { ...base, status: 'approved' };
    const res = await transitionOrder(approved, 'refund', { type: 'admin', id: 'a1' }, fx);
    expect(res.to).toBe('refunded');
    expect(fx.calls).toContain('unlock:false');
    expect(fx.calls).toContain('link:false');
  });
});
