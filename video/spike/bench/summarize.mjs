// usage: node bench/summarize.mjs [results.jsonl]
import { readFileSync } from "node:fs";
const rows = readFileSync(process.argv[2] || new URL("./results.jsonl", import.meta.url), "utf8").trim().split("\n").map((l) => JSON.parse(l));
const f = (x) => (x == null ? "-" : x.toFixed(1));
console.log("| scenario | load1 | wall s (each) | min | median | median CPU s | peak tree RSS MB | procs |\n|---|---|---|---|---|---|---|---|");
for (const r of rows) console.log(`| ${r.id} | ${f(r.load1)} | ${r.runs.map((x) => f(x.wall)).join(" / ")} | ${f(Math.min(...r.runs.map((x) => x.wall)))} | ${f(r.median.wall)} | ${f(r.median.cpu)} | ${f(r.median.peakTreeRssMB)} | ${Math.max(...r.runs.map((x) => x.peakProcs))} |`);
