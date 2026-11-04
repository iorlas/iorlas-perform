// Staging: verify rigs against rig.lock, vendor them byte-for-byte into the render public dir, write per-scene files, compute the scene cache key.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyRig, sceneCacheKey, sha } from "./rig_lock.mjs";

export const ENGINE = "remotion@4.0.540", ADAPTER_VERSION = "engine-1";
const here = dirname(fileURLToPath(import.meta.url));
export const RIGS_ROOT = join(here, "..", "..", "rigs");

/** refs: ["mihalych@1.0.0", ...] -> [{id,version,sha256,engine_api,manifest}], throws RIG TAMPERED on drift. */
export function verifyRigs(refs, rigsRoot = RIGS_ROOT) {
  return [...new Set(refs)].map((r) => { const [id, v] = r.split("@"); return verifyRig(join(rigsRoot, id, v), id, v); });
}

/** Copy verified rigs into publicDir/rigs and verify the copy again (that copy is what Chrome loads). */
export function stageRigs(publicDir, facts, rigsRoot = RIGS_ROOT) {
  for (const f of facts) {
    const dst = join(publicDir, "rigs", f.id, f.version);
    cpSync(join(rigsRoot, f.id, f.version), dst, { recursive: true });
    verifyRig(dst, f.id, f.version);
  }
  cpSync(join(here, "core.js"), join(publicDir, "core.js"));
}

/** Fill kind/art on each actor from its rig manifest. */
export function enrichActors(shots, facts) {
  for (const a of shots.actors) {
    const f = facts.find((x) => `${x.id}@${x.version}` === a.rig);
    if (!f) throw new Error(`actor ${a.id}: rig ${a.rig} not verified`);
    if (!a.kind) a.kind = f.manifest.body_type === "object" ? "object" : "character";
    a.art = f.manifest.module.file;
  }
  return shots;
}

/** Write publicDir/scenes/<id>/{shots.json, mouth_*.json, audio.wav}; returns {key, dir}. */
export function stageScene(publicDir, scene, facts, audioPath, opts = {}) {
  const dir = join(publicDir, "scenes", scene.shots.scene);
  mkdirSync(dir, { recursive: true });
  enrichActors(scene.shots, facts);
  const shotsText = JSON.stringify(scene.shots, null, 1);
  writeFileSync(join(dir, "shots.json"), shotsText);
  const mouthShas = {};
  for (const [id, m] of Object.entries(scene.mouth)) { const t = JSON.stringify(m); writeFileSync(join(dir, `mouth_${id}.json`), t); mouthShas[id] = sha(t); }
  cpSync(audioPath, join(dir, "audio.wav"));
  const rigs = facts.filter((f) => scene.shots.actors.some((a) => a.rig === `${f.id}@${f.version}`)); // only rigs this scene uses
  const key = sceneCacheKey({ rigs, shotsSha: sha(shotsText), extraInputs: { mouth: mouthShas, audio: sha(readFileSync(audioPath)), core: sha(readFileSync(join(here, "core.js"))), composition: sha(readFileSync(join(here, "..", "remotion", "index.jsx"))), codec: opts.codec ?? "h264-crf16" },
    fps: scene.shots.fps, size: scene.shots.size, engine: ENGINE, adapterVersion: ADAPTER_VERSION });
  return { key, dir };
}
