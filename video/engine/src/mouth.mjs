// Real mouth_open envelope from audio: RMS per video frame, gated to the actor's own turns, 0..0.9, deterministic.
import { readFileSync } from "node:fs";

export function readWav(path) {
  const b = readFileSync(path);
  if (b.toString("ascii", 0, 4) !== "RIFF") throw new Error("not a wav: " + path);
  let o = 12, fmt = null, data = null;
  while (o + 8 <= b.length) {
    const id = b.toString("ascii", o, o + 4), n = b.readUInt32LE(o + 4);
    if (id === "fmt ") fmt = { tag: b.readUInt16LE(o + 8), ch: b.readUInt16LE(o + 10), sr: b.readUInt32LE(o + 12), bits: b.readUInt16LE(o + 22) };
    if (id === "data") { data = b.subarray(o + 8, o + 8 + n); break; }
    o += 8 + n + (n & 1);
  }
  if (!fmt || !data) throw new Error("bad wav: " + path);
  if (fmt.tag !== 1 || fmt.bits !== 16) throw new Error(`wav must be PCM16 (got tag ${fmt.tag}, ${fmt.bits} bit): ${path}`);
  const frames = Math.floor(data.length / (2 * fmt.ch)), mono = new Float32Array(frames);
  for (let i = 0; i < frames; i++) { let s = 0; for (let c = 0; c < fmt.ch; c++) s += data.readInt16LE((i * fmt.ch + c) * 2); mono[i] = s / fmt.ch / 32768; }
  return { sr: fmt.sr, samples: mono };
}

/** turns: [{start,end}] scene-relative seconds for this actor. Returns {fps, samples[]} (one value per video frame). */
export function envelope(wav, fps, duration, turns) {
  const n = Math.round(duration * fps), rms = new Array(n).fill(0), win = wav.sr / fps;
  for (let f = 0; f < n; f++) {
    const a = Math.floor(f * win), b = Math.min(wav.samples.length, Math.floor((f + 1) * win));
    let s = 0; for (let i = a; i < b; i++) s += wav.samples[i] * wav.samples[i];
    rms[f] = b > a ? Math.sqrt(s / (b - a)) : 0;
  }
  const gated = rms.map((v, f) => (turns.some((t) => f / fps >= t.start - 0.05 && f / fps < t.end + 0.05) ? v : 0));
  const sorted = gated.filter((v) => v > 0).sort((x, y) => x - y);
  const ref = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : 1;
  const raw = gated.map((v) => Math.min(0.9, (v / ref) * 0.9));
  const sm = raw.map((v, i) => Math.max(v, 0.6 * (raw[i - 1] ?? 0), 0.6 * (raw[i + 1] ?? 0))); // dilate one frame so syllable gaps do not flutter
  return { kind: "mouth_open", fps, samples: sm.map((v) => (v < 0.08 ? 0 : +v.toFixed(3))) };
}
