// Fake mouth_open envelope: syllable-like pulses inside speech spans. Deterministic (mulberry32). 30 samples/s, values 0..0.9.
import { writeFileSync } from "node:fs";
const spans = [[0.4, 4.6], [5.8, 9.4]];
let a = 7;
const rnd = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const fps = 30, dur = 10, env = [];
const syl = []; // random syllable amplitudes per ~0.17 s slot
for (let i = 0; i < dur * 6 + 2; i++) syl.push(0.25 + 0.65 * rnd());
for (let f = 0; f < dur * fps; f++) {
  const t = f / fps, inSpan = spans.some(([s, e]) => t >= s && t < e);
  if (!inSpan) { env.push(0); continue; }
  const slot = t / 0.17, k = Math.floor(slot), ph = slot - k;
  env.push(+(syl[k] * Math.sin(Math.PI * ph) ** 0.8).toFixed(3));
}
writeFileSync(new URL("mouth_open.json", import.meta.url), JSON.stringify({ kind: "mouth_open", fake: true, fps, samples: env }) + "\n");
console.log("samples", env.length);
