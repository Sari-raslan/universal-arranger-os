# UAOS PA3X Run 044A Region Confidence Table

Status: PASS - READ-ONLY CONFIDENCE TABLE

| Region | Evidence | Confidence | Safe Use | Unsafe Use |
| --- | --- | --- | --- | --- |
| Offset 0 anchor | Runs 009 and 010, 16 PRFs, no outliers | High for read-only parsing | Parser alignment and schema checks | Writer proof |
| Offset 17 anchor | Runs 009 and 010, 16 PRFs, no outliers | High for read-only parsing | Parser alignment and schema checks | Writer proof |
| Offset 23 anchor | Runs 009 and 010, 16 PRFs, no outliers | High for read-only parsing | Parser alignment and schema checks | Writer proof |
| Repeated regions | Run 011 shows repeated regions across all PRFs | Medium for grouping | Boundary hypothesis and count validation | Direct synthesis |
| Variable regions | Run 011 shows file-dependent variable regions | Low for writing | Unknown-safe parser labeling | Direct synthesis |
| Unknown trailing region | Run 011 shows one unknown region per PRF | Low for writing | Stop-zone marker | Filling with synthetic bytes |

## Conclusion

The safest parser v2 direction is to strengthen read-only validation around offsets 0, 17, and 23, while treating repeated, variable, and unknown regions as non-writable until more evidence exists.
