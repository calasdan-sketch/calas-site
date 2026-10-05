"""Narration for the Haul Me demo (/demo/haul-me/).

Voice: Kokoro af_heart from the local Kokoro server (http://127.0.0.1:8880).
Deletes any old clips first, writes narration/step-N.mp3 and prints DURS
for the page's `durs` array. The LINES here must match `LINES` in index.html.
"""
import glob
import json
import os
import subprocess
import urllib.request

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "narration")
LINES = [
    "This is Haul Me, set up for a made-up trucking outfit. It answers one question: is this load worth taking, before you say yes?",
    "First, you enter your real truck costs, once: fuel, truck payment, insurance, maintenance, plates and driver pay. About ten minutes of setup.",
    "From that, Haul Me works out your cost per kilometre. That's the number every load gets measured against, not the rate a broker quotes you.",
    "Now a load comes in. Type the rate, the loaded kilometres and any deadhead, then press Check this load.",
    "In seconds you get a plain call. This one is green, and it shows where the money goes: fuel, driver and fixed costs.",
    "Here's a trickier one. The rate looks fine per kilometre, but a hundred and ninety kilometres of empty deadhead turns it into a loss. Red light.",
    "It also shows your floor rate: the lowest rate per loaded kilometre you can counter down to without losing money.",
    "Worried about fuel? Drag the fuel slider to see what a price jump does to the call, right away.",
    "Every load goes into a running log, totalled by broker and by lane, with a one-click CSV export, so you see who actually makes you money.",
    "Haul Me is $39 a month for up to three trucks, or $99 for up to twenty. Flat, not per truck, with a thirty-day money-back guarantee.",
    "Now it's your turn. Change the costs, try your own loads, and see what the numbers say.",
]


def say_kokoro(text: str) -> bytes:
    body = json.dumps({"model": "kokoro", "input": text, "voice": "af_heart", "speed": 1.0,
                       "response_format": "mp3"}).encode()
    req = urllib.request.Request("http://127.0.0.1:8880/v1/audio/speech", data=body,
                                 headers={"Content-Type": "application/json"})
    return urllib.request.urlopen(req, timeout=120).read()


def duration(path: str) -> float:
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                   "-of", "csv=p=0", path])
    return round(float(out.strip()), 2)


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for old in glob.glob(os.path.join(OUT, "*.mp3")):
        os.remove(old)
    durs = []
    for i, line in enumerate(LINES):
        path = os.path.join(OUT, f"step-{i}.mp3")
        with open(path, "wb") as f:
            f.write(say_kokoro(line))
        durs.append(duration(path))
        print(f"step-{i}: {durs[-1]}s  ({len(line.split())} words)")
    print("TOTAL=" + str(round(sum(durs), 2)))
    print("WORDS=" + str(sum(len(l.split()) for l in LINES)))
    print("DURS=" + json.dumps(durs))


if __name__ == "__main__":
    main()
