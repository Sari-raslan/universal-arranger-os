Write-Host "UAOS Full Local Check"

Write-Host "Repository status:"
git status

Write-Host "Latest commits:"
git log --oneline -5

Write-Host "Testing MIDI prototype..."
cd engine\midi\prototype

if (!(Test-Path ".venv")) {
    python -m venv .venv
}

.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe create_test_audio.py
.\.venv\Scripts\python.exe voice_to_midi.py

Write-Host "UAOS local check complete."
