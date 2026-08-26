# Owner listening pack — live inventory

Verified on disk 2026-08-25. SHA256 recomputed from WAV bytes.  
`TASK-05-00605-MUSICAL_BRAIN_CONTRACT` remains **OWNER_GATE**.  
`TECHNICAL_PRECHECK_PASS != OWNER_MUSICAL_QUALITY_PASS`  
A historic name such as OWNER APPROVED INSTRUMENTS does **not** pass this gate.

SOURCE_COMMIT for these files: `5aeac11779bd678ca3c80d16144e302a5eb5d9f6`

| PATH | SHA256 | DURATION | SAMPLE_RATE |
|---|---|---|---|
| `docs/owner-listening-pack/musical-examples/01-melody-example.wav` | `e338b8293ae47fefa2c17323e40bd417c8b5a99bc271fd67e0c269cd9f07794b` | 5.125s | 44100 |
| `docs/owner-listening-pack/musical-examples/02-arrangement-example.wav` | `f521fece833e2d41ec9b540dca5e02c1691701f32e77815c9b721d9a7f2bffcf` | 12.625s | 44100 |
| `docs/owner-listening-pack/musical-examples/03-before-raw-melody.wav` | `0318acc4a51f1c72de52256ef30569a375cd322d1a19e8ad26da99a20421fcd3` | 5.125s | 44100 |
| `docs/owner-listening-pack/musical-examples/04-after-arranged.wav` | `f521fece833e2d41ec9b540dca5e02c1691701f32e77815c9b721d9a7f2bffcf` | 12.625s | 44100 |
| `docs/owner-listening-pack/musical-examples/05-alternative-in-context.wav` | `13be9b796483ae687803223e96197569a5ac0bd60df0dad16a243e15216dbadd` | ~13.17s | 44100 |
| `docs/owner-listening-pack/musical-examples/06-full-short-demo.wav` | `679c11adeef75ce619a2d549681c84be0bee0d8185070e4203c9cddc8ee3d322` | 13.975s | 44100 |

Unique SHA256 count: **5** (02 and 04 share the arranged mix by design).  
REAL_MUSICAL_WAV_COUNT: **6**. Sine files are only under `technical-fixtures/` and are not proof.

## Per-file cards

### 01-melody-example.wav
- **INPUT:** Original UAOS Hijaz-inspired MIDI phrase (C/Db/E/F/G/Ab).
- **ACTIONS_APPLIED:** 16-note lead, envelope, stereo sketch render.
- **WHAT_OWNER_SHOULD_LISTEN_FOR:** Moving melody, several pitches, rhythm — not a 440 Hz beep.
- **KNOWN_LIMITATIONS:** Offline oscillators. Not sampled library. Not Musical Brain PASS.

### 02-arrangement-example.wav
- **INPUT:** Same phrase + Intro/Verse/Chorus plan.
- **ACTIONS_APPLIED:** Understand → arabic-khaleeji decide → drums/bass/chords/lead render.
- **WHAT_OWNER_SHOULD_LISTEN_FOR:** Groove first, then tune, then thicker chorus.
- **KNOWN_LIMITATIONS:** Same as 01. Independent renderer, not V13 Mixer.

### 03-before-raw-melody.wav
- **INPUT:** Same Hijaz phrase, arrangement off except bass roots.
- **ACTIONS_APPLIED:** Lead + bass; no drums/chorus stabs.
- **WHAT_OWNER_SHOULD_LISTEN_FOR:** Tune + bass; compare with 04.
- **KNOWN_LIMITATIONS:** Same as 01.

### 04-after-arranged.wav
- **INPUT:** Same material after arrangement (same audio as 02).
- **ACTIONS_APPLIED:** Full arranged mix.
- **WHAT_OWNER_SHOULD_LISTEN_FOR:** Drums/chords under the same tune.
- **KNOWN_LIMITATIONS:** Same as 01.

### 05-alternative-in-context.wav
- **INPUT:** Same Hijaz melody as approved 01–04/06. Style/fill only.
- **ACTIONS_APPLIED:** Tonal scoring rejected unrequested major rewrite; arabic-khaleeji-fill @ 92 BPM with Hijaz color voicings.
- **WHAT_OWNER_SHOULD_LISTEN_FOR:** Same Hijaz tune as 04, denser fill — not C major. Compare OLD 05 (`old-05-rejected-major-pop.wav`) vs this file.
- **KNOWN_LIMITATIONS:** Same as 01. Not Musical Brain PASS. OWNER_RELISTEN_REQUIRED=EXAMPLE_05_ONLY.

### 06-full-short-demo.wav
- **INPUT:** Hijaz sketch through Understand → Decide → Arrange → Render, plus held ending.
- **ACTIONS_APPLIED:** Chord-engine detect, personalized-arranger, section events, independent WAV.
- **WHAT_OWNER_SHOULD_LISTEN_FOR:** Whole short demo. Judge usefulness; do not rubber-stamp quality.
- **KNOWN_LIMITATIONS:** Same as 01.

Owner decision (explicit chat, not UI click): `OWNER_MUSICAL_LISTENING_NEEDS_FIXES` for example 05 only. Relisten **FIXED 05** vs OLD 05. Silence is not PASS.
