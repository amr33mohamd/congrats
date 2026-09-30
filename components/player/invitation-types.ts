import type { BoundStep, Direction, SceneDef, TemplateTheme } from '@/lib/template-contract';
export { applyTokens, slotValue } from '@/lib/template-contract';

/** The subset of SceneRenderProps the invitation sections use. */
export interface SceneRenderPropsLike {
  scene: SceneDef;
  step: BoundStep;
  theme: TemplateTheme;
  direction: Direction;
  recipientName: string;
  reducedMotion: boolean;
  active: boolean;
  fields?: Record<string, string>;
}
