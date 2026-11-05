// HyperFrames glue: hf-seek protocol + the timeline registration its lint demands.
(function () {
  var S = window.__SHOTS, C = window.SpikeCore;
  var svg = document.getElementById("stage");
  function renderAt(t) { svg.innerHTML = C.bg() + C.frame(t); }
  window.__renderAt = renderAt;
  window.addEventListener("hf-seek", function (e) { renderAt(e.detail.time); });
  var tl = gsap.timeline({ paused: true });
  tl.to({}, { duration: S.duration });
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
  renderAt(0);
  window.__ok = true;
})();
