// Slow end-to-end tests (start Chrome via Remotion). Need a Chrome: set PERFORM_CHROME=/path/to/chrome-headless-shell, or let Remotion download its own.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../src/pipeline.mjs";

const demo = join(dirname(fileURLToPath(import.meta.url)), "..", "demo");
const audio = join(demo, "demo.wav");
const chrome = process.env.PERFORM_CHROME;
const skip = existsSync(audio) ? false : "demo/demo.wav missing: run demo/make_audio.sh";
const base = { timeline: join(demo, "demo.timeline.json"), sheet: join(demo, "demo.sheet.json"), audio, chrome, onLog: () => {} };
const md5 = (f) => execFileSync("ffmpeg", ["-v", "error", "-i", f, "-map", "0:v", "-f", "framemd5", "-"]).toString().split("\n").filter((l) => l && !l.startsWith("#")).map((l) => l.split(",")[5]).join(",");
const dur = (f) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString();

test("two scenes render and concat; second run is all cache hits; same inputs give identical frames", { skip, timeout: 600000 }, async () => {
  const out = mkdtempSync(join(tmpdir(), "eng-"));
  const r1 = await run({ ...base, outDir: out });
  assert.deepEqual(r1.manifest.scenes.map((s) => s.hit), [false, false]);
  const sum = r1.manifest.scenes.reduce((a, s) => a + s.duration, 0);
  assert.ok(Math.abs(dur(r1.final) - sum) < 0.1, `final ${dur(r1.final)} s vs scenes ${sum} s`);
  const h1 = md5(r1.final);
  const r2 = await run({ ...base, outDir: out });
  assert.deepEqual(r2.manifest.scenes.map((s) => s.hit), [true, true], "unchanged scenes are cache hits");
  assert.equal(md5(r2.final), h1);
  const out2 = mkdtempSync(join(tmpdir(), "eng-")); // cold cache, other dir: must reproduce the same frames
  const r3 = await run({ ...base, outDir: out2 });
  assert.equal(md5(r3.final), h1, "re-render from scratch gives identical framemd5");
});

test("changing one scene's cue re-renders only that scene", { skip, timeout: 600000 }, async () => {
  const out = mkdtempSync(join(tmpdir(), "eng-"));
  await run({ ...base, outDir: out });
  const sheet = JSON.parse(readFileSync(base.sheet, "utf8"));
  sheet.scenes["Ночь"].cues.find((c) => c.value === "soft_smile").value = "pretend";
  const p = join(out, "sheet2.json"); writeFileSync(p, JSON.stringify(sheet));
  const r = await run({ ...base, sheet: p, outDir: out });
  assert.deepEqual(r.manifest.scenes.map((s) => s.hit), [true, false]);
});
