# UAOS Agent Prewriter Factory Validation Rules

validator_status: "DRAFT_ONLY_NOT_RUN"
metadata_only: true

## Required Checks
- Required files and folders exist.
- Forbidden KORG, MIDI, audio, package, USB, deploy, payment, and application files are absent.
- Export approval claims are absent.
- Future versions V62-V70 are not marked complete.
- Real owner approval is not applied.
- App.jsx is not present or touched inside the factory.
- Source mutation indicators are absent.
- Draft materials include DRAFT_ONLY_NOT_RUN or DRAFT_NOT_RUN labeling.
- Required safety flags remain false.

## Required Result Fields
- validator_result
- checked_at
- factory_path
- forbidden_file_findings
- forbidden_claim_findings
- required_file_findings
- safety_flag_findings
