Write-Host 'Setting up UAOS Instruments Engine'

python -m venv instruments\engine\.venv
.\instruments\engine\.venv\Scripts\python.exe -m pip install --upgrade pip
.\instruments\engine\.venv\Scripts\python.exe -m pip install -r instruments\engine\requirements.txt

Write-Host 'Generating synthetic piano samples...'
.\instruments\engine\.venv\Scripts\python.exe instruments\engine\piano\generate_synthetic_piano_samples.py

Write-Host 'Building piano preset...'
.\instruments\engine\.venv\Scripts\python.exe instruments\engine\piano\build_piano_preset.py

Write-Host 'Creating demo MIDI...'
.\instruments\engine\.venv\Scripts\python.exe instruments\engine\piano\create_demo_midi.py

Write-Host 'Rendering demo piano audio...'
.\instruments\engine\.venv\Scripts\python.exe instruments\engine\sampler\sampler_render.py

Write-Host 'UAOS Instruments ready.'
Start-Process 'instruments\engine\piano\demo_render.wav'
