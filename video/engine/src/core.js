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

  function frame(t) {
    var out = "";
    S.actors.slice().sort(function (a, b) { return a.layer - b.layer; }).forEach(function (a) {
      var off = a.offset || [0, 0];
      out += '<g transform="translate(' + off[0] + " " + off[1] + ')">' + drawActor(a, t) + "</g>";
    });
    return out + captions(t, S.camera.viewBox);
  }
  window.SpikeCore = { frame: frame, bg: function () { return '<rect x="-1000" y="-1000" width="3000" height="3000" fill="' + S.background + '"/>'; } };
})();
