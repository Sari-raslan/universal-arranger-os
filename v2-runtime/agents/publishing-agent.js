export function runPublishingAgent() {
  return {
    agent: 'publishing',
    status: 'blocked-today-if-vercel-limit',
    deployEnabled: false,
    rule: 'Do not deploy when daily limit is reached'
  };
}
