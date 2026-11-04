import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { segment, resolveScene } from "../src/resolve.mjs";
import { readWav } from "../src/mouth.mjs";
import { writeBurstWav } from "./helpers.mjs";

const demo = join(dirname(fileURLToPath(import.meta.url)), "..", "demo");
const tl = JSON.parse(readFileSync(join(demo, "demo.turns.json"), "utf8")), sheet = JSON.parse(readFileSync(join(demo, "demo.sheet.json"), "utf8"));

test("segment: consecutive turns of one scene title form a scene; whole frames; no overlap", () => {
  const g = segment(tl, sheet, 30);
  assert.deepEqual(g.map((x) => [x.id, x.title]), [["s01", "Утро"], ["s02", "Ночь"]]);
  for (const x of g) assert.ok(Math.abs(x.duration * 30 - Math.round(x.duration * 30)) < 1e-9, "whole frames");
  assert.ok(g[0].t1 <= g[1].t0 + 1e-9, "scene 1 ends before scene 2 starts");
  assert.ok(g[0].t0 <= 0.6 && g[0].t1 >= 8.2, "covers its turns");
});

test("resolveScene: cues become scene-relative keys, sorted, with a key at t=0", () => {
  const [g] = segment(tl, sheet, 30), dir = mkdtempSync(join(tmpdir(), "res-")), p = join(dir, "a.wav");
  writeBurstWav(p, g.duration, [[0.6 - g.t0, 4.6 - g.t0], [5.8 - g.t0, 8.2 - g.t0]]);
  const { shots, mouth } = resolveScene(g, sheet, readWav(p));
  const z = shots.tracks.find((t) => t.actor === "zinaida" && t.channel === "state");
  assert.deepEqual(z.keys.map((k) => k.value), ["idle", "working", "error"]);
  assert.equal(z.keys[0].t, 0);
  assert.equal(z.keys[2].t, +(5.8 - g.t0).toFixed(3), "turn 2 start, scene relative");
  assert.deepEqual(shots.actors.find((a) => a.id === "mihalych").mouth, "mouth_mihalych.json");
  assert.equal(shots.actors.find((a) => a.id === "zinaida").mouth, undefined, "object rigs get no mouth");
  assert.ok(mouth.mihalych.samples.length === Math.round(g.duration * 30));
});

test("mouth envelope follows speech: open inside the actor's turns, closed in the gap", () => {
  const [g] = segment(tl, sheet, 30), dir = mkdtempSync(join(tmpdir(), "res-")), p = join(dir, "a.wav");
  writeBurstWav(p, g.duration, [[0.6 - g.t0, 4.6 - g.t0], [5.8 - g.t0, 8.2 - g.t0]]);
  const s = resolveScene(g, sheet, readWav(p)).mouth.mihalych.samples, at = (t) => s[Math.round((t - g.t0) * 30)];
  assert.ok(at(2.0) > 0.5 && at(7.0) > 0.5, "open while speaking");
  assert.equal(at(5.2), 0, "closed between turns");
  assert.equal(at(g.t0 + 0.05), 0, "closed in the lead-in");
});

test("missing scene sheet entry and bad turn reference fail loudly", () => {
  const [g] = segment(tl, sheet, 30), dir = mkdtempSync(join(tmpdir(), "res-")), p = join(dir, "a.wav");
  writeBurstWav(p, g.duration, []);
  assert.throws(() => resolveScene({ ...g, title: "Нет такой" }, sheet, readWav(p)), /no entry for scene/);
  const bad = structuredClone(sheet); bad.scenes["Утро"].cues.push({ turn: 9, actor: "zinaida", channel: "state", value: "off" });
  assert.throws(() => resolveScene(g, bad, readWav(p)), /turn 9/);
});
