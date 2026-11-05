// Remotion composition "scene": loads the vendored rig art + core.js, then draws SpikeCore.frame(t) per frame.
// Inputs (inputProps): { scene: "<id>" } -> public/scenes/<id>/{shots.json, mouth_<actor>.json}; rigs from public/rigs/.
import React, { useEffect, useState } from "react";
import { AbsoluteFill, Composition, continueRender, delayRender, registerRoot, staticFile, useCurrentFrame } from "remotion";

const loadScript = (src) => new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("load " + src)); document.head.appendChild(s); });
const booted = {};
function boot(scene) {
  booted[scene] = booted[scene] || (async () => {
    const shots = await (await fetch(staticFile(`scenes/${scene}/shots.json`))).json();
    window.__SHOTS = shots; window.__MOUTH = {};
    for (const a of shots.actors) if (a.mouth) window.__MOUTH[a.id] = await (await fetch(staticFile(`scenes/${scene}/${a.mouth}`))).json();
    await loadScript(staticFile("prelude.js"));
    for (const a of shots.actors) { const [id, v] = a.rig.split("@"); window.HF.SNAP = window.HF.SNAP || {}; if (window.HF.SNAP[id]) continue; await loadScript(staticFile(`rigs/${id}/${v}/${a.art}`)); const H = window.HF; H.SNAP[id] = { draw: H.RIGS && H.RIGS[id], expr: H.EXPR_F && H.EXPR_F[id], poses: H.POSES_F }; } // the women rigs share one module: each register is snapshotted right after its own script, so a later script cannot replace it
    await loadScript(staticFile("core.js"));
    return shots;
  })();
  return booted[scene];
}

const Scene = ({ scene }) => {
  const frame = useCurrentFrame();
  const [shots, setShots] = useState(null);
  const [h] = useState(() => delayRender("boot"));
  useEffect(() => { boot(scene).then((s) => { setShots(s); continueRender(h); }); }, []);
  if (!shots) return null;
  const C = window.SpikeCore;
  return (
    <AbsoluteFill>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={C.viewBox(frame / shots.fps).join(" ")} preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%" }}
        dangerouslySetInnerHTML={{ __html: C.bg() + C.frame(frame / shots.fps) }} />
    </AbsoluteFill>
  );
};

registerRoot(() => (
  <Composition id="scene" component={Scene} durationInFrames={30} fps={30} width={1280} height={720} defaultProps={{ scene: "" }}
    calculateMetadata={async ({ props }) => { const s = await boot(props.scene); return { durationInFrames: Math.round(s.duration * s.fps), fps: s.fps, width: s.size[0], height: s.size[1] }; }} />
));
