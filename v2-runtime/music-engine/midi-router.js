export function routeMidiMessage(message) {
  return {
    received: message,
    routedTo: 'uaos-internal-bus',
    timestamp: Date.now()
  };
}
