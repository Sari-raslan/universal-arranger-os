# UAOS V422 Parser Research Summary For Review

Current schema v6 is read-only and excludes writer fields, native output fields, and mutation actions. Confidence v6 marks header confidence as reference-supported, while structural regions, section mapping, track mapping, checksum, compression, and encryption remain weak or unknown.

Known anchors:
- Prior rank 1/2/3 reports exist by reference.
- Header-like regions are observed by reference.
- Unknown-region catalog exists.

Unknowns:
- Region semantics.
- Section boundary proof.
- Track role proof.
- Checksum, compression, and encryption model.

writer_ready remains false because the evidence cannot safely support native output generation.
