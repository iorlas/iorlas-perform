// Concat per-scene mp4s. Copy-concat only works when every file has identical codec params (same engine, same settings); checked first.
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const probe = (f) => {
  const j = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_name,codec_type,width,height,r_frame_rate,pix_fmt,sample_rate,channels", "-of", "json", f]).toString());
  return JSON.stringify(j.streams.map((s) => [s.codec_type, s.codec_name, s.width, s.height, s.r_frame_rate, s.pix_fmt, s.sample_rate, s.channels]));
};
const duration = (f) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString();

export function concat(files, out, { xfade = 0 } = {}) {
  files = files.map((f) => resolve(f)); out = resolve(out);
  const sigs = new Set(files.map(probe));
  if (sigs.size > 1) throw new Error("cannot concat: scene files differ in codec params:\n" + [...sigs].join("\n"));
  if (!xfade) {
    const list = join(mkdtempSync(join(tmpdir(), "concat-")), "list.txt");
    writeFileSync(list, files.map((f) => `file '${f}'\n`).join(""));
    execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", out]);
    return;
  }
  // crossfade chain (re-encodes)
  const inputs = files.flatMap((f) => ["-i", f]);
  let v = "[0:v]", a = "[0:a]", off = 0, fg = [];
  for (let i = 1; i < files.length; i++) {
    off += duration(files[i - 1]) - xfade - (i > 1 ? 0 : 0);
    fg.push(`${v}[${i}:v]xfade=transition=fade:duration=${xfade}:offset=${off.toFixed(3)}[v${i}]`, `${a}[${i}:a]acrossfade=d=${xfade}[a${i}]`);
    v = `[v${i}]`; a = `[a${i}]`;
  }
  execFileSync("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", fg.join(";"), "-map", v, "-map", a, "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", "-c:a", "aac", out]);
}
