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
  function rigOf(a) {
    var id = a.rig.split("@")[0], snap = HF.SNAP && HF.SNAP[id];   // the female rigs (kristina, friend, mama) register no HF.RIG entry; their module is shared, so the loader snapshots each one's draw, expressions and poses
    return HF.RIG[id] || { expr: snap && snap.expr, poses: snap && snap.poses, draw: snap && snap.draw, default_expression: "neutral" };
  }
  // Rigs register differently: expressions/poses on the rig (mihalych, palych) or in the shared HF.EXPR/HF.POSES (vadik); draw as HF.RIGS[id](st) or rig.draw(st).
  function exprs(rig) { return rig.expr || HF.EXPR; }
  function poses(rig) { return rig.poses || HF.POSES; }
  function drawFn(rig, a) { var id = a.rig.split("@")[0], f = (HF.SNAP && HF.SNAP[id] && HF.SNAP[id].draw) || (HF.RIGS && HF.RIGS[id]); return f || rig.draw.bind(rig); }

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
    var k = keyAt(tr.keys, t), def = (S.screens || {})[k.value]; return def ? { def: def, dt: Math.max(0, t - k.t), t: t } : null;
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
        var green = (d.flicker != null && i === d.flicker.tile && sc.dt >= d.flicker.after && (Math.floor(sc.dt * 6) % 2 === 0 || sc.dt >= d.flicker.after + d.flicker.hold)) || (d.green_every != null && sc.dt >= (d.green_start || 0) + i * d.green_every);
        o += '<rect x="' + (x + w * 0.05 + (i % d.cols) * tw + 2) + '" y="' + (y + h * 0.1 + Math.floor(i / d.cols) * th + 2) + '" width="' + (tw - 4) + '" height="' + (th - 4) + '" fill="' + (green ? "#3ad07a" : "#c93030") + '"/>';
      }
      if (d.caption) o += T(d.caption, x + w / 2, y + h * 0.97, h * 0.1, sc.dt >= (d.caption_at || 0) ? "#8dffb8" : "#0000", "middle", 700);
    } else if (d.kind === "dialog") {
      var cur = d.cursor || [], pos = cur.length ? cur.reduce(function (a, c) { return c.dt <= sc.dt ? c : a; }, cur[0]) : null, clicked = d.click_dt != null && sc.dt >= d.click_dt;
      o += '<rect x="' + (x + w * 0.1) + '" y="' + (y + h * 0.12) + '" width="' + w * 0.8 + '" height="' + h * 0.72 + '" rx="5" fill="#e9e4d4" stroke="#556" stroke-width="2"/><rect x="' + (x + w * 0.1) + '" y="' + (y + h * 0.12) + '" width="' + w * 0.8 + '" height="' + h * 0.15 + '" fill="#3b5aa0"/>'
        + T(d.title || "", x + w * 0.14, y + h * 0.235, h * 0.1, "#fff", "start") + T(d.text || "", x + w / 2, y + h * 0.5, Math.min(h * 0.11, w * 0.76 / Math.max(1, (d.text || "").length * 0.58)), "#222", "middle");
      (d.buttons || []).forEach(function (b, i) {
        var bx = x + w * (0.2 + i * 0.32), by = y + h * 0.6, hit = clicked && d.click === b.id;
        o += '<rect x="' + bx + '" y="' + by + '" width="' + w * 0.26 + '" height="' + h * 0.16 + '" rx="4" fill="' + (hit ? "#3ad07a" : "#cfc8b0") + '" stroke="#445" stroke-width="1.5"/>' + T(b.label, bx + w * 0.13, by + h * 0.115, h * 0.1, "#111", "middle");
      });
      if (pos) o += '<path transform="translate(' + (x + w * pos.x) + " " + (y + h * pos.y) + ')" d="M0 0 L0 ' + h * 0.17 + " L" + h * 0.05 + " " + h * 0.13 + " L" + h * 0.09 + " " + h * 0.2 + " L" + h * 0.115 + " " + h * 0.185 + " L" + h * 0.075 + " " + h * 0.12 + " L" + h * 0.12 + ' ' + h * 0.11 + ' Z" fill="#fff" stroke="#000" stroke-width="1.5"/>';
    } else if (d.kind === "desktop") {
      (d.icons || []).forEach(function (ic) {
        if (ic.gone_at != null && sc.dt >= ic.gone_at) return;
        var ix = x + w * ic.x, iy = y + h * ic.y, struck = ic.strike_at != null && sc.dt >= ic.strike_at, s0 = h * 0.28;
        o += '<path d="M' + ix + " " + (iy + s0 * 0.22) + " h" + s0 * 0.4 + " l" + s0 * 0.1 + " " + -s0 * 0.1 + " h" + s0 * 0.5 + " v" + s0 * 0.16 + " h" + s0 * 0.5 + " v" + s0 * 0.78 + " h" + -s0 * 1.5 + ' Z" fill="#e8c35a" stroke="#a07a20" stroke-width="2"/>' + T(ic.label, ix + s0 * 0.75, iy + s0 * 1.28, h * 0.09, "#ddd", "middle");
        if (struck) o += '<line x1="' + (ix - 4) + '" y1="' + (iy + s0 * 0.7) + '" x2="' + (ix + s0 * 1.55) + '" y2="' + (iy + s0 * 0.7) + '" stroke="#e03a3a" stroke-width="' + h * 0.035 + '"/>';
      });
      if (d.caption) o += T(d.caption, x + w / 2, y + h * 0.92, h * 0.13, "#8dffb8", "middle");
    } else if (d.kind === "neyroset") {
      o += neyScreen(d, x, y, w, h, sc);
    } else if (d.kind === "rows") {
      var n2 = d.rows.length + (d.ok ? 1 : 0), rh = h * (d.footer ? 0.68 : 0.84) / n2, all = d.rows.concat(d.ok ? [{ label: d.ok.label, ok: true }] : []);
      o += label(d.title || "", x + w * 0.06, y + h * 0.1, h * 0.09, "#aab", 1).replace('text-anchor="middle"', 'text-anchor="start"');
      all.forEach(function (r, i) {
        var down = !r.ok && !r.up && sc.dt >= (r.at || 0), pulse = r.ok && sc.dt >= (d.ok.pulse_after || 1e9) ? 0.65 + 0.35 * Math.sin(sc.dt * 8) : 1, ry = y + h * 0.14 + i * rh;
        o += '<rect x="' + (x + w * 0.04) + '" y="' + (ry + 2) + '" width="' + w * 0.92 + '" height="' + (rh - 4) + '" rx="3" fill="' + (down ? "#7d1f1f" : "#17402c") + '" opacity="' + pulse + '"/>'
          + label(r.label, x + w * 0.08, ry + rh * 0.68, rh * 0.5, "#fff", 1).replace('text-anchor="middle"', 'text-anchor="start"')
          + label(r.ok ? d.ok.note : down ? "DOWN" : "UP", x + w * 0.93, ry + rh * 0.68, rh * 0.5, down ? "#ff9a9a" : "#8dffb8", 1).replace('text-anchor="middle"', 'text-anchor="end"');
      });
      if (d.footer) o += T(d.footer, x + w / 2, y + h * 0.97, h * 0.1, "#8dffb8", "middle");
    } else if (d.kind === "chat" && d.lines) {
      d.lines.forEach(function (l, i) {
        var me = l.from === "user", bw = w * 0.7, by = y + h * (0.1 + i * 0.3);
        o += '<rect x="' + (me ? x + w * 0.28 : x + w * 0.04) + '" y="' + by + '" width="' + bw + '" height="' + h * 0.24 + '" rx="8" fill="' + (me ? "#3b5aa0" : "#2e3b4c") + '"/>' + T(l.text, (me ? x + w * 0.28 : x + w * 0.04) + bw / 2, by + h * 0.155, h * 0.1, "#fff", "middle");
      });
    } else o += label(d.text || "", x + w / 2, y + h * 0.55, h * 0.14, d.kind === "chat" ? "#fff" : "#9fd", 1);
    return o;
  }
  function T(txt, x, y, fs, fill, anchor, weight) { return '<text x="' + x + '" y="' + y + '" font-family="Helvetica, Arial, sans-serif" font-weight="' + (weight || 700) + '" font-size="' + fs + '" fill="' + fill + '" text-anchor="' + (anchor || "middle") + '">' + esc(txt) + "</text>"; }
  function textAt(inst, t, dflt) { var tr = track(inst, "text"), v = tr && keyAt(tr.keys, t).value; return v === undefined || v === null ? dflt : v; }
  function ringing(t) { var v = textAt("phone", t, ""); return typeof v === "string" && v.indexOf("ring:") === 0; }

  // Flat cut-paper placeholders by kind. Real art (video/assets/**/<id>.svg) replaces any of them.
  function drawKind(d, x, y, w, h, t, inst) {
    var kind = d.kind || d.id, o = "", i;
    if (kind === "plate") {   // cutlets in a 7x2 grid (the match-cut partner of the 7x2 test tiles); text "13f" = 13 cutlets and a fork lifting the 14th
      var tx = String(textAt(inst, t, "14")), nC = parseInt(tx, 10), fork = /f/.test(tx), cw = w / 7;
      o += '<ellipse cx="' + (x + w / 2) + '" cy="' + (y + h * 0.55) + '" rx="' + w / 2 + '" ry="' + h * 0.5 + '" fill="#efeade" stroke="#b9b1a0" stroke-width="3"/>';
      for (i = 0; i < 14; i++) { var gx = x + w * 0.07 + (i % 7) * cw * 0.86 + cw * 0.3, gy = y + h * (i < 7 ? 0.36 : 0.66);
        if (i < nC) o += '<ellipse cx="' + gx + '" cy="' + gy + '" rx="' + cw * 0.36 + '" ry="' + h * 0.17 + '" fill="#b5703a" stroke="#7a4520" stroke-width="2"/>'; }
      if (fork) o += '<g transform="translate(' + (x + w * 0.07 + 6 * cw * 0.86 + cw * 0.3) + " " + (y + h * 0.2) + ')"><ellipse cx="0" cy="0" rx="' + cw * 0.36 + '" ry="' + h * 0.17 + '" fill="#b5703a" stroke="#7a4520" stroke-width="2"/><line x1="0" y1="-4" x2="' + cw * 0.5 + '" y2="' + -h * 0.5 + '" stroke="#999" stroke-width="5"/></g>';
      return o;
    }
    if (kind === "window_dusk" || kind === "window_night" || kind === "window_day") {   // frame, four panes, sky with sun/moon, sill line
      var night = kind === "window_night", day = kind === "window_day", f = Math.max(6, w * 0.04), pw = (w - 3 * f) / 2, ph = (h - 3 * f) / 2;
      o += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + (night ? "#4a3f33" : "#e9e2d0") + '"/>';
      for (i = 0; i < 4; i++) {
        var px = x + f + (i % 2) * (pw + f), py = y + f + Math.floor(i / 2) * (ph + f);
        o += '<rect x="' + px + '" y="' + py + '" width="' + pw + '" height="' + ph + '" fill="' + (night ? "#101a3a" : day ? "#9fd0f0" : i < 2 ? "#f0a24a" : "#e07a3c") + '"/>';
      }
      o += night ? '<circle cx="' + (x + w * 0.72) + '" cy="' + (y + h * 0.28) + '" r="' + w * 0.07 + '" fill="#f2efd0"/>' + [[.2, .2], [.4, .38], [.28, .7], [.8, .62]].map(function (s) { return '<circle cx="' + (x + w * s[0]) + '" cy="' + (y + h * s[1]) + '" r="2" fill="#fff"/>'; }).join("")
        : day ? '<circle cx="' + (x + w * 0.75) + '" cy="' + (y + h * 0.25) + '" r="' + w * 0.09 + '" fill="#fff3a0"/>'
        : '<circle cx="' + (x + w * 0.3) + '" cy="' + (y + h * 0.7) + '" r="' + w * 0.1 + '" fill="#ffd36a"/><rect x="' + (x + f) + '" y="' + (y + h * 0.78) + '" width="' + (w - 2 * f) + '" height="' + h * 0.14 + '" fill="#3b3550"/>';
      return o;
    }
    if (kind === "clock") {
      var cx = x + w / 2, cy = y + h / 2, r = w / 2, txt = textAt(inst, t, d.text) || "";
      o += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + d.fill + '" stroke="#2a2a30" stroke-width="' + r * 0.06 + '"/>';
      for (i = 1; i <= 12; i++) { var an = i * Math.PI / 6; o += T(i, cx + Math.sin(an) * r * 0.74, cy - Math.cos(an) * r * 0.74 + r * 0.1, r * 0.26, "#2a2a30"); }
      if (/^\d\d:\d\d$/.test(txt)) {
        var hh = +txt.slice(0, 2) % 12, mm = +txt.slice(3), ha = (hh + mm / 60) * Math.PI / 6, ma = mm * Math.PI / 30;
        o += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + Math.sin(ha) * r * 0.5) + '" y2="' + (cy - Math.cos(ha) * r * 0.5) + '" stroke="#2a2a30" stroke-width="' + r * 0.1 + '" stroke-linecap="round"/><line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + Math.sin(ma) * r * 0.72) + '" y2="' + (cy - Math.cos(ma) * r * 0.72) + '" stroke="#2a2a30" stroke-width="' + r * 0.06 + '" stroke-linecap="round"/><circle cx="' + cx + '" cy="' + cy + '" r="' + r * 0.06 + '" fill="#2a2a30"/>';
      }
      return o;
    }
    if (kind === "phone") {   // desk phone base: display, keypad; the handset is its own prop on top
      var ring = ringing(t), disp = textAt(inst, t, ""), shown = typeof disp === "string" && disp.indexOf("ring:") === 0 ? disp.slice(5) : disp || "03:07";
      o += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + h * 0.18 + '" fill="' + d.fill + '"/>';
      o += '<rect x="' + (x + w * 0.08) + '" y="' + (y + h * 0.14) + '" width="' + w * 0.46 + '" height="' + h * 0.3 + '" rx="2" fill="' + (ring && Math.floor(t * 4) % 2 ? "#ffd84a" : "#9ad8c0") + '"/>' + T(shown, x + w * 0.31, y + h * 0.36, Math.min(h * 0.2, w * 0.42 / Math.max(1, String(shown).length * 0.62)), "#1a2b25", "middle", 700);
      for (i = 0; i < 12; i++) o += '<rect x="' + (x + w * (0.6 + (i % 3) * 0.12)) + '" y="' + (y + h * (0.14 + Math.floor(i / 3) * 0.2)) + '" width="' + w * 0.09 + '" height="' + h * 0.14 + '" rx="1.5" fill="#6b6f7a"/>';
      return o;
    }
    if (kind === "handset") {
      var rg = ringing(t), ang = rg ? Math.sin(t * 60) * 3 : 0;
      return '<g transform="rotate(' + ang.toFixed(2) + " " + (x + w / 2) + " " + (y + h / 2) + ')"><rect x="' + x + '" y="' + (y + h * 0.35) + '" width="' + w + '" height="' + h * 0.35 + '" rx="' + h * 0.17 + '" fill="' + d.fill + '"/><rect x="' + x + '" y="' + y + '" width="' + w * 0.22 + '" height="' + h + '" rx="' + h * 0.2 + '" fill="' + d.fill + '"/><rect x="' + (x + w * 0.78) + '" y="' + y + '" width="' + w * 0.22 + '" height="' + h + '" rx="' + h * 0.2 + '" fill="' + d.fill + '"/></g>';
    }
    if (kind === "sign") {
      var lines = (d.lines || []).slice(), n = lines.length, over = textAt(inst, t, null);
      if (over !== null && n) lines[n - 1] = over;
      o += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="' + d.fill + '" stroke="' + (d.edge || "#00000055") + '" stroke-width="2"/>';
      lines.forEach(function (ln, k) { var big = d.big && k === n - 1; o += T(ln, x + w / 2, y + (k + 1) * h / (n + 0.6) + (big ? h * 0.05 : 0), (big ? h * 0.42 : Math.min(h * 0.22, w * 0.9 / Math.max(6, ln.length) * 1.5)), d.ink || "#fff"); });
      return o;
    }
    if (kind === "whiteboard") {
      var g = d.diagram || { boxes: [], arrows: [] };
      o += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="' + d.fill + '" stroke="#8a8f99" stroke-width="3"/>';
      (g.arrows || []).forEach(function (ar) { var A = g.boxes[ar[0]], B = g.boxes[ar[1]]; o += '<line x1="' + (x + (A.x + A.w / 2) * w) + '" y1="' + (y + (A.y + A.h / 2) * h) + '" x2="' + (x + (B.x + B.w / 2) * w) + '" y2="' + (y + (B.y + B.h / 2) * h) + '" stroke="' + (ar[2] ? "#c0392b" : "#34495e") + '" stroke-width="2.5" stroke-dasharray="' + (ar[2] ? "6 4" : "0") + '"/>'; });
      g.boxes.forEach(function (bx) { o += '<rect x="' + (x + bx.x * w) + '" y="' + (y + bx.y * h) + '" width="' + bx.w * w + '" height="' + bx.h * h + '" rx="3" fill="' + (bx.tone === "bad" ? "#f6c9c4" : "#dfe9f2") + '" stroke="#34495e" stroke-width="2"/>' + T(bx.label, x + (bx.x + bx.w / 2) * w, y + (bx.y + bx.h / 2) * h + h * 0.035, h * 0.1, "#1d2733"); });
      (g.notes || []).forEach(function (nt) { o += T(nt.text, x + nt.x * w, y + nt.y * h, h * 0.085, nt.color || "#c0392b", "middle", 700); });
      return o;
    }
    return null;
  }
  function drawProp(p, t) {
    var inst = p.inst || p.id, vis = track(inst, "visible");
    if (vis && keyAt(vis.keys, t).value === false) return "";
    var d = Object.assign({}, (S.props || {})[p.id] || {}, p), at = d.at || [0, 0], k = d.scale || 1, w = (d.w || 60) * k, h = (d.h || 60) * k, o;
    if (d.svg) return '<g transform="translate(' + at[0] + " " + at[1] + ') scale(' + k + ')">' + d.svg + "</g>";
    var x0 = at[0], y0 = at[1], special = drawKind(d, x0, y0, w, h, t, inst);
    if (special !== null) return special + label(d.id, x0 + w / 2, y0 + h + 14, 11, "#ffffffaa");
    o = d.shape === "circle" ? '<circle cx="' + (x0 + w / 2) + '" cy="' + (y0 + h / 2) + '" r="' + w / 2 + '" fill="' + d.fill + '"/>'
      : d.shape === "oval" ? '<ellipse cx="' + (x0 + w / 2) + '" cy="' + (y0 + h / 2) + '" rx="' + w / 2 + '" ry="' + h / 2 + '" fill="' + d.fill + '"/>'
      : '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" rx="' + Math.min(8, h / 4) + '" fill="' + d.fill + '"/>';
    if (d.screen) { var sc = screenAt(inst, t); if (sc) o += drawScreen(x0 + w * 0.05, y0 + h * 0.08, w * 0.9, h * 0.84, sc); }
    return o + label(d.id, x0 + w / 2, y0 + h + 14, 11, "#ffffffaa");
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
      var off = a.offset || [0, 0], k = a.scale || 1, body = '<g transform="translate(' + off[0] + " " + off[1] + ")" + (k !== 1 ? " scale(" + k + ")" : "") + '">' + drawActor(a, t) + "</g>";
      // a drawn set's slot clips the rig below a line: the legs it cannot hide behind furniture (no seated pose)
      if (a.filter) body = '<g filter="url(#' + a.filter + ')">' + body + "</g>";
      out += a.clip_y_max != null ? '<clipPath id="clip_' + a.id + '"><rect x="-9000" y="-9000" width="19000" height="' + (9000 + a.clip_y_max) + '"/></clipPath><g clip-path="url(#clip_' + a.id + ')">' + body + "</g>" : body;
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
      if (tr.card_svg) { o += '<g opacity="' + a.toFixed(3) + '"><svg x="' + vb[0] + '" y="' + vb[1] + '" width="' + vb[2] + '" height="' + vb[3] + '" viewBox="0 0 1280 720">' + tr.card_svg + "</svg></g>"; return; }
      o += '<g opacity="' + a.toFixed(3) + '"><rect x="' + (vb[0] - 5) + '" y="' + (vb[1] - 5) + '" width="' + (vb[2] + 10) + '" height="' + (vb[3] + 10) + '" fill="' + (tr.color || "#0b0b10") + '"/>' + (tr.svg || label(tr.text, vb[0] + vb[2] / 2, vb[1] + vb[3] * 0.54, vb[3] * 0.14, "#f3e9d2", 1)) + "</g>";
    });
    return o;
  }

  // The AI is never a body: its smiley / chat window (neyroset asset) is drawn into a screen, lip-synced from the `neyroset` actor's envelope.
  function neyScreen(d, x, y, w, h, sc) {
    var N = window.NEY; if (!N) return label("neyroset?", x + w / 2, y + h / 2, h * 0.1, "#f66", 1);
    var ex = track("neyroset", "expr"), e = (ex && keyAt(ex.keys, sc.t).value) || d.expr || "cheerful", chat = d.mode === "chat_window";
    var st = chat ? { mode: "chat_window", chat_lines: d.lines || [], typing: !!d.typing, expr: e } : { mode: "monitor_smiley", frame: false, phrase: d.phrase || "", expr: e, mouth: mouthAt("neyroset", sc.t) };
    var bw = chat ? 520 : 460, bh = chat ? 440 : 264, k = Math.min(w / bw, h / bh), ox = chat ? 0 : 30, oy = chat ? 0 : 24;
    return N.defs() + '<g transform="translate(' + (x + (w - bw * k) / 2 - ox * k) + " " + (y + (h - bh * k) / 2 - oy * k) + ") scale(" + k + ')">' + N.draw(st, sc.t) + "</g>";
  }
  // Per-shot looks: «Гори» hatch (hot red, crosshatch, vignette) over the whole shot; «Спичечная этикетка» card (cream, 3-colour misregistered print).
  function hatch(inner, vb) {
    var f = 'x="' + vb[0] + '" y="' + vb[1] + '" width="' + vb[2] + '" height="' + vb[3] + '"', cx = vb[0] + vb[2] / 2, cy = vb[1] + vb[3] / 2;
    return '<defs><filter id="hatchF" filterUnits="userSpaceOnUse" ' + f + '><feColorMatrix type="saturate" values="0.2"/><feComponentTransfer><feFuncR type="discrete" tableValues="0.1 0.45 0.8 1"/><feFuncG type="discrete" tableValues="0 0.12 0.3 0.55"/><feFuncB type="discrete" tableValues="0 0.05 0.1 0.2"/></feComponentTransfer></filter>'
      + '<pattern id="hatchP" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><line x1="0" y1="0" x2="0" y2="9" stroke="#2a0606" stroke-width="2.4"/></pattern>'
      + '<radialGradient id="hatchV" cx="50%" cy="50%" r="75%"><stop offset="55%" stop-color="#8a0000" stop-opacity="0"/><stop offset="100%" stop-color="#8a0000" stop-opacity="0.7"/></radialGradient></defs>'
      + '<g filter="url(#hatchF)">' + inner + '</g><rect ' + f + ' fill="url(#hatchP)" opacity="0.5"/><rect ' + f + ' fill="url(#hatchV)"/>';
  }
  function cardFrame(sh, vb) {
    var c = sh.card || {}, x = vb[0], y = vb[1], w = vb[2], h = vb[3], cx = x + w / 2, o = '<rect x="' + (x - 5) + '" y="' + (y - 5) + '" width="' + (w + 10) + '" height="' + (h + 10) + '" fill="#f1e4c0"/>';
    o += '<rect x="' + (x + w * 0.04) + '" y="' + (y + h * 0.06) + '" width="' + w * 0.92 + '" height="' + h * 0.88 + '" fill="none" stroke="#c0392b" stroke-width="' + w * 0.012 + '"/><rect x="' + (x + w * 0.06) + '" y="' + (y + h * 0.1) + '" width="' + w * 0.88 + '" height="' + h * 0.8 + '" fill="none" stroke="#1f3a6e" stroke-width="' + w * 0.004 + '" transform="translate(' + w * 0.004 + " " + h * 0.006 + ')"/>';
    [["#c0392b", 5, 4], ["#1f3a6e", -4, -3], ["#1a1a1a", 0, 0]].forEach(function (L) { o += T(c.title || "", cx + L[1], y + h * 0.5 + L[2], h * 0.15, L[0], "middle", 900); });
    [["#c0392b", 3, 2], ["#1f3a6e", -2, -1]].forEach(function (L) { o += T(c.note || "", cx + L[1], y + h * 0.7 + L[2], h * 0.07, L[0], "middle", 700); });
    return o;
  }

  // Shot overlays: screen-space layers over the set, placed by `rect` (fractions of the current view), timed t0..t1 in scene seconds.
  var BARS = [0.3, 0.55, 0.4, 0.8, 0.5, 0.65, 0.35, 0.9, 0.45, 0.7, 0.3, 0.6, 0.85, 0.4, 0.55, 0.75, 0.35, 0.5, 0.65, 0.4];
  function voiceCard(ov, x, y, w, h, t) {
    var p = Math.max(0, Math.min(1, (t - ov.t0) / Math.max(0.1, ov.t1 - ov.t0))), o = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + h * 0.22 + '" fill="#fbf0dc" stroke="#1f3a6e" stroke-width="' + h * 0.03 + '"/>';
    o += '<circle cx="' + (x + h * 0.4) + '" cy="' + (y + h * 0.5) + '" r="' + h * 0.24 + '" fill="#1f3a6e"/><path d="M' + (x + h * 0.33) + " " + (y + h * 0.38) + " L" + (x + h * 0.33) + " " + (y + h * 0.62) + " L" + (x + h * 0.52) + " " + (y + h * 0.5) + ' Z" fill="#fbf0dc"/>';
    var bx = x + h * 0.85, bw = (w - h * 1.05) / BARS.length;
    BARS.forEach(function (b, i) { var bh = h * 0.5 * b; o += '<rect x="' + (bx + i * bw) + '" y="' + (y + h * 0.56 - bh / 2) + '" width="' + bw * 0.62 + '" height="' + bh + '" rx="' + bw * 0.3 + '" fill="' + (i / BARS.length <= p ? "#1f3a6e" : "#9aa6bd") + '"/>'; });
    return o + T(ov.name || "", bx, y + h * 0.2, h * 0.17, "#1f3a6e", "start", 700);
  }
  function waveCard(ov, x, y, w, h, t) {
    var o = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + Math.min(w, h) * 0.12 + '" fill="#fbf0dc" stroke="#1f3a6e" stroke-width="' + Math.min(w, h) * 0.02 + '"/>', n = 22, bx = x + w * 0.34, bw = w * 0.6 / n;
    for (var i = 0; i < n; i++) { var e = mouthAt("neyroset", t - i * 0.03), a = 0.1 + Math.min(1, e * 1.6) * (0.55 + 0.45 * Math.abs(Math.sin(i * 1.9 + t * 11))), bh = h * 0.7 * a; o += '<rect x="' + (bx + i * bw) + '" y="' + (y + h / 2 - bh / 2) + '" width="' + bw * 0.62 + '" height="' + bh + '" rx="' + bw * 0.3 + '" fill="#1f3a6e"/>'; }
    return o + neyScreen({ mode: "monitor_smiley", phrase: "" }, x + w * 0.02, y + h * 0.1, w * 0.3, h * 0.8, { t: t });
  }
  function wrapText(txt, maxc) { var ws = txt.split(" "), ls = [], cur = ""; ws.forEach(function (w) { if ((cur + " " + w).trim().length > maxc && cur) { ls.push(cur); cur = w; } else cur = (cur + " " + w).trim(); }); if (cur) ls.push(cur); return ls; }
  // The CRT of the server: rules typed in time with the voice; the current rule loud, the earlier ones small and tone-on-tone above it.
  function crtRules(ov, x, y, w, h, t) {
    var st = ov.states.filter(function (k) { return k.t0 <= t; }).pop(), o = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="3" fill="#0d1a2c"/>';
    if (!st) return o;
    var fs = h * 0.085, maxc = Math.floor(w * 0.9 / (fs * 0.56)), shown = Math.floor((t - st.t0) * (st.cps || 14)), ty = y + h - fs * 0.6, cur = st.lines[st.lines.length - 1];
    var ls = wrapText(cur.slice(0, Math.max(0, shown)), maxc);
    for (var i = ls.length - 1; i >= 0; i--) { o += T(ls[i], x + w * 0.05, ty - (ls.length - 1 - i) * fs * 1.25, fs, "#ffe9a8", "start", 700); }
    var yy = ty - ls.length * fs * 1.25 - fs * 0.4;
    for (var j = st.lines.length - 2; j >= 0; j--) { var pl = wrapText(st.lines[j], Math.floor(w * 0.9 / (fs * 0.7 * 0.56))); for (var k = pl.length - 1; k >= 0; k--) { o += T(pl[k], x + w * 0.05, yy, fs * 0.7, "#3c4f6d", "start", 600); yy -= fs * 0.95; } yy -= fs * 0.2; }
    if (Math.floor(t * 2) % 2 === 0 && shown < cur.length) o += '<rect x="' + (x + w * 0.05 + (ls[ls.length - 1] || "").length * fs * 0.56) + '" y="' + (ty - fs * 0.85) + '" width="' + fs * 0.4 + '" height="' + fs + '" fill="#ffe9a8"/>';
    return o;
  }
  function tape(ov, x, y, w, h, t) {
    var px = 0, pe = ov.peel; if (pe && t > ov.t1 - pe) px = ease((t - (ov.t1 - pe)) / pe) * w * 1.1;
    var o = '<g transform="translate(' + px + ' 0)"><path d="M' + x + " " + y + " L" + (x + w) + " " + y + " L" + (x + w) + " " + (y + h * 0.9) + ' ';
    for (var i = 24; i >= 0; i--) o += "L" + (x + w * i / 24) + " " + (y + h * (i % 2 ? 1 : 0.84)) + " ";
    return o + 'Z" fill="#f1e4c0" stroke="#d9c79c" stroke-width="' + h * 0.02 + '"/>' + T(ov.text || "", x + w / 2, y + h * 0.62, h * 0.5, "#cdb98c", "middle", 700) + "</g>";
  }
  function bubble(ov, x, y, w, h, t) {
    var fs = h * 0.17, ls = wrapText(ov.text, Math.floor(w * 0.9 / (fs * 0.55))), o = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + h * 0.14 + '" fill="#fbf0dc" stroke="#1f3a6e" stroke-width="' + h * 0.025 + '"/><path d="M' + (x + w) + " " + (y + h * 0.5) + " l" + h * 0.2 + " " + h * 0.12 + " l-" + h * 0.2 + ' ' + h * 0.1 + ' Z" fill="#fbf0dc" stroke="#1f3a6e" stroke-width="' + h * 0.025 + '"/>';
    o += T(ov.name || "", x + w * 0.05, y + h * 0.2, fs * 0.8, "#c0392b", "start", 700);
    ls.forEach(function (l, i) { o += T(l, x + w * 0.05, y + h * 0.2 + fs * 1.3 * (i + 1), fs, "#1f3a6e", "start", 700); });
    return o;
  }
  function glow(ov, x, y, w, h) { return '<radialGradient id="gl' + ov.t0 + '"><stop offset="0" stop-color="' + ov.color + '" stop-opacity="0.95"/><stop offset="1" stop-color="' + ov.color + '" stop-opacity="0"/></radialGradient><ellipse cx="' + (x + w / 2) + '" cy="' + (y + h / 2) + '" rx="' + w + '" ry="' + h * 1.3 + '" fill="url(#gl' + ov.t0 + ')"/>'; }
  var OVER = { voice_card: voiceCard, waveform: waveCard, crt: crtRules, tape: tape, bubble: bubble, glow: glow };
  function overlays(sh, t, vb) {
    var o = "";
    (sh.overlays || []).forEach(function (ov) {
      if (t < ov.t0 || t >= ov.t1) return;
      var r = ov.rect.slice(), g = ov.grow, f = OVER[ov.kind];
      if (g) { var u = ease(Math.max(0, Math.min(1, (t - g.t0) / g.dur))); if (g.reverse) u = 1 - u; r = r.map(function (v, i) { return v + ([0.02, 0.02, 0.96, 0.96][i] - v) * u; }); }
      var set = ov.space === "set", x = set ? r[0] : vb[0] + r[0] * vb[2], y = set ? r[1] : vb[1] + r[1] * vb[3], w = set ? r[2] : r[2] * vb[2], h = set ? r[3] : r[3] * vb[3];
      if (f) o += '<g opacity="' + (ov.fade === false ? 1 : Math.min(1, (t - ov.t0) / 0.2)).toFixed(2) + '">' + f(ov, x, y, w, h, t) + "</g>";
    });
    return o;
  }

  function frame(t) {
    var sh = shotAt(t), vb = viewBox(t), set = sh.set || S.set;
    if (sh.look === "label") return cardFrame(sh, vb) + transitions(t, vb);
    var out = drawSet(set, vb);
    var def = (S.sets || {})[set], props = ((def && def.props) || []).concat(sh.props || []);
    out += props.filter(function (p) { return !p.front; }).map(function (p) { return drawProp(p, t); }).join("");
    out += drawCast(actorsOf(sh, sh.cast), t);
    out += (def && def.front) || "";   // a drawn set: its layers in front of the cast (island, table, foreground)
    out += props.filter(function (p) { return p.front; }).map(function (p) { return drawProp(p, t); }).join(""); // in front of the cast: a person behind a desk
    if (sh.look === "hatch") out = hatch(out, vb);
    if (sh.look === "memory") out = '<defs><filter id="memF" filterUnits="userSpaceOnUse" x="' + vb[0] + '" y="' + vb[1] + '" width="' + vb[2] + '" height="' + vb[3] + '"><feColorMatrix type="saturate" values="0.65"/></filter></defs><g filter="url(#memF)">' + out + "</g>";
    return out + overlays(sh, t, vb) + drawInset(sh, t, vb) + captions(t, vb) + transitions(t, vb);
  }
  window.SpikeCore = { frame: frame, viewBox: viewBox, bg: function () { return ""; } };
})();
