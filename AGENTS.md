# Keyboard Manager — AI Development Instructions

You are building Keyboard Manager.

Do not ask more questions. Work carefully and continue improving the app.

Goal:
Build a real arranger keyboard file manager and reader, similar in concept to PA editor tools, but as our own app.

Important:
Do not download copyrighted keyboard files or proprietary commercial content.
Use only user-provided files in /samples and safe public/open documentation.
If a format is proprietary, build safe readers, metadata extraction, hex/ASCII inspection, and adapter interfaces.

App name:
Keyboard Manager

Required stack:
- React + Vite frontend
- Node + Express backend

Main folders:
- backend
- frontend
- samples
- docs
- ai-tasks

Required features:
1. Read and inspect these files:
   - .mid
   - .midi
   - .syx
   - .sty
   - .set
   - .pcg
   - .kst
   - .pad
   - .prs
   - .all
   - .bkp
   - .pkg
   - unknown binary formats

2. MIDI parser:
   - validate MThd header
   - read format
   - read track count
   - read PPQ/division
   - count notes
   - count controllers
   - count program changes
   - count tempo events
   - count SysEx events

3. SysEx parser:
   - detect F0/F7
   - count blocks
   - detect manufacturer byte
   - show raw hex safely

4. Arranger parser:
   - detect possible brand:
     Korg, Yamaha, Roland, Ketron, unknown
   - safely inspect binary data
   - extract strings if possible
   - extract metadata
   - never crash
   - mark deep parser needed when format is proprietary

5. USB MIDI:
   - use Web MIDI API
   - detect inputs
   - detect outputs
   - show live note/controller/program messages

6. UI:
   - dashboard
   - upload screen
   - library screen
   - MIDI monitor
   - analysis viewer
   - export JSON button
   - beautiful modern interface
   - Arabic/English friendly labels

7. Backend API:
   - GET /api/status
   - POST /api/upload
   - GET /api/library
   - GET /api/library/:id
   - GET /api/export/:id
   - DELETE /api/library/:id

8. Quality:
   - robust error handling
   - no fake claims
   - no crash on unknown files
   - lightweight
   - fast
   - clear code comments
   - build and run locally

Commands that must work:
Backend:
cd backend
npm install
npm start

Frontend:
cd frontend
npm install
npm run dev

Use the real sample file if present:
C:\Users\ssare\Desktop\sar.SET

If that file exists, copy it into:
samples\Korg\sar.SET

Then analyze it and create:
docs\sar-set-analysis.json
docs\sar-set-notes.md

Keep improving until the local MVP runs.
