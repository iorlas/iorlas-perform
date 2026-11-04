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
import videoscene  # noqa: E402

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
    ids = lambda shot: [c["id"] for c in shot["cast"]]  # noqa: E731
    assert [(x["id"], ids(x)) for x in s1["shots"]] == [("1.1", ["vadik"]), ("1.2", ["vadik"]), ("1.3", ["vadik"])]
    assert {x["id"]: ids(x) for x in s2["shots"]} == {"2.1": ["vadik"], "2.2": ["vadik"], "2.3": ["vadik"], "2.4": [], "2.5": ["palych"], "2.5b": ["vadik"], "2.6": ["vadik"], "2.7": []}
    cto = next(x for x in s2["shots"] if x["id"] == "2.5")  # a phone call is cut like in film: full frame on the other end, then back
    assert cto["set"] == "setC_palych_home" and "inset" not in cto
    assert {a["id"] for a in s1["actors"]} == {"vadik"} and {a["id"] for a in s2["actors"]} == {"vadik", "palych"}


def test_shot_types_times_and_push_in(tmp_path):
    s1, s2 = resolved(tmp_path)
    assert {x["frame"] for x in s1["shots"] + s2["shots"]} == {"wide", "medium", "close", "insert"}
    for s in (s1, s2):
        t0s = [x["t0"] for x in s["shots"]]
        assert t0s[0] == 0 and t0s == sorted(set(t0s)) and t0s[-1] < s["duration"]
    push, start = s1["shots"][2]["camera"]["push_to"], s1["shots"][2]["camera"]["viewBox"]
    assert push[2] < start[2] and push[3] < start[3]
    assert all(abs(v[2] / v[3] - 16 / 9) < 0.01 for v in (x["camera"]["viewBox"] for x in s1["shots"] + s2["shots"]))


def test_transitions_are_in_shots_json(tmp_path):
    s1, s2 = resolved(tmp_path)
    (out,) = s1["transitions"]
    assert (out["type"], out["text"], out["t1"]) == ("time_card", "СБ 03:00", s1["duration"]) and out["t0"] == pytest.approx(s1["duration"] - 1.2, abs=0.01)
    (into,) = s2["transitions"]
    assert (into["type"], into["text"], into["t0"]) == ("card_out", "СБ 03:00", 0)


def props_of(scene: dict, set_name: str) -> dict:
    return {p["id"]: p for p in scene["sets"][set_name]["props"]}


def test_objects_are_placed_by_relations_not_pixels(tmp_path):
    """desk on the floor, keyboard/monitor/phone on the desk, cricket on the sill, chair behind the desk: derived from `place`."""
    _, s2 = resolved(tmp_path)
    p, floor, big_h = props_of(s2, "setB_office_night"), DESIGN["stage"]["floor"], DESIGN["stage"]["H"]
    bottom = lambda o: o["at"][1] + o["h"]  # noqa: E731
    assert bottom(p["desk"]) == floor and p["desk"]["h"] == round(0.43 * big_h)
    assert all(bottom(p[k]) == p["desk"]["at"][1] for k in ("keyboard", "monitor", "phone"))
    assert "cricket" not in p  # «сверчок за окном» is a sound (the night bed), never a prop
    assert p["desk"]["front"] and p["monitor"]["front"] and not p["chair"].get("front")  # he sits behind the desk, on the chair
    assert abs(p["chair"]["at"][0] + p["chair"]["w"] / 2) < 2  # chair centred on his axis


def test_a_set_can_extend_another_and_drop_or_replace_objects(tmp_path):
    s1, s2 = resolved(tmp_path)
    a, b = props_of(s1, "setA_office_dusk"), props_of(s2, "setB_office_night")
    assert {"clock", "poster_friday"} <= set(a) and not ({"clock", "poster_friday"} & set(b))
    assert {"dashboard"} <= set(b) and a["desk"]["at"] == b["desk"]["at"]  # same room, re-lit
    assert a["window"]["fill"] != b["window"]["fill"]  # dusk vs night art kind


def test_vadik_sits_on_the_chair_and_his_hands_go_where_the_keyboard_is(tmp_path):
    s1, _ = resolved(tmp_path)
    vadik = next(c for c in s1["shots"][1]["cast"] if c["id"] == "vadik")
    assert vadik["seated"] and vadik["offset"][0] == 0
    dim = videoscene.rig_dim("vadik@1.2.0")["dim"]
    seat_y = DESIGN["stage"]["floor"] - 0.26 * DESIGN["stage"]["H"]
    assert vadik["offset"][1] == round(seat_y - dim["hipY"])  # hips at seat height
    pose = [t for t in s1["tracks"] if t["actor"] == "vadik" and t["channel"] == "pose"][0]["keys"]
    kb = props_of(s1, "setA_office_dusk")["keyboard"]
    typing = next(k for k in pose if k["override"].get("_typing"))
    hand_world = [typing["override"]["R"]["h"][0] + vadik["offset"][0], typing["override"]["R"]["h"][1] + vadik["offset"][1]]
    assert abs(hand_world[1] - (kb["at"][1] - 4)) < 1 and kb["at"][0] <= hand_world[0] <= kb["at"][0] + kb["w"] + 40  # on the keys, not floating


def test_vadik_picks_up_the_phone_when_it_rings_and_it_leaves_the_desk(tmp_path):
    _, s2 = resolved(tmp_path)
    keys = [k for t in s2["tracks"] if t["actor"] == "handset" and t["channel"] == "visible" for k in t["keys"]]
    assert keys[0]["value"] is True and keys[-1]["value"] is False  # on the desk until beat 6, then in his hand
    pose = [k["value"] for t in s2["tracks"] if t["actor"] == "vadik" and t["channel"] == "pose" for k in t["keys"]]
    assert pose[-1] == "hold_receiver" and "stand_still" in pose


def test_screen_contents_come_from_named_cues(tmp_path):
    s1, s2 = resolved(tmp_path)

    def vals(s: dict, who: str) -> list[str]:
        v = [k["value"] for t in s["tracks"] if t["actor"] == who and t["channel"] == "screen" for k in t["keys"]]
        return [x for i, x in enumerate(v) if i == 0 or x != v[i - 1]]

    assert vals(s1, "monitor") == ["terminal", "deploy_run", "deploy_frozen"] and vals(s2, "monitor") == ["tiles_red", "chat_control"]
    assert vals(s2, "dashboard") == ["dash_failing", "dash_cricket"]


def test_the_punchline_shows_every_service_down_and_the_cricket_up(tmp_path):
    _, s2 = resolved(tmp_path)
    d = s2["screens"]
    assert len(d["dash_failing"]["rows"]) == 5 and "ok" not in d["dash_failing"]  # the cricket row is the reveal, not there from the start
    assert all("at" not in r for r in d["dash_cricket"]["rows"]) and d["dash_cricket"]["ok"]["pulse_after"] > 0
    last = s2["shots"][-1]
    assert last["id"] == "2.7" and last["camera"]["push_to"][2] < last["camera"]["viewBox"][2]
    vb, p = last["camera"]["viewBox"], props_of(s2, "setB_office_night")
    assert vb[0] <= p["dashboard"]["at"][0] and p["dashboard"]["at"][0] + p["dashboard"]["w"] <= vb[0] + vb[2]


def test_the_cto_is_cut_to_full_frame_lip_synced_and_the_caller_id_is_on_the_phone(tmp_path):
    _, s2 = resolved(tmp_path)
    cto = next(x for x in s2["shots"] if x["id"] == "2.5")
    assert cto["cast"][0]["seated"] and cto["frame"] == "close"
    assert "mouth" in next(a for a in s2["actors"] if a["id"] == "palych") and not s2.get("debug")
    back = next(x for x in s2["shots"] if x["id"] == "2.5b")
    assert back["t0"] > cto["t0"] + 1  # the reaction shot starts mid-beat, after the CTO has spoken

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


def test_an_object_out_of_arm_reach_is_refused():
    bad = json.loads(json.dumps(DESIGN))
    for o in bad["sets"]["setA_office_dusk"]["objects"]:
        if o["id"] == "keyboard":
            o["place"]["x"] = 0.9  # a metre away
    with pytest.raises(ValueError, match="arm reach"):
        videodesign.emit_sheet(tl(), LAYOUT, bad)


def test_a_seated_character_with_nothing_hiding_his_legs_is_refused():
    """vadik 1.2.0 has no seated pose: without a solid desk over his missing legs, a wide shot would show him cut off at the hips."""
    bad = json.loads(json.dumps(DESIGN))
    bad["sets"]["setA_office_dusk"]["objects"] = [o for o in bad["sets"]["setA_office_dusk"]["objects"] if o["id"] not in {"desk", "keyboard", "monitor", "phone", "handset"}]
    bad["scenes"]["Офис, вечер"]["interactions"] = []
    bad["scenes"]["Офис, вечер"]["cues"] = [c for c in bad["scenes"]["Офис, вечер"]["cues"] if c.get("target") not in {"monitor"}]
    with pytest.raises(ValueError, match="no seated pose"):
        videodesign.emit_sheet(tl(), LAYOUT, bad)


def test_objects_that_depend_on_each_other_in_a_loop_are_refused():
    objs = [{"id": "a", "size": [.1, .1], "place": {"on": "b", "x": 0}}, {"id": "b", "size": [.1, .1], "place": {"on": "a", "x": 0}}]
    with pytest.raises(ValueError, match="loop"):
        videoscene.solve_objects(objs, DESIGN["stage"])


def test_the_design_renders_as_a_review_document():
    md = videodesign.describe(tl(), DESIGN)
    assert "## Set `setB_office_night` (extends `setA_office_dusk`)" in md and "| 2.7 |" in md and "seated on `chair`" in md and "hands_on `keyboard`" in md


def test_phone_rings_only_from_the_ring_sfx(tmp_path):
    _, s2 = resolved(tmp_path)
    ring = next(t for t in s2["tracks"] if t["actor"] == "phone" and t["channel"] == "text")["keys"]
    first = next(k for k in ring if k["value"].startswith("ring:"))
    assert ring[0]["value"] == "" and first["t"] > 15  # silent at t=0, rings at the sfx (beat 5), not while the narrator introduces the call
    assert any(k["value"] == "в разговоре" and k["t"] > first["t"] for k in ring)


def _design(edit) -> dict:
    d = json.loads(json.dumps(DESIGN))
    edit(d)
    return d


def test_an_object_must_cite_the_script_or_say_it_is_invented():
    with pytest.raises(ValueError, match='no "from"'):
        videodesign.emit_sheet(tl(), LAYOUT, _design(lambda d: d["sets"]["setA_office_dusk"]["objects"][0].pop("from")))
    with pytest.raises(ValueError, match="not in the script"):
        videodesign.emit_sheet(tl(), LAYOUT, _design(lambda d: d["sets"]["setA_office_dusk"]["objects"][0].update({"from": "слон в комнате"})))


def test_an_outside_object_must_be_seen_through_the_window():
    def on_the_inner_sill(d):
        d["sets"]["setB_office_night"]["objects"].append({"id": "moth", "size": [0.05, 0.03], "place": {"x": -0.9, "on": "sill"}, "from": "invented", "side": "outside"})
    with pytest.raises(ValueError, match="outside but not inside a window"):
        videodesign.emit_sheet(tl(), LAYOUT, _design(on_the_inner_sill))


def test_a_sound_is_cited_and_never_drawn():
    s2 = sheet()["sets"]["setB_office_night"]
    assert "cricket" not in {x["id"] for x in s2["props"]}
    with pytest.raises(ValueError, match="must cite the script"):
        videodesign.emit_sheet(tl(), LAYOUT, _design(lambda d: d["sets"]["setB_office_night"]["sounds"][0].update({"from": "слон"})))


def test_a_beat_that_names_an_object_must_show_it():
    def hide_the_phone(d):
        sc = d["scenes"]["Офис, ночь"]
        sc["shots"] = [s for s in sc["shots"] if s["id"] != "2.4"]  # the only shot of the beat that says «телефон»
    with pytest.raises(ValueError, match="says «телефон»"):
        videodesign.emit_sheet(tl(), LAYOUT, _design(hide_the_phone))
