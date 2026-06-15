# UAOS MIDI Learn System

The Phase 6 MIDI Learn system lives in `uaos-live-clean/src/hardware/hardwarePhase6.js`.

## Supported Controls

- Notes
- Control Change
- Program Change
- Pitch Bend
- Channel filtering
- Profile-scoped mappings
- Global mappings
- Save, replace, delete, export, and import mapping JSON
- Duplicate-control warnings
- Mapping conflict detection
- Cancel and timeout states

## Persistence

Mappings can be stored in the Phase 6 hardware session state and exported with `serializeMappings`. Imported JSON is validated by `importMappings`.

## Limitations

Mappings marked `experimental` or `manual-verification-required` require physical device validation before public support claims.
