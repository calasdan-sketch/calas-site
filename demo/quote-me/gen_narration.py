"""Narration for the Quote Me demo (/demo/quote-me/).

Voice: ElevenLabs "Sarah" (Dan's choice, 2026-10-02) instead of Kokoro.
Reads the API key from the ELEVENLABS_API_KEY environment variable - the key
is never written in this file. Deletes any old clips first, writes
narration/step-N.mp3 and prints DURS for the page's `durs` array. The LINES
here MUST match `LINES` in index.html (same count, same order).

Run (PowerShell):   $env:ELEVENLABS_API_KEY="<your key>"; python gen_narration.py
Run (cmd):          set ELEVENLABS_API_KEY=<your key> && python gen_narration.py
If the key is already in your environment, just: python gen_narration.py
"""
import glob
import json
import os
import subprocess
import urllib.request

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "narration")

# ElevenLabs "Sarah" (a built-in voice). eleven_multilingual_v2 is the default
# high-quality model; change MODEL_ID if Dan prefers a different one.
VOICE_ID = "EXAVITQu4vr4xnSDxMaL"  # Sarah
MODEL_ID = "eleven_multilingual_v2"

LINES = [
    "Welcome to Quote Me. This is Tallgrass Plumbing and Heating, a made-up shop. Dave has just finished looking at a customer's furnace.",
    "Instead of writing up a quote tonight, he talks the job into his phone for about ninety seconds. What's wrong, what he'll do, and what parts it takes.",
    "Before he leaves, he snaps a photo of the old part. Quote Me keeps it with the quote, and it rides along on the supplier order, so the right part gets sent, not a guess.",
    "If he'd rather type it, that works too. Either way, one press builds the quote.",
    "Every line is priced from his own rate card. His labour rate, his parts, his markups. Not an industry average.",
    "He can change anything. The customer wants a spare filter, so one tap, and the total updates straight away.",
    "Nothing goes out until Dave ticks Reviewed. Quote Me never sends a price he hasn't looked at.",
    "This is exactly what the customer will see. A clean, itemised quote on her phone, with the job photos. No app, no account, no P D F.",
    "Press Send, and the customer gets one link by email. In this demo, nothing is actually sent.",
    "She reads it, types her name to accept, and pays the deposit from her bank account or a card, right there.",
    "Dave is told the moment it's done. The job is booked before the truck leaves the driveway.",
    "Quote Me is ninety-nine dollars a month per shop, with no setup fee. If it hasn't collected a real deposit for you in sixty days, those two months are refunded.",
    "That's the tour. Now try it yourself: pick a job or type your own, and build a quote.",
]


def say_eleven(text: str) -> bytes:
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        raise SystemExit(
            "ELEVENLABS_API_KEY is not set. Set it in your environment and re-run "
            "(this script never stores the key)."
        )
    body = json.dumps({"text": text, "model_id": MODEL_ID}).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
        data=body,
        headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"},
    )
    return urllib.request.urlopen(req, timeout=120).read()


def duration(path: str) -> float:
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]
    )
    return round(float(out.strip()), 2)


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for old in glob.glob(os.path.join(OUT, "*.mp3")):
        os.remove(old)
    durs = []
    for i, line in enumerate(LINES):
        path = os.path.join(OUT, f"step-{i}.mp3")
        with open(path, "wb") as f:
            f.write(say_eleven(line))
        durs.append(duration(path))
        print(f"step-{i}: {durs[-1]}s  ({len(line.split())} words)")
    print("TOTAL=" + str(round(sum(durs), 2)))
    print("DURS=" + json.dumps(durs))


if __name__ == "__main__":
    main()
