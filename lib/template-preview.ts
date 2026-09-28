import type {
  BoundExperience,
  BoundMedia,
  BoundStep,
  Locale,
  SceneDef,
  TemplateDefinition,
} from './template-contract';

/**
 * Binds a TemplateDefinition to a ready-to-play BoundExperience using each
 * slot's own `defaultAr`/`defaultEn` copy — the same defaults `createExperience`
 * seeds a real card with.
 *
 * This is what lets the gallery show the REAL design rather than a stock photo:
 * the card a visitor hovers is the card they get, down to the palette, the
 * display face and the per-scene ornament.
 *
 * Text keeps its `{recipient}` token intact; the Player resolves tokens at
 * render time through `applyTokens`, so the sample name stays swappable.
 */

/** Stand-in photography for image slots, by occasion. Verified to resolve. */
const SAMPLE_PHOTOS: Record<string, string[]> = {
  anniversary: ['1518621736915-f3b1c41bfd00', '1529634806980-85c3dd6d34ac', '1522673607200-164d1b6ce486'],
  valentine: ['1518709779341-56cf4535e94b', '1520763185298-1b434c919102', '1487035242901-d419a42d17af'],
  proposal: ['1512163143273-bde0e3cc7407', '1419242902214-272b3f66ee7a', '1514432433435-ce2c7903dfba'],
  eid: ['1577214407836-1f3a0604ecb2', '1590092794015-bce5431c83f4', '1584650605024-7344812fa167'],
  birthday: ['1530103862676-de8c9debad1d', '1464349095431-e9a21285b5f3', '1533294455009-a77b7557d2d1'],
  graduation: ['1541339907198-e08756dedf3f', '1590012314607-cda9d9b699ae', '1525921429624-479b6a26d84d'],
  newborn: ['1511948374796-056e8f289f34', '1544126592-807ade215a0b', '1555252333-9f8e92e65df9'],
  wedding: ['1519225421980-715cb0215aed', '1511285560929-80b456fea0bc', '1465495976277-4387d4b0b4c6'],
  invitation: ['1511285560929-80b456fea0bc', '1519225421980-715cb0215aed', '1512163143273-bde0e3cc7407'],
};

const FALLBACK_PHOTOS = SAMPLE_PHOTOS.wedding;

function photoUrl(id: string, w = 900): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;
}

/** Slot defaults for one scene, in the experience's locale. */
function textForScene(scene: SceneDef, locale: Locale): Record<string, string> {
  const out: Record<string, string> = {};
  for (const slot of scene.slots) {
    if (slot.type !== 'text' && slot.type !== 'date') continue;
    const def = locale === 'ar' ? slot.defaultAr : slot.defaultEn;
    if (def != null) out[slot.key] = def;
  }
  return out;
}

/**
 * Sample media for a scene's image slots. A scene that already carries its own
 * background photo reuses it for the first slot, so the preview matches the
 * art direction the template author chose instead of fighting it.
 */
function mediaForScene(scene: SceneDef, pool: string[], cursor: { i: number }): BoundMedia[] {
  const out: BoundMedia[] = [];
  const next = () => {
    const id = pool[cursor.i % pool.length];
    cursor.i += 1;
    return photoUrl(id);
  };

  for (const slot of scene.slots) {
    if (slot.type !== 'image') continue;
    // Galleries need at least `min` frames to not look broken.
    const count = Math.max(1, Math.min(slot.min ?? 1, slot.max ?? 4) || 1);
    const wanted = slot.max && slot.max > 1 ? Math.max(count, 3) : 1;
    for (let n = 0; n < wanted; n++) {
      const useBg = n === 0 && scene.background?.type === 'image' && scene.background.imageUrl;
      out.push({ slot: slot.key, url: useBg ? scene.background!.imageUrl! : next() });
    }
  }
  return out;
}

export interface PreviewOptions {
  templateId: string;
  /** Occasion slug, used to pick stand-in photography. */
  category?: string;
  /** Sample recipient shown wherever `{recipient}` appears. */
  recipientName: string;
}

export function buildPreviewExperience(
  def: TemplateDefinition,
  { templateId, category, recipientName }: PreviewOptions,
): BoundExperience {
  const pool = (category && SAMPLE_PHOTOS[category]) || FALLBACK_PHOTOS;
  const cursor = { i: 0 };

  const steps: BoundStep[] = def.scenes.map((scene, orderIndex) => ({
    templateStepId: scene.id,
    orderIndex,
    text: textForScene(scene, def.locale),
    media: mediaForScene(scene, pool, cursor),
    animationConfig: {},
  }));

  return {
    experienceId: `preview-${templateId}`,
    templateId,
    locale: def.locale,
    direction: def.direction,
    recipientName,
    theme: def.theme,
    scenes: def.scenes,
    steps,
  };
}
