# UAOS Library Metadata Validator Task 006

Status: READY

## Purpose

Validate UAOS Library Factory metadata, Oriental Strings requirements, source policy, quality tiers, and sample-safety rules.

## Run

```powershell
node validate-library-metadata-fixtures.js
```

## Checks

- Required library fields: id, name, type, tier, version.
- Tier is `standard`, `premium`, or `future_pro`.
- Source policy is `original_recording_planned`, `synthesis_metadata_only`, or `midi_spec_only`.
- No commercial or proprietary sample source.
- No Kontakt copying.
- No Native Instruments copying.
- No commercial sample copying.
- Instrument libraries include articulations.
- Oriental Strings libraries include legato, portamento, slides, trills, tremolo, marcato, and emotional_sustain.
- Maqam metadata allowed.
- Quarter-tone metadata allowed.
- Forbidden output/payment claims rejected.

## Safety

- No App.jsx.
- No deploy.
- No Vercel.
- No keyboard output.
- No proprietary copying.
- No Jobcenter folders touched.
