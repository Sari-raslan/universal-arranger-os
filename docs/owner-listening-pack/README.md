# UAOS Owner Listening Pack — real musical sketches

**STATUS:** `OWNER_LISTENING_PACK_REAL_MUSICAL_CONTENT_READY`  
**TASK-05-00605-MUSICAL_BRAIN_CONTRACT:** still **OWNER_GATE** — not PASS  
**musicalQualityPass:** false

Owner correction applied: `OWNER_MUSICAL_LISTENING_NEEDS_FIXES`  
Reason: `NO_REAL_MUSICAL_PRODUCT_ARTIFACT_AVAILABLE_FOR_OWNER_LISTENING`

Sine/test files are **not** musical proof. They live under `technical-fixtures/` only.

## Listen in the local Owner UI

One-click launcher (does not change WAV files, does not auto-PASS):

- `docs/owner-listening-pack/OPEN-OWNER-LISTENING.cmd`
- or open `http://127.0.0.1:8765/` after `node scripts/start-owner-listening-ui.mjs`

`OWNER_DECISION` stays PENDING until you click **NEEDS_FIXES** or confirm **PASS**. Playback is not approval.

## Listen to these (real sketches)

Original UAOS-owned Hijaz-inspired phrase. Example 05 is a style alternative **inside** that context (not a major rewrite).

| # | File | What to hear |
|---|---|---|
| 1 | `musical-examples/01-melody-example.wav` | Moving melody, several pitches |
| 2 | `musical-examples/02-arrangement-example.wav` | Intro groove → verse tune → thicker chorus |
| 3 | `musical-examples/03-before-raw-melody.wav` | Same tune + bass, no drums yet |
| 4 | `musical-examples/04-after-arranged.wav` | Same material after arrangement (drums/chords) |
| 5 | `musical-examples/05-alternative-in-context.wav` | Same Hijaz tune; denser fill. Compare OLD 05 ↔ this. |
| 6 | `musical-examples/06-full-short-demo.wav` | Full chain + held ending |

SHA256 and metadata: each `musical-examples/*.json` and `real-musical-catalog.json`.

## Owner checklist

- [ ] I listened to at least three of the musical-example WAVs
- [ ] I did **not** treat the old sine fixtures as quality proof
- [ ] I still decide Musical Brain: `OWNER_MUSICAL_LISTENING_PASS` or `OWNER_MUSICAL_LISTENING_NEEDS_FIXES`
- [ ] Silence is not approval

## Truth

- `TECHNICAL_WAV != MUSICAL_QUALITY_PROOF`
- `FIXTURE != PRODUCT_CONTENT`
- `COMMANDER_CHANGED=NO`
- `V13_OWNED_FILES_CHANGED=NO`
- `PUBLIC_RELEASE=NO`
- `PAYMENT=NO`
- `KORG_WRITE=UNSUPPORTED`
