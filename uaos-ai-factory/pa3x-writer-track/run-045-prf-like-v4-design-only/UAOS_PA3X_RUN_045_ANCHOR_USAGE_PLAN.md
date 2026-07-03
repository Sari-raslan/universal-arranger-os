# UAOS PA3X Run 045 Anchor Usage Plan

Status: DESIGN ONLY

## Anchors

Run 044A identifies offsets 0, 17, and 23 as the safest structural anchors. Run 045 treats these offsets only as parser-alignment anchors.

## Allowed Anchor Use

- Mark anchor locations in a design plan.
- Require future validator checks around anchor placement.
- Compare future local-only candidate bytes against the design plan.
- Preserve TEST_UNVERIFIED labeling near anchor documentation.

## Disallowed Anchor Use

- Do not treat anchors as decoded musical meaning.
- Do not infer keyboard behavior from anchors.
- Do not copy fixture bytes at or near anchors.
- Do not claim that anchor placement proves a valid PRF.
- Do not use anchors to approve USB, package copy, or PA3X load.

## V4 Improvement Over V3

V4 should make anchor purpose clearer than V3 by separating anchor markers, unknown-region guards, and local-only warning markers in the design.
