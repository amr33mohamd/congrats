# Soundtracks

Templates declare a `music` key in `definition.theme.music` (e.g.
`wedding-strings`). The Player resolves it to `/audio/<key>.mp3` and loops it at
50% volume once the recipient taps to open the card.

**No audio ships with this repo — you must add licensed tracks yourself.**
A missing file is handled gracefully: the music control simply doesn't appear.

Drop files here named exactly after the key:

| File | Used by |
| --- | --- |
| `wedding-strings.mp3` | wedding, all wedding invitations |
| `soft-piano.mp3` | anniversary (EN) |
| `oud-romantic.mp3` | anniversary (AR) |
| `romantic-strings.mp3` | valentine |
| `cinematic-swell.mp3` | proposal |
| `happy-birthday-uplift.mp3` | birthday |
| `eid-takbir-soft.mp3` | eid |
| `triumphant-soft.mp3` | graduation |
| `lullaby-soft.mp3` | newborn |

Licensing: these play publicly on every shared card, so they need a licence that
covers public performance/synchronisation — production music libraries
(Artlist, Epidemic Sound, Musicbed) or genuinely royalty-free sources. Do not
use commercial chart music; the reference site does, and that is a liability you
do not want to inherit.
