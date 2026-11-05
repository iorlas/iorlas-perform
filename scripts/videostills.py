"""Stills: frames of a scene's shots.json drawn by the engine's own frame function in one headless Chrome, no Remotion, no bundling.

core.js is a pure function of (shots, mouth, t) -> SVG. A page loads the verified rigs, core.js and one scene, then draws any
list of times into a grid of cells; one `chrome --screenshot` captures the grid and ffmpeg cuts it into PNGs. Seconds for a whole
film instead of minutes of video rendering. What it shares with the full render: rigs, core.js, shots.json. What it does not:
video encoding, Remotion's frame timing (a still at time t equals the video frame at t).

Part of video.py storyboard / animatic (docs/PREPRODUCTION.md). Stdlib only; needs Chrome (PERFORM_CHROME or a standard install) and ffmpeg.
"""

import html
import importlib.util
import json
import os
import shutil
import subprocess
import tempfile
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent / "video"
RIGS = ROOT / "rigs"
CORE = ROOT / "engine" / "src" / "core.js"
PRELUDE = ROOT / "engine" / "src" / "prelude.js"
MAX_PIXELS = 15000  # a screenshot taller or wider than this is refused by Chrome: grids paginate below it

CHROME_CANDIDATES = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "google-chrome",
    "chromium",
    "chrome",
]


def chrome_path(explicit: str | None = None) -> str:
    for c in (explicit, os.environ.get("PERFORM_CHROME"), *CHROME_CANDIDATES):
        if c and (Path(c).exists() or shutil.which(c)):
            return c
    msg = "no Chrome found for stills: install Chrome or set PERFORM_CHROME"
    raise RuntimeError(msg)


_verify = None
_verify_lock = threading.Lock()


def verify_rig(rig_dir: Path) -> None:
    """The same rig.lock check the full render makes (video/rigs/verify.py): a tampered rig stops the stills too."""
    global _verify  # noqa: PLW0603
    with _verify_lock:
        if _verify is None:
            spec = importlib.util.spec_from_file_location("rigs_verify", RIGS / "verify.py")
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            _verify = mod
    if problems := _verify.verify_rig(rig_dir):
        msg = f"RIG TAMPERED or incomplete: {rig_dir.name}: {problems[0]}"
        raise RuntimeError(msg)


def rig_scripts(shots: dict[str, Any]) -> list[tuple[str, Path]]:
    """[(rig id, module file)] in first-use order, each rig verified. The women rigs share one module file: each is still loaded and snapshotted on its own."""
    seen, out = set(), []
    for a in shots["actors"]:
        rid, ver = a["rig"].split("@")
        if rid in seen:
            continue
        seen.add(rid)
        d = RIGS / rid / ver
        verify_rig(d)
        out.append((rid, d / json.loads((d / "rig.json").read_text())["module"]["file"]))
    return out


def page(shots: dict[str, Any], mouth: dict[str, Any], frames: list[dict[str, Any]], cell: tuple[int, int], cols: int, hud: dict[str, Any] | None) -> str:
    """One HTML page: the scene booted once, `frames` [{t, extra?, tag?, line?, crop?}] drawn into a cols-wide grid of cells of size `cell`.

    `extra` is SVG appended inside the camera's own coordinates (subject boxes); `tag` and `line` are the shot label and the heard text;
    `hud` {"zones": {top,bottom,left,right}, "subtitle": {"y": [a, b]}, "crop": [9, 16]} adds the safe-zone shading, or None for clean frames.
    """
    w, h = cell
    rows = -(-len(frames) // cols)
    scripts = []
    for rid, f in rig_scripts(shots):
        scripts.append(f'<script src="{f.as_uri()}"></script><script>HF.SNAP=HF.SNAP||{{}};if(!HF.SNAP["{rid}"])HF.SNAP["{rid}"]={{draw:HF.RIGS&&HF.RIGS["{rid}"],expr:HF.EXPR_F&&HF.EXPR_F["{rid}"],poses:HF.POSES_F}};</script>')
    return rf"""<!doctype html><meta charset="utf-8"><style>
html,body{{margin:0;background:#1b1b1b}} #g{{display:grid;grid-template-columns:repeat({cols},{w}px);grid-auto-rows:{h}px;width:{cols * w}px;height:{rows * h}px}}
.c{{position:relative;width:{w}px;height:{h}px;overflow:hidden;font-family:Helvetica,Arial,sans-serif}} .c svg.f{{position:absolute;left:0;top:0;width:{w}px;height:{h}px}}
.z{{position:absolute;background:rgba(255,40,40,.22);pointer-events:none}} .sub{{position:absolute;left:0;right:0;background:rgba(40,120,255,.20);border-top:1px dashed #6af;border-bottom:1px dashed #6af}}
.tag{{position:absolute;left:6px;top:6px;background:rgba(0,0,0,.72);color:#fff;font:700 {max(11, h // 28)}px Helvetica,Arial,sans-serif;padding:2px 6px;border-radius:3px}}
.line{{position:absolute;left:6px;right:6px;bottom:6px;background:rgba(0,0,0,.72);color:#fff;font:{max(10, h // 34)}px Helvetica,Arial,sans-serif;padding:3px 6px;border-radius:3px;line-height:1.25}}
.crop{{position:absolute;top:0;bottom:0;border-left:2px solid #ff0;border-right:2px solid #ff0;box-shadow:0 0 0 9999px rgba(0,0,0,.45)}}
</style><div id="g"></div>
<script>window.__SHOTS={json.dumps(shots, ensure_ascii=False)};window.__MOUTH={json.dumps(mouth)};</script>
<script src="{PRELUDE.as_uri()}"></script>
{''.join(scripts)}
<script src="{CORE.as_uri()}"></script>
<script>
var C=window.SpikeCore,F={json.dumps(frames, ensure_ascii=False)},HUD={json.dumps(hud)},W={w},H={h},g=document.getElementById("g");
function uniq(h,n){{var ids={{}};h.replace(/\bid="([^"]+)"/g,function(m,i){{ids[i]=1;return m;}});
  Object.keys(ids).forEach(function(i){{var q=i.replace(/[.*+?^${{}}()|[\]\\]/g,"\\$&"),p="f"+n+"_";
    h=h.replace(new RegExp('id="'+q+'"',"g"),'id="'+p+i+'"').replace(new RegExp("url\\(#"+q+"\\)","g"),"url(#"+p+i+")").replace(new RegExp('href="#'+q+'"',"g"),'href="#'+p+i+'"');}});return h;}}
F.forEach(function(f){{
  var vb=C.viewBox(f.t),c=document.createElement("div");c.className="c";
  var s=document.createElementNS("http://www.w3.org/2000/svg","svg");s.setAttribute("class","f");s.setAttribute("viewBox",vb.join(" "));s.setAttribute("preserveAspectRatio","xMidYMid slice");
  var ex="";
  (f.boxes||[]).forEach(function(b){{var x=b.b[0],y=b.b[1],bw=b.b[2],bh=b.b[3],ok=x>=vb[0]-0.5&&x+bw<=vb[0]+vb[2]+0.5&&y>=vb[1]-0.5&&y+bh<=vb[1]+vb[3]+0.5,sw=vb[2]/260;
    ex+='<rect x="'+x+'" y="'+y+'" width="'+bw+'" height="'+bh+'" fill="none" stroke="'+(ok?"#22d36b":"#ff2a2a")+'" stroke-width="'+sw+'" stroke-dasharray="'+4*sw+' '+2*sw+'"/><text x="'+(x+sw*2)+'" y="'+(y-sw*2)+'" font-family="Helvetica,Arial,sans-serif" font-size="'+vb[2]/48+'" font-weight="700" fill="'+(ok?"#22d36b":"#ff2a2a")+'" stroke="#000" stroke-width="'+sw*0.4+'" paint-order="stroke">'+b.n+(ok?"":" CROPPED")+'</text>';}});
  s.innerHTML=uniq(C.frame(f.t)+ex,g.children.length);c.appendChild(s);
  if(HUD){{
    var z=HUD.zones||{{}};
    if(z.top)c.insertAdjacentHTML("beforeend",'<div class="z" style="left:0;right:0;top:0;height:'+z.top*100+'%"></div>');
    if(z.bottom)c.insertAdjacentHTML("beforeend",'<div class="z" style="left:0;right:0;bottom:0;height:'+z.bottom*100+'%"></div>');
    if(z.right)c.insertAdjacentHTML("beforeend",'<div class="z" style="right:0;top:'+(z.top||0)*100+'%;bottom:'+(z.bottom||0)*100+'%;width:'+z.right*100+'%"></div>');
    if(z.left)c.insertAdjacentHTML("beforeend",'<div class="z" style="left:0;top:'+(z.top||0)*100+'%;bottom:'+(z.bottom||0)*100+'%;width:'+z.left*100+'%"></div>');
    if(HUD.subtitle)c.insertAdjacentHTML("beforeend",'<div class="sub" style="top:'+HUD.subtitle.y[0]*100+'%;height:'+(HUD.subtitle.y[1]-HUD.subtitle.y[0])*100+'%"></div>');
    if(HUD.crop&&f.crop){{var cw=H*HUD.crop[0]/HUD.crop[1],cx=Math.max(0,Math.min(W-cw,(f.crop[0]-vb[0])/vb[2]*W-cw/2));c.insertAdjacentHTML("beforeend",'<div class="crop" style="left:'+cx+'px;width:'+cw+'px"></div>');}}
  }}
  if(f.tag)c.insertAdjacentHTML("beforeend",'<div class="tag">'+f.tag+'</div>');
  if(f.line)c.insertAdjacentHTML("beforeend",'<div class="line">'+f.line+'</div>');
  g.appendChild(c);
}});
</script>"""


def shoot(html_text: str, size: tuple[int, int], png: Path, chrome: str | None = None, timeout: float = 240) -> None:
    """Load the page in headless Chrome and write a screenshot of `size` to png."""
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / "page.html"
        src.write_text(html_text)
        shoot_url(src.as_uri(), size, png, chrome, timeout)


def shoot_url(url: str, size: tuple[int, int], png: Path, chrome: str | None = None, timeout: float = 240) -> None:
    """Screenshot of a page (file URL) in headless Chrome."""
    with tempfile.TemporaryDirectory() as tmp:
        cmd = [chrome_path(chrome), "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars", "--force-device-scale-factor=1", "--allow-file-access-from-files", "--no-first-run",
               "--disable-background-networking", "--disable-component-update", f"--user-data-dir={tmp}/profile", f"--window-size={size[0]},{size[1]}", f"--screenshot={png}", url]
        proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
        deadline, grace = time.time() + timeout, None
        while proc.poll() is None and time.time() < deadline:  # the screenshot is written, then Chrome may linger: take the file and stop it
            if png.exists() and png.stat().st_size > 0:
                grace = grace or time.time() + 1.0
                if time.time() > grace:
                    break
            time.sleep(0.05)
        if proc.poll() is None:
            proc.kill()
        err = proc.stderr.read() if proc.stderr else ""
    if not png.exists() or png.stat().st_size == 0:
        msg = f"chrome produced no screenshot in {timeout}s: {err.strip()[-400:]}"
        raise RuntimeError(msg)


def cut(strip: Path, n: int, cols: int, cell: tuple[int, int], outs: list[Path]) -> None:
    """Cut the grid screenshot into one PNG per cell (a single ffmpeg call)."""
    w, h = cell
    parts = ";".join([f"[0:v]split={n}" + "".join(f"[a{i}]" for i in range(n))] + [f"[a{i}]crop={w}:{h}:{(i % cols) * w}:{(i // cols) * h}[o{i}]" for i in range(n)])
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(strip), "-filter_complex", parts]
    for i, o in enumerate(outs):
        cmd += ["-map", f"[o{i}]", "-frames:v", "1", "-update", "1", str(o)]
    subprocess.run(cmd, check=True)


def render_frames(shots: dict[str, Any], mouth: dict[str, Any], frames: list[dict[str, Any]], outs: list[Path], cell: tuple[int, int], hud: dict[str, Any] | None, chrome: str | None = None, cols: int = 3) -> None:
    """Draw `frames` of one scene to `outs` (same length), in pages that stay under Chrome's screenshot limit."""
    w, h = cell
    per = max(1, (MAX_PIXELS // h) * cols)
    for i in range(0, len(frames), per):
        chunk, paths = frames[i : i + per], outs[i : i + per]
        rows = -(-len(chunk) // cols)
        with tempfile.TemporaryDirectory() as tmp:
            strip = Path(tmp) / "strip.png"
            shoot(page(shots, mouth, chunk, cell, cols, hud), (cols * w, rows * h), strip, chrome)
            cut(strip, len(chunk), cols, cell, paths)


def render_scenes(jobs: list[dict[str, Any]], cell: tuple[int, int], hud: dict[str, Any] | None, chrome: str | None = None, workers: int = 5) -> None:
    """jobs: [{shots, mouth, frames, outs}] one per scene, in parallel."""
    def one(j: dict[str, Any]) -> None:
        render_frames(j["shots"], j["mouth"], j["frames"], j["outs"], cell, hud, chrome)

    with ThreadPoolExecutor(workers) as pool:
        for fut in [pool.submit(one, j) for j in jobs]:
            fut.result()


def escape(text: str) -> str:
    return html.escape(text, quote=False)
