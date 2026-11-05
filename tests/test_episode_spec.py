"""Episode backbone: world.brief, episode.spec, distinct, experiments, platform_rules.

    uv run --with pytest pytest tests/test_episode_spec.py

The vadik world in tests/fixtures/worlds is example data used only here; the neutral world
proves the tools need no particular world.
"""

import copy
import datetime as dt
import json
import re
import shutil
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import contract  # noqa: E402
import distinct  # noqa: E402
import episode  # noqa: E402
import experiments  # noqa: E402
import policy  # noqa: E402
import world as worldmod  # noqa: E402

FIX = ROOT / "tests" / "fixtures" / "worlds"
EP = "01-deploy"


@pytest.fixture
def vadik(tmp_path: Path) -> Path:
    dest = tmp_path / "vadik"
    shutil.copytree(FIX / "vadik", dest)
    return dest


@pytest.fixture
def neutral(tmp_path: Path) -> Path:
    dest = tmp_path / "neutral"
    shutil.copytree(FIX / "neutral", dest)
    return dest


def spec_of(w: Path, name: str = EP) -> dict:
    return json.loads((w / "episodes" / f"{name}.spec.json").read_text())


def levels(findings: list, level: str) -> list[str]:
    return [f"{where}: {msg}" for lv, where, msg in findings if lv == level]


def has(findings: list, level: str, text: str) -> bool:
    return any(text in m for m in levels(findings, level))


def run_check(w: Path, spec: dict, **kw) -> list:
    return episode.check(spec, w, **kw)


def paths(w: Path, name: str = EP) -> dict:
    return {"script": w / "episodes" / f"{name}.md", "timeline": w / "episodes" / f"{name}.timeline.json"}


# --- world.brief --------------------------------------------------------------------------------


def test_brief_template_is_all_open(neutral: Path):
    f = neutral / "world.brief.json"
    assert worldmod.main(["world.py", "new", str(neutral)]) == 0
    brief = json.loads(f.read_text())
    findings = worldmod.validate(brief, neutral)
    assert not levels(findings, "error")
    assert {w for lv, w, _ in findings if lv == "open"} >= {
        "platforms",
        "formats",
        "audience",
        "genre",
        "tone",
        "cadence",
        "policy",
        "metrics",
        "length_s",
    }


def test_brief_new_never_overwrites(neutral: Path):
    worldmod.main(["world.py", "new", str(neutral)])
    with pytest.raises(SystemExit):
        worldmod.main(["world.py", "new", str(neutral)])


def test_brief_fixture_is_valid(vadik: Path):
    assert worldmod.validate(json.loads((vadik / "world.brief.json").read_text()), vadik) == []


def test_brief_unknown_format_and_metric(vadik: Path):
    b = json.loads((vadik / "world.brief.json").read_text())
    b["formats"] = ["shorts-9x16-60s", "square-1x1"]
    b["metrics"]["primary"] = "vibes"
    f = worldmod.validate(b, vadik)
    assert has(f, "error", "unknown format «square-1x1»")
    assert has(f, "error", "unknown metric «vibes»")


def test_brief_length_above_format_max_warns(vadik: Path):
    b = json.loads((vadik / "world.brief.json").read_text())
    b["length_s"] = {"min": 45, "max": 90}
    assert has(worldmod.validate(b, vadik), "warn", "above shorts-9x16-60s's hard max")
    b["length_s"] = {"min": 90, "max": 45}
    assert has(worldmod.validate(b, vadik), "error", "min above max")


def test_brief_wrong_type_is_an_error(vadik: Path):
    b = json.loads((vadik / "world.brief.json").read_text())
    b["cadence"] = "often"
    assert has(worldmod.validate(b, vadik), "error", "expected dict")


# --- episode.spec -------------------------------------------------------------------------------


def test_new_spec_from_template_scales_and_is_open(vadik: Path):
    s = episode.new_spec(vadik, "fresh", fmt="shorts-9x16-60s", target=26)
    assert s["number"] == 5
    ids = [b["id"] for b in s["structure"]["beats"]]
    assert ids == ["hook", "setup", "incident", "ladder", "ladder", "turn", "button"]
    assert s["structure"]["beats"][-1]["end_s"] == 26
    assert s["mechanism"] == "OPEN" and s["hook"]["line"] == "OPEN"
    f = episode.validate(s, vadik)
    assert not levels(f, "error")
    assert {"mechanism", "hook.line", "premise.key", "set", "cast"} <= {w for lv, w, _ in f if lv == "open"}


def test_new_via_cli_writes_numbered_file(neutral: Path):
    assert episode.main(["episode.py", "new", str(neutral), "pilot"]) == 0
    assert (neutral / "episodes" / "01-pilot.spec.json").exists()
    assert episode.main(["episode.py", "new", str(neutral), "second", "--format", "landscape-16x9-3min"]) == 0
    assert (neutral / "episodes" / "02-second.spec.json").exists()


def test_new_rejects_wrong_template_for_format(vadik: Path):
    with pytest.raises(SystemExit):
        episode.new_spec(vadik, "x", fmt="shorts-9x16-60s", template="landscape-3min-v1")


def test_fixture_spec_is_valid(vadik: Path):
    assert not levels(episode.validate(spec_of(vadik), vadik), "error")


def test_all_templates_use_known_beats_and_fit_their_format():
    fmts = contract.formats()
    for name, t in contract.templates().items():
        assert t["format"] in fmts, name
        assert [b["id"] for b in t["beats"]][0] == "hook", name
        assert t["beats"][0]["start_s"] == 0
        for a, b in zip(t["beats"], t["beats"][1:], strict=False):
            assert a["end_s"] == b["start_s"], f"{name}: gap after {a['id']}"
        assert {b["id"] for b in t["beats"]} <= set(episode.BEAT_NAMES)
        assert t["beats"][-1]["end_s"] == t["total_s"]
        f = fmts[t["format"]]
        assert t["total_s"] < f["hard_max_s"] or not f["hard_max_strict"]
        assert name in f["structure_templates"]
        assert set(t["rules"]) <= set(__import__("scenario").Rules.__dataclass_fields__)


def test_hook_line_word_cap_and_window(vadik: Path):
    s = spec_of(vadik)
    s["hook"]["line"] = " ".join(["слово"] * 13)
    s["hook"]["by_s"] = 5
    s["hook"]["on_screen"] = "раз два три четыре пять шесть семь"
    f = episode.validate(s, vadik)
    assert has(f, "error", "13 words, at most 12")
    assert has(f, "error", "past the format's hook window 3 s")
    assert has(f, "warn", "7 words on screen")


def test_unknown_hook_pattern_and_mechanism_types(vadik: Path):
    s = spec_of(vadik)
    s["hook"]["pattern"] = "shout"
    s["cast"] = []
    s["mechanism"] = 3
    f = episode.validate(s, vadik)
    assert has(f, "error", "unknown hook pattern «shout»")
    assert has(f, "error", "cast: empty")
    assert has(f, "error", "mechanism: expected str")


def test_beats_must_be_contiguous_and_known(vadik: Path):
    s = spec_of(vadik)
    s["structure"]["beats"][2]["start_s"] += 1
    s["structure"]["beats"][3]["id"] = "climax"
    f = episode.validate(s, vadik)
    assert has(f, "error", "the previous beat ended")
    assert has(f, "error", "unknown beat id «climax»")


def test_plan_past_hard_max_is_an_error_for_shorts_not_landscape(vadik: Path):
    s = spec_of(vadik)
    s["structure"]["beats"][-1]["end_s"] = 60
    assert has(episode.validate(s, vadik), "error", "hard max is 60 s")
    s["structure"]["beats"][-1]["end_s"] = 59
    assert not has(episode.validate(s, vadik), "error", "hard max")


def test_template_must_match_format(vadik: Path):
    s = spec_of(vadik)
    s["structure"]["template"] = "landscape-3min-v1"
    assert has(episode.validate(s, vadik), "error", "is for landscape-16x9-3min")


def test_unknown_experiment_id_is_an_error(vadik: Path):
    experiments.main(["experiments.py", "init", str(vadik)]) if not (vadik / "experiments.json").exists() else None
    s = spec_of(vadik)
    s["experiments"] = ["subs-karaoke-colour", "made-up"]
    f = episode.validate(s, vadik)
    assert has(f, "error", "unknown experiment «made-up»")
    assert not has(f, "error", "subs-karaoke-colour")


def test_world_specific_vocab_is_free_text(neutral: Path):
    s = episode.new_spec(neutral, "a", fmt="shorts-9x16-60s")
    s["mechanism"] = "any-id-the-world-likes"
    assert not has(episode.validate(s, neutral), "error", "mechanism")


# --- expand -------------------------------------------------------------------------------------


def test_expand_writes_word_budgets_and_outline(vadik: Path):
    spec_path = vadik / "episodes" / f"{EP}.spec.json"
    assert episode.main(["episode.py", "expand", str(spec_path)]) == 0
    s = spec_of(vadik)
    hook = s["structure"]["beats"][0]
    assert hook["words"] == [round(3 * 1.4), round(3 * 3.2)]
    assert "| 1 | hook | 0-3 s |" in episode.outline(s, vadik)


def test_skeleton_beats_map_one_to_one_and_lint_has_no_errors(vadik: Path):
    spec = spec_of(vadik, "03-standup")
    sk = episode.skeleton(spec, vadik)
    f = vadik / "episodes" / "skel.md"
    f.write_text(sk)
    sc = episode.scenario.load(f)
    assert [k for kind, k, _ in sc.marks if kind == "beat"] == [b["id"] for b in spec["structure"]["beats"]]
    assert not [i for i in episode.scenario.lint(sc) if i[0] == "error"]
    assert set(sc.cast) == {"vadik", "palych"}
    assert sc.cast["vadik"].startswith("Вадик")  # described from the world's characters.md
    assert sc.turns == []  # no line is invented
    assert abs(sc.length - spec["structure"]["target_s"] / 60) < 0.01


def test_skeleton_cast_without_characters_file_is_open(neutral: Path):
    s = episode.new_spec(neutral, "a", fmt="shorts-9x16-60s")
    s["cast"] = ["ann", "bob"]
    assert "| ann | OPEN |" in episode.skeleton(s, neutral)


def test_expand_script_never_overwrites(vadik: Path):
    spec_path = vadik / "episodes" / "02-backup.spec.json"
    assert episode.main(["episode.py", "expand", str(spec_path), "--script", "--write"]) == 0
    with pytest.raises(SystemExit):
        episode.main(["episode.py", "expand", str(spec_path), "--script", "--write"])


# --- check: spec against script and timeline ----------------------------------------------------


def test_check_passes_on_a_matching_script(vadik: Path):
    f = run_check(vadik, spec_of(vadik), **paths(vadik))
    assert not levels(f, "error"), levels(f, "error")


def test_check_beat_missing_extra_and_order(vadik: Path):
    s = spec_of(vadik)
    s["structure"]["beats"].insert(1, {"id": "tag", "start_s": 3, "end_s": 3.5, "what": "x"})
    for b in s["structure"]["beats"][2:]:
        b["start_s"] += 0.5
        b["end_s"] += 0.5
    f = run_check(vadik, s, script=paths(vadik)["script"])
    assert has(f, "error", "spec beat «tag» has no")
    s2 = spec_of(vadik)
    s2["structure"]["beats"][5]["id"], s2["structure"]["beats"][6]["id"] = "button", "turn"
    assert has(run_check(vadik, s2, script=paths(vadik)["script"]), "error", "count or order differs")


def test_check_timing_within_and_outside_tolerance(vadik: Path):
    s = spec_of(vadik)
    s["structure"]["beats"][5]["start_s"] = 20  # planned turn at 20 s, rendered at ~30.5 s
    s["structure"]["beats"][4]["end_s"] = 20
    f = run_check(vadik, s, **paths(vadik))
    assert has(f, "error", "beat turn: starts at 30.")
    assert not has(run_check(vadik, spec_of(vadik), **paths(vadik)), "error", "starts at")


def test_check_hook_must_land_inside_the_window(vadik: Path):
    tl = json.loads(paths(vadik)["timeline"].read_text())
    tl[0]["end"] = 4.5
    shifted = vadik / "tl.json"
    shifted.write_text(json.dumps(tl))
    f = run_check(vadik, spec_of(vadik), script=paths(vadik)["script"], timeline=shifted)
    assert has(f, "error", "the hook turn ends at 4.5 s, the hook must land by 3 s")


def test_check_first_voice_late_warns(vadik: Path):
    tl = json.loads(paths(vadik)["timeline"].read_text())
    tl[0]["start"] = 1.2
    shifted = vadik / "tl.json"
    shifted.write_text(json.dumps(tl))
    f = run_check(vadik, spec_of(vadik), script=paths(vadik)["script"], timeline=shifted)
    assert has(f, "warn", "first voice at 1.20 s")


def test_check_length_gate_uses_real_audio_duration(vadik: Path):
    pkg = paths(vadik)
    v2 = {"schema": "timeline/2", "duration": 61.0, "entries": json.loads(pkg["timeline"].read_text())}
    f2 = vadik / "tl2.json"
    f2.write_text(json.dumps(v2))
    f = run_check(vadik, spec_of(vadik), script=pkg["script"], timeline=f2)
    assert has(f, "error", "61.0 s rendered: the gate is under 60 s")
    v2["duration"] = 60.0
    f2.write_text(json.dumps(v2))
    assert has(run_check(vadik, spec_of(vadik), script=pkg["script"], timeline=f2), "error", "60.0 s rendered")
    v2["duration"] = 59.9
    f2.write_text(json.dumps(v2))
    assert not has(run_check(vadik, spec_of(vadik), script=pkg["script"], timeline=f2), "error", "gate is")


def test_check_length_from_wav(vadik: Path):
    import wave

    wav = vadik / "a.wav"
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(8000)
        w.writeframes(b"\0\0" * 8000 * 61)
    f = run_check(vadik, spec_of(vadik), script=paths(vadik)["script"], timeline=paths(vadik)["timeline"], audio=wav)
    assert has(f, "error", "61.0 s rendered")


def test_check_short_audio_warns_against_target(vadik: Path):
    v2 = {"schema": "timeline/2", "duration": 30.0, "entries": json.loads(paths(vadik)["timeline"].read_text())}
    f2 = vadik / "tl2.json"
    f2.write_text(json.dumps(v2))
    f = run_check(vadik, spec_of(vadik), script=paths(vadik)["script"], timeline=f2)
    assert has(f, "warn", "30.0 s rendered, the format's target is 45-58 s")


def test_check_word_rate_sanity(vadik: Path):
    v2 = {"schema": "timeline/2", "duration": 50.0, "entries": json.loads(paths(vadik)["timeline"].read_text())}
    f2 = vadik / "tl2.json"
    f2.write_text(json.dumps(v2))
    spec = spec_of(vadik)
    assert not has(run_check(vadik, spec, script=paths(vadik)["script"], timeline=f2), "warn", "words/s")
    for secs in (75.0, 20.0):  # far slower, far faster than the band
        v2["duration"] = secs
        f2.write_text(json.dumps(v2))
        assert has(run_check(vadik, spec, script=paths(vadik)["script"], timeline=f2), "warn", "words/s")


def test_check_without_timeline_estimates_and_never_errors_on_timing(vadik: Path):
    f = run_check(vadik, spec_of(vadik), script=paths(vadik)["script"])
    assert has(f, "warn", "timing is estimated from characters")
    assert not has(f, "error", "starts at")


def test_check_timeline_from_another_version_is_an_error(vadik: Path):
    tl = json.loads(paths(vadik)["timeline"].read_text())[:-1]
    short = vadik / "tl.json"
    short.write_text(json.dumps(tl))
    f = run_check(vadik, spec_of(vadik), script=paths(vadik)["script"], timeline=short)
    assert has(f, "error", "turns rendered, the script has")
    tl = json.loads(paths(vadik)["timeline"].read_text())
    tl[2]["text"] = "[calm] другой текст"
    short.write_text(json.dumps(tl))
    assert has(run_check(vadik, spec_of(vadik), script=paths(vadik)["script"], timeline=short), "error", "re-render")


def test_check_cast_and_hook_text(vadik: Path):
    s = spec_of(vadik)
    s["cast"] = ["vadik", "mama"]
    s["hook"]["line"] = "Совсем другая фраза."
    f = run_check(vadik, s, **paths(vadik))
    assert has(f, "error", "spec cast «mama» is not in the script's Cast table")
    assert has(f, "warn", "voice «palych» speaks but is not in the spec cast")
    assert has(f, "warn", "hook line is not in the script's hook beat")


def test_check_runs_the_existing_lint_with_template_rules(vadik: Path):
    f = run_check(vadik, spec_of(vadik), script=paths(vadik)["script"])
    assert has(f, "warn", "lint: no ## Map")
    # the template's laugh_gap (10 s) replaces the lint default (20 s)
    assert has(f, "warn", "without a laugh")


def test_check_lint_error_surfaces_as_error(vadik: Path):
    bad = vadik / "episodes" / "bad.md"
    bad.write_text(paths(vadik)["script"].read_text().replace("[deadpan] ", "[деп] ", 1))
    f = run_check(vadik, spec_of(vadik), script=bad)
    assert has(f, "error", "Russian inside [tag]")


def test_cli_check_exit_codes(vadik: Path, capsys: pytest.CaptureFixture):
    p = paths(vadik)
    spec = str(vadik / "episodes" / f"{EP}.spec.json")
    assert episode.main(["episode.py", "check", spec, str(p["script"]), "--timeline", str(p["timeline"])]) == 0
    assert episode.main(["episode.py", "check", spec, str(p["script"]), "--timeline", str(p["timeline"]), "--strict"]) == 0
    s = spec_of(vadik)
    s["mechanism"] = "OPEN"
    (vadik / "episodes" / f"{EP}.spec.json").write_text(json.dumps(s))
    assert episode.main(["episode.py", "check", spec]) == 0
    assert episode.main(["episode.py", "check", spec, "--strict"]) == 1
    assert "mechanism: OPEN" in capsys.readouterr().out


# --- distinct -----------------------------------------------------------------------------------


def fresh(slug: str, number: int, **keys) -> dict:
    base = {"slug": slug, "number": number, "mechanism": f"m-{slug}", "outcome": {"type": f"o-{slug}"}, "set": f"s-{slug}",
            "title": {"pattern": f"t-{slug}"}, "premise": {"key": f"p-{slug}"}}  # fmt: skip
    for k, v in keys.items():
        base[k] = {**base[k], **v} if isinstance(v, dict) else v
    return base


def test_fixture_ledger_is_distinct(vadik: Path):
    assert distinct.check_all(vadik) == []


def test_same_mechanism_and_outcome_is_an_error():
    before = [fresh("a", 1), fresh("b", 2)]
    cand = fresh("c", 3, mechanism="m-a", outcome={"type": "o-a"})
    f = distinct.compare(cand, before)
    assert has(f, "error", "same mechanism «m-a» and outcome «o-a» as a")


def test_same_mechanism_different_outcome_is_fine_once():
    f = distinct.compare(fresh("c", 3, mechanism="m-a"), [fresh("a", 1), fresh("b", 2)])
    assert not levels(f, "error")


def test_mechanism_repeated_warns_after_threshold():
    before = [fresh("a", 1, mechanism="m"), fresh("b", 2, mechanism="m")]
    f = distinct.compare(fresh("c", 3, mechanism="m"), before)
    assert has(f, "warn", "mechanism «m» in 3 of the last 3 episodes")


def test_same_set_twice_in_a_row_only_when_adjacent():
    assert has(
        distinct.compare(fresh("c", 3, set="kitchen"), [fresh("a", 1), fresh("b", 2, set="kitchen")]),
        "error",
        "the same set «kitchen» 2 episodes in a row",
    )
    assert not has(distinct.compare(fresh("c", 3, set="kitchen"), [fresh("a", 1, set="kitchen"), fresh("b", 2)]), "error", "same set")


def test_title_pattern_run_is_a_warning_at_three():
    before = [fresh("a", 1, title={"pattern": "n"}), fresh("b", 2, title={"pattern": "n"})]
    f = distinct.compare(fresh("c", 3, title={"pattern": "n"}), before)
    assert has(f, "warn", "the same title pattern «n» 3 episodes in a row")
    assert not has(distinct.compare(fresh("c", 3, title={"pattern": "n"}), before[1:]), "warn", "title pattern")


def test_same_premise_key_is_an_error():
    f = distinct.compare(fresh("c", 3, premise={"key": "p-a"}), [fresh("a", 1), fresh("b", 2)])
    assert has(f, "error", "same premise key «p-a» as a")


def test_four_shared_keys_with_the_previous_episode():
    prev = fresh("b", 2)
    cand = fresh("c", 3, mechanism=prev["mechanism"], set=prev["set"], title=prev["title"], premise=prev["premise"])
    f = distinct.compare(cand, [fresh("a", 1), prev])
    assert has(f, "error", "shares 4 of 5 novelty keys")


def test_window_limits_how_far_back_collisions_count():
    old = fresh("a", 1)
    cand = fresh("z", 9, mechanism="m-a", outcome={"type": "o-a"})
    filler = [fresh(f"f{i}", i + 2) for i in range(7)]
    assert has(distinct.compare(cand, [old, *filler], {**distinct.DEFAULTS, "last_n": 8}), "error", "same mechanism")
    assert not levels(distinct.compare(cand, [old, *filler], {**distinct.DEFAULTS, "last_n": 3}), "error")


def test_open_keys_are_never_compared():
    a = fresh("a", 1, mechanism="OPEN", outcome={"type": "OPEN"}, set="OPEN", premise={"key": "OPEN"})
    b = copy.deepcopy(a)
    b["slug"], b["number"] = "b", 2
    assert distinct.compare(b, [a]) == []


def test_ledger_orders_by_number_and_skips_dropped(vadik: Path):
    s = spec_of(vadik, "02-backup")
    s["status"] = "dropped"
    (vadik / "episodes" / "02-backup.spec.json").write_text(json.dumps(s))
    assert [e["number"] for e in distinct.ledger(vadik)] == [1, 3, 4]


def test_world_brief_overrides_limits(vadik: Path):
    assert distinct.limits(vadik)["last_n"] == 6
    assert distinct.limits(None)["last_n"] == 8


def test_check_flags_collision_through_episode_check(vadik: Path):
    s = spec_of(vadik, "03-standup")
    s["mechanism"], s["outcome"]["type"] = "literal-obedience", "boss-believes-it"
    (vadik / "episodes" / "03-standup.spec.json").write_text(json.dumps(s))
    f = episode.check_distinct(s, vadik)
    assert has(f, "error", "same mechanism «literal-obedience» and outcome «boss-believes-it» as 01-deploy".replace("01-deploy", "deploy"))
    assert distinct.main(["distinct.py", str(vadik)]) == 1


def test_candidate_not_yet_in_ledger_is_compared_with_earlier_numbers(vadik: Path):
    s = episode.new_spec(vadik, "new", fmt="shorts-9x16-60s")
    s.update(mechanism="over-honesty", set="kitchen")
    s["outcome"]["type"] = "cover-up-fails"
    s["number"] = 5
    assert has(episode.check_distinct(s, vadik), "error", "same mechanism «over-honesty»")
    assert has(episode.check_distinct(s, vadik), "error", "same set") is False  # kitchen was episode 3, episode 4 is between


# --- experiments --------------------------------------------------------------------------------


def test_seed_experiments_are_valid_and_have_no_results():
    data = json.loads((ROOT / "contracts" / "seeds" / "experiments.json").read_text())
    assert not levels(experiments.validate(data), "error")
    assert all(e["result"] is None and e["decision"] == "OPEN" for e in data["experiments"])
    assert not any(e["confidence"] == "TESTED" for e in data["experiments"])
    ids = {e["id"] for e in data["experiments"]}
    assert {"hook-voice-by-0.5s", "intro-none-shorts", "length-55s-vs-180s", "subs-karaoke-colour"} <= ids


def test_init_list_open_and_area(neutral: Path, capsys: pytest.CaptureFixture):
    assert experiments.main(["experiments.py", "init", str(neutral)]) == 0
    with pytest.raises(SystemExit):
        experiments.main(["experiments.py", "init", str(neutral)])
    assert len(experiments.list_rows(neutral)) == 16
    assert {e["area"] for e in experiments.list_rows(neutral, area="subtitles")} == {"subtitles"}
    assert experiments.main(["experiments.py", "list", str(neutral)]) == 0
    assert "16 hypotheses" in capsys.readouterr().out


def test_record_result_makes_it_tested_and_closed(vadik: Path):
    e = experiments.record(
        vadik, "intro-none-shorts", n=6, value="viewed 78% without intro vs 71% with", decision="adopt", date="2026-12-01"
    )
    assert e["confidence"] == "TESTED" and e["decided"] == "2026-12-01"
    assert "intro-none-shorts" not in {x["id"] for x in experiments.list_rows(vadik)}
    assert not levels(experiments.validate(experiments.load(vadik)), "error")
    with pytest.raises(SystemExit):
        experiments.record(vadik, "intro-none-shorts", n=1, value="again", decision="reject")


def test_inconclusive_keeps_confidence(vadik: Path):
    e = experiments.record(vadik, "loop-seam", n=2, value="too few", decision="inconclusive")
    assert e["confidence"] == "3P"
    assert e["decision"] == "inconclusive"


def test_result_cli_requires_sample_and_value(vadik: Path):
    with pytest.raises(SystemExit):
        experiments.main(["experiments.py", "result", str(vadik), "loop-seam", "--decision", "adopt"])
    assert experiments.main(["experiments.py", "result", str(vadik), "loop-seam", "--n", "4", "--value", "x", "--decision", "reject"]) == 0
    assert (
        experiments.load(vadik)["experiments"][[x["id"] for x in experiments.load(vadik)["experiments"]].index("loop-seam")]["confidence"]
        == "TESTED"
    )


def test_unknown_experiment_and_decision(vadik: Path):
    with pytest.raises(SystemExit):
        experiments.record(vadik, "nope", n=1, value="x", decision="adopt")
    with pytest.raises(SystemExit):
        experiments.record(vadik, "loop-seam", n=1, value="x", decision="maybe")


def test_validate_catches_inconsistent_ledger(vadik: Path):
    data = experiments.load(vadik)
    e = data["experiments"][0]
    e["confidence"] = "TESTED"
    data["experiments"][1]["decision"] = "adopt"
    data["experiments"][2]["metric"] = ["vibes"]
    f = experiments.validate(data)
    assert has(f, "error", "TESTED without a result")
    assert has(f, "error", "a decision without a result")
    assert has(f, "error", "unknown metric «vibes»")


def test_add_and_trace_to_episodes(vadik: Path, capsys: pytest.CaptureFixture):
    assert (
        experiments.main(
            [
                "experiments.py",
                "add",
                str(vadik),
                "cover-red-word",
                "--area",
                "cover",
                "--claim",
                "red key word",
                "--plan",
                "alternate",
                "--metric",
                "ctr",
            ]
        )
        == 0
    )
    assert experiments.referencing(vadik, "subs-karaoke-colour") == ["01-deploy"]
    experiments.main(["experiments.py", "show", str(vadik), "subs-karaoke-colour"])
    assert "episodes: 01-deploy" in capsys.readouterr().out
    assert (
        experiments.main(
            ["experiments.py", "add", str(vadik), "bad", "--area", "nowhere", "--claim", "c", "--plan", "p", "--metric", "ctr"]
        )
        == 1
    )


# --- platform_rules and check_policy ------------------------------------------------------------


def test_seed_rules_carry_the_policy_points():
    data = json.loads((ROOT / "contracts" / "seeds" / "platform_rules.json").read_text())
    assert not levels(policy.validate(data), "error")
    by = {r["id"]: r for r in data["rules"]}
    assert "looks like it's made with a template" in by["yt-inauth-template"]["quote"]
    assert "same situation over and over again with the same outcome" in by["yt-inauth-same-situation"]["quote"]
    assert "minimal variation across videos" in by["yt-inauth-minimal-variation"]["quote"]
    assert "series following a set of characters" in by["yt-series-set-characters"]["quote"]
    assert by["yt-animation-treatment"]["status"] == "OPEN"
    assert by["yt-synthetic-voice"]["status"] == "OPEN"
    for r in data["rules"]:
        assert r["source_url"] or r["status"] == "OPEN"
        assert re.fullmatch(r"\d{4}-\d\d-\d\d", r["fetched"])


def test_check_policy_lists_open_items_and_fails(neutral: Path, capsys: pytest.CaptureFixture):
    policy.main(["policy.py", "init", str(neutral)])
    f = policy.check_policy(neutral, today=dt.date(2026, 11, 6))
    assert {w for lv, w, _ in f if lv == "open"} == {"yt-animation-treatment", "yt-synthetic-voice", "yt-unwritten"}
    assert policy.main(["policy.py", "check", str(neutral)]) == 1
    assert "unresolved" in capsys.readouterr().out


def test_acks_turn_open_into_a_warning(vadik: Path):
    f = policy.check_policy(vadik, today=dt.date(2026, 11, 6))
    assert {w for lv, w, _ in f if lv == "open"} == {"yt-animation-treatment", "yt-unwritten"}
    assert has(f, "warn", "OPEN, acknowledged 2026-11-05: publish and watch Studio notices")


def test_stale_rules_warn(vadik: Path):
    f = policy.check_policy(vadik, today=dt.date(2027, 3, 1))
    assert has(f, "warn", "fetched 116 days ago")


def test_resolving_a_rule_clears_it(vadik: Path):
    data = json.loads((vadik / "platform_rules.json").read_text())
    for r in data["rules"]:
        if r["id"] == "yt-animation-treatment":
            r.update(status="known", confidence="TESTED", note="ran repetition-tolerance for 10 episodes")
    (vadik / "platform_rules.json").write_text(json.dumps(data))
    assert "yt-animation-treatment" not in {w for lv, w, _ in policy.check_policy(vadik, today=dt.date(2026, 11, 6)) if lv == "open"}


def test_fact_needs_a_quote_and_missing_file_errors(vadik: Path, neutral: Path):
    data = json.loads((vadik / "platform_rules.json").read_text())
    del data["rules"][0]["quote"]
    assert has(policy.validate(data), "error", "FACT without a `quote`")
    assert has(policy.check_policy(neutral), "error", "no platform_rules.json")


def test_check_policy_with_spec_includes_distinct(vadik: Path):
    s = spec_of(vadik, "03-standup")
    s["mechanism"], s["outcome"]["type"] = "misheard-order", "vadik-promoted"
    (vadik / "episodes" / "03-standup.spec.json").write_text(json.dumps(s))
    assert policy.main(["policy.py", "check", str(vadik), "--spec", str(vadik / "episodes" / "03-standup.spec.json")]) == 1


# --- world-agnostic -----------------------------------------------------------------------------


def test_new_modules_name_no_world():
    banned = re.compile(r"vadik|вадик|палыч|palych|mikhalych|mama\b|сеньор", re.IGNORECASE)
    for name in ("contract", "world", "distinct", "episode", "experiments", "policy"):
        assert not banned.search((ROOT / "scripts" / f"{name}.py").read_text()), name
    for f in (ROOT / "contracts").rglob("*.json"):
        assert not banned.search(f.read_text()), f


def test_the_whole_flow_runs_in_a_world_with_no_vadik(neutral: Path):
    assert worldmod.main(["world.py", "new", str(neutral)]) == 0
    assert experiments.main(["experiments.py", "init", str(neutral)]) == 0
    assert policy.main(["policy.py", "init", str(neutral)]) == 0
    assert episode.main(["episode.py", "new", str(neutral), "pilot", "--target", "50"]) == 0
    spec_path = neutral / "episodes" / "01-pilot.spec.json"
    assert episode.main(["episode.py", "expand", str(spec_path), "--script", "--write"]) == 0
    assert episode.main(["episode.py", "check", spec_path.as_posix()]) == 0
    assert distinct.main(["distinct.py", str(neutral)]) == 0
    sc = episode.scenario.load(neutral / "episodes" / "01-pilot.md")
    assert [k for kind, k, _ in sc.marks if kind == "beat"] == ["hook", "setup", "incident", "ladder", "ladder", "turn", "button"]


def test_a_world_can_add_its_own_format_and_hook(neutral: Path):
    (neutral / "formats.json").write_text(
        json.dumps({"formats": {"story-4x5": {**contract.formats()["shorts-9x16-60s"], "aspect": "4:5"}}})
    )
    (neutral / "hooks.json").write_text(json.dumps({"hooks": {"cliffhanger": {"what": "x"}}}))
    assert "story-4x5" in contract.formats(neutral) and "cliffhanger" in contract.hooks(neutral)
    assert "story-4x5" not in contract.formats()
