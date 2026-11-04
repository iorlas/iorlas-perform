// Engine helpers some rigs expect to exist before they load (vadik, palych: HF.hash). Same formula as the rigs' golden/harness/hf.js.
window.HF = window.HF || {};
if (!HF.hash) HF.hash = function (n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
