# UAOS PA3X Run 044A Previous Parser Comparison

Status: PASS - READ-ONLY REPORT COMPARISON

## Inputs Reviewed

- Run 007 minimal structural parser
- Run 008 structural layer 2
- Run 009 controlled structural checks
- Run 010 stable offset validation
- Run 011 read-only parser v1
- Run 031 deeper parser research
- Run 032 PRF-like V3 candidate records
- Run 033 expected path was not found

## Comparison Summary

Run 007 established a first structural map and schema draft, but did not decode fields.

Run 008 expanded region boundaries, length catalogues, and structural fingerprints. It still did not define a writable format.

Run 009 found three stable-offset anchors and many variable regions. It reported 16 PRF files and kept output read-only.

Run 010 validated the three stable offsets with 16 windows each, present ratio 1, no outliers, and confidence score 0.915.

Run 011 used those outputs to produce read-only parser v1 artifacts for 16 PRFs. Its region summaries show one file header, two stable regions, many repeated regions, occasional variable regions, and one unknown region per PRF.

Run 031 converted prior evidence into a research-only V3 blueprint. It allowed discussion of a local TEST_UNVERIFIED candidate, but did not prove device acceptance.

Run 032 created and validated a local TEST_UNVERIFIED V3 candidate file. Its manifest kept keyboardReady, usbWriteApproved, keyboardLoadApproved, and overwriteAllowed all false.

Run 033 is listed as an expected prior input but is missing at the requested path, so binary-inspection evidence from that run cannot be relied upon in Run 044A.

## Research Conclusion

The PRF parser chain supports read-only structural parsing and cautious design notes. It does not yet support a verified writer, a verified loader, or any hardware-use claim.
