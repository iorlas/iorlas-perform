"""«Правила проекта»: drawn art sets (video/art), slots, overlays, slices. Only the finished scenes are in the design (`partial`).

    uv run --with pytest pytest tests/test_pravila.py
"""

import copy
import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import videodesign  # noqa: E402
import videoplan  # noqa: E402

LAYOUT = json.loads((ROOT / "video" / "layout.json").read_text())
DESIGN = json.loads((ROOT / "examples" / "pravila.design.json").read_text())
V1 = json.loads((ROOT / "tests" / "data" / "pravila.v1.json").read_text())


def tl() -> dict:
    return videoplan.timeline_v2(V1, audio="a.wav", duration=208.1, sr=24000)


def sheet(design: dict = DESIGN) -> dict:
    return videodesign.emit_sheet(tl(), LAYOUT, design)


def test_partial_design_skips_undesigned_scenes() -> None:
    assert list(sheet()["scenes"])[0] == "Кухня, полдень" and "Переговорная, ровно два" not in sheet()["scenes"]
    d = copy.deepcopy(DESIGN)
    del d["partial"]
    with pytest.raises(KeyError, match="Переговорная"):
        sheet(d)


def test_art_slots_place_the_real_rigs() -> None:
    sc = sheet()["scenes"]["Кухня, полдень"]
    shot = sc["shots"][0]
    by = {c["id"]: c for c in shot["cast"]}
    assert by["mama"]["offset"] == [403, 285] and by["mama"]["scale"] == 0.62 and by["mama"]["pose"] == "stir_hold"
    assert by["vadik"]["offset"] == [975, 352] and by["vadik"]["clip_y_max"] == 640
    assert {"mama": "mama@1.0.0", "vadik": "vadik@1.2.0", "neyroset": "neyroset@1.0.0"}.items() <= {a["id"]: a["rig"] for a in sc["actors"]}.items()


def test_art_set_is_drawn_back_and_front_with_removals() -> None:
    st = sheet()["sets"]["setA_kitchen_noon"]
    assert "windowglow" not in st["svg"] and st["svg"] and st["front"]
    assert "setA_kitchen_island" not in st["svg"]  # the island is in front of the cast, not behind it
    assert [p["id"] for p in st["props"]] == ["laptop"]


def test_unknown_slot_or_removal_is_an_error() -> None:
    d = copy.deepcopy(DESIGN)
    d["sets"]["setA_kitchen_noon"]["characters"]["mama"]["slot"] = "nope"
    with pytest.raises(ValueError, match="slot"):
        sheet(d)
    d = copy.deepcopy(DESIGN)
    d["sets"]["setA_kitchen_noon"]["remove"].append("not_an_object")
    with pytest.raises(ValueError, match="do not exist"):
        sheet(d)


def test_overlays_resolve_to_scene_seconds(tmp_path: Path) -> None:
    import struct
    import wave

    audio = tmp_path / "a.wav"
    with wave.open(str(audio), "wb") as w:
        w.setnchannels(1), w.setsampwidth(2), w.setframerate(16000)
        w.writeframes(struct.pack("<16000h", *([0] * 16000)) * 209)
    groups = videoplan.plan(tl(), sheet(), audio, tmp_path / "scenes", None, ["s01"])
    assert [g["id"] for g in groups] == ["s01"]
    shots = json.loads((groups[0]["dir"] / "shots.json").read_text())["shots"]
    card = next(s for s in shots if s["id"] == "1.3")["overlays"][0]
    wave_ = next(s for s in shots if s["id"] == "1.5")["overlays"][0]
    nxt = next(s for s in shots if s["id"] == "1.4")["t0"]
    assert card["kind"] == "voice_card" and card["t0"] == pytest.approx(18.15, abs=0.1) and card["t1"] == pytest.approx(nxt)
    assert wave_["grow"]["t0"] > wave_["t0"] and wave_["t1"] > wave_["grow"]["t0"] + wave_["grow"]["dur"] - 3


def test_flashback_and_vehicle_scenes() -> None:
    sh = sheet()
    night = sh["scenes"]["Серверная, ночь"]
    assert all(s["look"] == "memory" for s in night["shots"]) and any(o["kind"] == "tape" for o in night["shots"][0]["overlays"])
    assert night["transition_out"]["card_svg"] and sh["scenes"]["Маршрутка, день"]["transition_in"]["card_svg"]
    assert night["actors"][0]["id"] in {"vadik", "neyroset"} and "filter" in next(x for x in night["shots"] if x["id"] == "2.2")["cast"][0]
    assert "url(#nightF)" in sh["sets"]["setD_server_night"]["svg"]
