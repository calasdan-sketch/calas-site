"""One-off: regenerate Lead Me narration forcing 'Lead Me' -> spoken 'Leed Me'.
Captions on the page stay 'Lead Me'; only the TTS input is phonetic."""
import json, os, re, subprocess, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "narration")

def lines():
    html = open(os.path.join(HERE, "index.html"), encoding="utf-8").read()
    block = html.split("lines: [", 1)[1].split("],", 1)[0]
    return [m[1:-1] for m in re.findall(r'"[^"]*"', block)]

def phonetic(t):
    # force correct pronunciation of the brand name in speech only
    return t.replace("Lead Me", "Leed Me")

def say(text):
    body = json.dumps({"model":"kokoro","input":text,"voice":"af_heart","speed":1.0,
                       "response_format":"mp3"}).encode()
    req = urllib.request.Request("http://127.0.0.1:8880/v1/audio/speech", data=body,
                                 headers={"Content-Type":"application/json"})
    return urllib.request.urlopen(req, timeout=180).read()

def duration(path):
    out = subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration",
                                   "-of","csv=p=0", path])
    return round(float(out.strip()), 2)

def main():
    os.makedirs(OUT, exist_ok=True)
    durs = []
    for i, line in enumerate(lines()):
        spoken = phonetic(line)
        path = os.path.join(OUT, f"step-{i}.mp3")
        with open(path, "wb") as f:
            f.write(say(spoken))
        durs.append(duration(path))
        tag = " (phonetic)" if spoken != line else ""
        print(f"step-{i}{tag}: {durs[-1]}s")
    print("durs: " + json.dumps(durs))

if __name__ == "__main__":
    main()
