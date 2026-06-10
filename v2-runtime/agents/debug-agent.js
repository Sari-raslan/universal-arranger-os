export function runDebugAgent(errorText = '') {
  const lines = errorText.split('\n').slice(-40);
  return {
    agent: 'debug',
    status: 'ready',
    lastLines: lines,
    advice: 'Send only the last 30-40 lines'
  };
}
