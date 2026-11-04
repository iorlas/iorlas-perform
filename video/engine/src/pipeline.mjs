// timeline.json + scene sheet + mixed wav -> per-scene mp4 (cached) -> final.mp4
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { segment, resolveScene } from "./resolve.mjs";
import { readWav } from "./mouth.mjs";
import { verifyRigs, stageRigs, stageScene } from "./stage.mjs";
import { renderScenes } from "./render.mjs";
import { concat } from "./concat.mjs";

export async function run({ timeline, sheet, audio, outDir, only, chrome, concurrency, xfade = 0, onLog = console.log }) {
  outDir = resolve(outDir); audio = resolve(audio);
  const tl = JSON.parse(readFileSync(timeline, "utf8")), sh = JSON.parse(readFileSync(sheet, "utf8"));
  const publicDir = join(outDir, "public"), cacheDir = join(outDir, "cache"), cutDir = join(outDir, "cuts");
  rmSync(publicDir, { recursive: true, force: true }); mkdirSync(cutDir, { recursive: true });
  const groups = segment(tl, sh, sh.fps ?? 30).filter((g) => !only || only.includes(g.id));
  const refs = groups.flatMap((g) => (sh.scenes[g.title] ?? sh.scenes["*"]).actors.map((a) => a.rig));
  const facts = verifyRigs(refs); // refuses a tampered rig before anything is staged
  stageRigs(publicDir, facts);
  const staged = [];
  for (const g of groups) {
    const cut = join(cutDir, `${g.id}.wav`);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(g.t0), "-t", String(g.duration), "-i", audio, "-c:a", "pcm_s16le", cut]);
    const scene = resolveScene(g, sh, readWav(cut));
    const { key } = stageScene(publicDir, scene, facts, cut);
    staged.push({ id: g.id, title: g.title, key, duration: g.duration, t0: g.t0 });
  }
  const results = await renderScenes({ publicDir, scenes: staged, cacheDir, chrome, concurrency, onLog });
  const final = join(outDir, "final.mp4");
  concat(results.map((r) => r.file), final, { xfade });
  const manifest = { engine: "remotion@4.0.540", rigs: facts.map(({ id, version, sha256 }) => ({ id, version, sha256 })), scenes: results.map(({ id, title, key, hit, seconds, duration, t0 }) => ({ id, title, key, hit, seconds, duration, t0 })) };
  writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 1) + "\n");
  return { final, manifest };
}
