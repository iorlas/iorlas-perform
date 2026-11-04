// "Own thin renderer": plain headless Chrome (puppeteer-core) + ffmpeg. Baseline column of the capability matrix.
// usage: node render_plain.mjs [--size WxH] [--workers N] [--out f.mp4] [--proj dir] [--start s --end s] [--duck]
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { prepare, here } from "./prepare.mjs";

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const size = opt("size", "1280x720").split("x").map(Number);
const proj = resolve(opt("proj", join(here, "out/plain-project")));
const out = resolve(opt("out", join(here, "out/scene_plain.mp4")));
const N = +opt("workers", 4);
const p = prepare({ dir: proj, size, mouthFile: opt("mouth"), engine: "plain-chrome-ffmpeg", adapterVersion: "spike-2" });
const s = p.shots, [w, h] = s.size;
writeFileSync(join(proj, "index.html"), `<!doctype html><html><body style="margin:0"><svg id="stage" xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${s.camera.viewBox.join(" ")}" preserveAspectRatio="xMidYMid slice"></svg>
${p.rigFacts.map((r) => `<script src="assets/rigs/${r.id}/${r.version}/${r.artFile}"></script>`).join("\n")}
<script>window.__SHOTS=${JSON.stringify(s)};window.__MOUTH=${p.mouthText};</script><script src="core.js"></script>
<script>var svg=document.getElementById("stage");window.__renderAt=function(t){svg.innerHTML=SpikeCore.bg()+SpikeCore.frame(t)};window.__ok=true;</script></body></html>`);

const { default: puppeteer } = await import(process.env.PUPPETEER_CORE);
const total = Math.round(s.duration * s.fps), f0 = Math.round(+opt("start", 0) * s.fps), f1 = opt("end") ? Math.round(+opt("end") * s.fps) : total;
const frames = join(proj, "frames"); rmSync(frames, { recursive: true, force: true }); mkdirSync(frames);
const browser = await puppeteer.launch({ executablePath: process.env.CHROME, args: ["--no-sandbox", "--allow-file-access-from-files"], headless: true });
const t0 = Date.now();
await Promise.all(Array.from({ length: N }, async (_, k) => {
  const page = await browser.newPage(); await page.setViewport({ width: w, height: h });
  await page.goto("file://" + join(proj, "index.html")); await page.waitForFunction("window.__ok");
  for (let f = f0 + k; f < f1; f += N) {
    await page.evaluate((t) => window.__renderAt(t), f / s.fps);
    await page.screenshot({ path: join(frames, `f${String(f - f0).padStart(5, "0")}.png`) });
  }
}));
await browser.close();
const tCapture = (Date.now() - t0) / 1000;
// audio: voice + extra tracks with per-clip offset (adelay) and volume; optional ducking of the voice under the sfx (sidechaincompress)
const ins = ["-i", join(proj, "assets/audio/out.wav"), ...(s.audio_tracks || []).flatMap((t) => ["-i", join(proj, "assets/audio", t.file.split("/").pop())])];
const tr = s.audio_tracks || [];
let fg = `[1:a]adelay=${Math.round(s.audio.start * 1000)}:all=1[v]`;
tr.forEach((t, i) => (fg += `;[${i + 2}:a]volume=${t.volume ?? 1},adelay=${Math.round(t.start * 1000)}:all=1[s${i}]`));
const mix = tr.length ? `;[v]${tr.map((_, i) => `[s${i}]`).join("")}amix=inputs=${tr.length + 1}:normalize=0:duration=longest[a]` : ";[v]anull[a]";
const a = ["-v", "error", "-y", "-framerate", String(s.fps), "-i", join(frames, "f%05d.png"), ...ins, "-filter_complex", fg + mix, "-map", "0:v", "-map", "[a]",
  "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", "-c:a", "aac", "-t", String((f1 - f0) / s.fps), out];
execFileSync("ffmpeg", a);
console.log(JSON.stringify({ key: p.key, captureS: tCapture, wallS: (Date.now() - t0) / 1000, workers: N }));
