// Rig lock verification + scene cache key. Mirrors video/rigs/verify.py (sha256-tree-v1) in Node.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const sha = (buf) => createHash("sha256").update(buf).digest("hex");

function walk(dir, base = dir, out = []) {
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, base, out);
    else out.push(relative(base, p).split(sep).join("/"));
  }
  return out;
}

const excluded = (rel) =>
  rel.endsWith(".DS_Store") || rel.includes("__pycache__") || rel === "rig.lock" ||
  (rel.startsWith("golden/") && rel.toLowerCase().endsWith(".png"));

export function treeHash(rigDir) {
  const files = {};
  for (const rel of walk(rigDir)) if (!excluded(rel)) files[rel] = sha(readFileSync(join(rigDir, rel)));
  const listing = Object.keys(files).sort().map((p) => `${p}\0${files[p]}\n`).join("");
  return { sha256: sha(listing), files };
}

/** Throws when the recomputed hash differs from rig.lock. Returns the facts an engine needs. */
export function verifyRig(rigDir, expectId, expectVersion) {
  const lock = JSON.parse(readFileSync(join(rigDir, "rig.lock"), "utf8"));
  const manifest = JSON.parse(readFileSync(join(rigDir, "rig.json"), "utf8"));
  if (lock.id !== expectId || lock.version !== expectVersion || manifest.id !== expectId || manifest.version !== expectVersion)
    throw new Error(`rig identity mismatch in ${rigDir}: want ${expectId}@${expectVersion}`);
  if (lock.algorithm !== "sha256-tree-v1") throw new Error(`unknown lock algorithm ${lock.algorithm}`);
  const got = treeHash(rigDir);
  if (got.sha256 !== lock.sha256) {
    const drift = Object.keys({ ...lock.files, ...got.files }).filter((p) => lock.files[p] !== got.files[p]);
    throw new Error(`RIG TAMPERED ${expectId}@${expectVersion}: lock ${lock.sha256.slice(0, 12)} != actual ${got.sha256.slice(0, 12)}; drifted: ${drift.join(", ")}`);
  }
  return { id: expectId, version: expectVersion, sha256: lock.sha256, engine_api: manifest.requires.engine_api, manifest };
}

/** Scene cache key per video/rigs/README.md: rig id+version+sha256, engine_api, scene sheet hash, fps, size (+ engine, adapter, extra inputs). */
export function sceneCacheKey({ rigs, shotsSha, extraInputs = {}, fps, size, engine, adapterVersion }) {
  const doc = {
    engine, adapterVersion, fps, size, shotsSha, extraInputs,
    rigs: rigs.map((r) => ({ id: r.id, version: r.version, sha256: r.sha256, engine_api: r.engine_api })).sort((a, b) => a.id.localeCompare(b.id)),
  };
  return sha(JSON.stringify(doc));
}

export { sha };
