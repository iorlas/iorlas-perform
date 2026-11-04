#!/usr/bin/env node
// node render.mjs --scene DIR --cache DIR [--work DIR] [--chrome PATH] [--concurrency N]
// DIR holds Python's shots.json + mouth_*.json. Verifies rigs (rig.lock), computes the cache key, renders on a miss.
// Prints one JSON line {id, key, file, hit, seconds, engine, adapter}; exit 1 with the reason on stderr (a tampered rig included).
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { verifyRigs, stageRigs, stageScene } from "./src/stage.mjs";
import { ENGINE, ADAPTER_VERSION, CODEC, COMPOSITION, render } from "./src/adapter.mjs";

const a = process.argv.slice(2), opt = (n) => { const i = a.indexOf("--" + n); return i < 0 ? undefined : a[i + 1]; };
for (const r of ["scene", "cache"]) if (!opt(r)) { console.error("missing --" + r); process.exit(2); }
const sceneDir = resolve(opt("scene")), cacheDir = resolve(opt("cache")), chrome = opt("chrome") || process.env.PERFORM_CHROME;
try {
  const shots = JSON.parse(readFileSync(join(sceneDir, "shots.json"), "utf8"));
  const facts = verifyRigs(shots.actors.map((x) => x.rig)); // a tampered rig stops here, before any staging
  const publicDir = mkdtempSync(join(opt("work") ? (mkdirSync(resolve(opt("work")), { recursive: true }), resolve(opt("work"))) : tmpdir(), "public-"));
  stageRigs(publicDir, facts);
  const { id, key } = stageScene(publicDir, sceneDir, facts, { engine: ENGINE, adapterVersion: ADAPTER_VERSION, composition: COMPOSITION, codec: CODEC });
  mkdirSync(cacheDir, { recursive: true });
  const file = join(cacheDir, `${key}.mp4`), hit = existsSync(file), t0 = Date.now();
  if (!hit) await render(publicDir, id, file, { chrome, concurrency: opt("concurrency") ? +opt("concurrency") : undefined });
  rmSync(publicDir, { recursive: true, force: true });
  console.log(JSON.stringify({ id, key, file, hit, seconds: (Date.now() - t0) / 1000, engine: ENGINE, adapter: ADAPTER_VERSION, codec: CODEC }));
} catch (e) { console.error(e.message); process.exit(1); }
