// Benchmark harness. usage: node bench.mjs <scenario-id>[,<id>...]   (see SCENARIOS). Appends JSON lines to bench/results.jsonl.
// Measures wall time, user+sys CPU seconds (/usr/bin/time -l) and PEAK SUMMED RSS of the whole process tree (ps poll every 150 ms; time -l alone only reports the largest single process).
import { spawn, execFileSync } from "node:child_process";
import { appendFileSync, rmSync, existsSync, renameSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import os, { homedir } from "node:os";
import { here } from "./prepare.mjs";

const CHROME = process.env.CHROME;
const hfFonts = join(homedir(), ".cache/hyperframes/fonts");
const rmCache = join(here, "engines/remotion/node_modules/.cache");
const B = (engine, w, h, dur, extra = []) => {
  const size = `${w}x${h}`;
  return engine === "hf"
    ? ["node", ["build.mjs", "--size", size, "--duration", String(dur), "--quiet", "1", ...extra]]
    : ["node", ["build_remotion.mjs", "--size", size, "--duration", String(dur), "--chrome", CHROME, "--quiet", "1", ...extra]];
};
const fontsBak = hfFonts + ".bench-bak";
const coldPrep = { hf: () => { if (!existsSync(fontsBak) && existsSync(hfFonts)) renameSync(hfFonts, fontsBak); else rmSync(hfFonts, { recursive: true, force: true }); }, rm: () => rmSync(rmCache, { recursive: true, force: true }) };

function psTree(root) {
  const rows = execFileSync("ps", ["-axo", "pid=,ppid=,rss="], { encoding: "utf8" }).trim().split("\n").map((l) => l.trim().split(/\s+/).map(Number));
  const kids = new Map(); for (const [p, pp, r] of rows) { (kids.get(pp) || kids.set(pp, []).get(pp)).push([p, r]); }
  let sum = 0, n = 0; const walk = (p, r) => { sum += r; n++; for (const [c, cr] of kids.get(p) || []) walk(c, cr); };
  const me = rows.find((r) => r[0] === root); if (me) walk(me[0], me[2]); return { kb: sum, n };
}

function measure(cmd, args, env = {}) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const ch = spawn("/usr/bin/time", ["-l", cmd, ...args], { cwd: here, env: { ...process.env, ...env }, stdio: ["ignore", "ignore", "pipe"] });
    let err = "", peak = 0, peakN = 0;
    ch.stderr.on("data", (d) => (err += d));
    const iv = setInterval(() => { try { const { kb, n } = psTree(ch.pid); if (kb > peak) { peak = kb; peakN = n; } } catch {} }, 150);
    ch.on("close", (code) => {
      clearInterval(iv);
      const g = (re) => { const m = err.match(re); return m ? +m[1] : null; };
      resolve({ code, wall: (Date.now() - t0) / 1000, user: g(/([\d.]+)\s+user/), sys: g(/([\d.]+)\s+sys/), maxRssSingleMB: g(/(\d+)\s+maximum resident/) / 1048576, peakTreeRssMB: peak / 1024, peakProcs: peakN, tail: code ? err.slice(-400) : "" });
    });
  });
}

const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const SCENARIOS = {};
for (const eng of ["hf", "rm"]) for (const [w, h] of [[1280, 720], [1920, 1080]]) for (const mode of ["cold", "warm"])
  SCENARIOS[`${eng}-${h}p-${mode}`] = { eng, w, h, dur: 10, mode, runs: 3 };
for (const eng of ["hf", "rm"]) for (const [w, h] of [[1280, 720], [1920, 1080]]) SCENARIOS[`${eng}-${h}p-60s`] = { eng, w, h, dur: 60, mode: "warm", runs: 1 };
for (const [eng, rng] of [["hf", ["--start", "5.8", "--end", "9.4"]], ["rm", ["--rmargs", "--frames=174-281"]]]) {
  SCENARIOS[`${eng}-720p-mouth-full`] = { eng, w: 1280, h: 720, dur: 10, mode: "warm", runs: 3, extra: ["--mouth", "mouth_open_alt.json"] };
  SCENARIOS[`${eng}-720p-mouth-range`] = { eng, w: 1280, h: 720, dur: 10, mode: "warm", runs: 3, extra: ["--mouth", "mouth_open_alt.json", ...rng] };
}
SCENARIOS["hf-720p-first"] = { eng: "hf", w: 1280, h: 720, dur: 10, mode: "warm", runs: 3, extra: ["--start", "0", "--end", "1"] };
SCENARIOS["rm-720p-first"] = { eng: "rm", w: 1280, h: 720, dur: 10, mode: "warm", runs: 3, extra: ["--rmargs", "--frames=0-0"] };
SCENARIOS["hf-1080p-w7"] = { eng: "hf", w: 1920, h: 1080, dur: 10, mode: "warm", runs: 3, extra: ["--workers", "7"] };
SCENARIOS["rm-1080p-c8"] = { eng: "rm", w: 1920, h: 1080, dur: 10, mode: "warm", runs: 3, extra: ["--concurrency", "8"] };

const env = { HYPERFRAMES_NO_TELEMETRY: "1", DO_NOT_TRACK: "1", HYPERFRAMES_NO_UPDATE_CHECK: "1", REMOTION_DISABLE_TELEMETRY: "1" };
for (const id of process.argv[2].split(",")) {
  const s = SCENARIOS[id]; if (!s) throw new Error("unknown scenario " + id);
  const runs = [];
  for (let i = 0; i < s.runs; i++) {
    if (s.mode === "cold") coldPrep[s.eng]();
    const out = join(here, "out/bench", `${id}_${i}.mp4`);
    const [cmd, args] = B(s.eng, s.w, s.h, s.dur, [...(s.extra || []), "--out", out, "--proj", join(here, "out/bench", `proj-${s.eng}-${s.h}`)]);
    const r = await measure(cmd, args, env); runs.push(r);
    console.log(id, i, JSON.stringify({ ...r, tail: undefined }), r.tail);
  }
  const rec = { id, ...s, ts: new Date().toISOString(), load1: os.loadavg()[0], runs, median: { wall: median(runs.map((r) => r.wall)), cpu: median(runs.map((r) => r.user + r.sys)), peakTreeRssMB: median(runs.map((r) => r.peakTreeRssMB)) } };
  appendFileSync(join(here, "bench/results.jsonl"), JSON.stringify(rec) + "\n");
}

// restore the HyperFrames font cache moved aside for cold runs
if (existsSync(fontsBak)) { rmSync(hfFonts, { recursive: true, force: true }); renameSync(fontsBak, hfFonts); }
