import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifyRigs, RIGS_ROOT } from "../src/stage.mjs";
import { sceneCacheKey } from "../src/rig_lock.mjs";

const facts = () => verifyRigs(["mihalych@1.0.0", "zinaida@1.0.0"]);

test("pristine frozen rigs verify against rig.lock", () => { assert.equal(facts().length, 2); });

test("a tampered rig is refused, naming the drifted file", () => {
  const root = mkdtempSync(join(tmpdir(), "rigs-"));
  cpSync(join(RIGS_ROOT, "mihalych"), join(root, "mihalych"), { recursive: true });
  appendFileSync(join(root, "mihalych/1.0.0/art/mihalych_cut.js"), "\n//x");
  assert.throws(() => verifyRigs(["mihalych@1.0.0"], root), /RIG TAMPERED mihalych@1\.0\.0.*art\/mihalych_cut\.js/s);
});

test("cache key changes with rig sha, rig version, shots, audio, size, engine", () => {
  const [m, z] = facts(), base = { rigs: [m, z], shotsSha: "a", extraInputs: { audio: "x" }, fps: 30, size: [1280, 720], engine: "remotion@4.0.540", adapterVersion: "1" };
  const k = sceneCacheKey(base);
  assert.equal(k, sceneCacheKey({ ...base, rigs: [z, m] }), "stable under rig order");
  for (const [name, change] of Object.entries({
    "rig sha": { rigs: [{ ...m, sha256: "0".repeat(64) }, z] }, "rig version": { rigs: [{ ...m, version: "1.0.1" }, z] },
    shots: { shotsSha: "b" }, audio: { extraInputs: { audio: "y" } }, size: { size: [1920, 1080] }, engine: { engine: "remotion@4.0.541" } }))
    assert.notEqual(k, sceneCacheKey({ ...base, ...change }), name);
});
