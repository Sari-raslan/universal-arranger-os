# UAOS V1 Official Release Checklist

## Code gate

- [ ] Full tests pass.
- [ ] Static check passes.
- [ ] Production build passes.
- [ ] Runtime check passes.
- [ ] Desktop smoke passes.
- [ ] Open Arranger tests pass.
- [ ] WAV Sampler tests pass.

## Manual hardware gate

- [ ] Note On/Off tested.
- [ ] Velocity tested.
- [ ] Sustain tested.
- [ ] Pitch bend tested.
- [ ] Channel selection tested.
- [ ] Panic tested.
- [ ] Latency documented.
- [ ] Stuck-note test passed.

## Commercial gate

- [ ] Production URL configured.
- [ ] Payment provider configured server-side.
- [ ] License signing configured server-side.
- [ ] Support contact configured.
- [ ] Legal documents approved.
- [ ] Privacy and deletion workflow verified.
- [ ] Prices verified in UI and payment provider.

## Windows gate

- [ ] Electron entry verified.
- [ ] electron-builder verified.
- [ ] Windows icon present.
- [ ] Installer built on a clean machine.
- [ ] Installer signed.
- [ ] Defender and SmartScreen test completed.
- [ ] Installation, upgrade and uninstall tested.

## Publication gate

- [ ] Commit and push approved.
- [ ] Pull Request CI green.
- [ ] V1 tag created.
- [ ] Changelog written.
- [ ] Production deployment approved.
- [ ] Public routes tested.
- [ ] Rollback procedure tested.