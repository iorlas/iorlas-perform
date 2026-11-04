// Engine-neutral prep: verify rigs, vendor them byte-for-byte into an engine project dir, derive per-run shots.json, compute the cache key.
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyRig, sceneCacheKey, sha } from "./rig_lock.mjs";

export const here = dirname(fileURLToPath(import.meta.url));
const rigsRoot = join(here, "..", "rigs");

/** opts: {dir, size:[w,h], duration, mouthFile, engine, adapterVersion, tamper} -> {shots, shotsText, rigFacts, key, mouth, audio} */
export function prepare(opts) {
  const base = JSON.parse(readFileSync(join(here, "shots.json"), "utf8"));
  const shots = { ...base, size: opts.size || base.size };
  if (shots.size[0] < shots.size[1] && base.camera.viewBox_9x16) shots.camera = { ...base.camera, viewBox: base.camera.viewBox_9x16 };
  if (opts.duration && opts.duration !== base.duration) { shots.loop = base.duration; shots.duration = opts.duration; }
  if (opts.mouthFile) shots.mouth_open = { ...shots.mouth_open, file: opts.mouthFile };
  const shotsText = JSON.stringify(shots, null, 1);
  const mouthPath = join(here, shots.mouth_open.file);
  const audioSrc = join(here, "audio", "out.wav");

  rmSync(opts.dir, { recursive: true, force: true });
  mkdirSync(join(opts.dir, "assets", "audio"), { recursive: true });
  const rigFacts = [];
  for (const actor of shots.actors) {
    const [id, version] = actor.rig.split("@");
    const f = verifyRig(join(rigsRoot, id, version), id, version);
    const dst = join(opts.dir, "assets", "rigs", id, version);
    cpSync(join(rigsRoot, id, version), dst, { recursive: true });
    if (opts.tamper) writeFileSync(join(dst, f.manifest.module.file), "/*tampered*/", { flag: "a" });
    rigFacts.push({ ...verifyRig(dst, id, version), artFile: f.manifest.module.file }); // re-verify what will actually be loaded
  }
  cpSync(audioSrc, join(opts.dir, "assets", "audio", "out.wav"));
  for (const t of shots.audio_tracks || []) cpSync(join(here, t.file), join(opts.dir, "assets", "audio", t.file.split("/").pop()));
  cpSync(join(here, "src", "core.js"), join(opts.dir, "core.js"));
  const srt = (shots.captions || []).map((c, i) => `${i + 1}\n${tc(c.t0)} --> ${tc(c.t1)}\n${c.words.map((w) => w.w).join(" ")}\n`).join("\n");
  writeFileSync(join(opts.dir, "captions.srt"), srt);
  const mouthText = readFileSync(mouthPath, "utf8");
  const key = sceneCacheKey({ rigs: rigFacts, shotsSha: sha(shotsText), extraInputs: { mouth: sha(mouthText), audio: sha(readFileSync(audioSrc)) },
    fps: shots.fps, size: shots.size, engine: opts.engine, adapterVersion: opts.adapterVersion });
  return { shots, shotsText, rigFacts, key, mouthText };
}

const tc = (s) => { const ms = Math.round(s * 1000); const p2 = (n, w = 2) => String(n).padStart(w, "0"); return `${p2(Math.floor(ms / 3600000))}:${p2(Math.floor(ms / 60000) % 60)}:${p2(Math.floor(ms / 1000) % 60)},${p2(ms % 1000, 3)}`; };
