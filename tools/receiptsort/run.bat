@echo off
REM ReceiptSort - free tool from Calas Automations, Winnipeg.
REM Starts the drop-files page at http://127.0.0.1:8765 on this computer.
REM No network calls, ever. Add --no-llm below to also skip the local Ollama model.
cd /d "%~dp0"
py -3 -c "import markitdown" 2>NUL
if errorlevel 1 (
  echo ReceiptSort needs the 'markitdown' package to read PDFs and images.
  echo Install it once with:   py -3 -m pip install -r requirements.txt
  echo.
  echo Continuing anyway - without it every receipt comes back as needs_review.
  echo.
)
py -3 receiptsort.py --web
pause
