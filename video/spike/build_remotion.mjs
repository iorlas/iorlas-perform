// Remotion driver: same prepare() as HyperFrames, public dir = vendored rigs + shots.json, then `remotion render`.
// usage: node build_remotion.mjs [--size 1920x1080] [--duration 60] [--mouth f] [--proj dir] [--out f.mp4] [--concurrency N] [--chrome path] [--no-render]
import { writeFileSync, copyFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { prepare, here } from "./prepare.mjs";

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const flag = (n) => argv.includes("--" + n);
const size = opt("size", "1280x720").split("x").map(Number);
const proj = resolve(opt("proj", join(here, "out", "rm-project")));
const out = resolve(opt("out", join(here, "out", "scene_remotion.mp4")));
const p = prepare({ dir: proj, size, duration: opt("duration") ? +opt("duration") : undefined, mouthFile: opt("mouth"), engine: "remotion@4.0.540", adapterVersion: "spike-2", tamper: flag("tamper") });
console.log("cache key", p.key);
writeFileSync(join(proj, "shots.json"), p.shotsText);
copyFileSync(join(here, p.shots.mouth_open.file), join(proj, p.shots.mouth_open.file));
if (flag("no-render")) process.exit(0);

const eng = join(here, "engines/remotion");
const a = ["remotion", "render", "src/index.jsx", "scene", out, "--public-dir", proj, "--codec", "h264", "--crf", "16", "--log", "warn"];
if (opt("concurrency")) a.push("--concurrency", opt("concurrency"));
if (opt("chrome")) a.push("--browser-executable", opt("chrome"));
if (opt("rmargs")) a.push(...opt("rmargs").split(" "));
if (opt("cache")) a.push("--bundle-cache=" + opt("cache"));
const env = { ...process.env, REMOTION_DISABLE_TELEMETRY: "1" };
const t0 = Date.now();
execFileSync(join(eng, "node_modules/.bin/remotion"), a.slice(1), { cwd: eng, stdio: opt("quiet") ? "ignore" : "inherit", env });
console.log("render wall s", ((Date.now() - t0) / 1000).toFixed(1));
