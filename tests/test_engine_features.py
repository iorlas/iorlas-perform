"""The engine stress test (examples/engine_test.md): features night_shift did not use, checked as design data in shots.json.

    uv run --with pytest pytest tests
"""

import json
import struct
import sys
import wave
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import videodesign  # noqa: E402
import videoplan  # noqa: E402

LAYOUT = json.loads((ROOT / "video" / "layout.json").read_text())
DESIGN = json.loads((ROOT / "examples" / "engine_test.design.json").read_text())
V1 = json.loads((ROOT / "tests" / "data" / "engine_test.v1.json").read_text())
END = max(e["end"] for e in V1) + 1.0


def tl() -> dict:
    return videoplan.timeline_v2(V1, audio="a.wav", duration=END, sr=24000)


@pytest.fixture(scope="module")
def built(tmp_path_factory):
    tmp = tmp_path_factory.mktemp("et")
    audio = tmp / "a.wav"
    with wave.open(str(audio), "wb") as w:
        w.setnchannels(1), w.setsampwidth(2), w.setframerate(16000)
        w.writeframes(struct.pack("<16000h", *([0] * 16000)) * int(END + 1))
    sheet = videodesign.emit_sheet(tl(), LAYOUT, DESIGN)
    groups = videoplan.plan(tl(), sheet, audio, tmp / "scenes", None)
    return sheet, [json.loads((g["dir"] / "shots.json").read_text()) for g in groups]


def shot(scene: dict, sid: str) -> dict:
    return next(s for s in scene["shots"] if s["id"] == sid)


def values(scene: dict, who: str, channel: str) -> list:
    out = [k["value"] for t in scene["tracks"] if t["actor"] == who and t["channel"] == channel for k in t["keys"]]
    return [x for i, x in enumerate(out) if i == 0 or x != out[i - 1]]


def rect(scene: dict, set_name: str, oid: str, vb: list[float]) -> tuple[float, float, float]:
    """(centre x, centre y, width) of an object on screen, as fractions of the frame."""
    p = next(p for p in scene["sets"][set_name]["props"] if p["id"] == oid)
    return ((p["at"][0] + p["w"] / 2 - vb[0]) / vb[2], (p["at"][1] + p["h"] / 2 - vb[1]) / vb[3], p["w"] / vb[2])


def test_three_scenes_and_the_cast_changes_per_scene(built):
    _, (s1, s2, s3) = built
    who = lambda s: {a["id"] for a in s["actors"]}  # noqa: E731
    assert who(s1) == {"mama", "vadik"} and who(s2) == {"vadik", "neyroset"} and who(s3) == {"palych", "kristina", "vadik", "mama"}
    assert [len(s["shots"]) for s in (s1, s2, s3)] == [5, 7, 10]


def test_the_ai_has_no_body_and_mama_is_a_declared_stand_in(built):
    _, (_, s2, s3) = built
    ai = next(a for a in s2["actors"] if a["id"] == "neyroset")
    assert ai["kind"] == "asset" and "mouth" in ai  # lip-synced, drawn only inside screens
    assert all("neyroset" not in [c["id"] for c in sh["cast"]] for sh in s2["shots"])
    mama = next(a for a in s3["actors"] if a["id"] == "mama")
    assert mama["rig"] == "friend@1.0.1" and "BLOCKER" in mama["stand_in"]


@pytest.mark.parametrize(("scene", "a", "b"), [(0, "plate_cutlets", "zinaida"), (1, "zinaida", "wallscreen")])
def test_a_match_cut_puts_the_next_object_where_the_last_one_was(built, scene, a, b):
    sheet, scenes = built
    prev, nxt = scenes[scene], scenes[scene + 1]
    last, first = prev["shots"][-1], nxt["shots"][0]
    vb_end = last["camera"].get("push_to") or last["camera"]["viewBox"]
    ra = rect(prev, last["set"], a, vb_end)
    rb = rect(nxt, first["set"], b, first["camera"]["viewBox"])
    assert first["match"] == {"from": a, "to": b}
    assert rb == pytest.approx(ra, abs=0.01)  # same centre and the same width on screen: the cut is invisible to the eye


def test_time_card_push_in_pull_out_and_inset(built):
    _, (s1, s2, s3) = built
    assert [(t["type"], t["text"]) for t in s2["transitions"]] == [("time_card", "15:00")] and s3["transitions"][0]["type"] == "card_out"
    cam = lambda s, i: shot(s, i)["camera"]  # noqa: E731
    assert cam(s3, "3.3")["push_to"][2] < cam(s3, "3.3")["viewBox"][2]  # push-in
    assert cam(s2, "2.1")["push_to"][2] > cam(s2, "2.1")["viewBox"][2] and cam(s3, "3.9")["push_to"][2] > cam(s3, "3.9")["viewBox"][2]  # pull-out
    for i in ("3.7", "3.8"):  # the kitchen set again, as Mama's side of the phone call
        ins = shot(s3, i)["inset"]
        assert ins["set"] == "setA_kitchen_morning" and ins["style"] == "caller" and [c["id"] for c in ins["cast"]] == ["mama"] and ins["cast"][0]["pose"] == "phone_hold"
    assert "setA_kitchen_morning" in s3["sets"] and "inset" not in shot(s3, "3.9")


def test_per_shot_looks(built):
    _, (s1, s2, s3) = built
    looks = {s["id"]: s["look"] for sc in (s1, s2, s3) for s in sc["shots"] if "look" in s}
    assert looks == {"2.4": "hatch", "2.6": "label", "3.10": "label"}
    assert shot(s2, "2.6")["card"] == {"title": "ПОКРЫТИЕ 100 %*", "note": "*от нуля"}
    assert shot(s2, "2.6b")["t0"] - shot(s2, "2.6")["t0"] > 1.0  # the card holds, then back to «Вырезка»


def test_screens_are_driven_by_cues(built):
    _, (s1, s2, s3) = built
    assert values(s2, "zinaida", "screen") == ["tiles_14_red", "chat_user", "ai_smiley", "dialog_delete", "tiles_14_green"]
    assert values(s3, "wallscreen", "screen") == ["wall_green", "desktop_tests"]
    d = s2["screens"]
    assert d["chat_user"]["mode"] == "chat_window" and d["ai_smiley"]["kind"] == "neyroset" and d["dialog_delete"]["click"] == "yes"
    assert d["tiles_14_green"]["green_every"] > 0 and d["tiles_14_red"]["cols"] * d["tiles_14_red"]["rows"] == 14


def test_props_have_state(built):
    _, (s1, _, s3) = built
    assert values(s1, "plate_cutlets", "text") == ["14", "13", "13f"]  # the plate empties as he eats
    icon = s3["screens"]["desktop_tests"]["icons"][0]
    assert icon["strike_at"] < icon["gone_at"]  # the folder is struck out, then gone
    assert values(s3, "phone", "text") == ["15:00", "ring:МАМА", "разговор"]


def test_every_new_object_cites_the_script_or_says_invented():
    for st in DESIGN["sets"].values():
        for o in st["objects"]:
            assert o["from"]


def test_rig_blockers_are_still_true():
    """If one of these fails, the blocker is gone: update the design (seated poses, a Mama rig, applause) and delete the workaround."""
    rigs = ROOT / "video" / "rigs"
    for rid, ver in (("vadik", "1.2.0"), ("palych", "1.0.1")):
        poses = json.loads((rigs / rid / ver / "rig.json").read_text())["poses"]
        assert not [p for p in poses if p.startswith("sit")], f"{rid}@{ver} has a seated pose now: drop the hips-up trick"
    assert not (rigs / "mama").exists(), "a mama rig exists now: replace the friend@1.0.1 stand-in"
