export function createSyncState() {
  return {
    enabled: false,
    provider: 'local-only',
    lastSync: null,
    queue: []
  };
}
