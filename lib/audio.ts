/**
 * Soundtrack resolution for the Player.
 *
 * Templates declare a `music` key in their theme (e.g. `wedding-strings`),
 * which maps to a file under `public/audio/`.
 *
 * LICENSING: no audio ships with the repo. To light a track up, drop the
 * licensed file in as `public/audio/<key>.mp3` AND add its key to
 * `SHIPPED_TRACKS` below (a unit test fails if the two disagree).
 *
 * Why a manifest instead of "try the URL and see": the browser logs every 404
 * as a console error, and it does so before any `onError` handler can hide
 * it. The only way a template whose track is missing produces no error and no
 * dead control is to never request the file at all — so the Player asks this
 * list first and renders nothing for an unlisted key.
 */

/** Every `music` key used by the template catalog. */
export const TRACK_KEYS = [
  'wedding-strings',
  'soft-piano',
  'oud-romantic',
  'romantic-strings',
  'cinematic-swell',
  'happy-birthday-uplift',
  'eid-takbir-soft',
  'triumphant-soft',
  'lullaby-soft',
] as const;

export type TrackKey = (typeof TRACK_KEYS)[number];

/**
 * Tracks whose file actually exists in `public/audio/`. Empty until licensed
 * audio is added — see public/audio/README.md.
 */
export const SHIPPED_TRACKS: ReadonlySet<string> = new Set<TrackKey>([]);

/**
 * Public URL for a template's soundtrack, or null when it declares none or
 * the file has not shipped.
 */
export function trackUrl(music?: string | null, shipped: ReadonlySet<string> = SHIPPED_TRACKS): string | null {
  if (!music) return null;
  // Keys come from template JSON, so keep them to a safe charset rather than
  // interpolating whatever the definition happens to contain into a path.
  if (!/^[a-z0-9-]{1,64}$/.test(music)) return null;
  if (!shipped.has(music)) return null;
  return `/audio/${music}.mp3`;
}

/** Playback volume: present, but under the content. */
export const TRACK_VOLUME = 0.5;

/** Remembers a viewer's mute choice across cards on the same device. */
export const MUTE_STORAGE_KEY = 'congrats:muted';

export function readMutePreference(): boolean {
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === '1';
  } catch {
    // Private mode / blocked storage — default to sound on.
    return false;
  }
}

export function writeMutePreference(muted: boolean): void {
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? '1' : '0');
  } catch {
    /* non-fatal */
  }
}
