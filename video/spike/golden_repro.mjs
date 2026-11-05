// Re-render the vendored rigs' golden.html pages in this Chrome and compare with the frozen golden.png (ffmpeg ssim run by caller).
import { join, dirname } from "node:path"; import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const { default: puppeteer } = await import(process.env.PUPPETEER_CORE);
const b = await puppeteer.launch({ executablePath: process.env.CHROME, args: ["--no-sandbox", "--allow-file-access-from-files"], headless: true });
for (const [rig, w, h] of [["mihalych", 2400, 1800], ["zinaida", 2400, 1800]]) {
  const p = await b.newPage(); await p.setViewport({ width: w, height: h });
  await p.goto("file://" + join(here, "out/hf-project/assets/rigs", rig, "1.0.0/golden/golden.html"));
  await p.waitForFunction("window.__ok", { timeout: 15000 });
  await p.screenshot({ path: join(here, "out", `golden_${rig}_repro.png`) }); await p.close();
}
await b.close();
