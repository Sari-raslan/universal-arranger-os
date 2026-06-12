# UAOS V2 Device Profile Format

```json
{
  "version": 2,
  "id": "generic-midi-controller",
  "name": "Generic MIDI Controller",
  "verified": true,
  "capabilities": ["notes", "cc", "program", "pitchbend"],
  "unsupported": []
}
```

Only the generic MIDI controller profile is marked verified. KORG PA, Yamaha Genos, Roland arranger, Ketron arranger, generic foot controller templates are mapping templates until hardware testing verifies them. Proprietary style conversion is explicitly unsupported.

