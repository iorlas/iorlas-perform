// Times `hyperframes check`: first "Check passed|failed" line vs process exit (killed at 120 s).
import { spawn } from "node:child_process";
const t0 = Date.now(); let seen = null;
const ch = spawn(process.argv[2], process.argv.slice(3), { env: { ...process.env, HYPERFRAMES_NO_TELEMETRY: "1", DO_NOT_TRACK: "1", HYPERFRAMES_NO_UPDATE_CHECK: "1" } });
const on = (d) => { if (!seen && /Check (passed|failed)/.test(String(d))) seen = (Date.now() - t0) / 1000; };
ch.stdout.on("data", on); ch.stderr.on("data", on);
const kill = setTimeout(() => { console.log("KILLED at 120s (still running)"); ch.kill("SIGKILL"); }, 120000);
ch.on("close", (c) => { clearTimeout(kill); console.log(JSON.stringify({ exit: c, resultLineAtS: seen, exitAtS: (Date.now() - t0) / 1000 })); });
