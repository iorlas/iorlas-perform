// Browser-side renderer adapter: shots.json (engine-neutral) -> rig.draw() states at time t. Pure function of t.
(function () {
  var S = window.__SHOTS, MOUTH = window.__MOUTH.samples, HF = window.HF;
  var R = { mihalych: HF.RIG.mihalych, zinaida: HF.RIG.zinaida };
  var clone = function (x) { return JSON.parse(JSON.stringify(x)); };
  function keyAt(keys, t) { var k = keys[0]; for (var i = 0; i < keys.length; i++) if (keys[i].t <= t) k = keys[i]; return k; }
  function prevKey(keys, k) { var i = keys.indexOf(k); return i > 0 ? keys[i - 1] : k; }
  function lerpExpr(a, b, u) { var o = {}; for (var k in b) { o[k] = typeof b[k] === "number" && typeof a[k] === "number" ? a[k] + (b[k] - a[k]) * u : b[k]; } return o; }
  function track(actor, channel) { return S.tracks.filter(function (x) { return x.actor === actor && x.channel === channel; })[0]; }
  function sample(arr, t) { var f = Math.min(arr.length - 1, Math.max(0, Math.round(t * S.mouth_open.fps))); return arr[f]; }

  function frame(t) {
    var out = "";
    S.actors.slice().sort(function (a, b) { return a.layer - b.layer; }).forEach(function (a) {
      var rig = R[a.id], o0 = out; out = "";
      if (a.id === "zinaida") {
        var k = keyAt(track("zinaida", "state").keys, t);
        out += rig.draw({ uid: "z", pose: a.pose, state: k.value, screen_text: k.screen_text, t: t });
      } else {
        var tr = track("mihalych", "expr"), k2 = keyAt(tr.keys, t), p = prevKey(tr.keys, k2);
        var u = k2 === p ? 1 : Math.min(1, (t - k2.t) / tr.blend);
        var pose = clone(rig.poses[a.pose]); for (var kk in (a.pose_override || {})) pose[kk] = a.pose_override[kk];
        out += rig.draw({ ch: "mihalych", uid: "m", pose: pose, expr: lerpExpr(rig.expr[p.value], rig.expr[k2.value], u),
          mouth: Math.min(0.9, sample(window.__MOUTH.samples, t)), gaze: { x: 0, y: 0 }, t: t });
      }
      var off = a.offset || [0, 0];
      out = o0 + '<g transform="translate(' + off[0] + ' ' + off[1] + ')">' + out + "</g>";
    });
    return out;
  }
  var svg = document.getElementById("stage");
  function renderAt(t) { svg.innerHTML = '<rect x="-1000" y="-1000" width="3000" height="3000" fill="' + S.background + '"/>' + frame(t); }
  window.__renderAt = renderAt;
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  // HyperFrames lint requires a registered paused GSAP timeline; it only supplies the clock/length, the rig draws from hf-seek time.
  var tl = gsap.timeline({ paused: true });
  tl.to({}, { duration: S.duration });
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
  renderAt(0);
  window.__ok = true;
})();
