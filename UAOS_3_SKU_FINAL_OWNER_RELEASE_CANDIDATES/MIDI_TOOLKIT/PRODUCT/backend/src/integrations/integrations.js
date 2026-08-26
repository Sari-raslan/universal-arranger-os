export function listIntegrations() {
  return {
    ok: true,
    daw: ['Ableton Live', 'FL Studio', 'Logic Pro', 'Cubase'],
    pluginTargets: ['VST3', 'AU', 'Standalone'],
    hardware: ['Korg', 'Yamaha', 'Roland', 'Ketron'],
    note: 'Scaffold: real VST/DAW integration needs native plugin projects.'
  };
}
