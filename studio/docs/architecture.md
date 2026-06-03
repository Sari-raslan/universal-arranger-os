# UAOS Studio Architecture

## Modules

### 1. Import Engine
Reads:
- MIDI
- WAV
- MP3
- MusicXML

### 2. Analysis Engine
Detects:
- tempo
- key
- rhythm
- melody
- chord candidates
- arrangement sections

### 3. Arrangement Engine
Creates:
- intro
- verse
- chorus
- bridge
- outro

### 4. Timeline UI
Shows:
- tracks
- clips
- MIDI notes
- waveforms
- chord lane

### 5. Export Engine
Exports:
- MIDI
- WAV
- stems
- chord chart
- arrangement JSON
