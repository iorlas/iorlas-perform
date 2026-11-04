// HyperFrames driver: verify rigs -> vendor into a HyperFrames project -> cache key -> render (audio muxed by the engine).
// usage: node build.mjs [--size 1920x1080] [--duration 60] [--mouth file.json] [--proj dir] [--out file.mp4]
//        [--workers N] [--docker] [--tamper] [--no-render] [--start s --end s]
import { cpSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { prepare, here } from "./prepare.mjs";

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const flag = (n) => argv.includes("--" + n);
const HF_VERSION = "0.9.9", ADAPTER_VERSION = "spike-2";
const size = (opt("size", "1280x720")).split("x").map(Number);
const proj = resolve(opt("proj", join(here, "out", "hf-project")));
const out = resolve(opt("out", join(here, "out", "scene.mp4")));

const p = prepare({ dir: proj, size, duration: opt("duration") ? +opt("duration") : undefined, mouthFile: opt("mouth"), engine: `hyperframes@${HF_VERSION}`, adapterVersion: ADAPTER_VERSION, tamper: flag("tamper") });
console.log("cache key", p.key);
mkdirSync(join(here, "out"), { recursive: true });
writeFileSync(join(proj, "cache_key.json"), JSON.stringify({ key: p.key, rigs: p.rigFacts.map(({ id, version, sha256 }) => ({ id, version, sha256 })) }, null, 1));
if (!opt("proj")) writeFileSync(join(here, "out", "cache_key.json"), JSON.stringify({ key: p.key, rigs: p.rigFacts.map(({ id, version, sha256 }) => ({ id, version, sha256 })) }, null, 1));

const [w, h] = p.shots.size, s = p.shots;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#000}#root{position:relative;width:${w}px;height:${h}px;overflow:hidden}#stage{position:absolute;inset:0;width:100%;height:100%}
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${s.duration}" data-width="${w}" data-height="${h}" data-fps="${s.fps}">
<svg id="stage" xmlns="http://www.w3.org/2000/svg" viewBox="${s.camera.viewBox.join(" ")}" preserveAspectRatio="xMidYMid slice"></svg>
<audio id="vo" src="assets/audio/out.wav" data-start="${s.audio.start}" data-duration="${s.audio.duration}" data-track-index="1"></audio>
</div>
${p.rigFacts.map((r) => `<script src="assets/rigs/${r.id}/${r.version}/${r.artFile}"></script>`).join("\n")}
<script>window.__SHOTS=${JSON.stringify(s)};window.__MOUTH=${p.mouthText};</script>
<script src="core.js"></script>
<script src="gsap.min.js"></script>
<script>
${readFileSync(join(here, "src", "adapter.js"), "utf8")}</script>
</body></html>`;
writeFileSync(join(proj, "index.html"), html);
cpSync(join(here, "src", "gsap.min.js"), join(proj, "gsap.min.js"));
writeFileSync(join(proj, "hyperframes.json"), "{}\n");
if (flag("no-render")) process.exit(0);

const local = join(here, "engines/hf/node_modules/.bin/hyperframes");
const [cmd, pre] = existsSync(local) ? [local, []] : ["npx", ["-y", `hyperframes@${HF_VERSION}`]];
const env = { ...process.env, HYPERFRAMES_NO_TELEMETRY: "1", DO_NOT_TRACK: "1", HYPERFRAMES_NO_UPDATE_CHECK: "1" };
const a = [...pre, "render", proj, "-o", out, "--fps", String(s.fps), "--quality", "delivery", "--no-best-effort"];
if (opt("workers")) a.push("--workers", opt("workers"));
if (flag("docker")) a.push("--docker");
if (opt("hfargs")) a.push(...opt("hfargs").split(" "));
if (opt("start")) a.push("--start", opt("start"), "--end", opt("end"));
const t0 = Date.now();
execFileSync(cmd, a, { stdio: opt("quiet") ? "ignore" : "inherit", env });
console.log("render wall s", ((Date.now() - t0) / 1000).toFixed(1));
