"""Pre-production ladder: estimator, subtitles, capability, gates, retime, CLI exit codes, the draft profile, stills (needs Chrome).

    uv run --with pytest pytest tests/test_preproduction.py
"""

import copy
import json
import shutil
import struct
import subprocess
import sys
import wave
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import scenario  # noqa: E402
import video  # noqa: E402
import videocapability  # noqa: E402
import videoestimate  # noqa: E402
import videogates  # noqa: E402
import videopreprod  # noqa: E402
import videoretime  # noqa: E402
import videostills  # noqa: E402
import videosubs  # noqa: E402

EX = ROOT / "examples"
ENGINE_TEST = EX / "engine_test.md"  # placeholder sets: no art, so everything here runs in a second
PRAVILA = EX / "pravila.md"
LAYOUT = json.loads((ROOT / "video" / "layout.json").read_text())
V1 = json.loads((ROOT / "tests" / "data" / "pravila.v1.json").read_text())


def has_chrome() -> bool:
    try:
        videostills.chrome_path()
    except RuntimeError:
        return False
    return shutil.which("ffmpeg") is not None


def plan(tmp: Path, src: Path = ENGINE_TEST, fmt: str | None = None, **kw) -> dict:
    return videopreprod.prepare(src, tmp, fmt=videopreprod.load_format(fmt), **kw)


# ---- estimate ----

def test_estimate_is_close_to_the_real_render() -> None:
    """The lines that exist in both the script and the render: summed estimate against the summed real seconds."""
    sc = scenario.load(PRAVILA)
    known = videoestimate.from_render(V1, sc)
    turns = {n: it for n, it in enumerate(sc.items, 1) if isinstance(it, scenario.Turn) and n in known}
    assert len(turns) >= 20
    est = sum(videoestimate.turn_seconds(t) for t in turns.values())
    real = sum(known[n] for n in turns)
    assert abs(est - real) / real < 0.04, (est, real)
    flat = videoestimate.estimate(sc)
    assert all(a["start"] >= b["end"] - 1e-6 or a.get("sfx") or b.get("sfx") for b, a in zip(flat, flat[1:], strict=False))


def test_known_durations_replace_estimates_by_voice_and_text() -> None:
    sc = scenario.load(PRAVILA)
    known = videoestimate.from_render(V1, sc)
    assert known and len(known) <= len(sc.items)
    est = videoestimate.estimate(sc, known=known)
    n = next(iter(known))
    e = next(x for x in est if x.get("turn") == n or (x.get("sfx") and False))
    assert abs((e["end"] - e["start"]) - known[n]) < 1e-3 and e["estimated"] is False


def test_whisper_tag_slows_the_estimate(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(videoestimate, "TAG_SPEED", {"whispering": 0.85})
    sc = scenario.parse("vadik: [panic] Один два три четыре пять шесть семь.\nvadik: [whispering] Один два три четыре пять шесть семь.\n")
    a, b = sc.turns
    assert videoestimate.turn_seconds(b) > videoestimate.turn_seconds(a)


# ---- subtitles ----

def test_chunks_fit_and_never_end_on_a_preposition() -> None:
    text = "[x] Я прошу вас, пожалуйста, не менять правила в проекте на следующей неделе, и не говорить об этом никому."
    for max_chars in (18, 30, 42):
        lines = videosubs.chunks(text, max_chars)
        assert [w for ln in lines for w in ln] == scenario.spoken(text).split()
        for ln in lines[:-1]:
            assert not videosubs.SHORT.match(ln[-1].strip(".,!?")), ln
            assert len(" ".join(ln)) <= max_chars + 12  # a glued preposition may overshoot by a word


def test_captions_stay_inside_their_turn() -> None:
    e = {"turn": 2, "voice": "vadik", "text": "[x] Один два три четыре пять шесть семь восемь девять десять.", "start": 5.0, "end": 9.0}
    caps = videosubs.captions([e], [e], 4.0, 24)
    assert caps[0]["t0"] == pytest.approx(1.0) and caps[-1]["t1"] <= 5.0 + 0.5
    assert all(a["t1"] <= b["t0"] + 1e-6 for a, b in zip(caps, caps[1:], strict=False))


# ---- prepare, capability, gates ----

def test_prepare_resolves_every_scene_without_audio(tmp_path: Path) -> None:
    p = plan(tmp_path)
    assert p["fatal"] is None and len(p["groups"]) == 3
    assert all((g["dir"] / "shots.json").exists() for g in p["groups"])
    assert not list(tmp_path.glob("**/mouth_*.json")) or all(json.loads(f.read_text())["samples"].count(0) == len(json.loads(f.read_text())["samples"]) for f in tmp_path.glob("**/mouth_*.json"))


def test_capability_lists_placeholders_and_a_missing_pose() -> None:
    sc = scenario.load(ENGINE_TEST)
    design = json.loads((EX / "engine_test.design.json").read_text())
    rows = videocapability.check(sc, design, LAYOUT)
    assert any(r["kind"] == "set" and r["status"] == "placeholder" for r in rows)
    bad = copy.deepcopy(design)
    scene = next(iter(bad["scenes"].values()))
    scene.setdefault("cues", []).append({"beat": 1, "actor": "vadik", "pose": "sit_on_a_rail"})
    gaps = [r for r in videocapability.check(sc, bad, LAYOUT) if r["status"] == "gap"]
    assert any(r["kind"] == "pose" and "sit_on_a_rail" in r["need"] for r in gaps)


def test_capability_flags_an_unknown_overlay_kind_and_a_missing_card() -> None:
    sc = scenario.load(ENGINE_TEST)
    design = json.loads((EX / "engine_test.design.json").read_text())
    scene = next(iter(design["scenes"].values()))
    scene["shots"][0]["overlays"] = [{"kind": "hologram", "rect": [0.1, 0.1, 0.2, 0.2], "card": "no_such_card"}]
    kinds = {(r["kind"], r["status"]) for r in videocapability.check(sc, design, LAYOUT)}
    assert ("overlay", "gap") in kinds and ("card", "gap") in kinds


def shots_with(events: list[dict], duration: float = 20.0, push: bool = False) -> dict:
    sh = [{"id": f"1.{i}", "t0": e["t0"], "camera": {"viewBox": [0, 0, 100, 56], **({"push_to": [0, 0, 80, 45]} if push else {})}, "cast": ["a"], **{k: v for k, v in e.items() if k != "t0"}} for i, e in enumerate(events, 1)]
    return {"title": "T", "duration": duration, "shots": sh, "tracks": [], "actors": [], "transitions": []}


def test_rhythm_blocks_a_long_static_shot_and_passes_cuts() -> None:
    g = videopreprod.load_format("shorts-1080x1920")["gates"]
    long = videogates.rhythm(shots_with([{"t0": 0.0}], 12.0), g)
    assert [f["severity"] for f in long] == ["block"]
    ok = videogates.rhythm(shots_with([{"t0": float(i * 2)} for i in range(6)], 12.0), g)
    assert not ok
    pushed = videogates.rhythm(shots_with([{"t0": 0.0}], 12.0, push=True), g)
    assert not [f for f in pushed if f["severity"] == "block"]  # a camera move is motion


def test_rhythm_warns_on_a_flash_shot() -> None:
    g = videopreprod.load_format("landscape-720")["gates"]
    f = videogates.rhythm(shots_with([{"t0": 0.0}, {"t0": 3.0}, {"t0": 3.1}, {"t0": 6.0}], 9.0), g)
    assert any("1.2" in x["message"] and "too short" in x["message"] for x in f)


def test_flicker_catches_a_flash_and_a_quick_flip() -> None:
    ov = {"kind": "card", "t0": 4.0, "t1": 4.2, "rect": [0, 0, 1, 1]}
    s = shots_with([{"t0": 0.0, "overlays": [ov]}], 10.0)
    s["tracks"] = [{"actor": "tv", "channel": "screen", "keys": [{"t": 0, "value": "a"}, {"t": 5.0, "value": "b"}, {"t": 5.4, "value": "a"}]}]
    msgs = " ".join(f["message"] for f in videogates.flicker(s))
    assert "a flash" in msgs and "flips" in msgs


def test_overlay_in_the_subtitle_band_blocks_only_while_someone_speaks(tmp_path: Path) -> None:
    p = plan(tmp_path)
    fmt = p["fmt"]
    g = p["groups"][0]
    s = copy.deepcopy(p["shots"][g["id"]])
    sh = s["shots"][0]
    sh["overlays"] = [{"kind": "card", "t0": 0.0, "t1": 2.0, "rect": [0.2, 0.8, 0.5, 0.15]}]
    speaking = videogates.zones(s, p, fmt)
    assert any(f["severity"] == "block" for f in speaking)
    sh["overlays"][0]["rect"] = [0.2, 0.3, 0.5, 0.2]
    assert not [f for f in videogates.zones(s, p, fmt) if f["severity"] == "block"]


def test_shorts_gate_limits_total_and_first_voice(tmp_path: Path) -> None:
    p = plan(tmp_path, fmt="shorts-1080x1920")
    msgs = [f["message"] for f in videogates.shorts(p, p["fmt"])]
    assert any("limit is 60s" in m for m in msgs)  # an 80 s test film is not a Short
    assert any("first voice" in m for m in msgs)  # the ambience lead puts the first word at 1.5 s


def test_textfit_blocks_an_overlong_card_text() -> None:
    fmt = videopreprod.load_format("landscape-720")
    s = {"title": "T", "duration": 5.0, "captions": [], "transitions": [{"type": "time_card", "text": "СУББОТА, ТРИ ЧАСА НОЧИ, СЕРВЕРНАЯ КОМНАТА", "t0": 1.0, "t1": 2.0, "fade": 0.4}]}
    assert any(f["severity"] == "block" for f in videogates.textfit(s, fmt))


def test_distinct_flags_reused_sets_and_titles(tmp_path: Path) -> None:
    p = plan(tmp_path)
    prev = tmp_path / "ep_prev.design.json"
    prev.write_text((EX / "engine_test.design.json").read_text())
    f = videogates.distinct(p, [prev])
    assert any("scene title" in x["message"] for x in f) and any("sets are the same" in x["message"] for x in f)


def test_a_design_that_cannot_resolve_is_one_blocking_finding(tmp_path: Path) -> None:
    d = json.loads((EX / "engine_test.design.json").read_text())
    d["cast"] = {"vadik": {"rig": "vadik@9.9.9"}}
    bad = tmp_path / "x.design.json"
    bad.write_text(json.dumps(d))
    p = videopreprod.prepare(ENGINE_TEST, tmp_path / "o", design=bad)
    f = videogates.run(p)
    assert f and f[0]["gate"] == "design" and f[0]["severity"] == "block"


def test_framing_defects_are_collected_not_raised(tmp_path: Path) -> None:
    d = json.loads((EX / "pravila.design.json").read_text())
    shot = d["scenes"]["Кухня, полдень"]["shots"][1]  # a medium of Mama: ask for a subject outside it
    shot["subjects"] = ["vadik", "mama"]
    shot["frame"] = "close"
    f = tmp_path / "p.design.json"
    f.write_text(json.dumps(d))
    p = videopreprod.prepare(PRAVILA, tmp_path / "o", design=f)
    assert p["fatal"] is None or "close-up" in p["fatal"]  # a close-up of two is refused outright; framing is checked otherwise
    shot["frame"] = "medium"
    shot["view"] = [0, 0, 300, 169]  # a fixed view that cuts both people off
    f.write_text(json.dumps(d))
    p = videopreprod.prepare(PRAVILA, tmp_path / "o2", design=f)
    assert any(x["kind"] == "crop" for x in p["report"]["problems"])
    assert any(x["gate"] == "framing" and x["severity"] == "block" for x in videogates.run(p, only={"framing"}))


# ---- retime ----

def test_retime_refuses_audio_of_another_script_unless_hybrid() -> None:
    sc = scenario.load(PRAVILA)
    entries, how = videoretime.real_entries(V1, sc, hybrid=False)  # the render IS this script: exact
    assert how["mode"] == "exact" and entries is V1
    edited = [{**e, "text": e["text"] + " Правка."} if e.get("turn") == 6 else e for e in V1]
    with pytest.raises(ValueError, match="not of this script"):
        videoretime.real_entries(edited, sc, hybrid=False)
    entries, how = videoretime.real_entries(edited, sc, hybrid=True)
    assert how["mode"] == "hybrid" and how["matched"] == how["turns"] - 1
    with pytest.raises(ValueError, match="not of this script"):
        videoretime.real_entries(V1, scenario.load(ENGINE_TEST), hybrid=False)


def test_retime_reports_moved_shots_and_scenes_that_rerender(tmp_path: Path) -> None:
    sc = scenario.load(ENGINE_TEST)
    est = videoestimate.estimate(sc)
    slower = [{**e, "start": round(e["start"] * 1.3, 3), "end": round(e["end"] * 1.3, 3)} for e in est]
    real = tmp_path / "real.timeline.json"
    real.write_text(json.dumps(slower))
    r = videoretime.retime(ENGINE_TEST, real, tmp_path / "rt", tol=0.15)
    assert r["mode"]["mode"] == "exact" and r["error_pct"] < -15
    assert r["flagged"] and set(r["rerender"]) == {s["scene"] for s in r["scenes"]}
    same = tmp_path / "same.timeline.json"
    same.write_text(json.dumps(est))
    r2 = videoretime.retime(ENGINE_TEST, same, tmp_path / "rt2")
    assert not r2["rerender"] and not r2["flagged"] and r2["unchanged"]
    assert "Retime" in videoretime.markdown(r)


# ---- CLI ----

def test_gates_cli_exits_nonzero_on_blocking_and_zero_with_warn_only(tmp_path: Path) -> None:
    cmd = [sys.executable, str(ROOT / "scripts" / "video.py"), "gates", str(ENGINE_TEST), "--format", "shorts-1080x1920", "--out", str(tmp_path / "o")]
    r = subprocess.run(cmd, capture_output=True, text=True, check=False)
    assert r.returncode == 1 and "blocking" in r.stdout
    assert (tmp_path / "o" / "gates.json").exists() and (tmp_path / "o" / "gates.md").exists()
    assert subprocess.run([*cmd, "--warn-only"], capture_output=True, text=True, check=False).returncode == 0


def test_capability_cli_writes_the_report(tmp_path: Path) -> None:
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "video.py"), "capability", str(ENGINE_TEST), "--out", str(tmp_path / "o")], capture_output=True, text=True, check=False)
    assert r.returncode in (0, 1) and (tmp_path / "o" / "capability.md").read_text().startswith("# Capability report")


def test_legacy_invocation_still_parses() -> None:
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "video.py"), "--help"], capture_output=True, text=True, check=False)
    assert "--draft" in r.stdout and "storyboard" in r.stdout


# ---- draft profile ----

def test_draft_profile_shrinks_size_and_fps_in_shots_json(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    sc = scenario.load(ENGINE_TEST)
    est = videoestimate.estimate(sc)
    seen: list[dict] = []

    def fake_render(scene_dir: Path, cache: Path, chrome: str | None, work: Path) -> dict:
        shots = json.loads((scene_dir / "shots.json").read_text())
        seen.append({"size": shots["size"], "fps": shots["fps"]})
        return {"id": scene_dir.name, "key": "k" * 12, "file": str(scene_dir / "x.mp4"), "hit": True, "seconds": 0, "engine": "e", "adapter": "a", "codec": "c"}

    monkeypatch.setattr(video, "render_scene", fake_render)
    monkeypatch.setattr(video, "join_and_mux", lambda files, audio, dest: dest.write_bytes(b""))
    audio = tmp_path / "a.wav"
    with wave.open(str(audio), "wb") as w:
        w.setnchannels(1), w.setsampwidth(2), w.setframerate(24000)
        w.writeframes(struct.pack("<24000h", *([0] * 24000)) * int(videoestimate.total(est)))
    for draft in (True, False):
        seen.clear()
        dest = video.make(audio, est, sr=24000, duration=videoestimate.total(est), out=tmp_path / f"o{draft}", scenario_src=ENGINE_TEST, draft=draft)
        assert seen and all((s["size"], s["fps"]) == (([640, 360], 15) if draft else ([1280, 720], 30)) for s in seen)
        assert dest.name == ("a.draft.mp4" if draft else "a.mp4")


# ---- stills (Chrome) ----

@pytest.mark.skipif(not has_chrome(), reason="needs Chrome and ffmpeg")
def test_storyboard_and_animatic_end_to_end(tmp_path: Path) -> None:
    p = plan(tmp_path, captions=True)
    r = videopreprod.storyboard(p, tmp_path, cell=(320, 180), overlays=False)
    meta = json.loads((r["dir"] / "storyboard.json").read_text())
    assert r["frames"] == len(meta["frames"]) and r["contact_sheet"].exists()
    assert all((r["dir"] / f["png"]).stat().st_size > 1000 for f in meta["frames"])
    a = videopreprod.animatic(p, tmp_path, cell=(320, 180))
    probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(a["file"])], capture_output=True, text=True, check=True).stdout)
    assert abs(float(probe["format"]["duration"]) - p["duration"]) < 3.0
