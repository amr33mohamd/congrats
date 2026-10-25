/**
 * Minimal Anthropic Messages API client with a tool-use loop. Plain fetch, so
 * no SDK dependency; ANTHROPIC_API_KEY comes from env and is never logged.
 */

export type Role = 'user' | 'assistant';
type TextBlock = { type: 'text'; text: string };
type ImageBlock = { type: 'image'; source: { type: 'url'; url: string } };
type ToolUseBlock = { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> };
type ToolResultBlock = { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean };
type Block = TextBlock | ImageBlock | ToolUseBlock | ToolResultBlock;
export type Turn = { role: Role; content: string | Block[] };

export interface ToolDef {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  /** Runs the tool; the returned string goes back to the model. Throw to report an error to it. */
  run: (input: Record<string, unknown>) => Promise<string>;
}

export const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

export async function runAgent(opts: {
  system: string;
  turns: Turn[];
  tools: ToolDef[];
  model?: string;
  maxSteps?: number;
}): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set');
  const turns = [...opts.turns];
  const toolDefs = opts.tools.map(({ name, description, input_schema }) => ({ name, description, input_schema }));

  for (let step = 0; step < (opts.maxSteps ?? 4); step++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: opts.model ?? process.env.MESSENGER_MODEL ?? DEFAULT_MODEL,
        max_tokens: 700,
        system: opts.system,
        messages: turns,
        tools: toolDefs,
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = (await res.json()) as { content: Block[]; stop_reason: string };

    const text = data.content
      .filter((b): b is TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    const uses = data.content.filter((b): b is ToolUseBlock => b.type === 'tool_use');
    if (data.stop_reason !== 'tool_use' || uses.length === 0) return text;

    turns.push({ role: 'assistant', content: data.content });
    const results: ToolResultBlock[] = [];
    for (const u of uses) {
      const tool = opts.tools.find((t) => t.name === u.name);
      try {
        if (!tool) throw new Error(`unknown tool ${u.name}`);
        results.push({ type: 'tool_result', tool_use_id: u.id, content: await tool.run(u.input ?? {}) });
      } catch (err) {
        results.push({ type: 'tool_result', tool_use_id: u.id, content: String((err as Error).message), is_error: true });
      }
    }
    turns.push({ role: 'user', content: results });
  }
  return '';
}

/** Merges consecutive same-role turns and drops leading assistant turns, as the API requires. */
export function normalizeTurns(turns: { role: Role; text: string }[]): Turn[] {
  const out: { role: Role; text: string }[] = [];
  for (const t of turns) {
    if (!t.text.trim()) continue;
    const last = out.at(-1);
    if (last && last.role === t.role) last.text += `\n\n${t.text}`;
    else out.push({ ...t });
  }
  while (out.length && out[0].role === 'assistant') out.shift();
  return out.map((t) => ({ role: t.role, content: t.text }));
}

const IMAGE_LINE = /^\[صورة\] (https?:\/\/\S+)$/;

/**
 * Stored messages mark images as "[صورة] <url>" lines. The newest customer turn
 * carries them as real images so the agent can see them (a payment screenshot,
 * a photo for the invitation); older ones become a short note, since Meta's
 * image links expire.
 */
export function withImages(turns: Turn[]): Turn[] {
  const lastUser = turns.map((t) => t.role).lastIndexOf('user');
  return turns.map((t, i) => {
    if (typeof t.content !== 'string') return t;
    const lines = t.content.split('\n');
    const urls = lines.map((l) => IMAGE_LINE.exec(l.trim())?.[1]).filter((u): u is string => !!u);
    if (urls.length === 0) return t;
    const text = lines.map((l) => (IMAGE_LINE.test(l.trim()) ? '[أرسل صورة]' : l)).join('\n');
    if (i !== lastUser) return { ...t, content: text };
    return {
      ...t,
      content: [
        { type: 'text', text },
        ...urls.slice(0, 3).map((url): ImageBlock => ({ type: 'image', source: { type: 'url', url } })),
      ],
    };
  });
}

/** The same turns with every image reduced to a note, for when an image cannot be fetched. */
export function withoutImages(turns: Turn[]): Turn[] {
  return turns.map((t) =>
    typeof t.content === 'string'
      ? { ...t, content: t.content.split('\n').map((l) => (IMAGE_LINE.test(l.trim()) ? '[أرسل صورة]' : l)).join('\n') }
      : t,
  );
}
