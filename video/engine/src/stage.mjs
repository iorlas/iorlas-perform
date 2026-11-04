// Staging, engine-neutral: verify rigs against rig.lock, vendor them byte-for-byte into a public dir, compute the scene cache key.
// Knows nothing about Remotion; adapter.mjs is the only file that does.
import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyRig, sceneCacheKey, sha } from "./rig_lock.mjs";

const here = dirname(fileURLToPath(import.meta.url));
export const RIGS_ROOT = join(here, "..", "..", "rigs");
export const CORE = join(here, "core.js"), PRELUDE = join(here, "prelude.js");

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
  cpSync(CORE, join(publicDir, "core.js"));
  cpSync(PRELUDE, join(publicDir, "prelude.js"));
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

/**
 * sceneDir: Python's output, shots.json + mouth_<actor>.json. Stages it as publicDir/scenes/<id>/ and returns {id, key, duration, fps, size}.
 * `composition` is the adapter's component source: part of the key, so editing it re-renders.
 */
export function stageScene(publicDir, sceneDir, facts, { engine, adapterVersion, composition, codec }) {
  const shots = enrichActors(JSON.parse(readFileSync(join(sceneDir, "shots.json"), "utf8")), facts);
  const dir = join(publicDir, "scenes", shots.scene);
  mkdirSync(dir, { recursive: true });
  const shotsText = JSON.stringify(shots, null, 1);
  writeFileSync(join(dir, "shots.json"), shotsText);
  const mouth = {};
  for (const f of readdirSync(sceneDir).filter((n) => /^mouth_.+\.json$/.test(n)).sort()) {
    const t = readFileSync(join(sceneDir, f), "utf8");
    writeFileSync(join(dir, f), t); mouth[f] = sha(t);
  }
  const rigs = facts.filter((f) => shots.actors.some((a) => a.rig === `${f.id}@${f.version}`)); // only rigs this scene uses
  const key = sceneCacheKey({ rigs, shotsSha: sha(shotsText), extraInputs: { mouth, core: sha(readFileSync(CORE)), prelude: sha(readFileSync(PRELUDE)), composition: sha(readFileSync(composition)), codec },
    fps: shots.fps, size: shots.size, engine, adapterVersion });
  return { id: shots.scene, key, shots };
}
