// Per-scene render with a content-addressed cache: cacheDir/<key>.mp4. Unchanged scene (same key) = cache hit, no Chrome started.
import { copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ENTRY = join(here, "..", "remotion", "index.jsx");

/** scenes: [{id, key}] already staged in publicDir. Renders only cache misses. Returns [{id,key,hit,file,seconds}]. */
export async function renderScenes({ publicDir, scenes, cacheDir, chrome = process.env.PERFORM_CHROME, concurrency, onLog = () => {} }) {
  mkdirSync(cacheDir, { recursive: true });
  const misses = scenes.filter((s) => !existsSync(join(cacheDir, `${s.key}.mp4`)));
  let serveUrl, renderer;
  if (misses.length) {
    const { bundle } = await import("@remotion/bundler");
    renderer = await import("@remotion/renderer");
    serveUrl = await bundle({ entryPoint: ENTRY, publicDir });
  }
  const out = [];
  for (const s of scenes) {
    const file = join(cacheDir, `${s.key}.mp4`);
    if (!misses.includes(s)) { onLog(`${s.id}: cache hit ${s.key.slice(0, 12)}`); out.push({ ...s, hit: true, file, seconds: 0 }); continue; }
    const t0 = Date.now(), tmp = file + ".part.mp4";
    const inputProps = { scene: s.id };
    const composition = await renderer.selectComposition({ serveUrl, id: "scene", inputProps, browserExecutable: chrome });
    await renderer.renderMedia({ composition, serveUrl, codec: "h264", crf: 16, outputLocation: tmp, inputProps, browserExecutable: chrome, concurrency, logLevel: "error" });
    copyFileSync(tmp, file); rmSync(tmp);
    const seconds = (Date.now() - t0) / 1000;
    onLog(`${s.id}: rendered ${s.key.slice(0, 12)} in ${seconds.toFixed(1)} s`);
    out.push({ ...s, hit: false, file, seconds });
  }
  return out;
}
