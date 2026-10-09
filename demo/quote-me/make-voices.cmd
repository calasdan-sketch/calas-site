@echo off
rem Generates the Quote Me demo narration in ElevenLabs "Sarah".
rem Your API key stays on this machine - it is only used by the script below.
cd /d "%~dp0"
echo.
echo Paste your ElevenLabs API key and press Enter.
echo (From elevenlabs.io - Developers - API Keys. If you can't see the full
echo  key, click "Create Key", copy it when it shows, and paste that.)
echo.
set /p ELEVENLABS_API_KEY=Key: 
echo.
echo Generating narration (ElevenLabs "Sarah")...
python gen_narration.py
echo.
echo Done. Copy the line that starts with DURS= and paste it back to Claude.
pause
