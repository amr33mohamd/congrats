/**
 * Soundtrack resolution for the Player.
 *
 * Templates have always declared a `music` key in their theme (e.g.
 * `wedding-strings`), and the paid tier advertises music — but nothing ever
 * played it. This maps that key to a file under `public/audio/`.
 *
 * LICENSING: no audio ships with the repo. Drop licensed tracks in as
 * `public/audio/<key>.mp3` and they light up automatically. A missing file is
 * not an error — `useSoundtrack` simply reports the track as unavailable and
 * the Player hides its music control, so a template without audio behaves
 * exactly as it did before.
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

/** Public URL for a template's soundtrack, or null when it declares none. */
export function trackUrl(music?: string | null): string | null {
  if (!music) return null;
  // Keys come from template JSON, so keep them to a safe charset rather than
  // interpolating whatever the definition happens to contain into a path.
  if (!/^[a-z0-9-]{1,64}$/.test(music)) return null;
  return `/audio/${music}.mp3`;
}

/** Playback volume. Matches the reference: present, but under the content. */
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
