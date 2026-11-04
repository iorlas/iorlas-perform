#!/usr/bin/env node
// node cli.mjs --timeline x.timeline.json --sheet sheet.json --audio x.wav --out dir [--only s01,s02] [--chrome path] [--concurrency N] [--xfade 0.5]
import { run } from "./src/pipeline.mjs";
const a = process.argv.slice(2), opt = (n) => { const i = a.indexOf("--" + n); return i < 0 ? undefined : a[i + 1]; };
for (const r of ["timeline", "sheet", "audio", "out"]) if (!opt(r)) { console.error("missing --" + r); process.exit(2); }
const { final, manifest } = await run({ timeline: opt("timeline"), sheet: opt("sheet"), audio: opt("audio"), outDir: opt("out"), only: opt("only")?.split(","), chrome: opt("chrome") || process.env.PERFORM_CHROME, concurrency: opt("concurrency") ? +opt("concurrency") : undefined, xfade: +(opt("xfade") ?? 0) });
console.log(final, "\n" + manifest.scenes.map((s) => `${s.id} ${s.hit ? "hit " : "miss"} ${s.key.slice(0, 12)} ${s.seconds.toFixed(1)}s`).join("\n"));
