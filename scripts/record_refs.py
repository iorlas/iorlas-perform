"""Guided recording of your own voice references, one per mood.

Shows a line to read, space starts recording, space stops it.
Saves <mood>.wav and <mood>.txt (its transcript) in $PERFORM_VOICES or ./voices,
ready for speak.py --voice <mood>. Needs ffmpeg; no Python packages.

Keys after a take: space = next, p = play back, r = redo, q = quit.

Usage: python3 record_refs.py
"""
import re
import subprocess
import sys
import termios
import time
import tty
from pathlib import Path

import voices

REFS = voices.user_dir()

PROMPTS = [
    ("calm", "спокойно, как будто объясняешь другу",
     "Знаешь, я тут подумал. Давай не будем спешить, разберёмся во всём спокойно, по порядку."),
    ("happy", "радостно, с улыбкой",
     "Да ладно! Серьёзно? Это же просто потрясающе, я так рад за тебя, честное слово!"),
    ("angry", "зло, на повышенных тонах",
     "Я тебе сто раз говорил, не трогай мои вещи! Сколько можно? Это уже переходит все границы!"),
    ("sad", "грустно, тихо, медленно",
     "Мне правда жаль, что так вышло. Я думал, у нас всё получится, но, видимо, не судьба."),
    ("whisper", "шёпотом, как будто секрет",
     "Тише, не шуми. Они ещё здесь, за дверью. Просто иди за мной и ничего не говори."),
    ("excited", "быстро, с азартом",
     "Слушай, слушай, ты не поверишь, что сейчас было! Мы выиграли, мы реально выиграли!"),
]

BOLD, DIM, RED, GREEN, RESET = "\033[1m", "\033[2m", "\033[31m", "\033[32m", "\033[0m"


def key() -> str:
    fd = sys.stdin.fileno()
    old = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        return sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old)


def wait_for(allowed: str) -> str:
    while True:
        k = key()
        if k == "\x03":
            raise KeyboardInterrupt
        if k.lower() in allowed:
            return k.lower()


def pick_mic() -> str:
    out = subprocess.run(
        ["ffmpeg", "-hide_banner", "-f", "avfoundation", "-list_devices", "true", "-i", ""],
        capture_output=True, text=True, check=False,  # ffmpeg exits non-zero after listing: that is how it lists
    ).stderr
    audio = out.split("audio devices:")[-1]
    mics = re.findall(r"\[(\d+)\] (.+)", audio)
    default = next((i for i, name in mics if "MacBook" in name), mics[0][0])
    print(f"{BOLD}Microphones:{RESET}")
    for i, name in mics:
        print(f"  {i}  {name}{'  (default)' if i == default else ''}")
    choice = input(f"Number, or Enter for {default}: ").strip()
    return choice or default


def record(mic: str, wav: Path) -> float:
    proc = subprocess.Popen(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
         "-f", "avfoundation", "-i", f":{mic}", "-ac", "1", "-ar", "24000", str(wav)],
        stdin=subprocess.PIPE,
    )
    start = time.time()
    print(f"  {RED}● recording{RESET} — space to stop", flush=True)
    wait_for(" ")
    proc.communicate(b"q")
    return time.time() - start


def main():
    REFS.mkdir(parents=True, exist_ok=True)
    mic = pick_mic()
    i = 0
    while i < len(PROMPTS):
        name, how, line = PROMPTS[i]
        wav = REFS / f"{name}.wav"
        print(f"\n{DIM}[{i + 1}/{len(PROMPTS)}]{RESET} {BOLD}{name}{RESET} — {how}")
        print(f"\n  {BOLD}{line}{RESET}\n")
        print(f"  {DIM}space = start, s = skip, q = quit{RESET}", flush=True)
        k = wait_for(" sq")
        if k == "q":
            break
        if k == "s":
            i += 1
            continue

        secs = record(mic, wav)
        (REFS / f"{name}.txt").write_text(line + "\n")
        warn = f"  {RED}short, aim for 5–15s{RESET}" if secs < 4 else ""
        print(f"  {GREEN}saved{RESET} {wav.name} ({secs:.1f}s){warn}")

        while True:
            print(f"  {DIM}space = next, p = play, r = redo, q = quit{RESET}", flush=True)
            k = wait_for(" prq")
            if k == "p":
                subprocess.run(["afplay", str(wav)], check=False)  # a failed playback is not fatal
                continue
            break
        if k == "q":
            break
        if k == " ":
            i += 1

    print(f"\nDone. Saved in {REFS}. Speak with: uv run speak.py script.txt --voice calm")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nStopped.")
