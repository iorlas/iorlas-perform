"""Slow end-to-end tests of the render half: Python plan -> `node render.mjs` per scene -> concat + mux. Start Chrome via Remotion.

    PERFORM_SLOW=1 uv run --with pytest pytest tests/test_video_render.py     (PERFORM_CHROME=/path/to/chrome-headless-shell to skip its download)
"""

import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import video  # noqa: E402
import videoplan  # noqa: E402

DEMO = ROOT / "video" / "engine" / "demo"
pytestmark = pytest.mark.skipif(not (os.environ.get("PERFORM_SLOW") and (DEMO / "demo.wav").exists()), reason="slow: PERFORM_SLOW=1 and demo/make_audio.sh")


def framemd5(f: Path) -> list[str]:
    out = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-map", "0:v", "-f", "framemd5", "-"], check=True, capture_output=True, text=True).stdout
    return [ln.split(",")[5] for ln in out.splitlines() if ln and not ln.startswith("#")]


def run(tmp: Path, out: Path, sheet: Path | None = None) -> tuple[Path, list[dict]]:
    v1 = json.loads((DEMO / "demo.turns.json").read_text())
    wav = DEMO / "demo.wav"
    sr, samples = videoplan.read_wav(wav)
    mp4 = video.make(wav, v1, sr=sr, duration=len(samples) / sr, out=out, sheet_path=sheet or tmp / "demo.sheet.json", chrome=os.environ.get("PERFORM_CHROME"))
    return mp4, json.loads((out / "manifest.json").read_text())["scenes"]


def test_cache_hits_identical_frames_and_one_changed_cue_rerenders_one_scene(tmp_path):
    mp4, scenes = run(tmp_path, tmp_path / "a")
    assert [s["hit"] for s in scenes] == [False, False]
    dur = float(video.probe(mp4)["format"]["duration"])
    assert dur == pytest.approx(len(videoplan.read_wav(DEMO / "demo.wav")[1]) / videoplan.read_wav(DEMO / "demo.wav")[0], abs=0.05)
    assert any(s["codec_type"] == "audio" for s in video.probe(mp4)["streams"])
    again, scenes = run(tmp_path, tmp_path / "a")
    assert [s["hit"] for s in scenes] == [True, True] and framemd5(again) == framemd5(mp4)
    cold, _ = run(tmp_path, tmp_path / "b")  # cold cache, other dir: the same frames
    assert framemd5(cold) == framemd5(mp4)
    sheet = json.loads((tmp_path / "demo.sheet.json").read_text())
    sheet["scenes"]["Ночь"]["cues"].append({"turn": 4, "actor": "vadik", "channel": "expr", "value": "panic"})
    (tmp_path / "edited.sheet.json").write_text(json.dumps(sheet))
    _, scenes = run(tmp_path, tmp_path / "a", tmp_path / "edited.sheet.json")
    assert [s["hit"] for s in scenes] == [True, False]
