// Dev probe: load the built HyperFrames project page in headless Chrome, seek via __renderAt, screenshot.
// usage: PUPPETEER_CORE=... CHROME=... node probe.mjs out.png t [viewBox x,y,w,h] [pose-for-zinaida]
import { join, dirname, resolve } from "node:path"; import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const { default: puppeteer } = await import(process.env.PUPPETEER_CORE);
const [out, t, vb] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: process.env.CHROME, args: ["--no-sandbox", "--allow-file-access-from-files"], headless: true });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
p.on("pageerror", (e) => console.log("PAGEERR", e.message));
await p.goto("file://" + join(here, "out/hf-project/index.html"));
await p.waitForFunction("window.__ok", { timeout: 15000 });
await p.evaluate((t, vb) => { if (vb) document.getElementById("stage").setAttribute("viewBox", vb.split(",").join(" ")); window.__renderAt(+t); }, t, vb);
await p.screenshot({ path: resolve(out) }); await b.close();
