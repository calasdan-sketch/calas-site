"""Regenerate ReceiptSort demo narration from the local Kokoro server (voice af_heart),
then write the real clip lengths into index.html (lines + durs)."""
import json, os, re, subprocess, urllib.request, glob
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "narration")
LINES = [
 "This is ReceiptSort, a free tool from Calas Automations. Meet Birchwood Painting, a made-up small business with a pile of receipts from September.",
 "Paint, fuel, lumber, coffee with a client. Phone photos and an emailed invoice. The usual shoebox.",
 "One button reads them all. It happens right on your own phone or computer. Nothing is uploaded anywhere.",
 "For every receipt, it writes one row: the date, the vendor, the subtotal, the GST, and the total.",
 "This one says check this. Its date could mean the fifth of September or the ninth of May, so ReceiptSort leaves it blank instead of guessing.",
 "You just type the right date in, and the row turns OK. You can fix any field the same way.",
 "Up top, the count keeps track of how many receipts are ready, and how many still need a look.",
 "When it all looks right, download one spreadsheet. It opens in Excel, Google Sheets, or your accounting software.",
 "Here is what's inside. One tidy row per receipt, with the file name, so you can always find the original.",
 "ReceiptSort is free. No account, no sign in, nothing to cancel. Just open it and pick your receipts.",
 "That's the tour. Go ahead and click around. Read the receipts again, fix a field, or open the spreadsheet yourself.",
]
for f in glob.glob(os.path.join(OUT, "step-*.mp3")): os.remove(f)
durs = []
for i, line in enumerate(LINES):
    body = json.dumps({"model": "kokoro", "input": line, "voice": "af_heart", "speed": 1.0, "response_format": "mp3"}).encode()
    req = urllib.request.Request("http://127.0.0.1:8880/v1/audio/speech", body, {"Content-Type": "application/json"})
    p = os.path.join(OUT, f"step-{i}.mp3")
    with urllib.request.urlopen(req, timeout=120) as r, open(p, "wb") as f: f.write(r.read())
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).strip())
    durs.append(round(d, 2)); print(f"step-{i}: {durs[-1]}s")
html = os.path.join(HERE, "index.html"); s = open(html, encoding="utf-8").read()
s = re.sub(r"\n    lines: \[.*?\],\n", lambda m: "\n    lines: " + json.dumps(LINES) + ",\n", s, count=1, flags=re.S)
s = re.sub(r"\n    durs: \[.*?\],\n", lambda m: "\n    durs: " + json.dumps(durs) + ",\n", s, count=1, flags=re.S)
open(html, "w", encoding="utf-8").write(s)
print("TOTAL", round(sum(durs), 1), "s;", sum(len(l.split()) for l in LINES), "words")
