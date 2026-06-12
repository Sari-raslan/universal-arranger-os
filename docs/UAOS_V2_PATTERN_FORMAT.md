# UAOS V2 Pattern Format

```json
{
  "version": 2,
  "id": "pattern-1",
  "name": "New Pattern",
  "ppq": 480,
  "lengthTicks": 1920,
  "lanes": {},
  "metadata": {},
  "loop": { "startTick": 0, "endTick": 1920 },
  "notes": [
    { "lane": "lead", "tick": 0, "note": 60, "duration": 120, "velocity": 100 }
  ]
}
```

Validation requires every note to have a non-negative tick, MIDI note 0-127, and positive duration. Playback expands notes into ordered note-on and note-off events.

