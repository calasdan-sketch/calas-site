"""Narration for the Lead Me demo (/demo/leadme/).

Reads the tour lines straight from index.html (window.LEADME_TOUR.lines), so the
captions and the voice can never drift apart. Voice: Kokoro af_heart from the
local Kokoro server (http://127.0.0.1:8880). Prints the durs array to paste
into index.html.
"""
import json
import os
import re
import subprocess
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "narration")


def lines():
    html = open(os.path.join(HERE, "index.html"), encoding="utf-8").read()
    block = html.split("lines: [", 1)[1].split("],", 1)[0]
    return [m[1:-1] for m in re.findall(r'"[^"]*"', block)]


def say(text):
    body = json.dumps({"model": "kokoro", "input": text, "voice": "af_heart", "speed": 1.0,
                       "response_format": "mp3"}).encode()
    req = urllib.request.Request("http://127.0.0.1:8880/v1/audio/speech", data=body,
                                 headers={"Content-Type": "application/json"})
    return urllib.request.urlopen(req, timeout=180).read()


def duration(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                   "-of", "csv=p=0", path])
    return round(float(out.strip()), 2)


def main():
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        if f.endswith(".mp3"):
            os.remove(os.path.join(OUT, f))
    durs = []
    for i, line in enumerate(lines()):
        path = os.path.join(OUT, f"step-{i}.mp3")
        with open(path, "wb") as f:
            f.write(say(line))
        durs.append(duration(path))
    print("durs: " + json.dumps(durs), "total", round(sum(durs), 1))


if __name__ == "__main__":
    main()
