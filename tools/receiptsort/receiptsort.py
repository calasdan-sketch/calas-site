"""ReceiptSort - drop a folder of receipts in, get one CSV out.

  python receiptsort.py <folder> [--out receipts.csv] [--no-llm]
  python receiptsort.py --web [--port 8765]        # drop-files page, returns the CSV

Free tool from Calas Automations. Runs offline: markitdown for PDFs/images
(PDFs and text layers) plus local Tesseract OCR for photos, regex first, the local Ollama model only when
regex finds fewer than 3 of the 4 fields. Never invents a vendor or a
total: blank + status=needs_review is the correct answer when unsure.

No network calls, ever. The only optional connection is to a model on your
own computer (Ollama at 127.0.0.1); pass --no-llm to disable even that.
OLLAMA_URL is honoured only if it points at a loopback address.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import io
import json
import os
import re
import sys
import urllib.parse
import urllib.request

COLUMNS = ["file", "date", "vendor", "subtotal", "gst", "total", "status"]
EXTS = {".pdf", ".jpg", ".jpeg", ".png"}
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "calas-chat")
LOOPBACK_HOSTS = {"127.0.0.1", "localhost", "::1", "[::1]"}
ONFILE_CTA = ("Tired of chasing receipts from clients? On File by Calas Automations chases "
              "the documents for you - calasautomations.com/accounting")

MONEY = re.compile(r"(?<![\d.])\$?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})|\d+\.\d{2})(?![\d])")
DATE_PATTERNS = [
    (re.compile(r"\b(\d{4})-(\d{2})-(\d{2})\b"), "ymd"),
    (re.compile(r"\b(\d{1,2})/(\d{1,2})/(\d{4})\b"), "mdy_or_dmy"),
    (re.compile(r"\b(\d{1,2})/(\d{1,2})/(\d{2})\b"), "mdy2"),
    (re.compile(r"\b([A-Z][a-z]{2,8})\.? (\d{1,2}),? (\d{4})\b"), "mon_d_y"),
    (re.compile(r"\b(\d{1,2}) ([A-Z][a-z]{2,8})\.? (\d{4})\b"), "d_mon_y"),
]
MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 1)}
TOTAL_WORDS = re.compile(r"(?i)\b(grand\s*total|total\s*(?:due|paid|amount)?|amount\s*due|balance\s*due)\b")
SUBTOTAL_WORDS = re.compile(r"(?i)\b(sub\s*-?\s*total|net)\b")
GST_WORDS = re.compile(r"(?i)\b(gst|hst|gst/hst|tps)\b")
SKIP_VENDOR = re.compile(r"(?i)^(receipt|invoice|tax invoice|thank you|welcome|store|customer copy|\W*)$")


# ------------------------------------------------------------------ reading

def read_text(path: str) -> str:
    """Text from a PDF or image. markitdown first (handles PDFs and any
    embedded text layer); if that is empty and the file is a photo, fall
    back to local Tesseract OCR. All offline - nothing leaves the computer.
    If Tesseract is not installed a photo simply comes back empty
    (status=needs_review), never a made-up value."""
    text = ""
    try:
        from markitdown import MarkItDown  # type: ignore
        text = (MarkItDown().convert(path).text_content or "").strip()
    except Exception:
        text = ""
    if text:
        return text
    ext = os.path.splitext(path)[1].lower()
    if ext in {".jpg", ".jpeg", ".png"}:
        return _ocr_image(path)
    return ""


def _ocr_image(path: str) -> str:
    """Read a photo with local Tesseract OCR (offline). Returns '' if OCR is
    unavailable or finds nothing - never a guess."""
    try:
        import pytesseract  # type: ignore
        from PIL import Image, ImageOps  # type: ignore
    except Exception:
        return ""
    try:
        img = Image.open(path)
        try:
            img = ImageOps.exif_transpose(img)  # honour phone rotation
        except Exception:
            pass
        img = img.convert("L")
        w, h = img.size
        if max(w, h) < 1600:
            scale = 1600.0 / float(max(w, h))
            img = img.resize((int(w * scale), int(h * scale)))
        img = ImageOps.autocontrast(img)
        return (pytesseract.image_to_string(img) or "").strip()
    except Exception:
        return ""


# --------------------------------------------------------------- extraction

def _money(s: str) -> float | None:
    try:
        return float(s.replace(",", ""))
    except ValueError:
        return None


def parse_date(text: str) -> str | None:
    for rx, kind in DATE_PATTERNS:
        m = rx.search(text)
        if not m:
            continue
        try:
            if kind == "ymd":
                y, mo, d = int(m[1]), int(m[2]), int(m[3])
            elif kind == "mdy_or_dmy":
                a, b, y = int(m[1]), int(m[2]), int(m[3])
                if a > 12 and b <= 12:
                    d, mo = a, b
                elif b > 12 and a <= 12:
                    mo, d = a, b
                else:
                    return None            # ambiguous (e.g. 03/04/2026): don't guess
            elif kind == "mdy2":
                a, b, y = int(m[1]), int(m[2]), 2000 + int(m[3])
                if a > 12 and b <= 12:
                    d, mo = a, b
                elif b > 12 and a <= 12:
                    mo, d = a, b
                else:
                    return None
            elif kind == "mon_d_y":
                mo = MONTHS.get(m[1][:3].lower()); d, y = int(m[2]), int(m[3])
                if not mo:
                    continue
            else:  # d_mon_y
                d = int(m[1]); mo = MONTHS.get(m[2][:3].lower()); y = int(m[3])
                if not mo:
                    continue
            return dt.date(y, mo, d).isoformat()
        except ValueError:
            continue
    return None


def _amount_on_line(line: str) -> float | None:
    vals = [_money(x) for x in MONEY.findall(line)]
    vals = [v for v in vals if v is not None]
    return vals[-1] if vals else None


def parse_amounts(text: str) -> tuple[float | None, float | None, float | None, bool]:
    """(subtotal, gst, total, ambiguous). total = amount on a 'total' line;
    if no such line, the largest amount only when it is unique."""
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    subtotal = gst = total = None
    for ln in lines:
        amt = _amount_on_line(ln)
        if amt is None:
            continue
        if SUBTOTAL_WORDS.search(ln) and subtotal is None:
            subtotal = amt
        elif GST_WORDS.search(ln) and gst is None and amt < 10000:
            gst = amt
        elif TOTAL_WORDS.search(ln) and not SUBTOTAL_WORDS.search(ln):
            total = amt                          # last 'total' line wins (grand total is usually last)
    ambiguous = False
    if total is None:
        all_vals = [v for v in (_money(x) for x in MONEY.findall(text)) if v is not None]
        if all_vals:
            mx = max(all_vals)
            if all_vals.count(mx) == 1 and (subtotal is None or mx >= subtotal):
                total = mx
            else:
                ambiguous = True
    # sanity: subtotal + gst should not exceed total
    if total is not None and subtotal is not None and subtotal > total + 0.01:
        ambiguous = True
    return subtotal, gst, total, ambiguous


def parse_vendor(text: str) -> str | None:
    """First meaningful line that isn't a date, amount or boilerplate."""
    for ln in text.splitlines()[:8]:
        s = ln.strip(" #*|-_")
        if len(s) < 3 or len(s) > 60 or SKIP_VENDOR.match(s):
            continue
        if MONEY.search(s) or parse_date(s):
            continue
        if re.search(r"\d{3}[-. ]\d{3}[-. ]\d{4}", s):   # phone number line
            continue
        return s
    return None


def extract_regex(text: str) -> dict:
    subtotal, gst, total, ambiguous = parse_amounts(text)
    return {"date": parse_date(text), "vendor": parse_vendor(text),
            "subtotal": subtotal, "gst": gst, "total": total, "ambiguous": ambiguous}


def is_loopback(url: str) -> bool:
    """True only for a URL on this computer (127.0.0.1 / localhost / ::1)."""
    try:
        host = (urllib.parse.urlsplit(url).hostname or "").lower()
    except ValueError:
        return False
    return host in LOOPBACK_HOSTS or host.startswith("127.")


def ask_ollama(text: str, timeout: float = 30.0) -> dict | None:
    """Local model, only when regex is short. Answer must be valid JSON with
    the four keys or it is discarded (returns None). Refuses to talk to any
    host that is not this computer: this tool makes no network calls."""
    if not is_loopback(OLLAMA_URL):
        return None
    prompt = ("Extract from this receipt text. Reply with ONLY a JSON object with keys "
              "date (YYYY-MM-DD or null), vendor (string or null), gst (number or null), "
              "total (number or null). Use null when not sure. Never guess.\n\n" + text[:4000])
    body = json.dumps({"model": OLLAMA_MODEL, "prompt": prompt, "stream": False,
                       "format": "json", "options": {"temperature": 0}}).encode()
    req = urllib.request.Request(f"{OLLAMA_URL}/api/generate", data=body,
                                 headers={"content-type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            out = json.loads(r.read().decode()).get("response", "")
        data = json.loads(out)
    except Exception:
        return None
    if not isinstance(data, dict) or not {"date", "vendor", "gst", "total"} <= set(data):
        return None
    if data.get("date") is not None:
        try:
            dt.date.fromisoformat(str(data["date"]))      # must be a real calendar date
        except ValueError:
            return None
    for k in ("gst", "total"):
        if data.get(k) is not None and not isinstance(data[k], (int, float)):
            return None
    return data


def extract(text: str, use_llm: bool = True, llm=ask_ollama) -> dict:
    """Regex first; the model only fills gaps when fewer than 3 of 4 fields
    were found, and the model never overrides a regex value."""
    f = extract_regex(text)
    found = sum(1 for k in ("date", "vendor", "gst", "total") if f.get(k) is not None)
    if use_llm and found < 3 and text.strip():
        ans = llm(text)
        if ans:
            for k in ("date", "vendor", "gst", "total"):
                if f.get(k) is None and ans.get(k) is not None:
                    f[k] = ans[k]
    status = "ok"
    if not text.strip() or f["total"] is None or f["date"] is None or f["vendor"] is None or f["ambiguous"]:
        status = "needs_review"
    f["status"] = status
    return f


# ------------------------------------------------------------------ driver

def _fmt(v) -> str:
    if v is None:
        return ""
    return f"{v:.2f}" if isinstance(v, (int, float)) else str(v)


def process_folder(folder: str, use_llm: bool = True, llm=ask_ollama) -> list[dict]:
    rows = []
    for name in sorted(os.listdir(folder)):
        path = os.path.join(folder, name)
        if not os.path.isfile(path) or os.path.splitext(name)[1].lower() not in EXTS:
            continue
        text = read_text(path)
        f = extract(text, use_llm, llm) if text else {"date": None, "vendor": None, "subtotal": None,
                                                      "gst": None, "total": None, "status": "needs_review"}
        rows.append({"file": name, "date": _fmt(f["date"]), "vendor": _fmt(f["vendor"]),
                     "subtotal": _fmt(f["subtotal"]), "gst": _fmt(f["gst"]),
                     "total": _fmt(f["total"]), "status": f["status"]})
    return rows


def rows_to_csv(rows: list[dict]) -> str:
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=COLUMNS, lineterminator="\n")
    w.writeheader()
    for r in rows:
        w.writerow(r)
    return buf.getvalue()


def summary(rows: list[dict]) -> str:
    total = sum(float(r["total"]) for r in rows if r["total"])
    review = sum(1 for r in rows if r["status"] == "needs_review")
    return (f"{len(rows)} receipt{'s' if len(rows) != 1 else ''} read\n"
            f"total of readable receipts: ${total:,.2f}\n"
            f"{review} need{'s' if review == 1 else ''} review (blank fields - check by hand)\n"
            f"\n{ONFILE_CTA}")


# --------------------------------------------------------------------- web

def _crescent_b64() -> str:
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "crescent-b64.txt")
    try:
        with open(path, "r", encoding="ascii") as f:
            return f.read().strip()
    except FileNotFoundError:
        return ""


CALAS_BRAND_CSS = """
.calas-mark{display:flex;align-items:center;gap:10px;margin-bottom:18px}
.calas-mark .crescent{width:36px;height:36px;flex:none;perspective:600px;
  animation:calasSpin 8s linear infinite;transform-style:preserve-3d}
.calas-mark .crescent:hover{animation-play-state:paused}
@keyframes calasSpin{from{transform:rotateY(0deg)}to{transform:rotateY(360deg)}}
.calas-mark .markword{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11px;
  letter-spacing:.08em;color:#0B2E45}
@media (prefers-reduced-motion:reduce){.calas-mark .crescent{animation:none}}
"""


def _calas_mark_html() -> str:
    b64 = _crescent_b64()
    img = f'<img src="data:image/png;base64,{b64}" alt="Calas Automations" class="crescent">' if b64 else ""
    return f'<div class="calas-mark">{img}<div class="markword">CALAS AUTOMATIONS &middot; WINNIPEG</div></div>'


PAGE = f"""<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ReceiptSort</title>
<style>body{{font-family:system-ui,sans-serif;max-width:560px;margin:48px auto;padding:0 16px;color:#1c2430}}
h1{{color:#155F87;margin-bottom:4px}}.g{{border-top:2px solid #F0C171;margin:8px 0 20px}}
input[type=file]{{display:block;margin:16px 0}}button{{background:#155F87;color:#fff;border:0;border-radius:8px;padding:12px 18px;font-size:1em}}
small{{color:#5b6673}}{CALAS_BRAND_CSS}</style>
{_calas_mark_html()}
<h1>ReceiptSort</h1><div class="g"></div>
<p>Pick your receipt PDFs or photos. You get back one spreadsheet (CSV): date, vendor, subtotal, GST, total, and a "needs review" flag on anything unclear. Nothing is uploaded anywhere - this runs on this computer.</p>
<p><small>No network calls, ever - the only optional connection is to a model on your own computer (Ollama at 127.0.0.1); start with <code>--no-llm</code> to disable even that.</small></p>
<form method="post" enctype="multipart/form-data" action="/sort"><input type="file" name="files" multiple accept=".pdf,.jpg,.jpeg,.png" required><button>Make my CSV</button></form>
<p><small>Free tool from Calas Automations, Winnipeg. No support promised. Photos are read with local Tesseract OCR (offline - nothing leaves your computer); anything it cannot read comes back as "needs review", never a guess.</small></p>
<p><small>{ONFILE_CTA.replace("calasautomations.com/accounting", '<a href="https://calasautomations.com/accounting">calasautomations.com/accounting</a>')}</small></p>"""


def serve(port: int = 8765, use_llm: bool = True) -> None:
    import cgi
    import tempfile
    from http.server import BaseHTTPRequestHandler, HTTPServer

    class H(BaseHTTPRequestHandler):
        def log_message(self, *a):  # quiet
            pass

        def do_GET(self):
            self.send_response(200); self.send_header("content-type", "text/html; charset=utf-8"); self.end_headers()
            self.wfile.write(PAGE.encode())

        def do_POST(self):
            if self.path != "/sort":
                self.send_response(404); self.end_headers(); return
            form = cgi.FieldStorage(fp=self.rfile, headers=self.headers,
                                    environ={"REQUEST_METHOD": "POST", "CONTENT_TYPE": self.headers.get("content-type", "")})
            items = form["files"] if "files" in form else []
            if not isinstance(items, list):
                items = [items]
            with tempfile.TemporaryDirectory() as td:
                for it in items:
                    if getattr(it, "filename", None):
                        safe = os.path.basename(it.filename)
                        with open(os.path.join(td, safe), "wb") as f:
                            f.write(it.file.read())
                rows = process_folder(td, use_llm)
            body = rows_to_csv(rows).encode("utf-8-sig")
            self.send_response(200)
            self.send_header("content-type", "text/csv; charset=utf-8")
            self.send_header("content-disposition", 'attachment; filename="receipts.csv"')
            self.send_header("content-length", str(len(body))); self.end_headers()
            self.wfile.write(body)

    print(f"ReceiptSort is open at http://127.0.0.1:{port}  (Ctrl+C to stop)")
    HTTPServer(("127.0.0.1", port), H).serve_forever()


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Receipts folder -> receipts.csv")
    ap.add_argument("folder", nargs="?"); ap.add_argument("--out", default="receipts.csv")
    ap.add_argument("--no-llm", action="store_true", help="regex only, never ask the local model")
    ap.add_argument("--web", action="store_true"); ap.add_argument("--port", type=int, default=8765)
    a = ap.parse_args(argv)
    if a.web:
        serve(a.port, not a.no_llm); return 0
    if not a.folder or not os.path.isdir(a.folder):
        ap.error("give a folder of receipts, or --web")
    rows = process_folder(a.folder, not a.no_llm)
    with open(a.out, "w", encoding="utf-8-sig", newline="") as f:
        f.write(rows_to_csv(rows))
    print(a.out); print(summary(rows))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
