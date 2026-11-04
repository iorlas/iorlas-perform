"""Fast tests for the pure half of the video path: timeline v2, sheet emitter, segmenter, resolver, mouth.

    uv run --with pytest pytest tests
"""

import ast
import json
import math
import struct
import sys
import wave
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import videoplan  # noqa: E402

LAYOUT = json.loads((ROOT / "video" / "layout.json").read_text())


def v1() -> list[dict]:
    """A timeline as scene.py writes it: two scenes, a narrator that is off screen, a sfx and a bed entry."""
    t = lambda n, voice, s, e, scene: {"turn": n, "voice": voice, "text": "x", "scene": scene, "ambience": None, "start": s, "end": e}  # noqa: E731
    return [
        t(1, "narrator", 0.5, 3.0, "Утро"),
        t(2, "vadik", 3.2, 5.0, "Утро"),
        {"sfx": "keyboard", "volume": 1, "start": 5.2, "end": 5.9},
        t(3, "narrator", 8.0, 10.0, "Ночь"),
        t(4, "vadik", 10.3, 12.0, "Ночь"),
        {"ambience": "night", "start": 7.0, "end": 12.5},
    ]


def tl2() -> dict:
    return videoplan.timeline_v2(v1(), audio="a.wav", duration=12.51, sr=24000)


def write_wav(path: Path, seconds: float, bursts: list[tuple[float, float]], sr: int = 16000) -> None:
    n = round(seconds * sr)
    data = [round(12000 * math.sin(2 * math.pi * 220 * i / sr)) if any(a <= i / sr < b for a, b in bursts) else 0 for i in range(n)]
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(struct.pack(f"<{n}h", *data))


def test_timeline_v2_keeps_v1_entries_and_lists_scenes():
    tl = tl2()
    assert tl["schema"] == "timeline/2" and tl["entries"] == v1()
    assert [(s["title"], s["turns"]) for s in tl["scenes"]] == [("Утро", [1, 2]), ("Ночь", [3, 4])]


def test_segment_is_contiguous_on_whole_frames_and_covers_the_audio():
    sheet = videoplan.emit_sheet(tl2(), LAYOUT)
    g = videoplan.segment(tl2(), sheet)
    assert g[0]["t0"] == 0 and g[0]["t1"] == pytest.approx(g[1]["t0"])
    assert g[1]["t0"] == pytest.approx(8.0 - 0.3, abs=1 / 30)  # lead before its first turn
    assert sum(x["frames"] for x in g) == math.ceil(12.51 * 30)
    assert all(x["frames"] > 0 and isinstance(x["frames"], int) for x in g)


def test_emitted_sheet_puts_props_always_and_cast_where_they_speak():
    sheet = videoplan.emit_sheet(tl2(), LAYOUT)
    assert sheet["schema"] == "scene-sheet/1"
    for title in ("Утро", "Ночь"):
        assert [a["id"] for a in sheet["scenes"][title]["actors"]] == ["zinaida", "mihalych"]  # by layer
    assert sheet["cast"] == {"vadik": {"actor": "mihalych"}}  # narrator has no rig: off screen
    only_narrator = videoplan.timeline_v2([x for x in v1() if x.get("voice") != "vadik"], audio="a.wav", duration=12.0, sr=24000)
    assert [a["id"] for a in videoplan.emit_sheet(only_narrator, LAYOUT)["scenes"]["Утро"]["actors"]] == ["zinaida"]


def test_emitter_output_has_no_manual_offset_left():
    """The pairing (Zinaida q + offset beside Mihalych sit_side) comes from layout.json, the same in every scene."""
    sheet = videoplan.emit_sheet(tl2(), LAYOUT)
    zs = [next(a for a in s["actors"] if a["id"] == "zinaida") for s in sheet["scenes"].values()]
    assert zs[0] == zs[1] and zs[0]["pose"] == "q" and zs[0]["offset"] == [110, 0]


def test_resolve_cues_become_scene_relative_tracks_with_a_key_at_zero(tmp_path):
    sheet = videoplan.emit_sheet(tl2(), LAYOUT)
    sheet["scenes"]["Ночь"]["cues"].append({"turn": 4, "offset": 0.4, "actor": "zinaida", "channel": "state", "value": "love"})
    audio = tmp_path / "a.wav"
    write_wav(audio, 12.6, [(3.2, 5.0), (10.3, 12.0)])
    g = videoplan.segment(tl2(), sheet)[1]
    shots = videoplan.resolve_scene(g, sheet, videoplan.read_wav(audio))["shots"]
    z = next(t for t in shots["tracks"] if t["actor"] == "zinaida")
    assert z["keys"][0]["t"] == 0
    assert z["keys"][-1] == {"t": pytest.approx(10.3 - g["t0"] + 0.4, abs=1e-3), "value": "love"}
    assert shots["duration"] == pytest.approx(g["duration"]) and shots["scene"] == "s02"


def test_resolve_refuses_a_missing_scene_and_a_foreign_turn(tmp_path):
    sheet = videoplan.emit_sheet(tl2(), LAYOUT)
    audio = tmp_path / "a.wav"
    write_wav(audio, 12.6, [])
    wav, g = videoplan.read_wav(audio), videoplan.segment(tl2(), sheet)
    del sheet["scenes"]["Ночь"]
    with pytest.raises(KeyError, match="no entry for scene"):
        videoplan.resolve_scene(g[1], sheet, wav)
    sheet["scenes"]["Утро"]["cues"].append({"turn": 4, "actor": "zinaida", "channel": "state", "value": "x"})
    with pytest.raises(KeyError, match="turn 4"):
        videoplan.resolve_scene(g[0], sheet, wav)


def test_mouth_follows_the_speaking_actor_only_and_is_deterministic(tmp_path):
    sheet = videoplan.emit_sheet(tl2(), LAYOUT)
    audio = tmp_path / "a.wav"
    write_wav(audio, 12.6, [(0.5, 3.0), (3.2, 5.0)])  # narrator and vadik both loud in scene 1
    g = videoplan.segment(tl2(), sheet)[0]
    a = videoplan.resolve_scene(g, sheet, videoplan.read_wav(audio))
    b = videoplan.resolve_scene(g, sheet, videoplan.read_wav(audio))
    assert a == b and list(a["mouth"]) == ["mihalych"]  # no mouth for the prop
    m = a["mouth"]["mihalych"]["samples"]
    assert all(v == 0 for v in m[: int(3.1 * 30)]), "silent while the narrator talks"
    assert max(m[int(3.3 * 30) : int(4.9 * 30)]) > 0.8


def test_plan_writes_the_whole_contract_for_the_renderer(tmp_path):
    sheet = videoplan.emit_sheet(tl2(), LAYOUT)
    audio = tmp_path / "a.wav"
    write_wav(audio, 12.6, [(3.2, 5.0)])
    groups = videoplan.plan(tl2(), sheet, audio, tmp_path / "scenes")
    assert sorted(p.name for p in groups[0]["dir"].iterdir()) == ["mouth_mihalych.json", "shots.json"]


def test_audio_only_path_has_no_video_code_outside_the_flag():
    """scene.py without --video: `video` is imported and called only inside `if args.video:`, so nothing else can change."""
    tree = ast.parse((ROOT / "scripts" / "scene.py").read_text())
    guarded = {id(n) for g in ast.walk(tree) if isinstance(g, ast.If) and ast.unparse(g.test) == "args.video" for n in ast.walk(g)}
    uses = [n for n in ast.walk(tree) if (isinstance(n, ast.Name) and n.id in {"video", "videoplan"}) or (isinstance(n, ast.Import) and any(a.name in {"video", "videoplan"} for a in n.names))]
    assert uses and all(id(n) in guarded for n in uses)
    flags = [n for n in ast.walk(tree) if isinstance(n, ast.Constant) and n.value == "--video"]
    assert len(flags) == 1
