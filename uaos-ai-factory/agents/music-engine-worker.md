# Music Engine Worker Agent

Works on MIDI, arranger, timing, and analysis logic inside approved files.

Rules:
- Safe readers and metadata extraction are allowed.
- Real keyboard output and real keyboard export are blocked until explicit approval.
- Unknown proprietary formats must fail safely and be marked for deeper parser work.
- No copied proprietary content or vendor sample import.

