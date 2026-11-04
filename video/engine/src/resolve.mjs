// Resolver: timeline.json (scene.py output) + scene sheet + mixed wav -> one scene spec per scene, each with an engine-neutral shots.json.
// Pure except for reading the wav; no engine code here.
import { envelope, readWav } from "./mouth.mjs";

const sceneId = (title, i) => `s${String(i + 1).padStart(2, "0")}`;

/** Group consecutive turns by their "scene" title. Returns [{id,title,turns[],t0,t1}] on the global audio clock. */
export function segment(timeline, sheet, fps) {
  const turns = timeline.filter((e) => e.turn != null);
  const groups = [];
  for (const e of turns) {
    const title = e.scene ?? "(no scene)", last = groups[groups.length - 1];
    if (last && last.title === title) last.turns.push(e); else groups.push({ title, turns: [e] });
  }
  const lead = sheet.lead ?? 0.3, tail = sheet.tail ?? 0.5;
  let prevEnd = 0;
  groups.forEach((g, i) => {
    g.id = sceneId(g.title, i);
    g.t0 = Math.max(prevEnd, Math.min(...g.turns.map((t) => t.start)) - lead);
    const next = groups[i + 1] && Math.min(...groups[i + 1].turns.map((t) => t.start));
    g.t1 = Math.max(...g.turns.map((t) => t.end)) + tail;
    if (next != null && g.t1 > next - lead) g.t1 = Math.max(Math.max(...g.turns.map((t) => t.end)), (next - lead));
    g.duration = Math.ceil((g.t1 - g.t0) * fps) / fps; // whole frames
    g.t1 = g.t0 + g.duration;
    prevEnd = g.t1;
  });
  return groups;
}

/** Build shots for one scene. `wav` is the scene's own audio cut (scene-relative clock). */
export function resolveScene(group, sheet, wav) {
  const fps = sheet.fps ?? 30, size = sheet.size ?? [1280, 720];
  const def = sheet.scenes?.[group.title] ?? sheet.scenes?.["*"];
  if (!def) throw new Error(`scene sheet has no entry for scene "${group.title}" (and no "*")`);
  const rel = (t) => +(t - group.t0).toFixed(3);
  const turnStart = (n) => { const t = group.turns.find((x) => x.turn === n); if (!t) throw new Error(`cue refers to turn ${n}, not in scene "${group.title}"`); return rel(t.start); };

  const tracks = [];
  for (const c of def.cues ?? []) {
    const t = c.at != null ? c.at : turnStart(c.turn) + (c.offset ?? 0);
    let tr = tracks.find((x) => x.actor === c.actor && x.channel === c.channel);
    if (!tr) { tr = { actor: c.actor, channel: c.channel, ...(c.blend != null ? { blend: c.blend } : {}), keys: [] }; tracks.push(tr); }
    const { at, turn, offset, actor, channel, blend, ...props } = c;
    tr.keys.push({ t: +t.toFixed(3), ...props });
  }
  for (const tr of tracks) { tr.keys.sort((a, b) => a.t - b.t); if (tr.keys[0].t > 0) tr.keys.unshift({ ...tr.keys[0], t: 0 }); }

  const actors = def.actors.map((a) => ({ ...a }));
  const mouth = {};
  for (const a of actors) {
    const voices = Object.entries(sheet.cast ?? {}).filter(([, v]) => v.actor === a.id).map(([voice]) => voice);
    if (a.kind === "object" || !voices.length) continue;
    const turns = group.turns.filter((t) => voices.includes(t.voice)).map((t) => ({ start: rel(t.start), end: rel(t.end) }));
    mouth[a.id] = envelope(wav, fps, group.duration, turns);
    a.mouth = `mouth_${a.id}.json`;
  }
  const shots = {
    schema: "shots/1", scene: group.id, title: group.title, fps, size, duration: group.duration,
    camera: def.camera ?? sheet.camera, background: def.background ?? sheet.background ?? "#26344f",
    actors, tracks, ...(def.captions ? { captions: def.captions } : {}),
  };
  return { shots, mouth };
}
