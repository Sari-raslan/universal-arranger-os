# UAOS SysEx Safety

SysEx is disabled by default in Phase 6.

## Required For Any Real Send

- Explicit user permission
- Device/profile whitelist
- Manufacturer ID whitelist
- Maximum message size
- Send confirmation
- Rate-limited output engine
- Cancellation and timeout support

## Defaults

- `enabled: false`
- `userPermission: false`
- `dryRun: true`
- destructive commands blocked
- undocumented packets blocked

## Prohibited

- Automatic firmware commands
- Factory reset commands
- Destructive memory writes
- Undocumented SysEx packets by default
- Real SysEx in automated tests

Automated tests use dry-run validation only.
