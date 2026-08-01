'use client';

import * as React from 'react';
import { Player } from '@/components/player';
import { PhoneFrame } from '@/components/marketing/PhoneFrame';
import type { BoundExperience } from '@/lib/template-contract';
import type { EditorExperience } from './types';
import type { LocalStep } from './editor-state';
import { toBoundExperience } from './editor-state';

/**
 * Live phone preview that renders the real Player from the builder's in-memory
 * editor state. We remount the Player when content changes (keyed by a content
 * hash) so the user sees their edits replay immediately.
 */
export function BuilderPreview({
  experience,
  steps,
  recipientName,
  focusStepId,
}: {
  experience: EditorExperience;
  steps: LocalStep[];
  recipientName: string;
  /** When set, preview starts at this scene so editing jumps straight to it. */
  focusStepId?: string | null;
}) {
  const bound: BoundExperience = React.useMemo(
    () => toBoundExperience(experience, steps, recipientName),
    [experience, steps, recipientName],
  );

  // Remount when textual content changes so edits are reflected on replay.
  const contentKey = React.useMemo(
    () =>
      JSON.stringify({
        r: recipientName,
        f: focusStepId,
        s: steps.map((s) => [s.templateStepId, s.text, s.media.map((m) => m.url)]),
      }),
    [steps, recipientName, focusStepId],
  );

  return (
    <PhoneFrame>
      <div className="absolute inset-0">
        <div className="h-full w-full [&>div]:!h-full">
          <Player key={contentKey} experience={bound} startPaused={false} startAtStepId={focusStepId} />
        </div>
      </div>
    </PhoneFrame>
  );
}
