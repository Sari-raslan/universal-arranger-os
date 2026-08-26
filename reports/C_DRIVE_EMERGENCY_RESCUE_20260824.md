# UAOS C-drive emergency rescue — 2026-08-24

## Captured fields

- **C_FREE_BEFORE_GB:** 109.30
- **C_FREE_AFTER_GB:** 109.96
- **SPACE_RECLAIMED_GB:** 0.66 (measurement noise; cleanup did not complete)
- **SHUTDOWN_HEURISTIC:** `C_FREE_ABOVE_20GB; KERNEL_POWER_41_COUNT_7D=5; EVENTLOG_6008_COUNT=5; BUGCHECK_0x124_WHEA_UNCORRECTABLE_TODAY=2; WHEA_COUNT_7D=888; WHEA_TYPE=Corrected_Cache_Hierarchy_Processor_Core; NOT_DISK_FULL_AS_PRIMARY_CAUSE`
- **HIBERNATION_TEMPORARILY_DISABLED:** YES (already disabled; no `C:\hiberfil.sys`)
- **FINAL_DISK_STATUS:** `SAFE_ABOVE_20GB_REGRESSION_NOT_RESUMED`

## Git freeze (unchanged HEAD / branch)

- Repo: `C:\keyboard-manager-clean`
- Branch: `factory/p0-integration-safety-fixes-20260814`
- HEAD: `5aeac11779bd678ca3c80d16144e302a5eb5d9f6`
- Commander / Singy / Arranger source: not modified
- No checkout, commit, or stash

## Regression

- No force-kill
- No new build or regression started
- Not resumed (`C:` is above 20 GB, but the instruction was to stop)

## Elevation

`RUN-UAOS-C-DRIVE-RESCUE.cmd` requested Administrator via UAC and is still waiting. This Cursor session is not elevated. Hibernation was already off, so the main admin action has nothing left to disable.

## Last events (today)

Kernel-Power 41 unexpected reboot: 18:17, 20:13, 21:44.

WER bugcheck 0x124 (WHEA uncorrectable): 18:17 and 20:13.

WHEA-Logger 19: corrected Processor Core cache-hierarchy machine checks, still occurring after 21:50.

EventLog 6008: three unexpected shutdowns today, two on 2026-08-19.
