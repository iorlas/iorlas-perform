// Engine-neutral frame function: shots.json + rig.draw() -> SVG string for time t. Pure function of (shots, mouth, t).
// Actors: kind "object" (state channel, e.g. zinaida) or "character" (expr channel + pose, mouth envelope, e.g. mihalych).
(function () {
  var S = window.__SHOTS, M = window.__MOUTH || {}, HF = window.HF;
  var clone = function (x) { return JSON.parse(JSON.stringify(x)); };
  function keyAt(keys, t) { var k = keys[0]; for (var i = 0; i < keys.length; i++) if (keys[i].t <= t) k = keys[i]; return k; }
  function lerpExpr(a, b, u) { var o = {}; for (var k in b) o[k] = typeof b[k] === "number" && typeof a[k] === "number" ? a[k] + (b[k] - a[k]) * u : b[k]; return o; }
  function track(actor, channel) { return S.tracks.filter(function (x) { return x.actor === actor && x.channel === channel; })[0]; }
  function mouthAt(id, t) {
    var m = M[id]; if (!m) return 0;
    var f = Math.min(m.samples.length - 1, Math.max(0, Math.round(t * m.fps)));
    return Math.min(0.9, m.samples[f]);
  }
  function rigOf(a) { return HF.RIG[a.rig.split("@")[0]]; }
  // Rigs register differently: expressions/poses on the rig (mihalych, palych) or in the shared HF.EXPR/HF.POSES (vadik); draw as HF.RIGS[id](st) or rig.draw(st).
  function exprs(rig) { return rig.expr || HF.EXPR; }
  function poses(rig) { return rig.poses || HF.POSES; }
  function drawFn(rig, a) { var f = HF.RIGS && HF.RIGS[a.rig.split("@")[0]]; return f || rig.draw.bind(rig); }

  function drawActor(a, t) {
    var rig = rigOf(a), id = a.id;
    if (a.kind === "object") {
      var st = track(id, "state"), k = st ? keyAt(st.keys, t) : { value: a.state || "idle" };
      var s = { uid: "o_" + id, pose: a.pose, state: k.value, t: t };
      ["screen_text", "led", "shake", "cable"].forEach(function (p) { if (k[p] != null) s[p] = k[p]; });
      return rig.draw(s);
    }
    var ex = track(id, "expr"), pk = track(id, "pose"), poseName = pk ? keyAt(pk.keys, t).value : a.pose, pose = clone(poses(rig)[poseName]);
    for (var q in (a.pose_override || {})) pose[q] = a.pose_override[q];
    var E = exprs(rig), expr = E[a.expr || rig.default_expression || "neutral_anxious"] || E[Object.keys(E)[0]];
    if (ex) {
      var k2 = keyAt(ex.keys, t), i = ex.keys.indexOf(k2), prev = i > 0 ? ex.keys[i - 1] : k2;
      var u = k2 === prev ? 1 : Math.min(1, (t - k2.t) / (ex.blend || 0.25));
      expr = lerpExpr(E[prev.value], E[k2.value], u);
    }
    return drawFn(rig, a)({ ch: id, uid: "c_" + id, pose: pose, expr: expr, mouth: mouthAt(id, t), gaze: { x: 0, y: 0, cam: 0 }, key: 1, stand: !/^sit/.test(poseName), shake: { x: 0, y: 0, r: 0 }, t: t });
  }

  function captions(t, vb) {
    var cs = (S.captions || []).filter(function (c) { return t >= c.t0 && t < c.t1; })[0];
    if (!cs) return "";
    var x = vb[0] + vb[2] / 2, y = vb[1] + vb[3] - vb[3] * 0.06, fs = vb[3] * 0.055, o = "";
    var total = cs.words.reduce(function (a, w) { return a + w.w.length + 1; }, 0) * fs * 0.55, cx = x - total / 2;
    cs.words.forEach(function (w) {
      var on = t >= w.t0 && t < w.t1;
      o += '<text x="' + cx + '" y="' + y + '" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="' + fs + '" fill="' + (on ? "#ffd84a" : "#ffffff") + '" stroke="#000" stroke-width="' + fs * 0.08 + '" paint-order="stroke">' + w.w + "</text>";
      cx += (w.w.length + 1) * fs * 0.55;
    });
    return o;
  }

  // ---- shots (shots/2): sets, props, per-shot cast and camera, push-in, inset, transitions. Without `shots`, one shot holds the whole scene (shots/1).
  var SHOTS = S.shots || [{ t0: 0, camera: S.camera, cast: S.actors.map(function (a) { return a.id; }) }];
  function shotAt(t) { var s = SHOTS[0]; for (var i = 0; i < SHOTS.length; i++) if (SHOTS[i].t0 <= t) s = SHOTS[i]; return s; }
  function ease(u) { return u * u * (3 - 2 * u); }
  function viewBox(t) {
    var sh = shotAt(t), c = sh.camera, a = c.viewBox;
    if (!c.push_to) return a;
    var end = (SHOTS[SHOTS.indexOf(sh) + 1] || { t0: S.duration }).t0, u = ease(Math.max(0, Math.min(1, (t - sh.t0) / Math.max(0.001, end - sh.t0))));
    return a.map(function (v, i) { return v + (c.push_to[i] - v) * u; });
  }
  function esc(x) { return String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  function label(txt, x, y, fs, fill) { return '<text x="' + x + '" y="' + y + '" font-family="Helvetica, Arial, sans-serif" font-size="' + fs + '" fill="' + (fill || "#ffffff99") + '" text-anchor="middle">' + esc(txt) + "</text>"; }

  // Flat placeholders carry the real ids (sets and props); a staged <id>.svg from video/assets replaces the placeholder with no code change.
  function drawSet(id, vb) {
    var d = (S.sets || {})[id]; if (!d) return '<rect x="-3000" y="-3000" width="9000" height="9000" fill="' + S.background + '"/>';
    if (d.svg) return d.svg;
    return '<rect x="-3000" y="-3000" width="9000" height="9000" fill="' + d.bg + '"/><rect x="-3000" y="478" width="9000" height="3000" fill="' + (d.floor || d.bg) + '"/>' + label(id, vb[0] + vb[2] * 0.5, vb[1] + vb[3] - vb[3] * 0.02, vb[3] * 0.03);
  }
  function screenAt(inst, t) {
    var tr = track(inst, "screen"); if (!tr) return null;
    var k = keyAt(tr.keys, t), def = (S.screens || {})[k.value]; return def ? { def: def, dt: Math.max(0, t - k.t) } : null;
  }
  function drawScreen(x, y, w, h, sc) {
    var d = sc.def, o = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="#0a1218"/>';
    if (d.kind === "bar") {
      var u = Math.min(1, d.from + (d.to - d.from) * Math.min(1, sc.dt / (d.dur || 1)));
      o += label(d.label || "", x + w / 2, y + h * 0.35, h * 0.13, "#9fd") + '<rect x="' + (x + w * 0.1) + '" y="' + (y + h * 0.5) + '" width="' + w * 0.8 + '" height="' + h * 0.14 + '" fill="#233"/><rect x="' + (x + w * 0.1) + '" y="' + (y + h * 0.5) + '" width="' + w * 0.8 * u + '" height="' + h * 0.14 + '" fill="' + (d.frozen ? "#e8a33a" : "#3ad07a") + '"/>' + label(Math.round(u * 100) + " %", x + w / 2, y + h * 0.85, h * 0.13, "#fff");
      if (d.red_tile) o += '<rect x="' + (x + w * 0.78) + '" y="' + (y + h * 0.08) + '" width="' + w * 0.14 + '" height="' + h * 0.16 + '" fill="#e03a3a"/>';
    } else if (d.kind === "tiles") {
      var n = d.cols * d.rows, tw = w * 0.9 / d.cols, th = h * 0.8 / d.rows;
      for (var i = 0; i < n; i++) {
        var green = d.flicker != null && i === d.flicker.tile && sc.dt >= d.flicker.after && (Math.floor(sc.dt * 6) % 2 === 0 || sc.dt >= d.flicker.after + d.flicker.hold);
        o += '<rect x="' + (x + w * 0.05 + (i % d.cols) * tw + 2) + '" y="' + (y + h * 0.1 + Math.floor(i / d.cols) * th + 2) + '" width="' + (tw - 4) + '" height="' + (th - 4) + '" fill="' + (green ? "#3ad07a" : "#c93030") + '"/>';
      }
    } else o += label(d.text || "", x + w / 2, y + h * 0.55, h * 0.14, d.kind === "chat" ? "#fff" : "#9fd");
    return o;
  }
  function drawProp(p, t) {
    var d = Object.assign({}, (S.props || {})[p.id] || {}, p), at = d.at || [0, 0], sc = d.w || 60, k = d.scale || 1, w = (d.w || 60) * k, h = (d.h || 60) * k, o;
    if (d.svg) return '<g transform="translate(' + at[0] + " " + at[1] + ') scale(' + k + ')">' + d.svg + "</g>";
    o = d.shape === "circle" ? '<circle cx="' + (at[0] + w / 2) + '" cy="' + (at[1] + h / 2) + '" r="' + w / 2 + '" fill="' + d.fill + '"/>'
      : d.shape === "oval" ? '<ellipse cx="' + (at[0] + w / 2) + '" cy="' + (at[1] + h / 2) + '" rx="' + w / 2 + '" ry="' + h / 2 + '" fill="' + d.fill + '"/>'
      : '<rect x="' + at[0] + '" y="' + at[1] + '" width="' + w + '" height="' + h + '" rx="6" fill="' + d.fill + '"/>';
    if (d.screen) { var s = screenAt(p.inst || p.id, t); if (s) o += drawScreen(at[0] + w * 0.08, at[1] + h * 0.1, w * 0.84, h * 0.72, s); }
    var txt = (track(p.inst || p.id, "text") && keyAt(track(p.inst || p.id, "text").keys, t).value) || d.text;
    return o + label(txt ? p.id + " " + txt : p.id, at[0] + w / 2, at[1] + h + 14, 11, "#ffffffaa");
  }
  function actorsOf(sh, cast) {
    return cast.map(function (c) {
      var id = typeof c === "string" ? c : c.id, a = Object.assign({}, S.actors.filter(function (x) { return x.id === id; })[0], typeof c === "string" ? {} : c);
      return a;
    });
  }
  function drawCast(cast, t) {
    var out = "";
    cast.sort(function (a, b) { return (a.layer || 0) - (b.layer || 0); }).forEach(function (a) {
      var off = a.offset || [0, 0], k = a.scale || 1;
      out += '<g transform="translate(' + off[0] + " " + off[1] + ")" + (k !== 1 ? " scale(" + k + ")" : "") + '">' + drawActor(a, t) + "</g>";
    });
    return out;
  }
  function drawInset(sh, t, vb) {
    var ins = sh.inset; if (!ins) return "";
    var r = ins.rect, x = vb[0] + r[0] * vb[2], y = vb[1] + r[1] * vb[3], w = r[2] * vb[2], h = r[3] * vb[3], iv = ins.camera, id = "inset_" + sh.id, rad = (ins.radius || 0.03) * vb[2];
    var inner = drawSet(ins.set, iv) + ((S.sets || {})[ins.set] ? ((S.sets[ins.set].props || []).map(function (p) { return drawProp(p, t); }).join("")) : "") + drawCast(actorsOf(sh, ins.cast), t);
    return '<clipPath id="' + id + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rad + '"/></clipPath><g clip-path="url(#' + id + ')"><svg x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" viewBox="' + iv.join(" ") + '" preserveAspectRatio="xMidYMid slice">' + inner + '</svg></g><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rad + '" fill="none" stroke="#f3e9d2" stroke-width="' + vb[2] * 0.004 + '"/>';
  }
  function transitions(t, vb) {
    var o = "";
    (S.transitions || []).forEach(function (tr) {
      if (t < tr.t0 || t >= tr.t1) return;
      var fade = tr.fade || 0.4, a = tr.type === "time_card" ? Math.min(1, (t - tr.t0) / fade) : 1 - Math.min(1, (t - tr.t0) / fade);
      o += '<g opacity="' + a.toFixed(3) + '"><rect x="' + (vb[0] - 5) + '" y="' + (vb[1] - 5) + '" width="' + (vb[2] + 10) + '" height="' + (vb[3] + 10) + '" fill="' + (tr.color || "#0b0b10") + '"/>' + (tr.svg || label(tr.text, vb[0] + vb[2] / 2, vb[1] + vb[3] * 0.54, vb[3] * 0.14, "#f3e9d2")) + "</g>";
    });
    return o;
  }

  function frame(t) {
    var sh = shotAt(t), vb = viewBox(t), set = sh.set || S.set, out = drawSet(set, vb);
    var def = (S.sets || {})[set]; if (def && def.props) out += def.props.map(function (p) { return drawProp(p, t); }).join("");
    out += (sh.props || []).map(function (p) { return drawProp(p, t); }).join("");
    out += drawCast(actorsOf(sh, sh.cast), t);
    return out + drawInset(sh, t, vb) + captions(t, vb) + transitions(t, vb);
  }
  window.SpikeCore = { frame: frame, viewBox: viewBox, bg: function () { return ""; } };
})();
