import path from 'path';import {fileURLToPath} from 'url';
const here=path.dirname(fileURLToPath(import.meta.url));
const {default:puppeteer}=await import(process.env.PUPPETEER_CORE || 'puppeteer-core');
const b=await puppeteer.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--allow-file-access-from-files'],headless:true});
const p=await b.newPage();await p.setViewport({width:+(process.argv[4]||2400),height:+(process.argv[5]||1800)});
p.on('pageerror',e=>console.log('PAGEERR',e.message));
p.on('console',m=>console.log(m.text()));await p.goto('file://'+here+'/'+('golden.html'));
await p.waitForFunction('window.__ok',{timeout:15000});
await p.screenshot({path:here+'/'+(process.argv[3]||'golden_check.png')});await b.close();console.log('ok');
