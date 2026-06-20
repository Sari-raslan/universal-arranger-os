export class KeyboardRuntime {
  constructor() {
    this.profile = null;
    this.pack = null;
  }

  loadProfile(profile) { this.profile = profile; return this.status(); }
  loadPack(pack) { this.pack = pack; return this.status(); }

  status() {
    return {
      ready: Boolean(this.profile),
      profile: this.profile,
      packId: this.pack?.packId || null
    };
  }
}
