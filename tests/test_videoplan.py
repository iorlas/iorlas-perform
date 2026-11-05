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
    """A timeline as scene.py writes it (turn numbers are scenario item numbers): two scenes, a narrator, a sfx, a bed."""

    def t(n, voice, s, e, scene, text, amb):
        return {"turn": n, "voice": voice, "text": text, "scene": scene, "ambience": amb, "start": s, "end": e}

    return [
        t(2, "narrator", 0.5, 3.0, "Офис, вечер", "[calm] Вечер.", "office"),
        t(3, "vadik", 3.2, 5.0, "Офис, вечер", "[nervous] Деплой.", "office"),
        t(6, "narrator", 8.0, 10.0, "Офис, ночь", "[low] Ночь. Красный дашборд.", "night"),
        t(7, "vadik", 10.3, 12.0, "Офис, ночь", "[whisper, pleading] Ну давай.", "night"),
        {"sfx": "keyboard", "volume": 1, "start": 11.0, "end": 11.9},
        t(9, "praporshchik", 12.2, 14.0, "Офис, ночь", "[loud, suspicious question] Вадим!", "night"),
        t(10, "vadik", 14.2, 15.5, "Офис, ночь", "[panicking] Всё под контролем!", "night"),
    ]


def tl2(**kw) -> dict:
    return videoplan.timeline_v2(v1(), audio="a.wav", duration=15.6, sr=24000, **kw)


def write_wav(path: Path, seconds: float, bursts: list[tuple[float, float]], sr: int = 16000) -> None:
    n = round(seconds * sr)
    data = [round(12000 * math.sin(2 * math.pi * 220 * i / sr)) if any(a <= i / sr < b for a, b in bursts) else 0 for i in range(n)]
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(struct.pack(f"<{n}h", *data))


def sheet_of(**kw) -> dict:
    return videoplan.emit_sheet(tl2(**kw), LAYOUT)


def test_timeline_v2_keeps_v1_entries_and_lists_scenes():
    tl = tl2()
    assert tl["schema"] == "timeline/2" and tl["entries"] == v1()
    assert [(s["title"], s["turns"]) for s in tl["scenes"]] == [("Офис, вечер", [2, 3]), ("Офис, ночь", [6, 7, 9, 10])]


def test_a_pause_splits_a_scene_and_each_part_has_its_own_sheet_entry():
    tl = tl2(breaks=[8])  # {pause} between turns 7 and 9
    assert [s["turns"] for s in tl["scenes"]] == [[2, 3], [6, 7], [9, 10]]
    assert [s["title"] for s in tl["scenes"]][1:] == ["Офис, ночь", "Офис, ночь · 2"]
    sheet = videoplan.emit_sheet(tl, LAYOUT)
    assert set(sheet["scenes"]) == {"Офис, вечер", "Офис, ночь", "Офис, ночь · 2"}
    assert [g["id"] for g in videoplan.segment(tl, sheet)] == ["s01", "s02", "s03"]


def test_segment_is_contiguous_on_whole_frames_and_covers_the_audio():
    g = videoplan.segment(tl2(), sheet_of())
    assert g[0]["t0"] == 0 and g[0]["t1"] == pytest.approx(g[1]["t0"])
    assert g[1]["t0"] == pytest.approx(8.0 - 0.3, abs=1 / 30)
    assert sum(x["frames"] for x in g) == math.ceil(15.6 * 30)


def test_every_voice_is_drawn_as_its_own_rig_and_only_where_it_speaks():
    sheet = sheet_of()
    day, night = sheet["scenes"]["Офис, вечер"], sheet["scenes"]["Офис, ночь"]
    assert [(a["id"], a["rig"]) for a in day["actors"] if a["id"] != "zinaida"] == [("vadik", "vadik@1.3.0")]
    assert sorted((a["id"], a["rig"]) for a in night["actors"] if a["id"] != "zinaida") == [("palych", "palych@1.0.2"), ("vadik", "vadik@1.3.0")]
    assert sheet["cast"] == {v: {"actor": c["id"]} for v, c in LAYOUT["cast"].items()}


def test_layout_maps_each_voice_to_a_distinct_existing_rig():
    seen = {}
    for voice, c in LAYOUT["cast"].items():
        rid, ver = c["rig"].split("@")
        assert rid == c["id"], f"{voice}: actor id must be the rig id, never another character"
        assert (ROOT / "video" / "rigs" / rid / ver / "rig.lock").exists(), f"{voice}: {c['rig']} is not a frozen rig"
        assert seen.setdefault(c["id"], voice) == voice or voice in {"mihalych", "mikhalych", "praporshchik", "palych"}  # one character, two scenario voice names, f"{c['id']} plays both {seen[c['id']]} and {voice}"


def test_a_voice_without_a_rig_is_an_error_not_a_stand_in():
    ghost = [*v1(), {"turn": 11, "voice": "starik", "text": "x", "scene": "Офис, ночь", "ambience": "night", "start": 16.0, "end": 17.0}]
    with pytest.raises(ValueError, match="starik"):
        videoplan.emit_sheet(videoplan.timeline_v2(ghost, audio="a.wav", duration=17.5, sr=24000), LAYOUT)


def test_scenes_are_staged_differently():
    day, night = (sheet_of()["scenes"][t] for t in ("Офис, вечер", "Офис, ночь"))
    assert day["background"] != night["background"]
    assert day["camera"] != night["camera"]  # one character vs three on stage


def test_screen_follows_the_timeline():
    cues = [c for c in sheet_of()["scenes"]["Офис, ночь"]["cues"] if c["actor"] == "zinaida"]
    states = [(c.get("abs", c.get("at")), c["value"]) for c in cues]
    assert states[0] == (0, "idle")  # night starts idle
    assert ("abs" in cues[1]) and (cues[1]["value"], cues[1]["screen_text"]) == ("error", "деплой упал")  # narrator: "красный дашборд"
    values = [c["value"] for c in cues]
    assert values.count("working") >= 2 and "error" in values  # pleading + keyboard sfx; panicking at the end
    assert cues[-1]["value"] == "error" and cues[-1]["abs"] == 14.2  # vadik panicking, then nothing resets it before the end


def test_author_directive_overrides_the_automatic_screen():
    sheet = videoplan.emit_sheet(tl2(cues=[{"turn": 10, "screen": "love", "text": "зелёный!"}]), LAYOUT)
    last = [c for c in sheet["scenes"]["Офис, ночь"]["cues"] if c["actor"] == "zinaida"][-1]
    assert (last["value"], last["screen_text"], last["abs"]) == ("love", "зелёный!", 14.2)


def test_speaker_tags_drive_expressions_per_rig():
    cues = [c for c in sheet_of()["scenes"]["Офис, ночь"]["cues"] if c["channel"] == "expr"]
    got = {(c["actor"], c.get("turn")): c["value"] for c in cues if "turn" in c}
    assert got == {("vadik", 7): "side_glance", ("palych", 9): "bark", ("vadik", 10): "panic"}  # each from its own rig's expression set


def test_resolve_cues_become_scene_relative_tracks_with_a_key_at_zero(tmp_path):
    sheet = sheet_of()
    audio = tmp_path / "a.wav"
    write_wav(audio, 15.7, [(10.3, 12.0)])
    g = videoplan.segment(tl2(), sheet)[1]
    shots = videoplan.resolve_scene(g, sheet, videoplan.read_wav(audio))["shots"]
    z = next(t for t in shots["tracks"] if t["actor"] == "zinaida")
    assert z["keys"][0]["t"] == 0 and all(0 <= k["t"] <= g["duration"] for k in z["keys"])
    v = next(t for t in shots["tracks"] if t["actor"] == "vadik" and t["channel"] == "expr")
    assert v["keys"][1] == {"t": pytest.approx(10.3 - g["t0"], abs=1e-3), "value": "side_glance"}
    assert shots["scene"] == "s02" and shots["background"] == LAYOUT["looks"]["night"]


def test_resolve_refuses_a_missing_scene_and_a_foreign_turn(tmp_path):
    sheet = sheet_of()
    audio = tmp_path / "a.wav"
    write_wav(audio, 15.7, [])
    wav, g = videoplan.read_wav(audio), videoplan.segment(tl2(), sheet)
    del sheet["scenes"]["Офис, ночь"]
    with pytest.raises(KeyError, match="no entry for scene"):
        videoplan.resolve_scene(g[1], sheet, wav)
    sheet["scenes"]["Офис, вечер"]["cues"].append({"turn": 10, "actor": "zinaida", "channel": "state", "value": "x"})
    with pytest.raises(KeyError, match="turn 10"):
        videoplan.resolve_scene(g[0], sheet, wav)


def test_mouth_follows_the_speaking_actor_only_and_is_deterministic(tmp_path):
    sheet = sheet_of()
    audio = tmp_path / "a.wav"
    write_wav(audio, 15.7, [(8.0, 10.0), (10.3, 12.0), (12.2, 14.0)])  # narrator, vadik and palych all loud in scene 2
    g = videoplan.segment(tl2(), sheet)[1]
    a = videoplan.resolve_scene(g, sheet, videoplan.read_wav(audio))
    assert a == videoplan.resolve_scene(g, sheet, videoplan.read_wav(audio))
    assert sorted(a["mouth"]) == ["palych", "vadik"]  # none for the prop or the narrator
    v = a["mouth"]["vadik"]["samples"]
    assert all(x == 0 for x in v[: int((10.2 - g["t0"]) * 30)]), "vadik silent while the narrator talks"
    assert max(v[int((10.4 - g["t0"]) * 30) : int((11.9 - g["t0"]) * 30)]) > 0.8
    p = a["mouth"]["palych"]["samples"]
    assert max(p[int((12.3 - g["t0"]) * 30) : int((13.9 - g["t0"]) * 30)]) > 0.8 and max(p[: int((12.0 - g["t0"]) * 30)]) == 0


def test_plan_writes_the_whole_contract_for_the_renderer(tmp_path):
    sheet = sheet_of()
    audio = tmp_path / "a.wav"
    write_wav(audio, 15.7, [(3.2, 5.0)])
    groups = videoplan.plan(tl2(), sheet, audio, tmp_path / "scenes")
    assert sorted(p.name for p in groups[0]["dir"].iterdir()) == ["mouth_vadik.json", "shots.json"]


def test_night_shift_voices_all_resolve_to_their_own_rig():
    import scenario

    voices = {t.voice for t in scenario.load(str(ROOT / "examples" / "night_shift.md")).turns}
    assert voices <= set(LAYOUT["cast"]) | set(LAYOUT["offscreen"])
    assert {LAYOUT["cast"][v]["id"] for v in voices if v in LAYOUT["cast"]} == {"vadik", "palych"}


def test_audio_only_path_has_no_video_code_outside_the_flag():
    """scene.py without --video: `video` is imported and called only inside `if args.video:`, so nothing else can change."""
    tree = ast.parse((ROOT / "scripts" / "scene.py").read_text())
    guarded = {id(n) for g in ast.walk(tree) if isinstance(g, ast.If) and ast.unparse(g.test) == "args.video" for n in ast.walk(g)}
    uses = [n for n in ast.walk(tree) if (isinstance(n, ast.Name) and n.id in {"video", "videoplan"}) or (isinstance(n, ast.Import) and any(a.name in {"video", "videoplan"} for a in n.names))]
    assert uses and all(id(n) in guarded for n in uses)
    flags = [n for n in ast.walk(tree) if isinstance(n, ast.Constant) and n.value == "--video"]
    assert len(flags) == 1
