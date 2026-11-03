// Spike driver: verify rigs -> vendor into a HyperFrames project -> cache key -> render -> mux audio.
// usage: node build.mjs [--tamper] [--no-render]
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyRig, sceneCacheKey, sha } from "./rig_lock.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const rigsRoot = join(here, "..", "rigs");
const proj = join(here, "out", "hf-project");
const args = new Set(process.argv.slice(2));
const HF_VERSION = "0.9.9", ADAPTER_VERSION = "spike-1";

const shotsPath = join(here, "shots.json");
const shots = JSON.parse(readFileSync(shotsPath, "utf8"));
const mouthPath = join(here, shots.mouth_open.file);

rmSync(proj, { recursive: true, force: true });
mkdirSync(join(proj, "assets", "audio"), { recursive: true });

// 1. verify the source rigs, 2. vendor them into the project, 3. verify the vendored copies again (that is what gets rendered)
const rigFacts = [];
for (const actor of shots.actors) {
  const [id, version] = actor.rig.split("@");
  const src = join(rigsRoot, id, version);
  const f = verifyRig(src, id, version);
  const dst = join(proj, "assets", "rigs", id, version);
  cpSync(src, dst, { recursive: true });
  if (args.has("--tamper")) writeFileSync(join(dst, "art", Object.values(f.manifest.module).find((v) => typeof v === "string" && v.startsWith("art/")).slice(4)), "/*tampered*/", { flag: "a" });
  rigFacts.push({ ...verifyRig(dst, id, version), artFile: f.manifest.module.file }); // throws on tamper
}

const audioSrc = join(here, "audio", "out.wav");
cpSync(audioSrc, join(proj, "assets", "audio", "out.wav"));

const key = sceneCacheKey({ rigs: rigFacts, shotsSha: sha(readFileSync(shotsPath)), extraInputs: { mouth: sha(readFileSync(mouthPath)), audio: sha(readFileSync(audioSrc)) },
  fps: shots.fps, size: shots.size, engine: `hyperframes@${HF_VERSION}`, adapterVersion: ADAPTER_VERSION });
console.log("cache key", key);
writeFileSync(join(here, "out", "cache_key.json"), JSON.stringify({ key, rigs: rigFacts.map(({ id, version, sha256 }) => ({ id, version, sha256 })) }, null, 1));

const [w, h] = shots.size;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#000}#root{position:relative;width:${w}px;height:${h}px;overflow:hidden}#stage{position:absolute;inset:0;width:100%;height:100%}
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${shots.duration}" data-width="${w}" data-height="${h}" data-fps="${shots.fps}">
<svg id="stage" xmlns="http://www.w3.org/2000/svg" viewBox="${shots.camera.viewBox.join(" ")}" preserveAspectRatio="xMidYMid slice"></svg>
<audio id="vo" src="assets/audio/out.wav" data-start="${shots.audio.start}" data-duration="${shots.audio.duration}" data-track-index="1"></audio>
</div>
${rigFacts.map((r) => `<script src="assets/rigs/${r.id}/${r.version}/${r.artFile}"></script>`).join("\n")}
<script>window.__SHOTS=${JSON.stringify(shots)};window.__MOUTH=${readFileSync(mouthPath, "utf8")};</script>
<script src="gsap.min.js"></script>
<script src="adapter.js"></script>
</body></html>`;
writeFileSync(join(proj, "index.html"), html);
cpSync(join(here, "src", "adapter.js"), join(proj, "adapter.js"));
cpSync(join(here, "src", "gsap.min.js"), join(proj, "gsap.min.js"));
writeFileSync(join(proj, "hyperframes.json"), "{}\n");

if (args.has("--no-render")) process.exit(0);
const t0 = Date.now();
const env = { ...process.env, HYPERFRAMES_NO_TELEMETRY: "1", DO_NOT_TRACK: "1", HYPERFRAMES_NO_UPDATE_CHECK: "1" };
execFileSync("npx", ["-y", `hyperframes@${HF_VERSION}`, "render", proj, "-o", join(here, "out", "scene.mp4"), "--fps", String(shots.fps), "--quality", "delivery", "--no-best-effort"], { stdio: "inherit", env });
console.log("render wall s", ((Date.now() - t0) / 1000).toFixed(1));
