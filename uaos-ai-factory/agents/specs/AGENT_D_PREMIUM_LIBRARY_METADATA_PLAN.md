# Agent D Premium Library Metadata Plan

Status: LOCAL ONLY

Purpose: define a metadata-only planning model for standard and future premium libraries without samples, audio assets, proprietary content, Kontakt content, Native Instruments content, or ownership claims over third-party libraries.

No samples are copied. No audio files are created. No keyboard writer/export is created.

## Library Tiers

### Standard Library Tier

Use this tier for safe local planning records that describe built-in or original project metadata ideas.

Allowed metadata examples:

- Library display name.
- Category.
- Instrument family.
- Style/use case.
- Mood tags.
- Tempo range.
- Region/culture tag when appropriate.
- Source status: original, placeholder, user-owned, or planning-only.
- Rights note.
- QA note.
- Demo readiness note.

### Future Premium Library Tier

Use this tier only as roadmap planning for original or properly licensed future content.

Premium tier does not mean:

- copied commercial libraries.
- copied Kontakt content.
- copied Native Instruments content.
- copied samples.
- proof of ownership over third-party material.
- ready-for-sale audio content.

Premium tier may mean future metadata planning for:

- owner-created original sounds.
- user-owned/imported libraries with user responsibility clearly documented.
- licensed content after explicit rights review.
- curated metadata, categories, QA notes, and provenance notes.

## Metadata-Only Schema Idea

Example metadata fields:

```json
{
  "libraryId": "planning-only-id",
  "tier": "standard-or-future-premium",
  "displayName": "Planning Name",
  "instrumentFamily": "keys|strings|brass|drums|world|synth|other",
  "styleTags": ["planning", "demo"],
  "tempoRange": "optional",
  "sourceStatus": "original|user-owned|licensed-future|placeholder|planning-only",
  "rightsStatus": "unknown|owner-created|user-confirmed|license-review-needed",
  "containsSamples": false,
  "containsThirdPartyContent": false,
  "kontaktNativeInstrumentsContent": false,
  "ownershipClaimAllowed": false,
  "exportReady": false,
  "notes": "Metadata planning only."
}
```

## No-Sample Rule

- No samples copied.
- No audio created.
- No audio imported.
- No commercial library files referenced as included assets.
- No proprietary folder copied.
- No file conversion into keyboard formats.

## Kontakt / Native Instruments Rule

- No Kontakt content copied.
- No Native Instruments content copied.
- No claim that UAOS owns Kontakt, Native Instruments, or third-party library content.
- Any future user-owned/imported library must be marked as user-owned/imported and rights-responsibility must stay with the user unless a license review proves otherwise.

## User-Owned / Imported-Library Distinction

Future wording should distinguish:

- Original UAOS/owner-created library: content created by the owner/project.
- User-owned imported library: content supplied by the user, with user responsibility for rights.
- Licensed future library: content used only after explicit license review.
- Planning-only placeholder: metadata record with no audio or sample content.

## Safe Roadmap For Original / Premium Libraries Later

1. Keep current work metadata-only.
2. Define rights/provenance fields before any content work.
3. Create original sound/content plan separately.
4. Add QA rules for naming, categories, and source status.
5. Require owner approval before any content import.
6. Require rights review before any licensed or third-party content use.
7. Keep keyboard writer/export blocked until separately approved.
8. Keep public release and payment blocked until owner approval.

## Forbidden Claims

Do not claim:

- Premium library content exists now.
- Commercial sample libraries are included.
- Kontakt or Native Instruments content is owned by UAOS.
- User imported content is owned by UAOS.
- Real keyboard export is active.
- Payment or commercial release is active.
- Public release is active.
