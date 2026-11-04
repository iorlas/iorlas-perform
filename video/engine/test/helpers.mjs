import { writeFileSync } from "node:fs";

/** PCM16 mono wav: tone bursts at the given [start,end] windows (seconds), silence elsewhere. */
export function writeBurstWav(path, seconds, bursts, sr = 16000) {
  const n = Math.round(seconds * sr), d = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) { const t = i / sr; if (bursts.some(([a, b]) => t >= a && t < b)) d.writeInt16LE(Math.round(12000 * Math.sin(2 * Math.PI * 220 * t)), i * 2); }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + d.length, 4); h.write("WAVEfmt ", 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(d.length, 40);
  writeFileSync(path, Buffer.concat([h, d]));
}
