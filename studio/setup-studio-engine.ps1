Write-Host 'Setting up UAOS Studio engine...'

cd studio\engine

python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

Write-Host 'UAOS Studio engine ready.'
Write-Host 'Analyze MIDI:'
Write-Host '.\.venv\Scripts\python.exe analysis\midi_analyzer.py path\to\file.mid'
Write-Host 'Analyze Audio:'
Write-Host '.\.venv\Scripts\python.exe analysis\audio_analyzer.py path\to\file.wav'
