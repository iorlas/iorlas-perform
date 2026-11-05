"""Estimated timeline: a scenario -> timeline v1 (the shape scene.py writes) with no audio rendered.

Stage 0 of the pre-production ladder (docs/PREPRODUCTION.md). Every later stage (storyboard, animatic, gates) takes
this timeline where the real one does not exist yet; `video.py retime` swaps it for the real one afterwards.

Durations: spoken characters / characters-per-second (measured on the Pravila render: 12.9 over 37 turns), a per-voice
override from a pace file, small adders for pauses written in the text. Placement mirrors scene.py: `--gap` between
turns, `--scene-pause` before each scene but the first, `{pause}`s, a lead before an opening ambience. Where a real or
cached duration is known for a turn (a take from the cache, a past render), it replaces the estimate.
"""

import json
import re
from pathlib import Path
from typing import Any

import scenario

CPS = 12.9  # spoken characters per second at scene.py's default speed (1.1); measured, tests/data/pravila.v1.json
TAG_SPEED = {"whisper": 0.85, "whispering": 0.85, "slow": 0.8, "slurred": 0.85, "tiny": 0.9, "fast": 1.15, "rapid": 1.15}  # tag word -> speed multiplier
SFX_SECONDS = {"notify": 0.72, "phone_vibrate": 3.0}  # known effect lengths; anything else DEFAULT_SFX
DEFAULT_SFX = 1.2
GAP = 0.35  # scene.py --gap
SCENE_PAUSE = 1.5  # scene.py --scene-pause
LEAD = 1.5  # ambience.XFADE: a scenario that opens on a bed lets it fade in before the first word
PAUSE_MARKS = re.compile(r"…|\.\.\.|—|\(pause\)", re.IGNORECASE)
LAUGH = re.compile(r"\[(laugh|laughs|laughing|chuckle|sigh|gasp)[^\]]*\]", re.IGNORECASE)


def turn_seconds(turn: scenario.Turn, cps: float = CPS, pace: dict[str, float] | None = None) -> float:
    """Seconds a turn is spoken: spoken characters at the voice's pace, slowed by speed tags, plus time for ellipses and laughs."""
    text = scenario.spoken(turn.text)
    rate = (pace or {}).get(turn.voice, cps)
    tags = re.findall(r"[a-z]+", " ".join(re.findall(r"\[([^\]]*)\]", turn.text)).lower())
    speed = min([TAG_SPEED[t] for t in tags if t in TAG_SPEED] or [1.0])
    pauses = len(PAUSE_MARKS.findall(text)) * 0.15 + len(LAUGH.findall(turn.text)) * 0.6
    return round(max(0.4, len(re.sub(r"\s+", "", text)) / rate / speed + pauses), 3)


def estimate(
    sc: scenario.Scenario, *, cps: float = CPS, pace: dict[str, float] | None = None, known: dict[int, float] | None = None,
    gap: float = GAP, scene_pause: float = SCENE_PAUSE, sfx_seconds: dict[str, float] | None = None,
) -> list[dict[str, Any]]:
    """The timeline v1 scene.py would write, from the script alone. `known`: item number -> real seconds (cached takes) that replace estimates."""
    known = known or {}
    sfx_len = {**SFX_SECONDS, **(sfx_seconds or {})}
    out: list[dict[str, Any]] = []
    opener = sc.items[0] if sc.items else None
    end = LEAD if isinstance(opener, (scenario.Scene, scenario.Ambience)) and getattr(opener, "ambience", None) else 0.0
    placed, scene = False, None
    for n, item in enumerate(sc.items, 1):
        if isinstance(item, scenario.Pause):
            end += item.secs
        elif isinstance(item, scenario.Scene):
            if placed:
                end += scene_pause
            scene = item
        elif isinstance(item, scenario.Ambience):
            continue
        elif isinstance(item, scenario.Sfx):
            at = max(0.0, end + (gap if item.gap is None else item.gap)) if placed else end
            dur = known.get(n, sfx_len.get(item.name, DEFAULT_SFX))
            out.append({"sfx": item.name, "volume": item.volume or 1.0, "start": round(at, 3), "end": round(at + dur, 3), "estimated": n not in known})
            end, placed = max(end, at + dur), True
        else:
            at = max(0.0, end + (gap if item.gap is None else item.gap)) if placed else end
            dur = known.get(n) or turn_seconds(item, cps, pace)
            out.append(
                {"turn": n, "voice": item.voice, "text": item.text, "scene": scene.title if scene else None, "ambience": scene.ambience if scene else None,
                 "start": round(at, 3), "end": round(at + dur, 3), "estimated": n not in known}
                | ({"phone": True} if item.phone else {})
            )
            end, placed = at + dur, True
    return out


def total(timeline: list[dict[str, Any]]) -> float:
    return max((e["end"] for e in timeline), default=0.0) + 0.5  # scene.py leaves a short tail after the last turn


def load_pace(path: Path | None) -> dict[str, float]:
    """A world's own voice pace file: {voice: characters per second}. Missing file: the defaults."""
    return json.loads(path.read_text()) if path and path.exists() else {}


def from_render(timeline_v1: list[dict[str, Any]], sc: scenario.Scenario) -> dict[int, float]:
    """Real seconds per item number of this scenario, from a past render's timeline, matched by (voice, text).

    A turn that was edited since has no match and stays an estimate; the numbering of the new script is the key.
    """
    have: dict[tuple[str, str], list[float]] = {}
    for e in timeline_v1:
        if "turn" in e:
            have.setdefault((e["voice"], re.sub(r"\s+", " ", e["text"]).strip()), []).append(e["end"] - e["start"])
    sfx_have: dict[str, list[float]] = {}
    for e in timeline_v1:
        if "sfx" in e:
            sfx_have.setdefault(e["sfx"], []).append(e["end"] - e["start"])
    known: dict[int, float] = {}
    for n, item in enumerate(sc.items, 1):
        if isinstance(item, scenario.Turn) and (hits := have.get((item.voice, re.sub(r"\s+", " ", item.text).strip()))):
            known[n] = round(hits[0], 3)
        elif isinstance(item, scenario.Sfx) and (hits := sfx_have.get(item.name)):
            known[n] = round(hits[0], 3)
    return known
