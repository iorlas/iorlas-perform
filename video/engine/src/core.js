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

  // Pose = the rig's named pose + the actor's static override + the pose track key's override (hand targets, head turn), eased over 0.3 s between keys.
  function isObj(x) { return x && typeof x === "object" && !Array.isArray(x); }
  function deepMerge(a, b) { for (var k in b) { if (isObj(b[k]) && isObj(a[k])) deepMerge(a[k], b[k]); else a[k] = clone(b[k]); } return a; }
  function deepLerp(a, b, u) {
    if (typeof a === "number" && typeof b === "number") return a + (b - a) * u;
    if (Array.isArray(a) && Array.isArray(b)) return b.map(function (v, i) { return deepLerp(a[i], v, u); });
    if (isObj(a) && isObj(b)) { var o = {}; for (var k in b) o[k] = deepLerp(a[k], b[k], u); return o; }
    return b;
  }
  function poseOf(rig, a, pk, t) {
    function make(key) { var p = clone(poses(rig)[key.value]); deepMerge(p, a.pose_override || {}); return deepMerge(p, key.override || {}); }
    var pose;
    if (!pk) pose = make({ value: a.pose });
    else {
      var k = keyAt(pk.keys, t), i = pk.keys.indexOf(k), prev = i > 0 ? pk.keys[i - 1] : k;
      pose = make(k);
      if (prev !== k && t < k.t + 0.3) { var u = (t - k.t) / 0.3; pose = deepLerp(make(prev), pose, u * u * (3 - 2 * u)); }
    }
    if (pose._typing) { pose.L.h = [pose.L.h[0], pose.L.h[1] + Math.sin(t * 38) * 5]; pose.R.h = [pose.R.h[0], pose.R.h[1] + Math.sin(t * 38 + 2) * 5]; }
    delete pose._typing;
    return pose;
  }

  function drawActor(a, t) {
    var rig = rigOf(a), id = a.id;
    if (a.kind === "object") {
      var st = track(id, "state"), k = st ? keyAt(st.keys, t) : { value: a.state || "idle" };
      var s = { uid: "o_" + id, pose: a.pose, state: k.value, t: t };
      ["screen_text", "led", "shake", "cable"].forEach(function (p) { if (k[p] != null) s[p] = k[p]; });
      return rig.draw(s);
    }
    var ex = track(id, "expr"), pk = track(id, "pose"), poseName = pk ? keyAt(pk.keys, t).value : a.pose, pose = poseOf(rig, a, pk, t);
    var E = exprs(rig), expr = E[a.expr || rig.default_expression || "neutral_anxious"] || E[Object.keys(E)[0]];
    if (ex) {
      var k2 = keyAt(ex.keys, t), i = ex.keys.indexOf(k2), prev = i > 0 ? ex.keys[i - 1] : k2;
      var u = k2 === prev ? 1 : Math.min(1, (t - k2.t) / (ex.blend || 0.25));
      expr = lerpExpr(E[prev.value], E[k2.value], u);
    }
    // Lip-sync owns the jaw: rigs combine eff = 1-(1-expr.mo)(1-mouth_open), so an expression with a base-open mouth (bark mo=1, panic) would pin it open whatever is said.
    if (M[id] && expr.mo) { expr = clone(expr); expr.mo = 0; }
    return drawFn(rig, a)({ ch: id, uid: "c_" + id, pose: pose, expr: expr, mouth: mouthAt(id, t), gaze: { x: 0, y: 0, cam: 0 }, key: 1, stand: !a.seated && !/^sit/.test(poseName), shake: { x: 0, y: 0, r: 0 }, t: t });
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
  function label(txt, x, y, fs, fill, always) { if (!always && !S.debug) return ""; return '<text x="' + x + '" y="' + y + '" font-family="Helvetica, Arial, sans-serif" font-size="' + fs + '" fill="' + (fill || "#ffffff99") + '" text-anchor="middle">' + esc(txt) + "</text>"; }

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
      o += label(d.label || "", x + w / 2, y + h * 0.35, h * 0.13, "#9fd", 1) + '<rect x="' + (x + w * 0.1) + '" y="' + (y + h * 0.5) + '" width="' + w * 0.8 + '" height="' + h * 0.14 + '" fill="#233"/><rect x="' + (x + w * 0.1) + '" y="' + (y + h * 0.5) + '" width="' + w * 0.8 * u + '" height="' + h * 0.14 + '" fill="' + (d.frozen ? "#e8a33a" : "#3ad07a") + '"/>' + label(Math.round(u * 100) + " %", x + w / 2, y + h * 0.85, h * 0.13, "#fff", 1);
      if (d.red_tile) o += '<rect x="' + (x + w * 0.78) + '" y="' + (y + h * 0.08) + '" width="' + w * 0.14 + '" height="' + h * 0.16 + '" fill="#e03a3a"/>';
    } else if (d.kind === "tiles") {
      var n = d.cols * d.rows, tw = w * 0.9 / d.cols, th = h * 0.8 / d.rows;
      for (var i = 0; i < n; i++) {
        var green = d.flicker != null && i === d.flicker.tile && sc.dt >= d.flicker.after && (Math.floor(sc.dt * 6) % 2 === 0 || sc.dt >= d.flicker.after + d.flicker.hold);
        o += '<rect x="' + (x + w * 0.05 + (i % d.cols) * tw + 2) + '" y="' + (y + h * 0.1 + Math.floor(i / d.cols) * th + 2) + '" width="' + (tw - 4) + '" height="' + (th - 4) + '" fill="' + (green ? "#3ad07a" : "#c93030") + '"/>';
      }
    } else if (d.kind === "rows") {
      var n2 = d.rows.length + (d.ok ? 1 : 0), rh = h * 0.84 / n2, all = d.rows.concat(d.ok ? [{ label: d.ok.label, ok: true }] : []);
      o += label(d.title || "", x + w * 0.06, y + h * 0.1, h * 0.09, "#aab", 1).replace('text-anchor="middle"', 'text-anchor="start"');
      all.forEach(function (r, i) {
        var down = !r.ok && sc.dt >= (r.at || 0), pulse = r.ok && sc.dt >= (d.ok.pulse_after || 1e9) ? 0.65 + 0.35 * Math.sin(sc.dt * 8) : 1, ry = y + h * 0.14 + i * rh;
        o += '<rect x="' + (x + w * 0.04) + '" y="' + (ry + 2) + '" width="' + w * 0.92 + '" height="' + (rh - 4) + '" rx="3" fill="' + (down ? "#7d1f1f" : "#17402c") + '" opacity="' + pulse + '"/>'
          + label(r.label, x + w * 0.08, ry + rh * 0.68, rh * 0.5, "#fff", 1).replace('text-anchor="middle"', 'text-anchor="start"')
          + label(r.ok ? d.ok.note : down ? "DOWN" : "UP", x + w * 0.93, ry + rh * 0.68, rh * 0.5, down ? "#ff9a9a" : "#8dffb8", 1).replace('text-anchor="middle"', 'text-anchor="end"');
      });
    } else o += label(d.text || "", x + w / 2, y + h * 0.55, h * 0.14, d.kind === "chat" ? "#fff" : "#9fd", 1);
    return o;
  }
  function drawProp(p, t) {
    var inst = p.inst || p.id, vis = track(inst, "visible");
    if (vis && keyAt(vis.keys, t).value === false) return "";
    var d = Object.assign({}, (S.props || {})[p.id] || {}, p), at = d.at || [0, 0], k = d.scale || 1, w = (d.w || 60) * k, h = (d.h || 60) * k, o;
    if (d.svg) return '<g transform="translate(' + at[0] + " " + at[1] + ') scale(' + k + ')">' + d.svg + "</g>";
    var txtTrack = track(inst, "text"), txt = (txtTrack && keyAt(txtTrack.keys, t).value) || d.text, x0 = at[0], y0 = at[1];
    if (d.id === "phone" && txtTrack && keyAt(txtTrack.keys, t).value) { x0 += Math.sin(t * 90) * w * 0.03; o = '<rect x="' + (x0 - w * 0.1) + '" y="' + (y0 - h * 0.2) + '" width="' + w * 1.2 + '" height="' + h * 1.4 + '" rx="8" fill="#ffd84a" opacity="' + (0.25 + 0.2 * Math.sin(t * 14)).toFixed(2) + '"/>'; } else o = "";
    o += d.shape === "circle" ? '<circle cx="' + (x0 + w / 2) + '" cy="' + (y0 + h / 2) + '" r="' + w / 2 + '" fill="' + d.fill + '"/>'
      : d.shape === "oval" ? '<ellipse cx="' + (x0 + w / 2) + '" cy="' + (y0 + h / 2) + '" rx="' + w / 2 + '" ry="' + h / 2 + '" fill="' + d.fill + '"/>'
      : '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" rx="' + Math.min(8, h / 4) + '" fill="' + d.fill + '"/>';
    if (d.id === "clock" && /^\d\d:\d\d$/.test(txt || "")) {
      var hh = +txt.slice(0, 2) % 12, mm = +txt.slice(3), cx = x0 + w / 2, cy = y0 + h / 2, ha = (hh + mm / 60) * Math.PI / 6, ma = mm * Math.PI / 30;
      o += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + Math.sin(ha) * w * 0.26) + '" y2="' + (cy - Math.cos(ha) * w * 0.26) + '" stroke="#2a2a30" stroke-width="' + w * 0.05 + '" stroke-linecap="round"/><line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + Math.sin(ma) * w * 0.4) + '" y2="' + (cy - Math.cos(ma) * w * 0.4) + '" stroke="#2a2a30" stroke-width="' + w * 0.03 + '" stroke-linecap="round"/>';
    }
    if (d.screen) { var s = screenAt(inst, t); if (s) o += drawScreen(x0 + w * 0.05, y0 + h * 0.08, w * 0.9, h * 0.84, s); }
    return o + label(d.id + (txt ? " " + txt : ""), x0 + w / 2, y0 + h + 14, 11, "#ffffffaa");
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
    return '<clipPath id="' + id + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rad + '"/></clipPath><g clip-path="url(#' + id + ')"><svg x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" viewBox="' + iv.join(" ") + '" preserveAspectRatio="xMidYMid slice">' + inner + '</svg></g><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rad + '" fill="none" stroke="#f3e9d2" stroke-width="' + vb[2] * 0.004 + '"/>' + caller(ins, t, x, y, w, h, id, rad);
  }
  // Phone call card: name bar and a ringing animation over the inset (style "caller"); the avatar is the character's own head, lip-synced while he speaks.
  function caller(ins, t, x, y, w, h, id, rad) {
    if (ins.style !== "caller") return "";
    var o = '<clipPath id="' + id + 'b"><rect x="' + x + '" y="' + (y + h * 0.82) + '" width="' + w + '" height="' + h * 0.18 + '"/></clipPath><g clip-path="url(#' + id + 'b)"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rad + '" fill="#101018" opacity="0.88"/></g>';
    o += label(ins.name || "", x + w / 2, y + h * 0.935, h * 0.06, "#f3e9d2", 1);
    if (ins.ringing) for (var i = 0; i < 3; i++) { var u = ((t * 1.4 + i / 3) % 1); o += '<rect x="' + (x - u * w * 0.08) + '" y="' + (y - u * w * 0.08) + '" width="' + (w + u * w * 0.16) + '" height="' + (h + u * w * 0.16) + '" rx="' + (rad + u * w * 0.08) + '" fill="none" stroke="#ffd84a" stroke-width="' + w * 0.012 + '" opacity="' + (1 - u).toFixed(2) + '"/>'; }
    return o;
  }
  function transitions(t, vb) {
    var o = "";
    (S.transitions || []).forEach(function (tr) {
      if (t < tr.t0 || t >= tr.t1) return;
      var fade = tr.fade || 0.4, a = tr.type === "time_card" ? Math.min(1, (t - tr.t0) / fade) : 1 - Math.min(1, (t - tr.t0) / fade);
      o += '<g opacity="' + a.toFixed(3) + '"><rect x="' + (vb[0] - 5) + '" y="' + (vb[1] - 5) + '" width="' + (vb[2] + 10) + '" height="' + (vb[3] + 10) + '" fill="' + (tr.color || "#0b0b10") + '"/>' + (tr.svg || label(tr.text, vb[0] + vb[2] / 2, vb[1] + vb[3] * 0.54, vb[3] * 0.14, "#f3e9d2", 1)) + "</g>";
    });
    return o;
  }

  function frame(t) {
    var sh = shotAt(t), vb = viewBox(t), set = sh.set || S.set, out = drawSet(set, vb);
    var def = (S.sets || {})[set], props = ((def && def.props) || []).concat(sh.props || []);
    out += props.filter(function (p) { return !p.front; }).map(function (p) { return drawProp(p, t); }).join("");
    out += drawCast(actorsOf(sh, sh.cast), t);
    out += props.filter(function (p) { return p.front; }).map(function (p) { return drawProp(p, t); }).join(""); // in front of the cast: a person behind a desk
    return out + drawInset(sh, t, vb) + captions(t, vb) + transitions(t, vb);
  }
  window.SpikeCore = { frame: frame, viewBox: viewBox, bg: function () { return ""; } };
})();
