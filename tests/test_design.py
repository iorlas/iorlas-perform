"""Design file -> sheet -> shots.json for examples/night_shift.md: scenes, per-shot cast, shot types, transitions, placeholders/art ids.

    uv run --with pytest pytest tests
"""

import json
import sys
import wave
import struct
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import videodesign  # noqa: E402
import videoplan  # noqa: E402

LAYOUT = json.loads((ROOT / "video" / "layout.json").read_text())
DESIGN = json.loads((ROOT / "examples" / "night_shift.design.json").read_text())
V1 = json.loads((ROOT / "tests" / "data" / "night_shift.v1.json").read_text())
SECTIONS = ["Офис, вечер", "Офис, ночь"]  # the scenario's two ## headings


def tl() -> dict:
    return videoplan.timeline_v2(V1, audio="a.wav", duration=50.8, sr=24000)


def sheet() -> dict:
    return videodesign.emit_sheet(tl(), LAYOUT, DESIGN)


def resolved(tmp_path: Path, assets: Path | None = None) -> list[dict]:
    audio = tmp_path / "a.wav"
    with wave.open(str(audio), "wb") as w:
        w.setnchannels(1), w.setsampwidth(2), w.setframerate(16000)
        w.writeframes(struct.pack("<16000h", *([0] * 16000)) * 51)
    groups = videoplan.plan(tl(), sheet(), audio, tmp_path / "scenes", assets)
    return [json.loads((g["dir"] / "shots.json").read_text()) for g in groups]


def test_scene_count_follows_the_scenario_sections(tmp_path):
    assert [s["title"] for s in tl()["scenes"]] == SECTIONS
    out = resolved(tmp_path)
    assert [s["title"] for s in out] == SECTIONS and all(s["schema"] == "shots/2" for s in out)


def test_per_shot_cast_matches_who_is_in_it(tmp_path):
    s1, s2 = resolved(tmp_path)
    assert [(x["id"], [c if isinstance(c, str) else c["id"] for c in x["cast"]]) for x in s1["shots"]] == [("1.1", ["vadik"]), ("1.2", ["vadik"]), ("1.3", ["vadik"])]
    cast2 = {x["id"]: [c if isinstance(c, str) else c["id"] for c in x["cast"]] for x in s2["shots"]}
    assert cast2 == {"2.1": [], "2.2": ["vadik"], "2.3": [], "2.4": [], "2.5": ["vadik"], "2.6": ["vadik"], "2.7": []}
    inset = next(x for x in s2["shots"] if x["id"] == "2.5")["inset"]
    assert [c["id"] for c in inset["cast"]] == ["palych"] and inset["set"] == "setC_palych_home"
    assert {a["id"] for a in s1["actors"]} == {"vadik"} and {a["id"] for a in s2["actors"]} == {"vadik", "palych"}  # Mihalych and Zinaida are not in this scenario


def test_shot_types_times_and_push_in(tmp_path):
    s1, s2 = resolved(tmp_path)
    assert {x["frame"] for x in s1["shots"] + s2["shots"]} == {"wide", "medium", "close", "insert"}
    for s in (s1, s2):
        t0s = [x["t0"] for x in s["shots"]]
        assert t0s[0] == 0 and t0s == sorted(set(t0s)) and t0s[-1] < s["duration"]
    assert "push_to" in s1["shots"][2]["camera"] and "push_to" not in s1["shots"][1]["camera"]
    push, start = s1["shots"][2]["camera"]["push_to"], s1["shots"][2]["camera"]["viewBox"]
    assert push[2] < start[2] and push[3] < start[3]
    vb = [x["camera"]["viewBox"] for x in s1["shots"] + s2["shots"]]
    assert all(abs(v[2] / v[3] - 16 / 9) < 0.01 for v in vb)


def test_transitions_are_in_shots_json(tmp_path):
    s1, s2 = resolved(tmp_path)
    (out,) = s1["transitions"]
    assert (out["type"], out["text"], out["t1"]) == ("time_card", "СБ 03:00", s1["duration"]) and out["t0"] == pytest.approx(s1["duration"] - 1.2, abs=0.01)
    (into,) = s2["transitions"]
    assert (into["type"], into["text"], into["t0"]) == ("card_out", "СБ 03:00", 0)


def test_sets_and_props_carry_the_ids_the_art_will_use(tmp_path):
    s1, s2 = resolved(tmp_path)
    assert set(s1["sets"]) == {"setA_office_dusk"} and set(s2["sets"]) == {"setB_office_night", "setC_palych_home"}
    assert {"clock", "dashboard", "phone", "cricket"} <= set(s2["props"])
    assert {p["id"] for p in s2["sets"]["setB_office_night"]["props"]} >= {"dashboard", "cricket", "phone"}
    assert "svg" not in s1["sets"]["setA_office_dusk"]  # placeholder: flat colours


def test_dropped_in_art_replaces_the_placeholder_without_other_changes(tmp_path):
    assets = tmp_path / "assets"
    (assets / "sets").mkdir(parents=True)
    (assets / "props").mkdir()
    (assets / "sets" / "setA_office_dusk.svg").write_text("<rect width='9' height='9'/>")
    (assets / "props" / "clock.svg").write_text("<circle r='5'/>")
    for d in ("x", "y"):
        (tmp_path / d).mkdir()
    before, after = resolved(tmp_path / "x"), resolved(tmp_path / "y", assets)
    assert after[0]["sets"]["setA_office_dusk"]["svg"] == "<rect width='9' height='9'/>" and after[0]["props"]["clock"]["svg"] == "<circle r='5'/>"
    assert [s["shots"] for s in before] == [s["shots"] for s in after]


def test_screen_contents_come_from_named_cues(tmp_path):
    s1, s2 = resolved(tmp_path)
    def mon(s: dict) -> list[str]:  # the resolver adds a key at t=0 equal to the first: collapse repeats
        v = [k["value"] for t in s["tracks"] if t["actor"] == "monitor" and t["channel"] == "screen" for k in t["keys"]]
        return [x for i, x in enumerate(v) if i == 0 or x != v[i - 1]]

    assert mon(s1) == ["terminal", "deploy_run", "deploy_frozen"] and mon(s2) == ["tiles_red", "chat_control"]
    assert set(s2["screens"]) >= {"tiles_red", "chat_control"}


def test_a_shot_on_a_missing_beat_is_an_error():
    bad = json.loads(json.dumps(DESIGN))
    bad["scenes"]["Офис, вечер"]["shots"][0]["beats"] = [99]
    with pytest.raises(ValueError, match="beat 99"):
        videodesign.emit_sheet(tl(), LAYOUT, bad)


def test_a_voice_missing_from_the_design_cast_is_an_error():
    bad = json.loads(json.dumps(DESIGN))
    del bad["cast"]["praporshchik"]
    with pytest.raises(ValueError, match="praporshchik"):
        videodesign.emit_sheet(tl(), LAYOUT, bad)


def test_props_are_placed_from_one_scale_and_named_anchors(tmp_path):
    """Staging model: sizes in person-heights, resting on named bases. No prop floats or sinks."""
    _, s2 = resolved(tmp_path)
    st, p = DESIGN["stage"], {x["id"]: x for x in s2["sets"]["setB_office_night"]["props"]}
    big_h, floor = st["H"], st["floor"]
    assert p["desk"]["at"][1] + p["desk"]["h"] == floor and p["desk"]["h"] == round(0.42 * big_h)  # desk stands on the floor, 42 % of a person
    desk_top = p["desk"]["at"][1]
    assert p["monitor"]["at"][1] + p["monitor"]["h"] == desk_top and p["phone"]["at"][1] + p["phone"]["h"] == desk_top  # both rest on the desk
    shelf_top = p["shelf"]["at"][1]
    assert p["cricket"]["at"][1] + p["cricket"]["h"] == shelf_top  # the cricket sits on the shelf, under the dashboard
    assert p["dashboard"]["at"][1] + p["dashboard"]["h"] < shelf_top
    assert p["desk"]["front"] and p["monitor"]["front"]  # drawn in front of the cast: Vadik stands behind the desk


def test_the_punchline_shows_every_service_down_and_the_cricket_up(tmp_path):
    _, s2 = resolved(tmp_path)
    d = s2["screens"]
    assert len(d["dash_failing"]["rows"]) == 5 and d["dash_failing"]["ok"]["label"] == "сверчок"  # setup: services go down one by one, cricket row stays up
    assert all("at" not in r for r in d["dash_cricket"]["rows"]) and d["dash_cricket"]["ok"]["pulse_after"] > 0  # payoff: all down at once, cricket row pulses on «сверчок»
    last = s2["shots"][-1]
    assert last["id"] == "2.7" and last["frame"] == "insert" and last["camera"]["push_to"][2] < last["camera"]["viewBox"][2]
    keys = [k["value"] for t in s2["tracks"] if t["actor"] == "dashboard" for k in t["keys"]]
    assert keys[-1] == "dash_cricket" and "dash_failing" in keys


def test_the_cto_is_a_caller_card_then_a_head_inset_never_a_full_body(tmp_path):
    _, s2 = resolved(tmp_path)
    ring, talk = (next(x for x in s2["shots"] if x["id"] == i)["inset"] for i in ("2.4", "2.5"))
    assert ring["style"] == talk["style"] == "caller" and ring["ringing"] and not talk["ringing"] and talk["name"] == "Геннадий Палыч"
    for ins in (ring, talk):  # head and shoulders: the camera is far tighter than a body shot
        assert ins["camera"][2] <= 320
    assert "mouth" in next(a for a in s2["actors"] if a["id"] == "palych")  # lip-sync track present
    assert not s2.get("debug")  # no debug labels in a real render
