# ReceiptSort — free tool, no support promised

Drop a folder of receipts (PDF or photo) in, get one spreadsheet out.

```
python receiptsort.py C:\path\to\receipts            # writes receipts.csv next to you
python receiptsort.py --web                          # opens a drop-files page at http://127.0.0.1:8765
run.bat                                              # Windows: double-click, same as --web
```

Columns: file, date, vendor, subtotal, gst, total, status. `status=needs_review` means a field is blank because the tool wasn't sure — it never guesses a vendor or a total.
Runs offline on your own computer. PDFs and photos with a text layer work; plain photos come back as needs_review (no OCR, no cloud).
The local model (Ollama, `calas-chat`) is only asked when the simple rules find fewer than 3 of 4 fields; `--no-llm` turns it off.

**No network calls, ever — the only optional connection is to a model on your own computer (Ollama at 127.0.0.1); pass `--no-llm` to disable even that.** The code refuses to contact any `OLLAMA_URL` that is not a loopback address.

Needs Python 3.10+ and `markitdown` (`pip install -r requirements.txt`). Test: `python -m pytest -q`

---

From Calas Automations, Winnipeg — the free door into On File for accounting firms.

Tired of chasing receipts from clients? On File by Calas Automations chases the documents for you — calasautomations.com/accounting


## Photos (OCR)

ReceiptSort reads photos with local Tesseract OCR (offline - nothing is uploaded).
Install once:

    pip install markitdown pytesseract Pillow

and install Tesseract OCR (https://github.com/tesseract-ocr/tesseract) for photo
support. PDFs with a text layer work without it. Anything ReceiptSort cannot read
is left blank and marked needs_review - it never guesses.
