"""Slow proof that --video changes nothing about the audio: the scene.py from before the video work and today's, run on the same
scenario with the same take cache, write byte-identical wav and timeline.json. Needs the TTS model (cached after one real run).

    PERFORM_SLOW=1 uv run --with pytest pytest tests/test_audio_identical.py
"""

import hashlib
import os
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
BEFORE = "b2d3077"  # last commit before scripts/scene.py learned --video
SCENARIO = ROOT / "examples" / "night_shift.md"


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


@pytest.mark.skipif(not os.environ.get("PERFORM_SLOW"), reason="renders speech with the TTS model; set PERFORM_SLOW=1")
def test_scene_py_audio_output_is_byte_identical_with_and_without_the_video_work(tmp_path):
    old = ROOT / "scripts" / "_scene_before_video.py"
    old.write_text(subprocess.run(["git", "show", f"{BEFORE}:scripts/scene.py"], cwd=ROOT, check=True, capture_output=True, text=True).stdout)
    try:
        runs = {}
        for name, script in (("before", old.name), ("after", "scene.py")):
            d = tmp_path / name
            d.mkdir()
            if name == "after":
                shutil.copytree(tmp_path / "before" / ".takes", d / ".takes")  # same takes: this compares the mix, master and timeline
            subprocess.run(["uv", "run", f"scripts/{script}", str(SCENARIO), str(d / "out.wav")], cwd=ROOT, check=True, capture_output=True)
            runs[name] = (sha(d / "out.wav"), sha(d / "out.timeline.json"))
        assert runs["before"] == runs["after"]
    finally:
        old.unlink(missing_ok=True)
