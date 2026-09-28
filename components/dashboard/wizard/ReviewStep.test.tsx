import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import dashboard from '@/messages/en/dashboard.json';
import type { EditorExperience } from '../types';
import { ReviewStep } from './ReviewStep';

vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
// The live preview mounts the Player (framer-motion, audio); irrelevant here.
vi.mock('../BuilderPreview', () => ({ BuilderPreview: () => null }));

const base: EditorExperience = {
  id: 'e1',
  templateId: 't1',
  title: null,
  recipientName: 'Sara',
  locale: 'en',
  direction: 'ltr',
  status: 'draft',
  isPaid: true,
  isUnlocked: false,
  pricePiastres: 4900,
  currency: 'EGP',
  theme: { palette: [] },
  scenes: [],
  steps: [],
  templateName: 'tpl',
};

function renderWith(overrides: Partial<EditorExperience>) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ dashboard }}>
      <ReviewStep
        experience={{ ...base, ...overrides }}
        steps={[]}
        recipientName="Sara"
        onBeforePublish={async () => {}}
      />
    </NextIntlClientProvider>,
  );
}

const review = dashboard.wizard.review;

describe('ReviewStep publish label', () => {
  it('asks a regular buyer of a paid template to continue to payment', () => {
    renderWith({ allAccess: false });
    expect(screen.getByRole('button', { name: review.goCheckout })).toBeTruthy();
  });

  it('lets a comped account publish directly and says why', () => {
    renderWith({ allAccess: true });
    expect(screen.getByRole('button', { name: review.publishFree })).toBeTruthy();
    expect(screen.queryByRole('button', { name: review.goCheckout })).toBeNull();
    expect(screen.getByText(review.included)).toBeTruthy();
    expect(screen.getByText(review.compedNote)).toBeTruthy();
  });

  it('publishes free templates directly', () => {
    renderWith({ isPaid: false, pricePiastres: 0 });
    expect(screen.getByRole('button', { name: review.publishFree })).toBeTruthy();
    expect(screen.getByText(review.free)).toBeTruthy();
  });

  it('does not send an already-paid card back to checkout', () => {
    renderWith({ isUnlocked: true });
    expect(screen.getByRole('button', { name: review.publishFree })).toBeTruthy();
    expect(screen.getByText(review.alreadyPaid)).toBeTruthy();
  });
});
