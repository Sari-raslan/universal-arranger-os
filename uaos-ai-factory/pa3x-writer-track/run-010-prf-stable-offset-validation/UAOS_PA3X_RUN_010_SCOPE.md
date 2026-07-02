# UAOS PA3X Run 010 Scope

Status: READ ONLY.

Run 010 validates only the stable PRF structural offsets identified in Run 009.

## Scope
- Load Run 009 stable regions and consistency results.
- Select the same PRF files from metadata.
- Read only 64-byte windows around stable offsets.
- Compare structural fingerprints across files.
- Decide whether PRF can move to read-only parser v1 or whether STYLE/PAD should be probed first.

## Forbidden
- No value decoding.
- No musical meaning or performance names/settings.
- No keyboard output.
- No generated .SET/.STY/.PRS/.PRF/.KST files.
- No USB write or keyboard transfer.
- No fixture modification.
