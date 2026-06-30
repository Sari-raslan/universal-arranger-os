# Snapshot-to-UI Mapping Spec

LOCAL ONLY - READ ONLY SPEC - NO APP SOURCE CHANGE

## Source Snapshot

`uaos-ai-factory/SELECTED_NEUTRAL_PACKAGE_SNAPSHOT.json`

## Target UI Panel

Selected Neutral Package panel.

## Field Mapping

| Snapshot field | UI field | Display rule |
| --- | --- | --- |
| `selectedPackageId` | Selected package | Display exact string, currently `owner-neutral-003`. |
| `packageType` | Package type | Display exact string, currently `.uaos-neutral.json`. |
| `keyboardNative` | Keyboard-native | Display `NO` when false. Never imply keyboard-native readiness. |
| `compatibility` | Compatibility | Display exact status, currently `UNVERIFIED`. |
| `validationStatus` | Validation | Display exact status, currently `PASS`. |
| `reviewStatus` | Review status | Display exact owner review status. |
| `realKeyboardOutput` | Real keyboard output | Display exact status, currently `NO`. |
| `keyboardTransfer` | Keyboard transfer | Display exact status, currently `NO`. |
| `safetyLabels` | UI safety badges | Display as read-only labels/badges. |
| `sourcePaths` | Local review links/paths | Display as local paths only; no network links. |
| `noNetwork` / `noWriteFromUi` / `noExportFromUi` | Read-only constraints | Preserve as blocked UI behavior constraints. |

## Read-Only Constraints

- No network.
- No write.
- No export.
- No keyboard actions.
- No keyboard output.
- No keyboard transfer.
- No payment.
- No deploy.
- No Vercel.
- No public release claim.

## Future Use

Any future `App.jsx` integration remains blocked until exact approval is provided in a later task. This spec does not modify UI code.

