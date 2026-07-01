# UAOS Arranger Plan Validator Task 005

Status: READY

## Purpose

Validate safe UAOS arranger plan JSON fixtures and reject missing structure or forbidden claims.

## Run

```powershell
node validate-arranger-plan-fixtures.js
```

## Checks

- Project/title metadata.
- Sections array.
- Required sections: intro, verse, chorus, ending.
- Optional sections: bridge, fill, prechorus, outro.
- Section fields: name, bars, chords or harmonicPlan, instruments, role.
- Maqam metadata allowed.
- Quarter-tone metadata allowed.
- MIDI-only/spec-only output allowed.
- Forbidden claims rejected.

## Safety

- No App.jsx.
- No deploy.
- No Vercel.
- No keyboard output.
- No proprietary copying.
- No Jobcenter folders touched.
