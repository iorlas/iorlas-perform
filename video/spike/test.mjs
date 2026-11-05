// Spike checks that need no render: tamper refusal, cache-key sensitivity.
import { cpSync, mkdtempSync, appendFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os"; import { join, dirname } from "node:path"; import { fileURLToPath } from "node:url";
import { verifyRig, sceneCacheKey, sha } from "./rig_lock.mjs";
const here = dirname(fileURLToPath(import.meta.url)), rigs = join(here, "..", "rigs");
let fail = 0; const ok = (n, c) => { console.log((c ? "PASS " : "FAIL ") + n); if (!c) fail++; };

const m = verifyRig(join(rigs, "mihalych/1.0.0"), "mihalych", "1.0.0");
const z = verifyRig(join(rigs, "zinaida/1.0.0"), "zinaida", "1.0.0");
ok("pristine rigs verify; sha equals rig.lock", m.sha256 === JSON.parse(readFileSync(join(rigs, "mihalych/1.0.0/rig.lock"))).sha256);

const tmp = mkdtempSync(join(tmpdir(), "rig-")); cpSync(join(rigs, "mihalych/1.0.0"), join(tmp, "m"), { recursive: true });
appendFileSync(join(tmp, "m/art/mihalych_cut.js"), "\n//x"); // one-byte-ish edit
let msg = ""; try { verifyRig(join(tmp, "m"), "mihalych", "1.0.0"); } catch (e) { msg = e.message; }
ok("tampered art refused: " + msg.slice(0, 90), /RIG TAMPERED/.test(msg) && /art\/mihalych_cut.js/.test(msg));

cpSync(join(rigs, "zinaida/1.0.0"), join(tmp, "z"), { recursive: true });
let msg2 = ""; try { verifyRig(join(tmp, "z"), "zinaida", "9.9.9"); } catch (e) { msg2 = e.message; }
ok("wrong version refused", /identity mismatch/.test(msg2));
appendFileSync(join(tmp, "z/RIG.md"), " "); let msg3 = ""; try { verifyRig(join(tmp, "z"), "zinaida", "1.0.0"); } catch (e) { msg3 = e.message; }
ok("tampered RIG.md (non-art file) refused", /RIG TAMPERED/.test(msg3));

const base = { rigs: [m, z], shotsSha: "a", extraInputs: {}, fps: 30, size: [1280, 720], engine: "hyperframes@0.9.9", adapterVersion: "1" };
const k0 = sceneCacheKey(base);
ok("key stable", k0 === sceneCacheKey({ ...base, rigs: [z, m] }));
ok("key changes with rig sha", k0 !== sceneCacheKey({ ...base, rigs: [{ ...m, sha256: "0".repeat(64) }, z] }));
ok("key changes with rig version", k0 !== sceneCacheKey({ ...base, rigs: [{ ...m, version: "1.0.1" }, z] }));
ok("key changes with shots", k0 !== sceneCacheKey({ ...base, shotsSha: "b" }));
ok("key changes with fps / size / engine", [{ fps: 25 }, { size: [1920, 1080] }, { engine: "hyperframes@0.9.10" }].every((o) => k0 !== sceneCacheKey({ ...base, ...o })));
process.exit(fail ? 1 : 0);
