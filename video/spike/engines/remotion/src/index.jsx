// Remotion glue: loads the vendored rig art + shared core.js from the public dir, then draws SpikeCore.frame(t) per frame.
import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Composition, continueRender, delayRender, registerRoot, staticFile, useCurrentFrame } from "remotion";

const loadScript = (src) => new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("load " + src)); document.head.appendChild(s); });
let booted;
function boot() {
  booted = booted || (async () => {
    const shots = await (await fetch(staticFile("shots.json"))).json();
    window.__SHOTS = shots;
    window.__MOUTH = await (await fetch(staticFile(shots.mouth_open.file))).json();
    for (const a of shots.actors) { const [id, v] = a.rig.split("@"); await loadScript(staticFile(`assets/rigs/${id}/${v}/art/${id}_cut.js`)); }
    await loadScript(staticFile("core.js"));
    return shots;
  })();
  return booted;
}

const Scene = () => {
  const frame = useCurrentFrame();
  const [shots, setShots] = useState(null);
  const [h] = useState(() => delayRender("boot"));
  useEffect(() => { boot().then((s) => { setShots(s); continueRender(h); }); }, []);
  if (!shots) return null;
  const C = window.SpikeCore;
  return (
    <AbsoluteFill>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={shots.camera.viewBox.join(" ")} preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%" }}
        dangerouslySetInnerHTML={{ __html: C.bg() + C.frame(frame / shots.fps) }} />
      <Audio src={staticFile("assets/audio/out.wav")} endAt={Math.round(shots.audio.duration * shots.fps)} />
    </AbsoluteFill>
  );
};

const Root = () => (
  <Composition id="scene" component={Scene} durationInFrames={300} fps={30} width={1280} height={720}
    calculateMetadata={async () => { const s = await boot(); return { durationInFrames: Math.round(s.duration * s.fps), fps: s.fps, width: s.size[0], height: s.size[1] }; }} />
);
registerRoot(Root);
