"""The listener check: is what each laugh stands on said aloud before it, in the words heard?

The map says where a fact is shown, and the lint trusts it. This check does not: a reader who
gets only the spoken lines (no tags, comments, map or notes) finds the line that tells each
fact a laugh needs. The reader must be a fresh agent that never saw the script's notes.

    uv run listen.py run EPISODE.md                     # a fresh `claude -p` session reads it
    uv run listen.py brief EPISODE.md > brief.md        # or give brief.md, alone, to a fresh agent
    uv run listen.py check EPISODE.md answers.json      # and check its JSON answer
    uv run listen.py rules EPISODE.md [opus|codex]      # word order, punch delivery, unexplained choices (T13-T15)
    uv run listen.py lines EPISODE.md [SHEET.md ...] [opus|codex]   # every line alone: does it follow, fit, parse (8b)
    uv run listen.py lines-brief EPISODE.md [SHEET.md ...]          # the same brief, for a fresh agent
"""

import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import scenario

BRIEF = """You hear a radio comedy once, in order, with no rewind. Below are its spoken lines, numbered,
then the laughs and the facts each one stands on. For every fact of every laugh, find the
FIRST spoken line, before or at the laugh, that tells a listener that fact in words they hear.
Be strict: a fact counts only if a listener who knows nothing else would get it from that
line; your own knowledge of the world, or a guess at what the writer meant, does not count.
Also say, in one short English sentence, what a listener hearing the laugh line once would
not get, or "" when it is clear.

Answer with JSON only, no prose:
{"laughs": [{"n": LAUGH_LINE, "facts": [{"id": "ID", "told": LINE_OR_NULL, "quote": "the words that tell it"}], "unclear": ""}]}
"""


RULES = """You hear a Russian radio comedy once, in order, with no rewind. Below are its lines, numbered,
with the delivery tags the voice actor gets in [brackets]. Check EVERY line against these rules and
report each line that breaks one. Be strict and literal; your own knowledge of the world does not
fill a gap the listener has.

- T13 word order: a statement that opens with a question word («Что это, она не знала»); or two
  nouns that touch but are not one phrase, so the ear fuses them («мой сеньор интеллект внедрил»
  is heard as «сеньор интеллект»).
- T14 punch delivery (not for a deadpan narrator, whose even voice is the joke): the line's last
  sentence turns against what came before it in the same line
  (a warning that ends as an insult, a boast that ends as a confession, a polite line that ends as
  a jab), but no new delivery tag stands before it, so it is voiced like the setup. [beat] or
  [pause] alone is not a new delivery.
- T15 unexplained choice: a character picks or asks for a specific thing (a source, a person, a
  tool, a place) and a first-time listener has not heard, by that line, what it is or why that one.

Answer with JSON only, no prose:
{"findings": [{"n": LINE, "rule": "T13|T14|T15", "quote": "the words",
  "why": "one short English sentence", "fix": "the line rewritten in Russian, with tags"}]}
"""


LINES = """You are a native Russian speaker who hears a short workplace comedy once, in order, with no rewind.
Below are its lines, numbered, with the delivery tags the actor gets in [brackets], and then (if given)
what each character knows. You do not know what the writer meant by any line. For EVERY line, judge it
alone. Be strict and literal; do not rescue a line with a charitable story, and give no credit for style,
shortness or cleverness.

- does: one plain sentence, what the speaker is doing with the line (asking, dodging, blaming, informing)
- replies: yes | partly | no, does it answer or react to the line before it
- knows: ok | violation, would this speaker know or ask this, given the characters' knowledge below
- natural: yes | no, would a native speaker in this role say it this way (name the odd word if no)
- clear: yes | no, understood heard once, without the writer's comment
- why: one short English sentence when anything is not ok, else ""

Answer with JSON only, no prose:
{"lines": [{"n": LINE, "does": "", "replies": "", "knows": "", "natural": "", "clear": "", "why": ""}],
 "last": "one sentence: what the last line means heard once"}
"""


def spoken(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"\[[^\]]*\]", " ", text)).strip()


def laughs(sc: scenario.Scenario) -> list[tuple[int, list[str]]]:
    """(turn number, needed ids) per laugh with needs, turn numbers from 1."""
    turns = sc.turns
    by_line = {t.line: i + 1 for i, t in enumerate(turns)}

    def number(n: int) -> int | None:
        return next((by_line[t.line] for t in turns if t.line >= n), None)

    needs = {k: scenario.ids(key) for kind, key, n in sc.marks if kind == "needs" and (k := number(n))}
    return sorted((k, v) for k, v in needs.items() if v)


def brief(sc: scenario.Scenario) -> str:
    names = {v: d.split(",")[0].strip() for v, d in sc.cast.items()}
    lines = [
        f"{i}. {names.get(t.voice, t.voice)}{' (по телефону)' if t.phone else ''}: {spoken(t.text)}" for i, t in enumerate(sc.turns, 1)
    ]
    nodes = {node.id: node.what for node in sc.story}
    asks = [f"- laugh at line {k}: " + "; ".join(f"{i} = {nodes.get(i, '?')}" for i in ids) for k, ids in laughs(sc)]
    return BRIEF + "\n## Spoken lines\n\n" + "\n".join(lines) + "\n\n## Laughs and their facts\n\n" + "\n".join(asks) + "\n"


def rules_brief(sc: scenario.Scenario) -> str:
    """Every line with its tags, for the rules a listener hears but the lint cannot count."""
    names = {v: d.split(",")[0].strip() for v, d in sc.cast.items()}
    lines = [f"{i}. {names.get(t.voice, t.voice)}{' (по телефону)' if t.phone else ''}: {t.text}" for i, t in enumerate(sc.turns, 1)]
    return RULES + "\n## Lines\n\n" + "\n".join(lines) + "\n"


def lines_brief(sc: scenario.Scenario, sheets: list[str]) -> str:
    """Every line with its tags and the characters' knowledge sheets; never the intents, map or card."""
    names = {v: d.split(",")[0].strip() for v, d in sc.cast.items()}
    lines = [f"{i}. {names.get(t.voice, t.voice)}{' (по телефону)' if t.phone else ''}: {t.text}" for i, t in enumerate(sc.turns, 1)]
    known = "".join(f"\n### {Path(s).stem}\n\n{Path(s).read_text()}\n" for s in sheets)
    return LINES + "\n## Lines\n\n" + "\n".join(lines) + ("\n\n## What the characters know\n" + known if known else "") + "\n"


def intents(sc: scenario.Scenario) -> dict[int, str]:
    """Turn number to the `<!-- intent: ... -->` written before it."""
    out: dict[int, str] = {}
    for kind, key, n in sc.marks:
        if kind == "intent" and (k := next((i for i, t in enumerate(sc.turns, 1) if t.line >= n), None)):
            out[k] = key
    return out


def report_lines(sc: scenario.Scenario, src: str, answers: dict) -> int:
    """Print the lines the reader flagged, then each intent beside what the reader heard."""
    line_of = {i: t.line for i, t in enumerate(sc.turns, 1)}
    got = answers.get("lines", [])
    flagged = 0
    for a in got:
        bad = [k for k, ok in (("replies", "yes"), ("knows", "ok"), ("natural", "yes"), ("clear", "yes")) if a.get(k) != ok]
        if bad:
            flagged += 1
            print(f"{src}:{line_of.get(a['n'], '?')}: LINES {'/'.join(bad)}: {a.get('why', '')}")
    wanted = intents(sc)
    for a in got:
        if a["n"] in wanted:
            print(f"  {a['n']}. meant: {wanted[a['n']]}\n     heard: {a.get('does', '')}")
    print(f"  last line heard as: {answers.get('last', '')}")
    return flagged


def check(sc: scenario.Scenario, answers: dict) -> list[scenario.Issue]:
    line_of = {i: t.line for i, t in enumerate(sc.turns, 1)}
    got = {a["n"]: a for a in answers.get("laughs", [])}
    out: list[scenario.Issue] = []
    for k, ids in laughs(sc):
        n, answer = line_of[k], got.get(k)
        if answer is None:
            out.append(("error", n, "the reader gave no answer for this laugh: run the check again"))
            continue
        told = {f["id"]: f.get("told") for f in answer.get("facts", [])}
        for i in ids:
            if told.get(i) is None:
                out.append(("error", n, f"needs «{i}»: no spoken line before it tells the listener"))
            elif told[i] > k:
                out.append(("error", n, f"needs «{i}»: told only at line {line_of.get(told[i], '?')}, after the laugh"))
        if answer.get("unclear"):
            out.append(("warn", n, f"heard once: {answer['unclear']}"))
    return out


def read_fresh(text: str, model: str = "sonnet") -> str:
    """The brief, read by a session with no settings, tools, memory or project files.

    `codex` reads it with GPT instead: a reader from another model family misses other things.
    """
    with tempfile.TemporaryDirectory() as empty:  # no CLAUDE.md or AGENTS.md to discover
        if model == "codex":
            cmd = ["codex", "exec", "--skip-git-repo-check", "-s", "read-only", "-o", f"{empty}/answer", "-"]
            done = subprocess.run(cmd, input=text, capture_output=True, text=True, cwd=empty, check=False)
            if done.returncode:
                sys.exit(f"[perform] listen: codex exec failed: {(done.stderr or done.stdout).strip()[-300:]}")
            return Path(f"{empty}/answer").read_text()
        cmd = ["claude", "-p", "--setting-sources", "", "--tools", "", "--no-session-persistence", "--model", model]
        cmd += ["--system-prompt", "You are a careful, literal first-time listener. Answer with JSON only."]
        done = subprocess.run(cmd, input=text, capture_output=True, text=True, cwd=empty, check=False)
    if done.returncode:
        sys.exit(f"[perform] listen: claude -p failed: {(done.stderr or done.stdout).strip()[:300]}")
    return done.stdout


def main() -> None:
    mode, src = sys.argv[1], sys.argv[2]
    sc = scenario.load(src)
    if mode == "brief":
        print(brief(sc))
        return
    rest = sys.argv[3:]
    if mode in ("lines", "lines-brief"):  # findings to judge, not errors: about a third are wrong
        sheets = [a for a in rest if a.endswith(".md")]
        if mode == "lines-brief":
            print(lines_brief(sc, sheets))
            return
        raw = read_fresh(lines_brief(sc, sheets), next((a for a in rest if not a.endswith(".md")), "sonnet"))
        flagged = report_lines(sc, src, json.loads(raw[raw.index("{") : raw.rindex("}") + 1]))
        print(f"[perform] listen lines: {flagged} lines flagged to judge")
        return
    if mode == "rules":  # findings to judge, not errors: the reader is wrong often enough
        raw = read_fresh(rules_brief(sc), sys.argv[3] if len(sys.argv) > 3 else "sonnet")
        found = json.loads(raw[raw.index("{") : raw.rindex("}") + 1]).get("findings", [])
        line_of = {i: t.line for i, t in enumerate(sc.turns, 1)}
        for f in found:
            print(f"{src}:{line_of.get(f['n'], '?')}: {f['rule']} «{f['quote']}»: {f['why']}\n    fix: {f['fix']}")
        print(f"[perform] listen rules: {len(found)} findings to judge")
        return
    raw = read_fresh(brief(sc)) if mode == "run" else Path(sys.argv[3]).read_text()
    answers = json.loads(raw[raw.index("{") : raw.rindex("}") + 1])  # tolerate a fence around the JSON
    issues = check(sc, answers)
    ok = scenario.report(issues, src)
    print(f"[perform] listen: {sum(i[0] == 'error' for i in issues)} errors, {sum(i[0] == 'warn' for i in issues)} warnings")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
