// The only module that knows Remotion. Contract: render(publicDir, sceneId, outFile, opts) draws public/scenes/<id> to a video-only h264 mp4.
// Swapping the engine (plain Chrome + ffmpeg) means replacing this file and remotion/ with the same render() and the same ENGINE/ADAPTER_VERSION/COMPOSITION/CODEC exports.
import { copyFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const ENGINE = "remotion@4.0.540", ADAPTER_VERSION = "engine-2", CODEC = "h264-crf16-video-only";
export const COMPOSITION = join(here, "..", "remotion", "index.jsx"); // component source, hashed into the cache key

export async function render(publicDir, sceneId, outFile, { chrome, concurrency } = {}) {
  const { bundle } = await import("@remotion/bundler");
  const r = await import("@remotion/renderer");
  const serveUrl = await bundle({ entryPoint: COMPOSITION, publicDir });
  const inputProps = { scene: sceneId }, tmp = outFile + ".part.mp4";
  const composition = await r.selectComposition({ serveUrl, id: "scene", inputProps, browserExecutable: chrome });
  await r.renderMedia({ composition, serveUrl, codec: "h264", crf: 16, muted: true, outputLocation: tmp, inputProps, browserExecutable: chrome, concurrency, logLevel: "error" });
  copyFileSync(tmp, outFile); rmSync(tmp);
}
