// node render.mjs [out.png]   Renders golden.html (2000x1500). Needs puppeteer-core and a headless Chrome:
//   PUPPETEER_CORE=/path/to/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js  CHROME=/path/to/chrome-headless-shell
import path from 'path';
import {fileURLToPath} from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || path.join(here, 'golden.png');
const {default: puppeteer} = await import(process.env.PUPPETEER_CORE || 'puppeteer-core');
const b = await puppeteer.launch({executablePath: process.env.CHROME, args: ['--no-sandbox'], headless: true});
const p = await b.newPage();
await p.setViewport({width: 2000, height: 2040});
p.on('pageerror', e => console.log('PAGEERR', e.message));
await p.goto('file://' + here + '/golden.html');
await p.waitForFunction('window.__ok', {timeout: 15000});
await p.screenshot({path: out});
await b.close();
console.log('ok', out);
