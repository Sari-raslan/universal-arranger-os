const CHANNELS = new Set(["stable", "beta", "nightly"]);

export function normalizeReleaseChannel(value = "stable") {
  const channel = String(value).trim().toLowerCase();
  if (!CHANNELS.has(channel)) {
    throw new Error(`Unsupported release channel: ${value}`);
  }
  return channel;
}

export function canReceiveUpdate(currentChannel, candidateChannel) {
  const current = normalizeReleaseChannel(currentChannel);
  const candidate = normalizeReleaseChannel(candidateChannel);

  if (current === "nightly") return true;
  if (current === "beta") return candidate !== "nightly";
  return candidate === "stable";
}

export function selectReleaseCandidate(currentChannel, releases = []) {
  return releases
    .filter((release) => canReceiveUpdate(currentChannel, release.channel))
    .sort((a, b) => String(b.version).localeCompare(String(a.version), undefined, { numeric: true }))[0] ?? null;
}