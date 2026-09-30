"""Regenerate demo narration clips (narration/step-N.mp3) from the lines on
each demo page, then write the new clip lengths back into the page's durs
array so the tour stays in step with the voice.

  python _tour/gen_voice.py leadme --steps 6 9     # just those clips
  python _tour/gen_voice.py --all                  # every demo
  python _tour/gen_voice.py --all --check          # count characters only

Voice: ElevenLabs "Sarah" (Dan's pick for Cara/Kara) when ELEVENLABS_API_KEY is
set, otherwise the free local Kokoro voice (af_heart on 127.0.0.1:8880).
The ElevenLabs path uses the Flash model (half a credit per character) and
refuses to start if the account doesn't have enough characters left, so it
never runs into paid overage.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import narration_lines  # noqa: E402

SARAH_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"  # ElevenLabs premade "Sarah"
EL_MODEL = "eleven_flash_v2_5"
EL_CREDITS_PER_CHAR = 0.5
DURS_RE = re.compile(r"\b(durs|DURS)(\s*[:=]\s*)\[[^\]]*\]")


def _el_key() -> str:
    return os.environ.get("ELEVENLABS_API_KEY", "").strip()


def _el_request(path: str, body: dict | None = None) -> bytes:
    req = urllib.request.Request(f"https://api.elevenlabs.io{path}",
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={"xi-api-key": _el_key(), "Content-Type": "application/json",
                                          "Accept": "audio/mpeg" if body is not None else "application/json"})
    return urllib.request.urlopen(req, timeout=180).read()


def el_credits_left() -> int:
    sub = json.loads(_el_request("/v1/user/subscription"))
    return int(sub.get("character_limit", 0)) - int(sub.get("character_count", 0))


def say_elevenlabs(text: str) -> bytes:
    voice = os.environ.get("ELEVENLABS_VOICE_ID") or SARAH_VOICE_ID
    return _el_request(f"/v1/text-to-speech/{voice}?output_format=mp3_44100_128",
                       {"text": text, "model_id": EL_MODEL,
                        "voice_settings": {"stability": 0.6, "similarity_boost": 0.8, "style": 0.0,
                                           "use_speaker_boost": True}})


def say_kokoro(text: str) -> bytes:
    body = json.dumps({"model": "kokoro", "input": text, "voice": "af_heart", "speed": 1.0,
                       "response_format": "mp3"}).encode()
    req = urllib.request.Request("http://127.0.0.1:8880/v1/audio/speech", data=body,
                                 headers={"Content-Type": "application/json"})
    return urllib.request.urlopen(req, timeout=180).read()


def duration(path: str) -> float:
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                   "-of", "csv=p=0", path])
    return round(float(out.strip()), 2)


def write_durs(demo: str, durs: list) -> None:
    page = os.path.join(narration_lines.DEMO_DIR, demo, "index.html")
    html = open(page, encoding="utf-8").read()
    m = DURS_RE.search(html)
    if not m:
        raise SystemExit(f"{demo}: no durs array on the page")
    html = html[:m.start()] + f"{m.group(1)}{m.group(2)}{json.dumps(durs)}" + html[m.end():]
    with open(page, "w", encoding="utf-8") as fh:
        fh.write(html)


def current_durs(demo: str) -> list:
    html = open(os.path.join(narration_lines.DEMO_DIR, demo, "index.html"), encoding="utf-8").read()
    m = DURS_RE.search(html)
    return json.loads(m.group(0)[m.group(0).index("["):]) if m else []


def regenerate(demo: str, steps: list | None, say) -> None:
    lines = narration_lines.lines_for(demo)
    folder = os.path.join(narration_lines.DEMO_DIR, demo, "narration")
    durs = current_durs(demo)
    if len(durs) != len(lines):
        durs = [0.0] * len(lines)
    # old clips are kept outside the site folder so backups are never published
    backup = os.path.join(os.path.expanduser("~"), "demo-voice-backups", demo, time.strftime("%Y%m%d-%H%M%S"))
    os.makedirs(backup, exist_ok=True)
    for i, text in enumerate(lines):
        if steps is not None and i not in steps:
            continue
        path = os.path.join(folder, f"step-{i}.mp3")
        if os.path.exists(path):
            shutil.copy2(path, backup)
        with open(path, "wb") as fh:
            fh.write(say(text))
        durs[i] = duration(path)
        print(f"  {demo} step {i}: {durs[i]}s")
    write_durs(demo, durs)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("demo", nargs="?")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--steps", nargs="*", type=int)
    ap.add_argument("--check", action="store_true", help="count characters and credits only")
    ap.add_argument("--kokoro", action="store_true", help="force the free local voice")
    args = ap.parse_args()
    demos = narration_lines.demos() if args.all else [args.demo]
    if not demos or demos == [None]:
        raise SystemExit("name a demo or use --all")
    chars = sum(len(t) for d in demos for i, t in enumerate(narration_lines.lines_for(d))
                if args.steps is None or i in args.steps)
    use_el = bool(_el_key()) and not args.kokoro
    need = int(chars * EL_CREDITS_PER_CHAR) + 1
    print(f"{len(demos)} demo(s), {chars} characters; voice: {'ElevenLabs Sarah' if use_el else 'Kokoro (free, local)'}")
    if use_el:
        left = el_credits_left()
        print(f"ElevenLabs credits left: {left}; this run needs about {need}")
        if left < need:
            raise SystemExit("Not enough ElevenLabs credits left this month -- stopping before any cost.")
    if args.check:
        return
    say = say_elevenlabs if use_el else say_kokoro
    for d in demos:
        regenerate(d, args.steps, say)


if __name__ == "__main__":
    main()
