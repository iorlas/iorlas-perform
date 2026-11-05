"""Subtitles from the script and a timeline: chunks of a turn timed inside the turn, in the engine's `captions` shape.

[{t0, t1, words: [{w, t0, t1}]}] in scene-relative seconds (core.js draws them, the active word in the accent colour).
Rules (research/shorts_hooks.md): a chunk fits one line of `max_chars`; never end a line on a short word (в, на, и, не, к, с ...);
break after punctuation when possible; a chunk is held for at least MIN_HOLD seconds so it can be read. Timing is proportional to
characters inside the turn's [start, end]: exact for an estimated timeline, within ~100 ms of the audio for a real one until word
timestamps (whisper) replace it.
"""

import re
from typing import Any

import scenario

MIN_HOLD = 0.6
SHORT = re.compile(r"^(в|во|на|и|а|но|не|ни|к|ко|с|со|о|об|у|за|из|от|по|до|же|ли|бы|то|что|для|без|над|при|про|a|an|the|of|to|in)$", re.IGNORECASE)  # prepositions, conjunctions, particles: never end a line
BREAK_AFTER = re.compile(r"[,.;:!?…—–-]$")


def chunks(text: str, max_chars: int) -> list[list[str]]:
    """Words of a turn grouped into lines of at most `max_chars` characters, breaking after punctuation when it is close enough."""
    words = scenario.spoken(text).split()
    out: list[list[str]] = []
    cur: list[str] = []
    for i, w in enumerate(words):
        glue = SHORT.match(re.sub(r"\W", "", w)) and i + 1 < len(words)  # a short word never ends a line
        size = len(" ".join([*cur, w]))
        if cur and size > max_chars and not (cur and SHORT.match(re.sub(r"\W", "", cur[-1]))):
            out.append(cur)
            cur = []
        cur.append(w)
        line = len(" ".join(cur))
        if BREAK_AFTER.search(w) and line >= max_chars * 0.55 and not glue:
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return out


def captions(entries: list[dict[str, Any]], turns: list[dict[str, Any]], t0: float, max_chars: int) -> list[dict[str, Any]]:
    """Caption chunks for the given turns (timeline entries), times relative to the scene start `t0`."""
    out: list[dict[str, Any]] = []
    for e in turns:
        if e.get("voice") == "narrator" and not e.get("text"):
            continue
        lines = chunks(e["text"], max_chars)
        total = sum(len(" ".join(c)) for c in lines) or 1
        t = e["start"]
        span = e["end"] - e["start"]
        for c in lines:
            share = len(" ".join(c)) / total * span
            end = min(e["end"], t + max(share, MIN_HOLD)) if t + max(share, MIN_HOLD) <= e["end"] + 0.4 else e["end"]
            wt, ws = t, []
            wtotal = sum(len(w) + 1 for w in c)
            for w in c:
                dw = (end - t) * (len(w) + 1) / wtotal
                ws.append({"w": w, "t0": round(wt - t0, 3), "t1": round(wt + dw - t0, 3)})
                wt += dw
            out.append({"t0": round(t - t0, 3), "t1": round(end - t0, 3), "voice": e["voice"], "words": ws})
            t = end
    return out
