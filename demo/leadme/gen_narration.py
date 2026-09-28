"""Narration for the Lead Me walkthrough (/demo/leadme/).

Voice: Kokoro af_heart from the local Kokoro server (http://127.0.0.1:8880),
free and far less robotic than the old edge-tts voice. To use an ElevenLabs
voice instead, set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID and rerun.
Prints DURS for the page's step timings.
"""
import json
import os
import subprocess
import urllib.request

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "narration")
LINES = [
    "This is Lead Me, the real app. Your day starts here: hot, warm and cold leads counted at a glance, and how many emails have gone out.",
    "Press Find leads, and Lead Me searches map data and the web across your territory, for businesses in your industry.",
    "Every company it finds is scored out of a hundred. The warmest sit at the top, with the reasons shown right on the card.",
    "Open a lead to see what Lead Me learned from their own website, the opener it picked and why, and a first email already written from those facts.",
    "It all starts in Settings. Add your company name, phone, email and mailing address, and Lead Me finds companies that fit your business.",
    "Nothing sends until you approve it. That's Lead Me: the right businesses, found and warmed up, ready for you to call.",
]


def say_kokoro(text: str) -> bytes:
    body = json.dumps({"model": "kokoro", "input": text, "voice": "af_heart", "speed": 1.0,
                       "response_format": "mp3"}).encode()
    req = urllib.request.Request("http://127.0.0.1:8880/v1/audio/speech", data=body,
                                 headers={"Content-Type": "application/json"})
    return urllib.request.urlopen(req, timeout=120).read()


def say_elevenlabs(text: str) -> bytes:
    vid = os.environ["ELEVENLABS_VOICE_ID"]
    body = json.dumps({"text": text, "model_id": "eleven_multilingual_v2"}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{vid}", data=body,
                                 headers={"Content-Type": "application/json",
                                          "xi-api-key": os.environ["ELEVENLABS_API_KEY"]})
    return urllib.request.urlopen(req, timeout=120).read()


def duration(path: str) -> float:
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                   "-of", "default=noprint_wrappers=1:nokey=1", path])
    return round(float(out.strip()), 2)


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    say = say_elevenlabs if os.environ.get("ELEVENLABS_API_KEY") else say_kokoro
    durs = []
    for i, line in enumerate(LINES):
        path = os.path.join(OUT, f"step-{i}.mp3")
        with open(path, "wb") as f:
            f.write(say(line))
        durs.append(duration(path))
        print(f"step-{i}: {durs[-1]}s")
    print("DURS=" + json.dumps(durs))


if __name__ == "__main__":
    main()
