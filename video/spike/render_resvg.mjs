// No-browser renderer: rig draw() run in plain Node (fake window), SVG -> PNG with resvg, ffmpeg encode. Experiment, not a pipeline.
// usage: node render_resvg.mjs [--size WxH] [--out f.mp4] [--frames N] [--png-dir dir]
import { readFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { prepare, here } from "./prepare.mjs";

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const size = opt("size", "1280x720").split("x").map(Number);
const proj = resolve(opt("proj", join(here, "out/resvg-project")));
const out = resolve(opt("out", join(here, "out/scene_resvg.mp4")));
const p = prepare({ dir: proj, size, engine: "resvg-node", adapterVersion: "spike-2" });
const s = p.shots;
globalThis.window = globalThis; globalThis.document = { createElementNS() { throw new Error("rig touched DOM"); } };
globalThis.__SHOTS = s; globalThis.__MOUTH = JSON.parse(p.mouthText);
for (const r of p.rigFacts) (0, eval)(readFileSync(join(proj, "assets/rigs", r.id, r.version, r.artFile), "utf8"));
(0, eval)(readFileSync(join(proj, "core.js"), "utf8"));
const { Resvg } = createRequire(join(here, "engines/resvg/"))("@resvg/resvg-js");
const [w, h] = s.size, N = opt("frames") ? +opt("frames") : Math.round(s.duration * s.fps);
const dir = join(proj, "frames"); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir);
const t0 = Date.now();
for (let f = 0; f < N; f++) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${s.camera.viewBox.join(" ")}" preserveAspectRatio="xMidYMid slice">${SpikeCore.bg()}${SpikeCore.frame(f / s.fps)}</svg>`;
  if (f === 0) writeFileSync(join(proj, "frame0.svg"), svg);
  const png = new Resvg(svg, { fitTo: { mode: "original" }, font: { loadSystemFonts: false, fontFiles: ["/System/Library/Fonts/Helvetica.ttc", "/System/Library/Fonts/Menlo.ttc"], defaultFontFamily: "Helvetica", monospaceFamily: "Menlo" } }).render().asPng();
  writeFileSync(join(dir, `f${String(f).padStart(5, "0")}.png`), png);
}
const tRender = (Date.now() - t0) / 1000;
execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(s.fps), "-i", join(dir, "f%05d.png"), "-i", join(proj, "assets/audio/out.wav"), "-t", String(N / s.fps), "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", "-c:a", "aac", out]);
console.log(JSON.stringify({ frames: N, resvgSeconds: tRender, perFrameMs: (tRender / N) * 1000, wall: (Date.now() - t0) / 1000 }));
