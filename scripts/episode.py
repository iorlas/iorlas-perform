"""episode.spec: the plan an episode is written from, before the script. Tools around it.

    uv run episode.py new WORLD SLUG [--format ID] [--template ID] [--target SECONDS] [--number N]
        write <world>/episodes/NN-SLUG.spec.json from a structure template; every decision is OPEN
    uv run episode.py expand SPEC [--script] [--write]
        outline: each beat's window and word budget (the budget is written into the spec); you fill
        the beats' `what`. With --script: a script skeleton whose beats are the spec's beats 1:1, as
        <!-- beat: ID --> comments, with the cast table and CARD; no turn is invented
    uv run episode.py check SPEC [SCRIPT] [--timeline FILE] [--audio WAV] [--strict]
        spec valid; the script's beats equal the spec's; the existing lint (under the template's
        rules); beat starts, hook window and total length against the rendered timeline (or an
        estimate from characters, warnings only); word rate; distinctness against earlier episodes
    uv run episode.py distinct SPEC
        novelty keys against the last N episodes of the world (distinct.py)

The world is the folder holding episodes/, found from the spec's path or `--world`.
See docs/contracts/episode-spec.md.
"""

import dataclasses
import re
import sys
import wave
from pathlib import Path
from typing import Any

import contract
import distinct
import scenario
from contract import OPEN, Finding

BEAT_NAMES = ("hook", "setup", "incident", "ladder", "turn", "button", "tag")
STATUSES = ("draft", "scripted", "rendered", "published", "dropped")
SKELETON_TEXT = {"hook": "hook line"}


def world_of(spec_path: Path, arg: str | None = None) -> Path | None:
    if arg:
        return contract.world_dir(arg)
    return spec_path.resolve().parent.parent if spec_path.resolve().parent.name == "episodes" else None


def words(text: str) -> int:
    return len(re.findall(r"\w+", text))


def template_of(spec: dict[str, Any], world: Path | None) -> dict[str, Any] | None:
    name = (spec.get("structure") or {}).get("template")
    return contract.templates(world).get(name) if isinstance(name, str) else None


def new_spec(
    world: Path, slug: str, *, fmt: str, template: str | None = None, target: float | None = None, number: int | None = None
) -> dict[str, Any]:
    fmts = contract.formats(world)
    if fmt not in fmts:
        sys.exit(f"unknown format {fmt}; known: {', '.join(fmts)}")
    tpls = contract.templates(world)
    template = template or fmts[fmt]["structure_templates"][0]
    if template not in tpls or tpls[template]["format"] != fmt:
        sys.exit(f"template {template} is not a {fmt} template; known: {', '.join(fmts[fmt]['structure_templates'])}")
    t = tpls[template]
    k = (target or t["total_s"]) / t["total_s"]
    beats = [
        {"id": b["id"], "start_s": round(b["start_s"] * k * 2) / 2, "end_s": round(b["end_s"] * k * 2) / 2, "what": OPEN}
        for b in t["beats"]
    ]
    if number is None:
        number = max((s["number"] for s in distinct.ledger(world) if isinstance(s.get("number"), int)), default=0) + 1
    return {
        "schema": "episode.spec/1",
        "number": number,
        "slug": slug,
        "status": "draft",
        "format": fmt,
        "title": {"working": OPEN, "pattern": OPEN},
        "hook": {"pattern": OPEN, "line": OPEN, "voice": OPEN, "on_screen": OPEN, "by_s": fmts[fmt]["hook_window_s"]},
        "premise": {"text": OPEN, "key": OPEN},
        "mechanism": OPEN,
        "outcome": {"type": OPEN, "note": OPEN},
        "set": OPEN,
        "cast": OPEN,
        "structure": {"template": template, "target_s": round(beats[-1]["end_s"], 1), "tolerance_s": t["tolerance_s"], "beats": beats},
        "subtitles": {"style": OPEN},
        "cover": {"style": OPEN, "text": OPEN},
        "experiments": [],
    }


def validate(spec: dict[str, Any], world: Path | None = None) -> list[Finding]:
    out: list[Finding] = []
    if spec.get("schema") != "episode.spec/1":
        out.append(("error", "schema", "expected episode.spec/1"))
    contract.need(spec, "slug", str, "", out)
    if "number" in spec and not isinstance(spec["number"], int):
        out.append(("error", "number", "expected int"))
    if "status" in spec:
        contract.one_of(spec["status"], STATUSES, "status", out, what="status")
    fmts = contract.formats(world)
    fid = contract.need(spec, "format", str, "", out)
    contract.one_of(fid, fmts, "format", out, what="format")
    fmt = fmts.get(fid or "")
    title = contract.need(spec, "title", dict, "", out) or {}
    contract.need(title, "working", str, "title", out)
    contract.need(title, "pattern", str, "title", out)
    out += validate_hook(spec, fmt, world)
    prem = contract.need(spec, "premise", dict, "", out) or {}
    contract.need(prem, "text", str, "premise", out)
    contract.need(prem, "key", str, "premise", out)
    contract.need(spec, "mechanism", str, "", out)
    outc = contract.need(spec, "outcome", dict, "", out) or {}
    contract.need(outc, "type", str, "outcome", out)
    contract.need(outc, "note", str, "outcome", out)
    contract.need(spec, "set", str, "", out)
    cast = contract.need(spec, "cast", list, "", out)
    if cast is not None and not cast:
        out.append(("error", "cast", "empty: list the voices"))
    sub = contract.need(spec, "subtitles", dict, "", out) or {}
    contract.need(sub, "style", str, "subtitles", out)
    cov = contract.need(spec, "cover", dict, "", out) or {}
    contract.need(cov, "style", str, "cover", out)
    contract.need(cov, "text", str, "cover", out)
    out += validate_structure(spec, fmt, world)
    out += validate_experiments(spec, world)
    return out


def validate_hook(spec: dict[str, Any], fmt: dict[str, Any] | None, world: Path | None) -> list[Finding]:
    out: list[Finding] = []
    hook = contract.need(spec, "hook", dict, "", out)
    if hook is None:
        return out
    pat = contract.need(hook, "pattern", str, "hook", out)
    contract.one_of(pat, contract.hooks(world), "hook.pattern", out, what="hook pattern")
    line = contract.need(hook, "line", str, "hook", out)
    contract.need(hook, "voice", str, "hook", out)
    shown = contract.need(hook, "on_screen", str, "hook", out)
    by = contract.need(hook, "by_s", (int, float), "hook", out)
    if fmt:
        if line and words(line) > fmt["hook_max_words"]:
            out.append(("error", "hook.line", f"{words(line)} words, at most {fmt['hook_max_words']}"))
        if shown and words(shown) > fmt["hook_on_screen_max_words"]:
            out.append(("warn", "hook.on_screen", f"{words(shown)} words on screen, at most {fmt['hook_on_screen_max_words']}"))
        if by is not None and by > fmt["hook_window_s"]:
            out.append(("error", "hook.by_s", f"{by} s is past the format's hook window {fmt['hook_window_s']} s"))
    return out


def validate_structure(spec: dict[str, Any], fmt: dict[str, Any] | None, world: Path | None) -> list[Finding]:
    out: list[Finding] = []
    st = contract.need(spec, "structure", dict, "", out)
    if st is None:
        return out
    tpls = contract.templates(world)
    tname = contract.need(st, "template", str, "structure", out)
    contract.one_of(tname, tpls, "structure.template", out, what="template")
    tpl = tpls.get(tname or "")
    if tpl and spec.get("format") != tpl["format"]:
        out.append(("error", "structure.template", f"{tname} is for {tpl['format']}, the episode is {spec.get('format')}"))
    beats = contract.need(st, "beats", list, "structure", out) or []
    prev_end = 0.0
    for i, b in enumerate(beats):
        w = f"structure.beats[{i}]"
        if b.get("id") not in BEAT_NAMES:
            out.append(("error", w, f"unknown beat id «{b.get('id')}»; known: {', '.join(BEAT_NAMES)}"))
        s, e = b.get("start_s"), b.get("end_s")
        if not isinstance(s, (int, float)) or not isinstance(e, (int, float)) or e <= s:
            out.append(("error", w, "start_s and end_s must be numbers, end after start"))
            continue
        if abs(s - prev_end) > 0.01:
            out.append(("error", w, f"starts at {s} s, the previous beat ended at {prev_end} s"))
        prev_end = e
        contract.need(b, "what", str, w, out)
    if beats and tpl and [b.get("id") for b in beats] != [b["id"] for b in tpl["beats"]]:
        out.append(("warn", "structure.beats", f"beat sequence differs from template {tname}"))
    if beats and fmt:
        hard, strict = fmt["hard_max_s"], fmt.get("hard_max_strict")
        if prev_end >= hard if strict else prev_end > hard:
            out.append(("error", "structure.beats", f"plan ends at {prev_end} s: the format's hard max is {hard} s"))
        elif not fmt["target_s"][0] <= prev_end <= fmt["target_s"][1]:
            out.append(
                (
                    "warn",
                    "structure.beats",
                    f"plan ends at {prev_end} s, the format's target is {fmt['target_s'][0]}-{fmt['target_s'][1]} s",
                )
            )
    return out


def validate_experiments(spec: dict[str, Any], world: Path | None) -> list[Finding]:
    ids = spec.get("experiments", [])
    if not isinstance(ids, list):
        return [("error", "experiments", "expected a list of experiment ids")]
    if world and (f := world / "experiments.json").exists():
        known = {e["id"] for e in contract.read_json(f).get("experiments", [])}
        return [("error", f"experiments[{i}]", f"unknown experiment «{x}»") for i, x in enumerate(ids) if x not in known]
    return [("warn", "experiments", f"no experiments.json in the world: {', '.join(ids)} unchecked")] if ids else []


# --- expand -------------------------------------------------------------------------------------


def budget(beat: dict[str, Any], fmt: dict[str, Any]) -> list[int]:
    secs = beat["end_s"] - beat["start_s"]
    lo, hi = fmt["words_per_s"]
    return [round(secs * lo), round(secs * hi)]


def outline(spec: dict[str, Any], world: Path | None) -> str:
    fmt = contract.formats(world)[spec["format"]]
    tpl = template_of(spec, world) or {"beats": []}
    roles = {i: b["role"] for i, b in enumerate(tpl["beats"])}
    for b in spec["structure"]["beats"]:
        b["words"] = budget(b, fmt)
    rows = ["| # | beat | window | words | role | what |", "|---|---|---|---|---|---|"]
    for i, b in enumerate(spec["structure"]["beats"]):
        window, lo_hi = f"{b['start_s']:g}-{b['end_s']:g} s", f"{b['words'][0]}-{b['words'][1]}"
        rows.append(f"| {i + 1} | {b['id']} | {window} | {lo_hi} | {roles.get(i, '')} | {b['what']} |")
    st = spec["structure"]
    head = f"# {spec.get('slug')}: outline\n\nFormat {spec['format']}, template {st['template']}, plan {st['target_s']} s.\n\n"
    return (
        head
        + "\n".join(rows)
        + "\n\nFill each beat's `what` in the spec (one line: what happens, who says what), then `expand --script`.\n"
    )


def skeleton(spec: dict[str, Any], world: Path | None) -> str:
    tpl = template_of(spec, world) or {"beats": []}
    roles = {i: b["role"] for i, b in enumerate(tpl["beats"])}
    fmt = contract.formats(world)[spec["format"]]
    desc: dict[str, str] = {}
    if world and (world / "characters.md").exists():
        desc = scenario.registry(world)
    cast = spec["cast"] if isinstance(spec.get("cast"), list) else []
    title = spec["title"]["working"] if spec.get("title", {}).get("working") not in (None, OPEN) else spec["slug"]
    total = spec["structure"]["beats"][-1]["end_s"]
    hook = spec["hook"]
    lines = [
        f"# {title}",
        "",
        f"<!-- length: {total / 60:.2f} -->",
        "",
        "<!-- From " + f"{spec['slug']}.spec.json, format {spec['format']}, template {spec['structure']['template']}.",
        "",
        "CARD",
        f"- Premise: {spec['premise']['text']}",
        f"- Mechanism: {spec['mechanism']}. Outcome: {spec['outcome']['type']} ({spec['outcome']['note']}).",
        f"- Set: {spec['set']}.",
        f"- Hook ({hook['pattern']}), {hook['voice']}, by {hook['by_s']} s: {hook['line']}",
        "- Wants: OPEN",
        "- Knows at start: OPEN",
        "- Turn owner: OPEN -->",
        "",
        "## Cast",
        "",
        "| voice | who |",
        "|---|---|",
        *[f"| {v} | {desc.get(v, OPEN)} |" for v in cast],
        "",
        "## Map",
        "",
        "| id | kind | who | what | because | knows | via | shown |",
        "|---|---|---|---|---|---|---|---|",
        "",
        f"## {spec['set']}",
        "",
    ]
    for i, b in enumerate(spec["structure"]["beats"]):
        lo, hi = budget(b, fmt)
        lines += [
            f"<!-- beat: {b['id']} -->",
            f"<!-- spec {b['start_s']:g}-{b['end_s']:g} s, {lo}-{hi} words. {roles.get(i, '')}. what: {b['what']} -->",
            "",
        ]
    return "\n".join(lines)


# --- check --------------------------------------------------------------------------------------


def load_timeline(path: Path) -> tuple[list[dict[str, Any]], float | None]:
    """(entries, duration or None) from a v1 list or a timeline/2 object."""
    data = contract.read_json(path)
    if isinstance(data, dict):
        return data.get("entries", []), data.get("duration")
    return data, None


def wav_seconds(path: Path) -> float | None:
    try:
        with wave.open(str(path)) as w:
            return w.getnframes() / w.getframerate()
    except (wave.Error, EOFError, OSError):
        pass
    try:
        import soundfile

        info = soundfile.info(str(path))
        return info.frames / info.samplerate
    except Exception:  # noqa: BLE001
        return None


def lint_findings(sc: scenario.Scenario, tpl: dict[str, Any] | None) -> list[Finding]:
    if tpl and tpl.get("rules"):
        rules = {k: tuple(v) if isinstance(v, list) else v for k, v in tpl["rules"].items()}
        sc.rules = dataclasses.replace(sc.rules, **rules)
    return [(lv if lv == "error" else "warn", f"script:{n}", f"lint: {msg}") for lv, n, msg in scenario.lint(sc)]


def check_beats(spec: dict[str, Any], sc: scenario.Scenario) -> list[Finding]:
    want = [b["id"] for b in spec["structure"]["beats"]]
    got = [key for kind, key, _ in sc.marks if kind == "beat"]
    if got == want:
        return []
    out: list[Finding] = []
    for key in sorted(set(want) - set(got)):
        out.append(("error", "script", f"spec beat «{key}» has no <!-- beat: {key} --> in the script"))
    for key in sorted(set(got) - set(want)):
        out.append(("error", "script", f"script beat «{key}» is not in the spec"))
    if not out:
        out.append(("error", "script", f"beats {got} do not match the spec's {want}: count or order differs"))
    return out


def beat_starts(sc: scenario.Scenario, entries: list[dict[str, Any]]) -> tuple[list[tuple[str, float]], list[Finding]]:
    """Each beat mark's start second: the first rendered turn after the mark."""
    timed = [e for e in entries if "turn" in e]
    turns = sc.turns
    if len(timed) != len(turns):
        return [], [
            ("error", "timeline", f"{len(timed)} turns rendered, the script has {len(turns)}: the timeline is from another version")
        ]
    for t, e in zip(turns, timed, strict=True):
        if t.text != e.get("text"):
            return [], [("error", "timeline", f"turn at script line {t.line} differs from the rendered one: re-render")]
    starts = []
    for kind, key, line in sc.marks:
        if kind == "beat":
            nxt = next((e for t, e in zip(turns, timed, strict=True) if t.line > line), None)
            starts.append((key, nxt["start"] if nxt else float("inf")))
    return starts, []


def check_timing(
    spec: dict[str, Any], sc: scenario.Scenario, entries: list[dict[str, Any]], total: float, fmt: dict[str, Any], *, exact: bool
) -> list[Finding]:
    out: list[Finding] = []
    lv = "error" if exact else "warn"
    src = "rendered" if exact else "estimated from characters"
    hard, strict = fmt["hard_max_s"], fmt.get("hard_max_strict")
    if total >= hard if strict else total > hard:
        out.append((lv, "length", f"{total:.1f} s {src}: the gate is {'under' if strict else 'at most'} {hard} s"))
    elif not fmt["target_s"][0] <= total <= fmt["target_s"][1]:
        out.append(("warn", "length", f"{total:.1f} s {src}, the format's target is {fmt['target_s'][0]}-{fmt['target_s'][1]} s"))
    n_words = sum(words(scenario.spoken(t.text)) for t in sc.turns)
    if total > 0 and sc.turns:
        rate = n_words / total
        lo, hi = fmt["words_per_s"]
        if not lo <= rate <= hi:
            out.append(("warn", "word-rate", f"{rate:.2f} words/s ({n_words} words in {total:.1f} s), sane band {lo}-{hi}"))
    if exact:
        out += check_beat_times(spec, sc, entries, fmt)
    return out


def check_beat_times(spec: dict[str, Any], sc: scenario.Scenario, entries: list[dict[str, Any]], fmt: dict[str, Any]) -> list[Finding]:
    out: list[Finding] = []
    starts, errs = beat_starts(sc, entries)
    if errs:
        return errs
    tol = spec["structure"].get("tolerance_s", 4)
    plan = spec["structure"]["beats"]
    if len(starts) == len(plan):
        for (key, at), b in zip(starts, plan, strict=True):
            if at == float("inf"):
                out.append(("error", f"beat {key}", "no turn after the beat mark"))
            elif abs(at - b["start_s"]) > tol:
                out.append(("error", f"beat {key}", f"starts at {at:.1f} s, planned {b['start_s']:g} s (tolerance {tol:g} s)"))
    timed = [e for e in entries if "turn" in e]
    if timed:
        by = spec["hook"]["by_s"] if isinstance(spec["hook"].get("by_s"), (int, float)) else fmt["hook_window_s"]
        if timed[0]["start"] > fmt["hook_voice_by_s"]:
            out.append(("warn", "hook", f"first voice at {timed[0]['start']:.2f} s, the format wants it by {fmt['hook_voice_by_s']} s"))
        hook_at = next((ln for kind, key, ln in sc.marks if kind == "beat" and key == "hook"), 0)
        hook_turn = next((e for t, e in zip(sc.turns, timed, strict=True) if t.line > hook_at), None)
        if hook_turn and hook_turn["end"] > by:
            out.append(("error", "hook", f"the hook turn ends at {hook_turn['end']:.1f} s, the hook must land by {by:g} s"))
    return out


def check_hook_text(spec: dict[str, Any], sc: scenario.Scenario) -> list[Finding]:
    line = spec["hook"].get("line")
    if contract.is_open(line):
        return []
    norm = lambda s: re.sub(r"\W+", " ", s.lower()).strip()  # noqa: E731
    first = next((t for t in sc.turns), None)
    beat_line = next((ln for k, key, ln in sc.marks if k == "beat" and key == "hook"), None)
    pool = [t for t in sc.turns if beat_line is not None and t.line > beat_line][:2] or ([first] if first else [])
    if not any(norm(line) in norm(scenario.spoken(t.text)) for t in pool):
        return [("warn", "hook", "the spec's hook line is not in the script's hook beat")]
    return []


def check_cast(spec: dict[str, Any], sc: scenario.Scenario) -> list[Finding]:
    if not isinstance(spec.get("cast"), list) or not sc.cast:
        return []
    out: list[Finding] = [("error", "cast", f"spec cast «{v}» is not in the script's Cast table") for v in spec["cast"] if v not in sc.cast]
    used = {t.voice for t in sc.turns} - {"narrator"}
    out += [("warn", "cast", f"voice «{v}» speaks but is not in the spec cast") for v in sorted(used - set(spec["cast"]))]
    return out


def check_distinct(spec: dict[str, Any], world: Path | None) -> list[Finding]:
    if not world:
        return []
    eps = distinct.ledger(world)
    mine = spec.get("slug")
    num = spec.get("number") if isinstance(spec.get("number"), int) else 10**9
    before = [e for e in eps if e.get("slug") != mine and (e.get("number") if isinstance(e.get("number"), int) else 10**9) < num]
    return distinct.compare(spec, before, distinct.limits(world))


def check(
    spec: dict[str, Any], world: Path | None, *, script: Path | None = None, timeline: Path | None = None, audio: Path | None = None
) -> list[Finding]:
    out = validate(spec, world)
    if any(f[0] == "error" and f[1] in ("schema", "format") for f in out):
        return out
    out += check_distinct(spec, world)
    if not script:
        return out
    fmt = contract.formats(world)[spec["format"]]
    sc = scenario.load(script)
    out += check_beats(spec, sc) + check_cast(spec, sc) + check_hook_text(spec, sc)
    out += lint_findings(sc, template_of(spec, world))
    entries: list[dict[str, Any]] = []
    total: float | None = None
    if timeline:
        entries, dur = load_timeline(timeline)
        total = dur
    if audio:
        total = wav_seconds(audio) or total
    exact = total is not None or bool(entries)
    if total is None and entries:
        total = max(e["end"] for e in entries)
        out.append(("warn", "length", "no audio file: length taken from the timeline's last end"))
    if total is None:
        total = scenario.seconds_at(sc, 10**9)
        out.append(("warn", "timeline", "no --timeline/--audio: timing is estimated from characters, not checked"))
    out += check_timing(spec, sc, entries, total, fmt, exact=exact and bool(entries or audio))
    return out


# --- cli ----------------------------------------------------------------------------------------


def opt(argv: list[str], name: str) -> str | None:
    return argv[argv.index(name) + 1] if name in argv else None


def main(argv: list[str]) -> int:
    if len(argv) < 3 or argv[1] not in ("new", "expand", "check", "distinct"):
        print(__doc__)
        return 2
    cmd = argv[1]
    flags = {"--format", "--template", "--target", "--number", "--world", "--timeline", "--audio"}
    pos = [a for i, a in enumerate(argv[2:], 2) if not a.startswith("--") and argv[i - 1] not in flags]
    if cmd == "new":
        if len(pos) != 2:
            print(__doc__)
            return 2
        world = contract.world_dir(pos[0])
        spec = new_spec(
            world, pos[1], fmt=opt(argv, "--format") or "shorts-9x16-60s", template=opt(argv, "--template"),
            target=float(t) if (t := opt(argv, "--target")) else None, number=int(n) if (n := opt(argv, "--number")) else None,
        )  # fmt: skip
        f = world / "episodes" / f"{spec['number']:02d}-{pos[1]}.spec.json"
        if f.exists():
            sys.exit(f"{f} exists")
        contract.write_json(f, spec)
        print(f"[perform] wrote {f}: {len(list(contract.walk_open(spec)))} OPEN fields")
        return 0
    spec_path = Path(pos[0])
    spec = contract.read_json(spec_path)
    world = world_of(spec_path, opt(argv, "--world"))
    if cmd == "expand":
        text = outline(spec, world)
        contract.write_json(spec_path, spec)  # the word budgets
        if "--script" in argv:
            text = skeleton(spec, world)
            dest = spec_path.with_name(spec_path.name.removesuffix(".spec.json") + ".md")
            if "--write" in argv:
                if dest.exists():
                    sys.exit(f"{dest} exists: a script is never overwritten")
                dest.write_text(text)
                print(f"[perform] wrote {dest}")
                return 0
        print(text)
        return 0
    if cmd == "distinct":
        findings = check_distinct(spec, world)
    else:
        findings = check(
            spec, world, script=Path(pos[1]) if len(pos) > 1 else None,
            timeline=Path(t) if (t := opt(argv, "--timeline")) else None, audio=Path(a) if (a := opt(argv, "--audio")) else None,
        )  # fmt: skip
    return 0 if contract.report(findings, str(spec_path), strict_open="--strict" in argv) else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
