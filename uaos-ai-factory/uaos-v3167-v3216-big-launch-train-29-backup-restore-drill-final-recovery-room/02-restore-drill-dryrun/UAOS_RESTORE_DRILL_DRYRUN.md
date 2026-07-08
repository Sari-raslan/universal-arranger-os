# UAOS Restore Drill Dryrun

Status: RESTORE_DRILL_DRYRUN_READY

Meaning:
This is a safe rehearsal of restore logic.

It does not:
- copy backup files
- overwrite active project
- delete anything
- deploy anything
- activate payment

Manager default:
Keep restore as dryrun only unless active project breaks and owner explicitly approves a real restore.
