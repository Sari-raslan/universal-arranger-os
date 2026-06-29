# Writer Sandbox Output Policy

LOCAL ONLY - EXPERIMENTAL - NOT FOR PUBLIC RELEASE

## Policy Summary

The owner writer sandbox is manifest-only for now. It may support later dry-run package planning, but it must not create real keyboard output until separate approval is received.

## Required Rules

- Manifest-only for now.
- No real keyboard binary output.
- No `.STY`, `.SET`, `.PRS`, `.STL`, `.PAT`, `.MSP`, or `.KST` output.
- No proprietary samples.
- No Kontakt or Native Instruments copying.
- Checksums/hashes required for future generated artifacts.
- Owner approval required before the first trial candidate.
- Sandbox artifacts must be marked `EXPERIMENTAL` and `NOT FOR PUBLIC RELEASE`.
- No payment or public release behavior.
- No push, deploy, or Vercel action.
- No App.jsx or frontend source changes.

## Future Artifact Labels

Any future dry-run artifact must be clearly labeled:

- `EXPERIMENTAL`
- `SANDBOX ONLY`
- `NOT FOR PUBLIC RELEASE`
- `NOT LOADABLE ON REAL KEYBOARD`

## Stop Conditions

Stop immediately if a task would:

- Create real keyboard output.
- Use a real keyboard output extension.
- Copy proprietary samples or libraries.
- Copy Kontakt or Native Instruments content.
- Create payment, public release, public URL, push, deploy, or Vercel behavior.
- Proceed without manifest, checksum/hash, backup, and explicit approval gates.
