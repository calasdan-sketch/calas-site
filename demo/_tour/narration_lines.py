"""Read each demo's spoken lines straight from its index.html, so the voice
clips (narration/step-N.mp3) can be regenerated from the words on the page.
Each demo spells the array a little differently (lines:, lines =, LINES=), so
this takes the first array literal after any of those names that is a list of
plain strings."""
from __future__ import annotations

import json
import os
import re

DEMO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME_RE = re.compile(r"\b(?:lines|LINES)\s*[:=]\s*\[")


def _array_at(text: str, start: int) -> str:
    depth, in_str, esc = 0, "", False
    for i in range(start, len(text)):
        c = text[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == in_str:
                in_str = ""
            continue
        if c in "\"'`":
            in_str = c
        elif c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                return text[start:i + 1]
    return ""


def lines_for(demo: str) -> list:
    html = open(os.path.join(DEMO_DIR, demo, "index.html"), encoding="utf-8").read()
    for m in NAME_RE.finditer(html):
        raw = _array_at(html, m.end() - 1)
        try:
            value = json.loads(raw)
        except ValueError:
            continue
        if value and all(isinstance(x, str) for x in value):
            return value
    return []


def demos() -> list:
    return sorted(d for d in os.listdir(DEMO_DIR)
                  if not d.startswith("_") and os.path.isdir(os.path.join(DEMO_DIR, d, "narration")))


if __name__ == "__main__":
    total = 0
    for d in demos():
        lines = lines_for(d)
        clips = len([f for f in os.listdir(os.path.join(DEMO_DIR, d, "narration")) if f.endswith(".mp3")])
        chars = sum(len(x) for x in lines)
        total += chars
        flag = "" if len(lines) == clips else "  <-- lines and clips differ"
        print(f"{d:12} lines={len(lines):2} clips={clips:2} chars={chars:5}{flag}")
    print(f"all demos: {total} characters")
