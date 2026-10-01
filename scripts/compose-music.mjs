// Original background music for the Congrats templates, composed in code.
// Every note here is written for this project: no samples, no third-party audio.
import { writeFileSync } from 'node:fs';
const SR = 44100;
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

class Mix {
  constructor(sec) { this.n = Math.ceil(sec * SR); this.L = new Float32Array(this.n); this.R = new Float32Array(this.n); }
  add(buf, t, gain = 1, pan = 0) {
    const s0 = Math.floor(t * SR), gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
    for (let i = 0; i < buf.length && s0 + i < this.n; i++) { if (s0 + i < 0) continue; this.L[s0 + i] += buf[i] * gl; this.R[s0 + i] += buf[i] * gr; }
  }
}
// --- instruments ---------------------------------------------------------
function pluck(freq, dur, bright = 0.5, seed = 1) { // Karplus-Strong: oud / harp / guitar
  const r = rng(seed), N = Math.max(2, Math.round(SR / freq)), buf = new Float32Array(N), out = new Float32Array(Math.floor(dur * SR));
  for (let i = 0; i < N; i++) buf[i] = r() * 2 - 1;
  let idx = 0, last = 0; const damp = 0.996 - (1 - bright) * 0.006;
  for (let i = 0; i < out.length; i++) { const cur = buf[idx]; const nxt = buf[(idx + 1) % N]; const v = damp * (bright * cur + (1 - bright) * 0.5 * (cur + nxt)); buf[idx] = v; out[i] = cur; idx = (idx + 1) % N; last = cur; }
  for (let i = 0; i < 200 && i < out.length; i++) out[i] *= i / 200;
  return out;
}
function piano(freq, dur) {
  const out = new Float32Array(Math.floor(dur * SR)); const parts = [[1, 1], [2, 0.42], [3, 0.2], [4, 0.1], [5, 0.05]];
  for (const [h, a] of parts) { const f = freq * h * (1 + 0.0004 * h * h), dec = 2.2 + h * 1.4;
    for (let i = 0; i < out.length; i++) { const t = i / SR; out[i] += a * Math.sin(2 * Math.PI * f * t) * Math.exp(-dec * t); } }
  for (let i = 0; i < 120 && i < out.length; i++) out[i] *= i / 120;
  return out;
}
function bell(freq, dur) { // music box / celesta
  const out = new Float32Array(Math.floor(dur * SR)); const parts = [[1, 1, 2.5], [2.76, 0.35, 4], [5.4, 0.15, 7], [8.93, 0.06, 9]];
  for (const [h, a, d] of parts) for (let i = 0; i < out.length; i++) { const t = i / SR; out[i] += a * Math.sin(2 * Math.PI * freq * h * t) * Math.exp(-d * t); }
  for (let i = 0; i < 60; i++) out[i] *= i / 60;
  return out;
}
function pad(freqs, dur, { attack = 1.2, release = 1.5, bright = 0.25 } = {}) { // warm strings
  const out = new Float32Array(Math.floor(dur * SR)); const det = [-0.12, 0, 0.11];
  for (const f0 of freqs) for (const d of det) { const f = f0 * Math.pow(2, d / 12); let ph = Math.random();
    for (let i = 0; i < out.length; i++) { ph += f / SR; ph -= Math.floor(ph); const tri = 1 - 4 * Math.abs(ph - 0.5); const saw = 2 * ph - 1; out[i] += (tri * (1 - bright) + saw * bright) / (freqs.length * det.length); } }
  let lp = 0; const a = 0.08; for (let i = 0; i < out.length; i++) { lp += a * (out[i] - lp); out[i] = lp; }
  const n = out.length; for (let i = 0; i < n; i++) { const t = i / SR, e = Math.min(1, t / attack) * Math.min(1, (dur - t) / release); out[i] *= Math.max(0, e); }
  return out;
}
function drum(kind, seed = 7) { // soft darbuka "dum"/"tak", or a light clap
  const r = rng(seed), dur = kind === 'dum' ? 0.35 : 0.12, out = new Float32Array(Math.floor(dur * SR));
  for (let i = 0; i < out.length; i++) { const t = i / SR;
    if (kind === 'dum') out[i] = Math.sin(2 * Math.PI * (90 + 60 * Math.exp(-30 * t)) * t) * Math.exp(-9 * t);
    else out[i] = (r() * 2 - 1) * Math.exp(-(kind === 'clap' ? 28 : 45) * t) * 0.6 + (kind === 'tak' ? Math.sin(2 * Math.PI * 520 * t) * Math.exp(-40 * t) * 0.4 : 0); }
  return out;
}
// --- reverb (Schroeder) ---------------------------------------------------
function reverb(x, mix = 0.28, size = 1) {
  const combs = [1557, 1617, 1491, 1422].map((d) => Math.round(d * size)), aps = [225, 556, 441];
  const y = new Float32Array(x.length);
  for (const d of combs) { const b = new Float32Array(d); let k = 0, lp = 0;
    for (let i = 0; i < x.length; i++) { const o = b[k]; lp = o * 0.8 + lp * 0.2; b[k] = x[i] + lp * 0.84; y[i] += o / combs.length; k = (k + 1) % d; } }
  for (const d of aps) { const b = new Float32Array(d); let k = 0;
    for (let i = 0; i < y.length; i++) { const bo = b[k]; const o = -y[i] + bo; b[k] = y[i] + bo * 0.5; y[i] = o; k = (k + 1) % d; } }
  const out = new Float32Array(x.length); for (let i = 0; i < x.length; i++) out[i] = x[i] * (1 - mix) + y[i] * mix; return out;
}
// --- writing a loop -------------------------------------------------------
function render(name, sec, compose, { rev = 0.3, size = 1 } = {}) {
  const tail = 4, m = new Mix(sec + tail); compose(m);
  let L = reverb(m.L, rev, size), R = reverb(m.R, rev, size * 1.03);
  // Seamless loop: fold the reverb tail back onto the start.
  const n = Math.floor(sec * SR), t = Math.floor(tail * SR), oL = new Float32Array(n), oR = new Float32Array(n);
  for (let i = 0; i < n; i++) { oL[i] = L[i]; oR[i] = R[i]; }
  for (let i = 0; i < t && n + i < L.length; i++) { oL[i] += L[n + i]; oR[i] += R[n + i]; }
  let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(oL[i]), Math.abs(oR[i]));
  const g = 0.86 / (peak || 1), inter = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { inter[2 * i] = Math.tanh(oL[i] * g * 1.1) * 0.92; inter[2 * i + 1] = Math.tanh(oR[i] * g * 1.1) * 0.92; }
  writeFileSync(`${name}.f32`, Buffer.from(inter.buffer)); console.log('rendered', name, sec + 's');
}
const chordsOf = (root, pattern) => pattern.map((c) => c.map((x) => root + x));
const MAJ = { I: [0, 4, 7], ii: [2, 5, 9], iii: [4, 7, 11], IV: [5, 9, 12], V: [7, 11, 14], vi: [9, 12, 16] };

// Shared "song" engine: chords as pad + broken-chord accompaniment + a melody line.
function song(m, { root, prog, bpm, bars, beats = 4, accomp = 'harp', lead = 'piano', melody, padGain = 0.5, accGain = 0.55, leadGain = 0.6, drums }) {
  const spb = 60 / bpm, barLen = spb * beats;
  for (let b = 0; b < bars; b++) {
    const ch = prog[b % prog.length].map((x) => root + x), t0 = b * barLen;
    m.add(pad(ch.map((n) => midi(n - 12)), barLen + 1.2), t0, padGain, 0);
    const arp = [ch[0] - 12, ch[1], ch[2], ch[1] + 12, ch[2], ch[1], ch[0] + 12, ch[2]];
    const steps = beats * 2;
    for (let s = 0; s < steps; s++) { const note = arp[s % arp.length], t = t0 + s * spb / 2;
      const buf = accomp === 'harp' ? pluck(midi(note), 2.2, 0.55, b * 31 + s) : accomp === 'bell' ? bell(midi(note + 12), 1.8) : piano(midi(note), 2);
      m.add(buf, t, accGain * (s % 2 ? 0.6 : 0.85), s % 2 ? 0.35 : -0.35); }
    if (drums) drums(m, t0, spb, b);
  }
  for (const [beat, note, len] of melody) { if (note == null) continue; const t = beat * spb;
    const buf = lead === 'piano' ? piano(midi(note), Math.max(1.5, len * spb + 1)) : lead === 'bell' ? bell(midi(note), 2.2) : lead === 'oud' ? pluck(midi(note), 2.5, 0.75, note * 13 + beat) : pad([midi(note)], len * spb + 0.6, { attack: 0.08, release: 0.4, bright: 0.45 });
    m.add(buf, t, leadGain, 0.1); }
}
// Melody helper: [beat, midi, lengthInBeats]
const mel = (start, notes, beatLen = 1) => { const out = []; let b = start; for (const n of notes) { if (Array.isArray(n)) { out.push([b, n[0], n[1]]); b += n[1]; } else { out.push([b, n, beatLen]); b += beatLen; } } return out; };

// 1. Wedding strings — D major, gentle, 72 bpm
render('wedding-strings', 53.33, (m) => {
  const D = 62; const prog = [MAJ.I, MAJ.V, MAJ.vi, MAJ.IV];
  const melody = [...mel(0, [[74, 2], [73, 1], [71, 1], [69, 3], [66, 1], [67, 2], [69, 1], [71, 1], [69, 4]]),
                  ...mel(16, [[74, 2], [76, 1], [78, 1], [76, 3], [74, 1], [73, 2], [71, 2], [74, 4]]),
                  ...mel(32, [[78, 2], [76, 1], [74, 1], [73, 3], [71, 1], [71, 2], [73, 1], [74, 1], [76, 4]]),
                  ...mel(48, [[74, 1.5], [76, 0.5], [78, 2], [76, 2], [73, 2], [71, 2], [69, 2], [74, 4]])];
  song(m, { root: D, prog, bpm: 72, bars: 16, accomp: 'harp', lead: 'strings', melody, leadGain: 0.42 });
});
// 2. Soft piano — C major, 66 bpm
render('soft-piano', 58.18, (m) => {
  const prog = [MAJ.I, MAJ.vi, MAJ.IV, MAJ.V];
  const melody = [...mel(0, [[76, 2], [74, 1], [72, 1], [74, 4], [72, 2], [71, 1], [69, 1], [67, 4]]), ...mel(16, [[69, 2], [71, 1], [72, 1], [74, 3], [76, 1], [77, 2], [76, 2], [74, 4]]),
                  ...mel(32, [[76, 2], [79, 2], [77, 2], [76, 1], [74, 1], [72, 4], [74, 4]]), ...mel(48, [[72, 2], [71, 2], [69, 2], [67, 2], [72, 8]])];
  song(m, { root: 60, prog, bpm: 66, bars: 16, accomp: 'piano', lead: 'piano', melody, padGain: 0.3, accGain: 0.4 });
});
// 3. Oud romantic — Hijaz on D, 84 bpm, soft darbuka
const HIJAZ_D = [62, 63, 66, 67, 69, 70, 72, 74];
render('oud-romantic', 45.71, (m) => {
  const bpm = 84, spb = 60 / bpm, bars = 16;
  for (let b = 0; b < bars; b++) { const t0 = b * 4 * spb;
    m.add(pad([midi(50), midi(57)], 4 * spb + 1.2, { attack: 0.6 }), t0, 0.35);
    m.add(drum('dum', b), t0, 0.5); m.add(drum('tak', b + 1), t0 + 1.5 * spb, 0.25, 0.3); m.add(drum('tak', b + 2), t0 + 2 * spb, 0.22, -0.3); m.add(drum('dum', b + 3), t0 + 3 * spb, 0.35); }
  const phrase = [[62, 1], [63, 0.5], [66, 0.5], [67, 1], [69, 1], [70, 1], [69, 0.5], [67, 0.5], [66, 1], [63, 1], [62, 2], [69, 1], [70, 0.5], [72, 0.5], [74, 2], [72, 1], [70, 1], [69, 1], [67, 1], [66, 2], [63, 1], [62, 3]];
  let beat = 0; for (let rep = 0; rep < 3; rep++) for (const [n, l] of phrase) { m.add(pluck(midi(n), 2.4, 0.8, n * 7 + beat * 3), beat * spb, 0.7, 0.15); if (l >= 1) m.add(pluck(midi(n), 1.2, 0.8, n), (beat + 0.5) * spb, 0.25, -0.2); beat += l; }
}, { rev: 0.32 });
// 4. Romantic strings — A minor feel, 70 bpm
render('romantic-strings', 54.86, (m) => {
  const prog = [[9, 12, 16], [5, 9, 12], [0, 4, 7], [7, 11, 14]];
  const melody = [...mel(0, [[76, 2], [72, 1], [74, 1], [76, 2], [79, 2], [77, 2], [76, 1], [74, 1], [72, 4]]), ...mel(16, [[69, 2], [72, 2], [76, 3], [74, 1], [72, 2], [71, 2], [72, 4]]),
                  ...mel(32, [[81, 2], [79, 1], [77, 1], [76, 2], [72, 2], [74, 2], [76, 1], [77, 1], [76, 4]]), ...mel(48, [[72, 2], [74, 2], [71, 2], [69, 6]])];
  song(m, { root: 60, prog, bpm: 70, bars: 16, accomp: 'piano', lead: 'strings', melody, accGain: 0.38, leadGain: 0.45 });
});
// 5. Cinematic swell — slow, building, 60 bpm
render('cinematic-swell', 64, (m) => {
  const prog = [MAJ.vi, MAJ.IV, MAJ.I, MAJ.V]; const spb = 1;
  for (let b = 0; b < 16; b++) { const ch = prog[b % 4].map((x) => 57 + x), t0 = b * 4, g = 0.25 + 0.5 * (b / 15);
    m.add(pad(ch.map((n) => midi(n - 12)).concat([midi(ch[0] - 24)]), 5.2, { attack: 2, release: 2, bright: 0.2 + 0.25 * (b / 15) }), t0, g);
    for (let s = 0; s < 4; s++) m.add(piano(midi(ch[s % 3] + 12), 3), t0 + s * spb, 0.25 + 0.2 * (b / 15), s % 2 ? 0.3 : -0.3);
    if (b >= 8) m.add(drum('dum', b), t0, 0.25 + 0.3 * ((b - 8) / 7)); }
}, { rev: 0.4, size: 1.2 });
// 6. Happy birthday uplift — F major, 112 bpm, bells + claps (original tune)
render('happy-birthday-uplift', 34.29, (m) => {
  const prog = [MAJ.I, MAJ.IV, MAJ.V, MAJ.I];
  const melody = [...mel(0, [72, 72, 74, 76, [77, 2], 76, 74, 72, 74, [76, 2], [72, 2]]), ...mel(16, [77, 77, 76, 74, [72, 2], 74, 76, 77, 79, [81, 2], [77, 2]]),
                  ...mel(32, [72, 72, 74, 76, [77, 2], 76, 74, 72, 74, [76, 2], [72, 2]]), ...mel(48, [81, 79, 77, 76, [74, 2], 76, 77, [79, 2], [77, 2], [77, 2]])];
  song(m, { root: 65, prog, bpm: 112, bars: 16, accomp: 'harp', lead: 'bell', melody, accGain: 0.45, leadGain: 0.55, padGain: 0.3,
    drums: (mm, t0, spb, b) => { mm.add(drum('dum', b), t0, 0.35); mm.add(drum('clap', b), t0 + spb, 0.28); mm.add(drum('dum', b + 9), t0 + 2 * spb, 0.3); mm.add(drum('clap', b + 3), t0 + 3 * spb, 0.28); } });
});
// 7. Eid — Rast feel on C, joyful, 96 bpm, oud + strings + darbuka
render('eid-takbir-soft', 40, (m) => {
  const bpm = 96, spb = 60 / bpm;
  for (let b = 0; b < 16; b++) { const t0 = b * 4 * spb; const ch = b % 4 < 2 ? [48, 55, 60] : [53, 57, 60];
    m.add(pad(ch.map(midi), 4 * spb + 1), t0, 0.35);
    m.add(drum('dum', b), t0, 0.45); m.add(drum('tak', b), t0 + spb, 0.22, 0.3); m.add(drum('tak', b + 5), t0 + 1.5 * spb, 0.18, -0.3); m.add(drum('dum', b + 2), t0 + 2 * spb, 0.35); m.add(drum('tak', b + 7), t0 + 3 * spb, 0.22, 0.2); }
  const phrase = [[60, 1], [62, 0.5], [63.5, 0.5], [65, 1], [67, 1], [69, 0.5], [67, 0.5], [65, 1], [63.5, 1], [62, 1], [60, 2], [67, 1], [69, 0.5], [70, 0.5], [72, 2], [70, 1], [69, 1], [67, 1], [65, 1], [63.5, 1], [62, 1], [60, 2]];
  let beat = 0; while (beat < 60) for (const [n, l] of phrase) { if (beat >= 60) break; m.add(pluck(midi(n), 2.2, 0.8, Math.round(n * 9 + beat)), beat * spb, 0.7, 0.1); beat += l; }
}, { rev: 0.3 });
// 8. Triumphant soft — Bb major, 96 bpm, graduation
render('triumphant-soft', 40, (m) => {
  const prog = [MAJ.I, MAJ.iii, MAJ.IV, MAJ.V];
  const melody = [...mel(0, [[70, 1], [74, 1], [77, 2], [75, 1], [74, 1], [72, 2], [74, 2], [70, 2], [72, 4]]), ...mel(16, [[70, 1], [74, 1], [77, 2], [79, 2], [77, 1], [75, 1], [74, 2], [72, 2], [70, 4]]),
                  ...mel(32, [[82, 2], [81, 1], [79, 1], [77, 2], [74, 2], [75, 2], [77, 2], [79, 4]]), ...mel(48, [[77, 2], [74, 2], [72, 2], [74, 2], [70, 8]])];
  song(m, { root: 58, prog, bpm: 96, bars: 16, accomp: 'harp', lead: 'strings', melody, leadGain: 0.5, padGain: 0.45,
    drums: (mm, t0, spb, b) => { mm.add(drum('dum', b), t0, 0.4); if (b % 2) mm.add(drum('dum', b + 4), t0 + 2.5 * spb, 0.25); } });
});
// 9. Lullaby — G major waltz, 76 bpm, music box
render('lullaby-soft', 37.89, (m) => {
  const prog = [MAJ.I, MAJ.IV, MAJ.I, MAJ.V];
  const melody = [...mel(0, [[79, 2], 78, [76, 2], 74, [76, 3], [74, 3]]), ...mel(12, [[72, 2], 74, [76, 2], 78, [79, 3], [74, 3]]),
                  ...mel(24, [[79, 2], 81, [83, 2], 81, [79, 3], [76, 3]]), ...mel(36, [[74, 2], 76, [78, 2], 76, [79, 6]])];
  song(m, { root: 67, prog, bpm: 76, bars: 16, beats: 3, accomp: 'bell', lead: 'bell', melody, padGain: 0.25, accGain: 0.3, leadGain: 0.6 });
}, { rev: 0.35 });
